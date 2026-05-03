"""AI routes for the User app — search, recommendations, and chatbot."""
from fastapi import APIRouter, Depends
from app.schemas.ai import AISearchRequest, AIRecommendRequest, AIChatRequest
from app.services import ai_service
from app.core.security import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/search")
async def ai_search(
    req: AISearchRequest,
    current_user: dict = Depends(get_current_user),
):
    return await ai_service.ai_search(req)


@router.post("/recommend")
async def ai_recommend(
    req: AIRecommendRequest,
    current_user: dict = Depends(get_current_user),
):
    return await ai_service.ai_recommend(req)


@router.post("/chat")
async def chat(
    req: AIChatRequest,
    current_user: dict = Depends(get_current_user),
):
    return await ai_service.chat_stream(req)
