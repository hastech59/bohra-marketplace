import math
from uuid import UUID
from fastapi import HTTPException
from app.core.database import get_supabase_admin
from app.schemas.product import ProductCreate, ProductUpdate, ProductFilters, NearbyProductsRequest

db = get_supabase_admin()


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two lat/lng points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def list_products(filters: ProductFilters) -> dict:
    query = (
        db.table("products")
        .select(
            "*, categories(name, slug), vendor_profiles(business_name, city, whatsapp), "
            "profiles!products_vendor_id_fkey(full_name)"
        )
        .eq("is_active", True)
    )

    if filters.category_id:
        query = query.eq("category_id", str(filters.category_id))
    if filters.min_price is not None:
        query = query.gte("price", filters.min_price)
    if filters.max_price is not None:
        query = query.lte("price", filters.max_price)
    if filters.vendor_city:
        query = query.ilike("vendor_profiles.city", f"%{filters.vendor_city}%")
    if filters.q:
        query = query.or_(
            f"name.ilike.%{filters.q}%,description.ilike.%{filters.q}%,tags.cs.{{{filters.q}}}"
        )

    # Sorting
    ascending = filters.sort_order == "asc"
    if filters.sort_by in ("price", "created_at", "avg_rating"):
        query = query.order(filters.sort_by, desc=not ascending)
    else:
        query = query.order("created_at", desc=True)

    # Pagination
    offset = (filters.page - 1) * filters.page_size
    query = query.range(offset, offset + filters.page_size - 1)

    result = query.execute()
    return {"products": result.data or [], "page": filters.page, "page_size": filters.page_size}


async def get_nearby_products(req: NearbyProductsRequest) -> dict:
    """Fetch products within radius_km using Haversine via Supabase RPC."""
    result = db.rpc(
        "get_nearby_products",
        {
            "user_lat": req.latitude,
            "user_lng": req.longitude,
            "radius_km": req.radius_km,
            "cat_id": str(req.category_id) if req.category_id else None,
            "page_offset": (req.page - 1) * req.page_size,
            "page_limit": req.page_size,
        },
    ).execute()
    return {"products": result.data or [], "page": req.page, "page_size": req.page_size}


async def get_product(product_id: str) -> dict:
    result = (
        db.table("products")
        .select(
            "*, categories(name, slug), vendor_profiles(business_name, city, whatsapp, "
            "business_description, approval_status), profiles!products_vendor_id_fkey(full_name)"
        )
        .eq("id", product_id)
        .eq("is_active", True)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return result.data


async def create_product(vendor_id: str, data: ProductCreate) -> dict:
    # Check membership limit
    vendor_resp = (
        db.table("vendor_profiles")
        .select("*, membership_plans(max_products)")
        .eq("id", vendor_id)
        .single()
        .execute()
    )
    vendor = vendor_resp.data
    if not vendor or vendor.get("approval_status") != "approved":
        raise HTTPException(status_code=403, detail="Vendor account not approved")

    plan = vendor.get("membership_plans") or {}
    max_products = plan.get("max_products", 5)

    count_resp = (
        db.table("products")
        .select("id", count="exact")
        .eq("vendor_id", vendor_id)
        .eq("is_active", True)
        .execute()
    )
    current_count = count_resp.count or 0

    if max_products != -1 and current_count >= max_products:
        raise HTTPException(
            status_code=403,
            detail=f"Product limit reached for your plan ({max_products}). Please upgrade.",
        )

    product = {
        "vendor_id": vendor_id,
        "name": data.name,
        "description": data.description,
        "price": data.price,
        "discount_percent": data.discount_percent,
        "stock_quantity": data.stock_quantity,
        "unit": data.unit,
        "category_id": str(data.category_id),
        "tags": data.tags,
        "images": data.images,
        "latitude": data.latitude or vendor.get("latitude"),
        "longitude": data.longitude or vendor.get("longitude"),
        "is_active": True,
        "avg_rating": 0.0,
        "review_count": 0,
    }
    result = db.table("products").insert(product).execute()
    return result.data[0]


async def update_product(vendor_id: str, product_id: str, data: ProductUpdate) -> dict:
    # Verify ownership
    existing = (
        db.table("products")
        .select("id, vendor_id")
        .eq("id", product_id)
        .eq("vendor_id", vendor_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Product not found or access denied")

    updates = data.model_dump(exclude_none=True)
    if "category_id" in updates:
        updates["category_id"] = str(updates["category_id"])

    result = db.table("products").update(updates).eq("id", product_id).execute()
    return result.data[0]


async def delete_product(vendor_id: str, product_id: str) -> dict:
    existing = (
        db.table("products")
        .select("id, vendor_id")
        .eq("id", product_id)
        .eq("vendor_id", vendor_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Product not found or access denied")

    # Soft delete
    db.table("products").update({"is_active": False}).eq("id", product_id).execute()
    return {"message": "Product deleted"}


async def get_vendor_products(vendor_id: str) -> list[dict]:
    result = (
        db.table("products")
        .select("*, categories(name)")
        .eq("vendor_id", vendor_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


async def get_vendor_stats(vendor_id: str) -> dict:
    # Total revenue from delivered orders
    revenue_resp = db.rpc("get_vendor_revenue", {"v_id": vendor_id}).execute()
    # Top products
    top_resp = (
        db.table("order_items")
        .select("product_id, quantity, products(name, images)")
        .eq("vendor_id", vendor_id)
        .order("quantity", desc=True)
        .limit(5)
        .execute()
    )
    # Product count
    count_resp = (
        db.table("products")
        .select("id", count="exact")
        .eq("vendor_id", vendor_id)
        .eq("is_active", True)
        .execute()
    )
    return {
        "total_revenue": revenue_resp.data[0]["total"] if revenue_resp.data else 0,
        "top_products": top_resp.data or [],
        "active_product_count": count_resp.count or 0,
    }
