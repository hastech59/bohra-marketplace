from pydantic import BaseModel
from uuid import UUID


class AISearchRequest(BaseModel):
    query: str
    user_latitude: float | None = None
    user_longitude: float | None = None


class AISearchResponse(BaseModel):
    filters: dict
    products: list[dict]
    explanation: str


class AIRecommendRequest(BaseModel):
    user_id: str
    limit: int = 8


class AIDescriptionRequest(BaseModel):
    product_name: str
    category: str
    price: float
    unit: str
    additional_info: str | None = None


class AITagsRequest(BaseModel):
    product_name: str
    description: str
    category: str


class AIChatMessage(BaseModel):
    role: str  # user | assistant
    content: str


class AIChatRequest(BaseModel):
    messages: list[AIChatMessage]
    user_city: str | None = None
    user_latitude: float | None = None
    user_longitude: float | None = None
