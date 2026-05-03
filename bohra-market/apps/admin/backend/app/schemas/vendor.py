from pydantic import BaseModel
from uuid import UUID
from typing import Any


class VendorProfileUpdate(BaseModel):
    business_name: str | None = None
    business_type: str | None = None
    business_description: str | None = None
    whatsapp: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    bank_account: dict[str, Any] | None = None  # stored as JSONB


class VendorApprovalRequest(BaseModel):
    action: str  # approve | reject | suspend | unsuspend
    rejection_reason: str | None = None


class MembershipPlanUpdate(BaseModel):
    name: str | None = None
    price_monthly: float | None = None
    max_products: int | None = None  # -1 = unlimited
    features: dict[str, Any] | None = None
    is_active: bool | None = None
