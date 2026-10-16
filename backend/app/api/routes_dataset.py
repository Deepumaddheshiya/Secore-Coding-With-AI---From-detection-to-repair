import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import SourceFile
from backend.app.schemas.schemas import SourceFileOut, DatasetSummary, DatasetProcessRequest
from backend.app.dataset.processor import dataset_processor
from backend.app.config import settings

router = APIRouter(prefix="/dataset", tags=["Dataset Management"])

@router.post("/ingest")
def ingest_dataset(req: Optional[DatasetProcessRequest] = None, db: Session = Depends(get_db)) -> Dict[str, Any]:
    target_dir = req.target_directory if req and req.target_directory else settings.DATASET_DIR
    res = dataset_processor.scan_and_ingest(db, target_dir)
    return res

@router.get("/summary", response_model=DatasetSummary)
def get_dataset_summary(db: Session = Depends(get_db)):
    summary = dataset_processor.get_summary(db)
    return summary

@router.get("/files", response_model=List[SourceFileOut])
def get_dataset_files(
    language: Optional[str] = None,
    snapshot: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(SourceFile)
    if language:
        query = query.filter(SourceFile.language == language.lower())
    if snapshot:
        query = query.filter(SourceFile.snapshot == snapshot)
    if search:
        query = query.filter(SourceFile.filename.ilike(f"%{search}%") | SourceFile.relative_path.ilike(f"%{search}%"))
    
    files = query.offset(offset).limit(limit).all()
    return files

@router.get("/files/{file_id}")
def get_file_content(file_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    file_record = db.query(SourceFile).filter(SourceFile.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    abs_path = os.path.join(settings.DATASET_DIR, file_record.relative_path)
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail=f"File not found on disk: {abs_path}")

    with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    return {
        "file": SourceFileOut.from_orm(file_record),
        "content": content
    }
