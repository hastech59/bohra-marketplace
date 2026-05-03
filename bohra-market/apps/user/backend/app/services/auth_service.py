from app.core.database import get_supabase_admin
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import RegisterRequest, VendorRegisterRequest, LoginRequest
from fastapi import HTTPException, status
import uuid


db = get_supabase_admin()


async def register_user(data: RegisterRequest) -> dict:
    """Register a new shopper account."""
    # Create auth user in Supabase Auth
    try:
        auth_resp = db.auth.admin.create_user({
            "email": data.email,
            "password": data.password,
            "email_confirm": True,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

    user_id = auth_resp.user.id

    # Create profile record
    profile = {
        "id": user_id,
        "email": data.email,
        "full_name": data.full_name,
        "phone": data.phone,
        "city": data.city,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "role": "user",
    }
    db.table("profiles").insert(profile).execute()

    token = create_access_token({"sub": user_id, "role": "user"})
    return {"access_token": token, "token_type": "bearer", "user": profile}


async def register_vendor(data: VendorRegisterRequest) -> dict:
    """Register a new vendor account (starts as pending)."""
    try:
        auth_resp = db.auth.admin.create_user({
            "email": data.email,
            "password": data.password,
            "email_confirm": True,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

    user_id = auth_resp.user.id

    profile = {
        "id": user_id,
        "email": data.email,
        "full_name": data.full_name,
        "phone": data.phone,
        "city": data.city,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "role": "vendor",
    }
    db.table("profiles").insert(profile).execute()

    # Get the free Basic plan
    plan_resp = db.table("membership_plans").select("id").eq("name", "Basic").single().execute()
    plan_id = plan_resp.data["id"] if plan_resp.data else None

    vendor_profile = {
        "id": user_id,
        "business_name": data.business_name,
        "business_type": data.business_type,
        "business_description": data.business_description,
        "whatsapp": data.whatsapp,
        "city": data.city,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "approval_status": "pending",
        "membership_plan_id": plan_id,
    }
    db.table("vendor_profiles").insert(vendor_profile).execute()

    token = create_access_token({"sub": user_id, "role": "vendor"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {**profile, "vendor_status": "pending"},
    }


async def login_user(data: LoginRequest) -> dict:
    """Authenticate user and return JWT."""
    try:
        auth_resp = db.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_id = auth_resp.user.id
    profile_resp = db.table("profiles").select("*").eq("id", user_id).single().execute()
    if not profile_resp.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = profile_resp.data
    token = create_access_token({"sub": user_id, "role": profile["role"]})
    return {"access_token": token, "token_type": "bearer", "user": profile}


async def get_me(user_id: str) -> dict:
    """Return full profile including vendor info if applicable."""
    profile_resp = db.table("profiles").select("*").eq("id", user_id).single().execute()
    if not profile_resp.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = profile_resp.data
    if profile["role"] == "vendor":
        vendor_resp = (
            db.table("vendor_profiles")
            .select("*, membership_plans(*)")
            .eq("id", user_id)
            .single()
            .execute()
        )
        profile["vendor"] = vendor_resp.data

    return profile
