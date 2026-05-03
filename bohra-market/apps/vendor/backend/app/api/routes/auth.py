from fastapi import APIRouter, Depends
from app.schemas.auth import RegisterRequest, VendorRegisterRequest, LoginRequest, ProfileUpdate
from app.services import auth_service
from app.core.security import get_current_user
from app.core.database import get_supabase_admin

router = APIRouter(prefix="/auth", tags=["auth"])
db = get_supabase_admin()


@router.post("/register")
async def register(data: RegisterRequest):
    return await auth_service.register_user(data)


@router.post("/vendor/register")
async def vendor_register(data: VendorRegisterRequest):
    return await auth_service.register_vendor(data)


@router.post("/login")
async def login(data: LoginRequest):
    return await auth_service.login_user(data)


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return await auth_service.get_me(current_user["id"])


@router.put("/me")
async def update_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    updates = data.model_dump(exclude_none=True)
    result = (
        db.table("profiles")
        .update(updates)
        .eq("id", current_user["id"])
        .execute()
    )
    return result.data[0]
