from fastapi import APIRouter, Depends, Query
from app.schemas.vendor import VendorApprovalRequest, MembershipPlanUpdate
from app.services import vendor_service
from app.core.security import get_current_admin
from app.core.database import get_supabase_admin

router = APIRouter(prefix="/admin", tags=["admin"])
db = get_supabase_admin()


@router.get("/stats")
async def platform_stats(admin: dict = Depends(get_current_admin)):
    return await vendor_service.admin_get_platform_stats()


@router.get("/vendors")
async def list_vendors(
    status: str | None = Query(None),
    admin: dict = Depends(get_current_admin),
):
    return await vendor_service.admin_list_vendors(status)


@router.post("/vendors/{vendor_id}/action")
async def vendor_action(
    vendor_id: str,
    data: VendorApprovalRequest,
    admin: dict = Depends(get_current_admin),
):
    return await vendor_service.admin_approve_vendor(vendor_id, data)


@router.get("/users")
async def list_users(
    q: str | None = Query(None),
    role: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    admin: dict = Depends(get_current_admin),
):
    query = db.table("profiles").select("*")
    if q:
        query = query.or_(f"full_name.ilike.%{q}%,email.ilike.%{q}%")
    if role:
        query = query.eq("role", role)
    offset = (page - 1) * page_size
    result = query.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
    return result.data or []


@router.put("/users/{user_id}/role")
async def change_user_role(
    user_id: str,
    data: dict,
    admin: dict = Depends(get_current_admin),
):
    valid_roles = {"user", "vendor", "admin"}
    role = data.get("role")
    if role not in valid_roles:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Role must be one of {valid_roles}")
    result = db.table("profiles").update({"role": role}).eq("id", user_id).execute()
    return result.data[0]


@router.get("/products")
async def list_all_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(50),
    admin: dict = Depends(get_current_admin),
):
    offset = (page - 1) * page_size
    result = (
        db.table("products")
        .select("*, vendor_profiles(business_name), categories(name)")
        .order("created_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )
    return result.data or []


@router.put("/products/{product_id}/featured")
async def toggle_featured(
    product_id: str,
    data: dict,
    admin: dict = Depends(get_current_admin),
):
    result = (
        db.table("products")
        .update({"is_featured": data.get("is_featured", False)})
        .eq("id", product_id)
        .execute()
    )
    return result.data[0]


@router.delete("/products/{product_id}")
async def remove_product(
    product_id: str,
    admin: dict = Depends(get_current_admin),
):
    db.table("products").update({"is_active": False}).eq("id", product_id).execute()
    return {"message": "Product removed"}


@router.get("/membership-plans")
async def list_plans(admin: dict = Depends(get_current_admin)):
    result = db.table("membership_plans").select("*").order("price_monthly").execute()
    return result.data or []


@router.put("/membership-plans/{plan_id}")
async def update_plan(
    plan_id: str,
    data: MembershipPlanUpdate,
    admin: dict = Depends(get_current_admin),
):
    return await vendor_service.admin_update_membership_plan(plan_id, data)


@router.get("/orders/chart")
async def orders_chart(admin: dict = Depends(get_current_admin)):
    """30-day orders per day for line chart."""
    result = db.rpc("orders_per_day_30", {}).execute()
    return result.data or []


@router.get("/revenue/by-category")
async def revenue_by_category(admin: dict = Depends(get_current_admin)):
    """Revenue breakdown by category for pie chart."""
    result = db.rpc("revenue_by_category", {}).execute()
    return result.data or []
