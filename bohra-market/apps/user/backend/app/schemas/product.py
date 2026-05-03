from pydantic import BaseModel, field_validator
from typing import Any
from uuid import UUID
from datetime import datetime


class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    discount_percent: float = 0.0
    stock_quantity: int
    unit: str  # kg, piece, box, litre, dozen
    category_id: UUID
    tags: list[str] = []
    images: list[str] = []  # Supabase Storage URLs
    latitude: float | None = None
    longitude: float | None = None

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Price must be positive")
        return round(v, 2)

    @field_validator("discount_percent")
    @classmethod
    def discount_range(cls, v: float) -> float:
        if not 0 <= v <= 90:
            raise ValueError("Discount must be between 0 and 90 percent")
        return v


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    discount_percent: float | None = None
    stock_quantity: int | None = None
    unit: str | None = None
    category_id: UUID | None = None
    tags: list[str] | None = None
    images: list[str] | None = None
    is_active: bool | None = None
    latitude: float | None = None
    longitude: float | None = None


class ProductFilters(BaseModel):
    q: str | None = None
    category_id: UUID | None = None
    min_price: float | None = None
    max_price: float | None = None
    min_rating: float | None = None
    tags: list[str] | None = None
    vendor_city: str | None = None
    page: int = 1
    page_size: int = 20
    sort_by: str = "created_at"  # price, rating, distance
    sort_order: str = "desc"


class NearbyProductsRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 50.0
    category_id: UUID | None = None
    page: int = 1
    page_size: int = 20
