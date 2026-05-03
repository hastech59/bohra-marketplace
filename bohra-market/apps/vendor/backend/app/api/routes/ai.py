"""AI routes for the Vendor app — description generator and tag suggester only."""
from fastapi import APIRouter, Depends
from app.schemas.ai import AIDescriptionRequest, AITagsRequest
from app.services import ai_service
from app.core.security import get_current_vendor

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/vendor/description")
async def generate_description(
    req: AIDescriptionRequest,
    current_vendor: dict = Depends(get_current_vendor),
):
    description = await ai_service.generate_description(req)
    return {"description": description}


@router.post("/product/tags")
async def suggest_tags(
    req: AITagsRequest,
    current_vendor: dict = Depends(get_current_vendor),
):
    tags = await ai_service.suggest_tags(req)
    return {"tags": tags}
