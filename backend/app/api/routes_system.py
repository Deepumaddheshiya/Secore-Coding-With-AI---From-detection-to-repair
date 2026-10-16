import os
import shutil
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import SystemAuditLog
from backend.app.repair.engine import repair_engine
from backend.app.config import settings

router = APIRouter(prefix="/system", tags=["System & Health"])

@router.get("/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected",
        "cloud_llm_calls_enabled": False,  # Strict Rule 3
        "api_keys_required": False          # Strict Rule 2
    }

@router.get("/ollama-status")
def get_ollama_status() -> Dict[str, Any]:
    installed = shutil.which("ollama") is not None
    available = repair_engine.check_ollama_available()
    models = repair_engine.get_local_ollama_models() if available else []
    return {
        "installed": installed,
        "service_online": available,
        "endpoint": settings.OLLAMA_HOST,
        "available_models": models,
        "active_model": settings.DEFAULT_OLLAMA_MODEL if models else None,
        "notes": "Ollama runs strictly locally on localhost. No cloud network requests or API keys."
    }

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    logs = db.query(SystemAuditLog).order_by(SystemAuditLog.created_at.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "status": l.status,
            "created_at": l.created_at.isoformat()
        }
        for l in logs
    ]
