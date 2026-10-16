from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import init_db, SessionLocal
from backend.app.dataset.processor import dataset_processor
from backend.app.api.routes_benchmarks import router as benchmarks_router
from backend.app.api.routes_dataset import router as dataset_router
from backend.app.api.routes_scanners import router as scanners_router
from backend.app.api.routes_findings import router as findings_router
from backend.app.api.routes_repair import router as repair_router
from backend.app.api.routes_evaluation import router as evaluation_router
from backend.app.api.routes_system import router as system_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    # Ingest default dataset files on startup if present
    db = SessionLocal()
    try:
        dataset_processor.scan_and_ingest(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Research-oriented implementation of 'Secure coding with AI – from detection to repair' (Empirical Software Engineering 2026). Strictly offline, zero cloud AI calls, zero API keys.",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(benchmarks_router, prefix=settings.API_PREFIX)
app.include_router(dataset_router, prefix=settings.API_PREFIX)
app.include_router(scanners_router, prefix=settings.API_PREFIX)
app.include_router(findings_router, prefix=settings.API_PREFIX)
app.include_router(repair_router, prefix=settings.API_PREFIX)
app.include_router(evaluation_router, prefix=settings.API_PREFIX)
app.include_router(system_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "paper_doi": "10.1007/s10664-026-10812-8",
        "message": "SecureCode AI backend running locally."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
