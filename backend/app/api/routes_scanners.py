import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.app.database import get_db
from backend.app.models.entities import ScannerRun, SecurityFinding, SourceFile, SystemAuditLog
from backend.app.schemas.schemas import ScannerStatus, ScannerRunOut
from backend.app.scanners.scanner_manager import scanner_manager
from backend.app.config import settings

router = APIRouter(prefix="/scanners", tags=["Security Scanners"])

class ScanRequest(BaseModel):
    scanner_name: Optional[str] = "all"  # Flawfinder, Semgrep, Cppcheck, Snyk, or all
    target_path: Optional[str] = None
    file_ids: Optional[List[int]] = None

from fastapi.responses import PlainTextResponse

@router.get("/status", response_model=List[ScannerStatus])
def get_scanner_statuses(db: Session = Depends(get_db)):
    return scanner_manager.get_scanner_statuses(db)

@router.get("/runs/{run_id}/report")
def get_scanner_run_report(run_id: int, db: Session = Depends(get_db)):
    run = db.query(ScannerRun).filter(ScannerRun.id == run_id).first()
    if not run or not run.raw_output:
        raise HTTPException(status_code=404, detail="Raw report not found for this scanner run.")
    return PlainTextResponse(content=run.raw_output, headers={
        "Content-Disposition": f"attachment; filename={run.scanner_name.lower()}_run_{run_id}.txt"
    })

@router.post("/run")
def trigger_scan(req: ScanRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    if req.file_ids:
        candidate_files = db.query(SourceFile).filter(SourceFile.id.in_(req.file_ids)).all()
        if not candidate_files:
            raise HTTPException(status_code=400, detail="No matching source files found for provided file_ids.")
    else:
        candidate_files = db.query(SourceFile).all()

    target_display = f"Dataset ({len(candidate_files)} candidate files)" if not req.file_ids else f"Selected {len(candidate_files)} files"
    files_map = {sf.relative_path.replace("\\", "/"): sf for sf in candidate_files}
    filename_map = {sf.filename: sf for sf in candidate_files}

    results = []
    scanners_to_run = [req.scanner_name] if req.scanner_name and req.scanner_name != "all" else ["Flawfinder", "Semgrep", "Cppcheck", "Snyk"]

    total_findings_added = 0

    for s_name in scanners_to_run:
        adapter = scanner_manager.scanners.get(s_name)
        supported_langs = adapter.supported_languages if adapter else ["c", "cpp", "csharp"]

        # Only pass files supported by this scanner
        matching_files = [sf for sf in candidate_files if sf.language.lower() in supported_langs and os.path.exists(sf.file_path)]
        skipped_files = [sf for sf in candidate_files if sf.language.lower() not in supported_langs]

        if matching_files and adapter and adapter.check_installed():
            scan_targets = [sf.file_path for sf in matching_files]
            scan_res = scanner_manager.run_scanner(s_name, scan_targets)
        elif adapter and not adapter.check_installed():
            scan_res = {
                "status": "not_installed",
                "execution_time": 0.0,
                "findings": [],
                "raw_output": f"{s_name} is not installed locally in system PATH.",
                "error": f"{s_name} is not installed."
            }
        else:
            scan_res = {
                "status": "zero_findings",
                "execution_time": 0.0,
                "findings": [],
                "raw_output": f"No files matched supported languages ({', '.join(supported_langs)}) for {s_name}.",
                "error": None
            }

        raw_status = scan_res.get("status", "failed")
        findings = scan_res.get("findings", [])
        exec_time = scan_res.get("execution_time", 0.0)
        raw_output = scan_res.get("raw_output", "")
        error_msg = scan_res.get("error")

        if raw_status == "success":
            status = "completed" if len(findings) > 0 else "zero_findings"
        elif raw_status in ["not_installed", "requires_auth"]:
            status = raw_status
        elif raw_status == "zero_findings":
            status = "zero_findings"
        else:
            status = "failed"

        # Record Scanner Run with real scanned & skipped file counts
        run_record = ScannerRun(
            scanner_name=s_name,
            scanner_version=adapter.get_version() if adapter and adapter.check_installed() else None,
            target_path=target_display,
            status=status,
            execution_time_seconds=exec_time,
            files_scanned=len(matching_files),
            files_skipped=len(skipped_files),
            findings_count=len(findings),
            raw_output=raw_output[:50000] if raw_output else "",
            error_message=error_msg
        )
        db.add(run_record)
        db.commit()
        db.refresh(run_record)

        # Store Findings
        for f in findings:
            f_path = f.get("file_path", "").replace("\\", "/")
            # Match SourceFile record
            matched_file = None
            for rel_p, sf in files_map.items():
                if rel_p in f_path or f_path.endswith(rel_p):
                    matched_file = sf
                    break
            if not matched_file:
                # Match by basename
                base_name = os.path.basename(f_path)
                matched_file = filename_map.get(base_name)

            if matched_file:
                # Check for duplicate finding
                existing = db.query(SecurityFinding).filter(
                    SecurityFinding.source_file_id == matched_file.id,
                    SecurityFinding.scanner == s_name,
                    SecurityFinding.line_number == f.get("line_number"),
                    SecurityFinding.rule_id == f.get("rule_id")
                ).first()
                if not existing:
                    new_finding = SecurityFinding(
                        finding_uuid=f.get("finding_uuid"),
                        source_file_id=matched_file.id,
                        scanner_run_id=run_record.id,
                        scanner=s_name,
                        rule_id=f.get("rule_id"),
                        line_number=f.get("line_number", 1),
                        column_number=f.get("column_number", 0),
                        severity=f.get("severity", "warning"),
                        message=f.get("message", ""),
                        cwe_id=f.get("cwe_id", "Unknown"),
                        cwe_description=f.get("cwe_description", ""),
                        code_snippet=f.get("code_snippet", ""),
                        confidence=f.get("confidence", "medium")
                    )
                    db.add(new_finding)
                    total_findings_added += 1

        db.commit()
        results.append({
            "scanner": s_name,
            "status": status,
            "execution_time_seconds": exec_time,
            "findings_count": len(findings),
            "error": error_msg
        })

    audit = SystemAuditLog(
        action="SCAN_EXECUTION",
        entity_type="ScannerRun",
        details=f"Ran {len(scanners_to_run)} scanners on {target_display}. New findings saved: {total_findings_added}."
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "results": results,
        "new_findings_added": total_findings_added
    }

@router.get("/runs", response_model=List[ScannerRunOut])
def get_scanner_runs(db: Session = Depends(get_db)):
    runs = db.query(ScannerRun).order_by(ScannerRun.created_at.desc()).limit(50).all()
    return runs
