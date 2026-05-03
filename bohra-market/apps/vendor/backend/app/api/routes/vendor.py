from fastapi import APIRouter, Depends, UploadFile, File
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.vendor import VendorProfileUpdate
from app.services import product_service, vendor_service, order_service
from app.core.security import get_current_vendor
from app.core.database import get_supabase_admin
from app.core.config import get_settings
import uuid

router = APIRouter(prefix="/vendor", tags=["vendor"])
settings = get_settings()
db = get_supabase_admin()


@router.get("/profile")
async def get_profile(current_vendor: dict = Depends(get_current_vendor)):
    return await vendor_service.get_vendor_profile(current_vendor["id"])


@router.put("/profile")
async def update_profile(
    data: VendorProfileUpdate,
    current_vendor: dict = Depends(get_current_vendor),
):
    return await vendor_service.update_vendor_profile(current_vendor["id"], data)


@router.get("/products")
async def list_products(current_vendor: dict = Depends(get_current_vendor)):
    return await product_service.get_vendor_products(current_vendor["id"])


@router.post("/products")
async def create_product(
    data: ProductCreate,
    current_vendor: dict = Depends(get_current_vendor),
):
    return await product_service.create_product(current_vendor["id"], data)


@router.put("/products/{product_id}")
async def update_product(
    product_id: str,
    data: ProductUpdate,
    current_vendor: dict = Depends(get_current_vendor),
):
    return await product_service.update_product(current_vendor["id"], product_id, data)


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_vendor: dict = Depends(get_current_vendor),
):
    return await product_service.delete_product(current_vendor["id"], product_id)


@router.post("/products/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_vendor: dict = Depends(get_current_vendor),
):
    """Upload product image to Supabase Storage."""
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP images allowed")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5 MB limit
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"products/{current_vendor['id']}/{uuid.uuid4()}.{ext}"

    db.storage.from_("product-images").upload(
        filename,
        contents,
        {"content-type": file.content_type},
    )
    public_url = db.storage.from_("product-images").get_public_url(filename)
    return {"url": public_url}


@router.get("/orders")
async def get_orders(current_vendor: dict = Depends(get_current_vendor)):
    return await order_service.get_vendor_orders(current_vendor["id"])


@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    data: dict,
    current_vendor: dict = Depends(get_current_vendor),
):
    from app.schemas.order import OrderStatusUpdate
    return await order_service.update_order_status(
        current_vendor["id"], order_id, OrderStatusUpdate(**data)
    )


@router.get("/stats")
async def get_stats(current_vendor: dict = Depends(get_current_vendor)):
    return await product_service.get_vendor_stats(current_vendor["id"])


@router.get("/membership/plans")
async def get_plans():
    return await vendor_service.get_membership_plans()


@router.post("/membership/purchase/{plan_id}")
async def purchase_membership(
    plan_id: str,
    current_vendor: dict = Depends(get_current_vendor),
):
    return await vendor_service.create_membership_payment(current_vendor["id"], plan_id)


@router.post("/membership/confirm")
async def confirm_membership(
    data: dict,
    current_vendor: dict = Depends(get_current_vendor),
):
    return await vendor_service.confirm_membership_payment(
        current_vendor["id"],
        data["plan_id"],
        data["razorpay_payment_id"],
        data["razorpay_order_id"],
        data["razorpay_signature"],
    )
