from fastapi import APIRouter, Depends
from app.schemas.review import ReviewCreate
from app.services import review_service
from app.core.security import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("")
async def create_review(
    data: ReviewCreate,
    current_user: dict = Depends(get_current_user),
):
    return await review_service.create_review(current_user["id"], data)


@router.get("/product/{product_id}")
async def product_reviews(product_id: str):
    return await review_service.get_product_reviews(product_id)


@router.post("/wishlist/{product_id}")
async def add_wishlist(
    product_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await review_service.add_to_wishlist(current_user["id"], product_id)


@router.delete("/wishlist/{product_id}")
async def remove_wishlist(
    product_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await review_service.remove_from_wishlist(current_user["id"], product_id)


@router.get("/wishlist/me")
async def my_wishlist(current_user: dict = Depends(get_current_user)):
    return await review_service.get_wishlist(current_user["id"])
