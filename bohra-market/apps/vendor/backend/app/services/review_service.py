from fastapi import HTTPException
from app.core.database import get_supabase_admin
from app.schemas.review import ReviewCreate

db = get_supabase_admin()


async def create_review(user_id: str, data: ReviewCreate) -> dict:
    """Only allow reviews for delivered orders."""
    # Verify order is delivered and belongs to user
    order_resp = (
        db.table("orders")
        .select("id, status, user_id")
        .eq("id", str(data.order_id))
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not order_resp.data:
        raise HTTPException(status_code=404, detail="Order not found")
    if order_resp.data["status"] != "delivered":
        raise HTTPException(status_code=400, detail="Can only review delivered orders")

    # Check order contains this product
    item_resp = (
        db.table("order_items")
        .select("id")
        .eq("order_id", str(data.order_id))
        .eq("product_id", str(data.product_id))
        .single()
        .execute()
    )
    if not item_resp.data:
        raise HTTPException(status_code=400, detail="Product not in this order")

    # Check for duplicate review
    existing = (
        db.table("reviews")
        .select("id")
        .eq("user_id", user_id)
        .eq("product_id", str(data.product_id))
        .eq("order_id", str(data.order_id))
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="Already reviewed this product")

    review = {
        "user_id": user_id,
        "product_id": str(data.product_id),
        "order_id": str(data.order_id),
        "rating": data.rating,
        "comment": data.comment,
    }
    result = db.table("reviews").insert(review).execute()

    # Update product avg_rating
    db.rpc("update_product_rating", {"p_id": str(data.product_id)}).execute()

    return result.data[0]


async def get_product_reviews(product_id: str) -> list[dict]:
    result = (
        db.table("reviews")
        .select("*, profiles(full_name)")
        .eq("product_id", product_id)
        .order("created_at", desc=True)
        .execute()
    )
    reviews = []
    for r in result.data or []:
        reviews.append({
            **r,
            "reviewer_name": r.get("profiles", {}).get("full_name", "Anonymous"),
        })
    return reviews


async def add_to_wishlist(user_id: str, product_id: str) -> dict:
    try:
        result = db.table("wishlists").insert({
            "user_id": user_id,
            "product_id": product_id,
        }).execute()
        return result.data[0]
    except Exception:
        raise HTTPException(status_code=400, detail="Already in wishlist")


async def remove_from_wishlist(user_id: str, product_id: str) -> dict:
    db.table("wishlists").delete().eq("user_id", user_id).eq("product_id", product_id).execute()
    return {"message": "Removed from wishlist"}


async def get_wishlist(user_id: str) -> list[dict]:
    result = (
        db.table("wishlists")
        .select("*, products(*, categories(name), vendor_profiles(business_name, city))")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []
