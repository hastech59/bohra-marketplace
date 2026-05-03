from fastapi import APIRouter, Depends, Query
from uuid import UUID
from app.schemas.product import ProductFilters, NearbyProductsRequest
from app.services import product_service
from app.core.security import get_current_user

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
async def list_products(
    q: str | None = Query(None),
    category_id: UUID | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    min_rating: float | None = Query(None),
    vendor_city: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
):
    filters = ProductFilters(
        q=q,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        vendor_city=vendor_city,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return await product_service.list_products(filters)


@router.get("/nearby")
async def nearby_products(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_km: float = Query(50.0),
    category_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    req = NearbyProductsRequest(
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        category_id=category_id,
        page=page,
        page_size=page_size,
    )
    return await product_service.get_nearby_products(req)


@router.get("/categories")
async def list_categories():
    from app.core.database import get_supabase_admin
    db = get_supabase_admin()
    result = db.table("categories").select("*").order("sort_order").execute()
    return result.data or []


@router.get("/{product_id}")
async def get_product(product_id: str):
    return await product_service.get_product(product_id)
