from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.routes import auth, products, orders, ai, reviews

settings = get_settings()

app = FastAPI(
    title="Bohra Market — User API",
    description="Shopper/user backend for Bohra Market",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(ai.router)
app.include_router(reviews.router)

# Wishlist routes
from fastapi import APIRouter, Depends
from app.services import review_service
from app.core.security import get_current_user

wishlist_router = APIRouter(prefix="/wishlist", tags=["wishlist"])

@wishlist_router.post("/{product_id}")
async def add_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    return await review_service.add_to_wishlist(current_user["id"], product_id)

@wishlist_router.delete("/{product_id}")
async def remove_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    return await review_service.remove_from_wishlist(current_user["id"], product_id)

@wishlist_router.get("/me")
async def my_wishlist(current_user: dict = Depends(get_current_user)):
    return await review_service.get_wishlist(current_user["id"])

app.include_router(wishlist_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Bohra Market User API"}
