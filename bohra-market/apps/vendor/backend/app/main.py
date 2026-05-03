from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.routes import auth, vendor, products, ai

settings = get_settings()

app = FastAPI(
    title="Bohra Market — Vendor API",
    description="Vendor/merchant backend for Bohra Market",
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
app.include_router(vendor.router)
app.include_router(products.router)
app.include_router(ai.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Bohra Market Vendor API"}
