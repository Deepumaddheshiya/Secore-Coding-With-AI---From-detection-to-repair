from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.schemas import PaperVsLocalComparison
from backend.app.evaluation.evaluator import evaluator

router = APIRouter(prefix="/evaluation", tags=["Evaluation & Paper Comparison"])

@router.get("/local-metrics")
def get_local_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    return evaluator.get_local_metrics(db)

@router.get("/paper-vs-local", response_model=List[PaperVsLocalComparison])
def get_paper_vs_local(db: Session = Depends(get_db)):
    return evaluator.get_paper_vs_local_comparison(db)

@router.post("/generate-reports")
def generate_evaluation_reports(db: Session = Depends(get_db)) -> Dict[str, Any]:
    generated = evaluator.generate_reports(db)
    return {
        "success": True,
        "message": "Generated CSV exports and final evaluation markdown report.",
        "reports": generated
    }
