from pydantic import BaseModel
from uuid import UUID
from typing import Any


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int
    unit_price: float


class DeliveryAddress(BaseModel):
    full_name: str
    phone: str
    address_line1: str
    address_line2: str | None = None
    city: str
    state: str
    pincode: str
    latitude: float | None = None
    longitude: float | None = None


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]
    delivery_address: DeliveryAddress
    payment_method: str = "razorpay"  # razorpay | cod
    razorpay_payment_id: str | None = None
    razorpay_order_id: str | None = None
    razorpay_signature: str | None = None


class OrderStatusUpdate(BaseModel):
    status: str  # pending, confirmed, processing, shipped, delivered, cancelled

    def validate_status(self) -> None:
        valid = {"pending", "confirmed", "processing", "shipped", "delivered", "cancelled"}
        if self.status not in valid:
            raise ValueError(f"Status must be one of {valid}")
