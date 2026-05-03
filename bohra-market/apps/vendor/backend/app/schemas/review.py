from pydantic import BaseModel, field_validator
from uuid import UUID


class ReviewCreate(BaseModel):
    product_id: UUID
    order_id: UUID
    rating: int
    comment: str | None = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewResponse(BaseModel):
    id: str
    user_id: str
    product_id: str
    rating: int
    comment: str | None
    created_at: str
    reviewer_name: str | None = None
