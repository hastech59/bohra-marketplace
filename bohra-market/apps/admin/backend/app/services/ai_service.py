import json
import anthropic
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from app.core.config import get_settings
from app.core.database import get_supabase_admin
from app.schemas.ai import (
    AISearchRequest,
    AIRecommendRequest,
    AIDescriptionRequest,
    AITagsRequest,
    AIChatRequest,
)

settings = get_settings()
db = get_supabase_admin()


def get_claude() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


CATEGORY_TREE = """
Bohra Market Categories:
- Food & Groceries
  - Pickles & Achaar (Mango, Lemon, Mixed, Garlic)
  - Mithai & Sweets (Mohanthal, Mawa Barfi, Halwa, Khajur)
  - Home-cooked Meals & Tiffin
  - Dry Fruits & Nuts
  - Spices & Masala
  - Bakery & Snacks
- Clothing & Accessories
  - Rida (Traditional Bohra dress)
  - Topi (Bohra cap)
  - Kurta & Shalwar
  - Jewellery & Accessories
- Handmade Crafts
  - Embroidery & Zardozi
  - Pottery & Ceramics
  - Candles & Home Decor
  - Handmade Bags & Purses
- Services
  - Catering & Event Food
  - Tailoring & Stitching
  - Mehendi & Beauty
  - Home Tutoring
"""


async def ai_search(req: AISearchRequest) -> dict:
    """Parse natural language query into structured DB filters."""
    client = get_claude()

    system_prompt = f"""You are a search assistant for Bohra Market, a community marketplace.
Extract structured search filters from the user's natural language query.
Return ONLY valid JSON with these optional fields:
- q: keyword search string
- category_name: category name from the tree
- min_price: number
- max_price: number
- vendor_city: city name
- tags: array of strings
- radius_km: number (if user mentions nearby/distance)

{CATEGORY_TREE}

Return only the JSON object, no explanation."""

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=300,
        system=system_prompt,
        messages=[{"role": "user", "content": req.query}],
    )

    try:
        filters = json.loads(response.content[0].text.strip())
    except json.JSONDecodeError:
        filters = {"q": req.query}

    # Resolve category name to ID
    if "category_name" in filters:
        cat_resp = (
            db.table("categories")
            .select("id")
            .ilike("name", f"%{filters.pop('category_name')}%")
            .limit(1)
            .execute()
        )
        if cat_resp.data:
            filters["category_id"] = cat_resp.data[0]["id"]

    # Build product query
    query = (
        db.table("products")
        .select("*, categories(name), vendor_profiles(business_name, city)")
        .eq("is_active", True)
    )
    if filters.get("q"):
        q = filters["q"]
        query = query.or_(f"name.ilike.%{q}%,description.ilike.%{q}%")
    if filters.get("category_id"):
        query = query.eq("category_id", filters["category_id"])
    if filters.get("min_price") is not None:
        query = query.gte("price", filters["min_price"])
    if filters.get("max_price") is not None:
        query = query.lte("price", filters["max_price"])
    if filters.get("vendor_city"):
        query = query.ilike("vendor_profiles.city", f"%{filters['vendor_city']}%")

    query = query.limit(20)
    products_resp = query.execute()

    return {
        "filters": filters,
        "products": products_resp.data or [],
        "explanation": f"Found {len(products_resp.data or [])} results for: {req.query}",
    }


async def ai_recommend(req: AIRecommendRequest) -> list[dict]:
    """Recommend products based on user's order history."""
    # Get user's past orders
    orders_resp = (
        db.table("order_items")
        .select("product_id, products(name, category_id, tags, categories(name))")
        .eq("orders.user_id", req.user_id)
        .limit(20)
        .execute()
    )
    past_items = orders_resp.data or []

    if not past_items:
        # Cold start: return featured/popular products
        result = (
            db.table("products")
            .select("*, categories(name), vendor_profiles(business_name, city)")
            .eq("is_active", True)
            .order("avg_rating", desc=True)
            .limit(req.limit)
            .execute()
        )
        return result.data or []

    # Extract categories and tags from history
    categories = list({
        item["products"]["categories"]["name"]
        for item in past_items
        if item.get("products") and item["products"].get("categories")
    })
    tags = []
    for item in past_items:
        if item.get("products") and item["products"].get("tags"):
            tags.extend(item["products"]["tags"])
    tags = list(set(tags))[:10]

    client = get_claude()
    prompt = f"""User has bought: {', '.join(categories[:5])} products with tags: {', '.join(tags[:10])}.
Suggest 3 search keywords to find similar Bohra Market products. Return as JSON array of strings only."""

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}],
    )
    try:
        keywords = json.loads(response.content[0].text.strip())
    except Exception:
        keywords = categories[:3]

    # Search for recommended products
    all_products = []
    for kw in keywords[:3]:
        resp = (
            db.table("products")
            .select("*, categories(name), vendor_profiles(business_name, city)")
            .eq("is_active", True)
            .or_(f"name.ilike.%{kw}%,tags.cs.{{{kw}}}")
            .limit(req.limit // 3 + 1)
            .execute()
        )
        all_products.extend(resp.data or [])

    # Deduplicate
    seen = set()
    unique = []
    for p in all_products:
        if p["id"] not in seen:
            seen.add(p["id"])
            unique.append(p)

    return unique[: req.limit]


async def generate_description(req: AIDescriptionRequest) -> str:
    """Generate a warm, community-tone product description."""
    client = get_claude()
    prompt = f"""Write a warm, authentic product description for a Bohra community marketplace.
Product: {req.product_name}
Category: {req.category}
Price: ₹{req.price} per {req.unit}
{f'Additional info: {req.additional_info}' if req.additional_info else ''}

Write 2-3 sentences in a friendly, community tone. Highlight authenticity and quality.
Do not use generic marketing language. Keep it genuine and specific."""

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()


async def suggest_tags(req: AITagsRequest) -> list[str]:
    """Suggest 6-8 relevant search tags for a product."""
    client = get_claude()
    prompt = f"""Suggest 6-8 relevant search tags for this Bohra Market product.
Product: {req.product_name}
Description: {req.description}
Category: {req.category}

Return ONLY a JSON array of lowercase tag strings. Example: ["rida", "bohra", "handmade"]"""

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}],
    )
    try:
        tags = json.loads(response.content[0].text.strip())
        return [str(t).lower() for t in tags[:8]]
    except Exception:
        return [req.product_name.lower(), req.category.lower()]


async def chat_stream(req: AIChatRequest):
    """Streaming SSE chatbot that knows the marketplace."""
    client = get_claude()

    # Fetch some products for context
    products_resp = (
        db.table("products")
        .select("name, price, categories(name), vendor_profiles(city)")
        .eq("is_active", True)
        .order("avg_rating", desc=True)
        .limit(20)
        .execute()
    )
    products_context = json.dumps(products_resp.data or [], default=str)

    system_prompt = f"""You are a helpful shopping assistant for Bohra Market — a community marketplace 
for the Dawoodi Bohra Muslim community. You help users find products like Rida, Topi, Bohra pickles, 
Mithai, handmade crafts, embroidery, catering, and home-based food businesses.

{f"User's city: {req.user_city}" if req.user_city else ""}
{CATEGORY_TREE}

Available products (sample):
{products_context}

Help users find products, answer questions about the marketplace, and suggest relevant items.
Be warm, helpful, and community-oriented. Keep responses concise."""

    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    async def event_generator():
        with client.messages.stream(
            model="claude-haiku-4-5",
            max_tokens=500,
            system=system_prompt,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
