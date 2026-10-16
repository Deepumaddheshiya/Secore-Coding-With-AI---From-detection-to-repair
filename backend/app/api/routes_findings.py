from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.entities import SecurityFinding, SourceFile, VulnerabilityReview, SystemAuditLog
from backend.app.schemas.schemas import SecurityFindingOut, VulnerabilityReviewCreate, VulnerabilityReviewOut, CWEDistributionItem, LanguageStatisticsItem

router = APIRouter(prefix="/findings", tags=["Security Findings"])

@router.get("", response_model=List[SecurityFindingOut])
def list_findings(
    severity: Optional[str] = None,
    scanner: Optional[str] = None,
    cwe: Optional[str] = None,
    language: Optional[str] = None,
    snapshot: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(SecurityFinding).join(SourceFile)
    if severity:
        query = query.filter(SecurityFinding.severity == severity.lower())
    if scanner:
        query = query.filter(SecurityFinding.scanner == scanner)
    if cwe:
        query = query.filter(SecurityFinding.cwe_id.ilike(f"%{cwe}%"))
    if language:
        query = query.filter(SourceFile.language == language.lower())
    if snapshot:
        query = query.filter(SourceFile.snapshot == snapshot)

    findings = query.offset(offset).limit(limit).all()
    results = []
    for f in findings:
        review = db.query(VulnerabilityReview).filter(VulnerabilityReview.finding_id == f.id).first()
        item = SecurityFindingOut(
            id=f.id,
            finding_uuid=f.finding_uuid,
            source_file_id=f.source_file_id,
            scanner=f.scanner,
            rule_id=f.rule_id,
            line_number=f.line_number,
            column_number=f.column_number,
            severity=f.severity,
            message=f.message,
            cwe_id=f.cwe_id,
            cwe_description=f.cwe_description,
            code_snippet=f.code_snippet,
            confidence=f.confidence,
            created_at=f.created_at,
            file_path=f.source_file.relative_path if f.source_file else "",
            snapshot=f.source_file.snapshot if f.source_file else "",
            language=f.source_file.language if f.source_file else "",
            review_status=review.status if review else "unreviewed"
        )
        results.append(item)
    return results

@router.get("/{finding_id}")
def get_finding_detail(finding_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    finding = db.query(SecurityFinding).filter(SecurityFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")
    review = db.query(VulnerabilityReview).filter(VulnerabilityReview.finding_id == finding.id).first()
    return {
        "finding": finding,
        "source_file": finding.source_file,
        "review": review,
        "patches": finding.patches
    }

@router.post("/{finding_id}/review", response_model=VulnerabilityReviewOut)
def review_finding(finding_id: int, review_in: VulnerabilityReviewCreate, db: Session = Depends(get_db)):
    finding = db.query(SecurityFinding).filter(SecurityFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")

    review = db.query(VulnerabilityReview).filter(VulnerabilityReview.finding_id == finding_id).first()
    if not review:
        review = VulnerabilityReview(
            finding_id=finding_id,
            source_file_id=finding.source_file_id,
            status=review_in.status,
            assigned_cwes=review_in.assigned_cwes or finding.cwe_id,
            reviewer_notes=review_in.reviewer_notes
        )
        db.add(review)
    else:
        review.status = review_in.status
        if review_in.assigned_cwes:
            review.assigned_cwes = review_in.assigned_cwes
        review.reviewer_notes = review_in.reviewer_notes

    db.commit()
    db.refresh(review)

    audit = SystemAuditLog(
        action="REVIEW_VULNERABILITY",
        entity_type="VulnerabilityReview",
        entity_id=str(review.id),
        details=f"Reviewed finding #{finding_id}: marked as {review.status}"
    )
    db.add(audit)
    db.commit()

    return review

@router.get("/analytics/cwe-distribution", response_model=List[CWEDistributionItem])
def get_cwe_distribution(db: Session = Depends(get_db)):
    # Local aggregation of CWEs
    results = db.query(SecurityFinding.cwe_id, func.count(SecurityFinding.id)).group_by(SecurityFinding.cwe_id).all()
    
    top_25_map = {
        "CWE-20": "12",
        "CWE-22": "5",
        "CWE-78": "7",
        "CWE-119": "20",
        "CWE-190": "23"
    }

    items = []
    for cwe, count in results:
        cwe_clean = cwe or "Unknown"
        items.append(CWEDistributionItem(
            cwe=cwe_clean,
            description="Detected security weakness category",
            count=count,
            top_25_rank=top_25_map.get(cwe_clean, "-")
        ))
    return sorted(items, key=lambda x: x.count, reverse=True)

@router.get("/analytics/language-statistics", response_model=List[LanguageStatisticsItem])
def get_language_statistics(db: Session = Depends(get_db)):
    langs = ["c", "cpp", "csharp"]
    items = []
    for lang in langs:
        files = db.query(SourceFile).filter(SourceFile.language == lang).all()
        f_count = len(files)
        loc = sum(f.code_lines for f in files)
        detections = db.query(SecurityFinding).join(SourceFile).filter(SourceFile.language == lang).count()
        loc_per_det = round(loc / detections, 1) if detections > 0 else 0.0
        files_per_det = round(f_count / detections, 1) if detections > 0 else 0.0

        items.append(LanguageStatisticsItem(
            language=lang.upper(),
            files=f_count,
            lines_of_code=loc,
            detections=detections,
            loc_per_detection=loc_per_det,
            files_per_detection=files_per_det
        ))
    return items
