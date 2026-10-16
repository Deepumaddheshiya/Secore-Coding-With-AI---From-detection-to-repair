from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import RepairPatch
from backend.app.schemas.schemas import RepairGenerateRequest, RepairPatchOut, PatchActionRequest
from backend.app.repair.engine import repair_engine

router = APIRouter(prefix="/repair", tags=["Vulnerability Repair Engine"])

@router.post("/generate")
def generate_repair_patch(req: RepairGenerateRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    res = repair_engine.generate_repair(db, req.finding_id, req.engine_type, req.model_name)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to generate repair patch."))
    return res

@router.get("/patches", response_model=List[RepairPatchOut])
def list_patches(db: Session = Depends(get_db)):
    patches = db.query(RepairPatch).order_by(RepairPatch.created_at.desc()).all()
    return patches

@router.get("/patches/{patch_id}", response_model=RepairPatchOut)
def get_patch_details(patch_id: int, db: Session = Depends(get_db)):
    patch = db.query(RepairPatch).filter(RepairPatch.id == patch_id).first()
    if not patch:
        raise HTTPException(status_code=404, detail="Patch not found.")
    return patch

@router.post("/apply")
def apply_patch(req: PatchActionRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    res = repair_engine.apply_patch(db, req.patch_id)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to apply patch."))
    return res

@router.post("/rollback")
def rollback_patch(req: PatchActionRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    res = repair_engine.rollback_patch(db, req.patch_id)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to rollback patch."))
    return res
