from fastapi import HTTPException
from app.core.database import get_supabase_admin
from app.schemas.vendor import VendorProfileUpdate, VendorApprovalRequest, MembershipPlanUpdate
from app.core.config import get_settings

settings = get_settings()
db = get_supabase_admin()


async def get_vendor_profile(vendor_id: str) -> dict:
    result = (
        db.table("vendor_profiles")
        .select("*, membership_plans(*)")
        .eq("id", vendor_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    return result.data


async def update_vendor_profile(vendor_id: str, data: VendorProfileUpdate) -> dict:
    updates = data.model_dump(exclude_none=True)
    result = (
        db.table("vendor_profiles")
        .update(updates)
        .eq("id", vendor_id)
        .execute()
    )
    return result.data[0]


async def get_membership_plans() -> list[dict]:
    result = (
        db.table("membership_plans")
        .select("*")
        .eq("is_active", True)
        .order("price_monthly")
        .execute()
    )
    return result.data or []


async def create_membership_payment(vendor_id: str, plan_id: str) -> dict:
    """Create a Razorpay order for membership purchase."""
    plan_resp = (
        db.table("membership_plans")
        .select("*")
        .eq("id", plan_id)
        .single()
        .execute()
    )
    if not plan_resp.data:
        raise HTTPException(status_code=404, detail="Plan not found")

    plan = plan_resp.data
    if plan["price_monthly"] == 0:
        # Free plan — assign directly
        db.table("vendor_profiles").update({"membership_plan_id": plan_id}).eq("id", vendor_id).execute()
        return {"plan": plan, "free": True}

    import razorpay  # lazy import — avoids pkg_resources error at startup
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    amount_paise = int(plan["price_monthly"] * 100)
    order = client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "payment_capture": 1,
        "notes": {"vendor_id": vendor_id, "plan_id": plan_id},
    })
    return {"razorpay_order": order, "plan": plan}


async def confirm_membership_payment(
    vendor_id: str,
    plan_id: str,
    razorpay_payment_id: str,
    razorpay_order_id: str,
    razorpay_signature: str,
) -> dict:
    """Verify payment and upgrade membership."""
    import hmac, hashlib
    key_secret = settings.RAZORPAY_KEY_SECRET.encode()
    msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode()
    generated = hmac.new(key_secret, msg, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(generated, razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment verification failed")

    result = (
        db.table("vendor_profiles")
        .update({
            "membership_plan_id": plan_id,
            "membership_expires_at": db.rpc("now_plus_30_days", {}).execute().data,
        })
        .eq("id", vendor_id)
        .execute()
    )
    return result.data[0]


# ── Admin vendor management ──────────────────────────────────────────────────

async def admin_list_vendors(status: str | None = None) -> list[dict]:
    query = db.table("vendor_profiles").select("*, profiles(full_name, email, phone)")
    if status:
        query = query.eq("approval_status", status)
    result = query.order("created_at", desc=True).execute()
    return result.data or []


async def admin_approve_vendor(vendor_id: str, data: VendorApprovalRequest) -> dict:
    valid_actions = {"approve", "reject", "suspend", "unsuspend"}
    if data.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Action must be one of {valid_actions}")

    status_map = {
        "approve": "approved",
        "reject": "rejected",
        "suspend": "suspended",
        "unsuspend": "approved",
    }
    updates: dict = {"approval_status": status_map[data.action]}
    if data.action == "reject" and data.rejection_reason:
        updates["rejection_reason"] = data.rejection_reason

    result = (
        db.table("vendor_profiles")
        .update(updates)
        .eq("id", vendor_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return result.data[0]


async def admin_get_platform_stats() -> dict:
    users_resp = db.table("profiles").select("id", count="exact").eq("role", "user").execute()
    vendors_resp = db.table("profiles").select("id", count="exact").eq("role", "vendor").execute()
    orders_today_resp = db.rpc("orders_today_count", {}).execute()
    monthly_revenue_resp = db.rpc("monthly_revenue", {}).execute()
    pending_vendors_resp = (
        db.table("vendor_profiles")
        .select("id", count="exact")
        .eq("approval_status", "pending")
        .execute()
    )
    return {
        "total_users": users_resp.count or 0,
        "total_vendors": vendors_resp.count or 0,
        "orders_today": orders_today_resp.data[0]["count"] if orders_today_resp.data else 0,
        "monthly_revenue": monthly_revenue_resp.data[0]["total"] if monthly_revenue_resp.data else 0,
        "pending_vendors": pending_vendors_resp.count or 0,
    }


async def admin_update_membership_plan(plan_id: str, data: MembershipPlanUpdate) -> dict:
    updates = data.model_dump(exclude_none=True)
    result = db.table("membership_plans").update(updates).eq("id", plan_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    return result.data[0]
