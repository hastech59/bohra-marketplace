from fastapi import HTTPException
from app.core.database import get_supabase_admin
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.core.config import get_settings
import hmac
import hashlib

settings = get_settings()
db = get_supabase_admin()


def get_razorpay_client():
    import razorpay  # lazy import — avoids pkg_resources error at startup
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


async def create_razorpay_order(amount_paise: int) -> dict:
    """Create a Razorpay order for payment."""
    client = get_razorpay_client()
    order = client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "payment_capture": 1,
    })
    return order


def verify_razorpay_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    key_secret = settings.RAZORPAY_KEY_SECRET.encode()
    msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode()
    generated = hmac.new(key_secret, msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated, razorpay_signature)


async def place_order(user_id: str, data: OrderCreate) -> dict:
    """Validate cart, verify payment, create order and line items."""
    # Verify payment signature if Razorpay
    if data.payment_method == "razorpay":
        if not all([data.razorpay_payment_id, data.razorpay_order_id, data.razorpay_signature]):
            raise HTTPException(status_code=400, detail="Razorpay payment details required")
        if not verify_razorpay_signature(
            data.razorpay_order_id,
            data.razorpay_payment_id,
            data.razorpay_signature,
        ):
            raise HTTPException(status_code=400, detail="Payment verification failed")

    # Validate products and calculate total
    total = 0.0
    enriched_items = []
    for item in data.items:
        prod_resp = (
            db.table("products")
            .select("id, name, price, discount_percent, stock_quantity, vendor_id, images")
            .eq("id", str(item.product_id))
            .eq("is_active", True)
            .single()
            .execute()
        )
        if not prod_resp.data:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        prod = prod_resp.data
        if prod["stock_quantity"] < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {prod['name']}",
            )
        discounted_price = prod["price"] * (1 - prod["discount_percent"] / 100)
        line_total = round(discounted_price * item.quantity, 2)
        total += line_total
        enriched_items.append({
            **item.model_dump(),
            "product_id": str(item.product_id),
            "vendor_id": prod["vendor_id"],
            "unit_price": round(discounted_price, 2),
            "total_price": line_total,
            "product_name": prod["name"],
            "product_image": prod["images"][0] if prod["images"] else None,
        })

    # Create order
    order_payload = {
        "user_id": user_id,
        "total_amount": round(total, 2),
        "status": "confirmed" if data.payment_method == "razorpay" else "pending",
        "payment_method": data.payment_method,
        "payment_status": "paid" if data.payment_method == "razorpay" else "pending",
        "razorpay_payment_id": data.razorpay_payment_id,
        "razorpay_order_id": data.razorpay_order_id,
        "delivery_address": data.delivery_address.model_dump(),
    }
    order_resp = db.table("orders").insert(order_payload).execute()
    order = order_resp.data[0]
    order_id = order["id"]

    # Create line items and decrement stock
    for item in enriched_items:
        db.table("order_items").insert({
            "order_id": order_id,
            "product_id": item["product_id"],
            "vendor_id": item["vendor_id"],
            "quantity": item["quantity"],
            "unit_price": item["unit_price"],
            "total_price": item["total_price"],
            "product_name": item["product_name"],
            "product_image": item["product_image"],
        }).execute()
        # Decrement stock
        db.rpc("decrement_stock", {
            "p_id": item["product_id"],
            "qty": item["quantity"],
        }).execute()

    return {**order, "items": enriched_items}


async def get_user_orders(user_id: str) -> list[dict]:
    result = (
        db.table("orders")
        .select("*, order_items(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


async def get_order_detail(user_id: str, order_id: str) -> dict:
    result = (
        db.table("orders")
        .select("*, order_items(*)")
        .eq("id", order_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    return result.data


async def get_vendor_orders(vendor_id: str) -> list[dict]:
    result = (
        db.table("order_items")
        .select("*, orders(id, status, delivery_address, created_at, user_id, "
                "profiles!orders_user_id_fkey(full_name, phone))")
        .eq("vendor_id", vendor_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


async def update_order_status(vendor_id: str, order_id: str, data: OrderStatusUpdate) -> dict:
    data.validate_status()
    # Verify vendor has items in this order
    check = (
        db.table("order_items")
        .select("id")
        .eq("order_id", order_id)
        .eq("vendor_id", vendor_id)
        .limit(1)
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=403, detail="Access denied to this order")

    result = (
        db.table("orders")
        .update({"status": data.status})
        .eq("id", order_id)
        .execute()
    )
    return result.data[0]
