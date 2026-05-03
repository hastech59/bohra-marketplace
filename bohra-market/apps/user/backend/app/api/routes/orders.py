from fastapi import APIRouter, Depends
from app.schemas.order import OrderCreate
from app.services import order_service
from app.core.security import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("")
async def place_order(
    data: OrderCreate,
    current_user: dict = Depends(get_current_user),
):
    return await order_service.place_order(current_user["id"], data)


@router.get("/me")
async def my_orders(current_user: dict = Depends(get_current_user)):
    return await order_service.get_user_orders(current_user["id"])


@router.get("/me/{order_id}")
async def order_detail(
    order_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await order_service.get_order_detail(current_user["id"], order_id)


@router.post("/razorpay/create")
async def create_razorpay_order(
    data: dict,
    current_user: dict = Depends(get_current_user),
):
    """Create a Razorpay order before payment."""
    amount_paise = int(data.get("amount", 0) * 100)
    return await order_service.create_razorpay_order(amount_paise)
