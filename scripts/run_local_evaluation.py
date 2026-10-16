"""
End-to-end evaluation runner script.
Ingests dataset, executes available security scanners (Flawfinder),
normalizes findings, generates repair patches, performs pre/post rescans,
and writes comprehensive evaluation report files to reports/.
"""

import os
import sys

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import init_db, SessionLocal
from backend.app.dataset.processor import dataset_processor
from backend.app.scanners.scanner_manager import scanner_manager
from backend.app.models.entities import SourceFile, ScannerRun, SecurityFinding, RepairPatch, VulnerabilityReview
from backend.app.repair.engine import repair_engine
from backend.app.evaluation.evaluator import evaluator

def main():
    print("=" * 60)
    print("SecureCode AI – Local End-to-End Evaluation Pipeline")
    print("=" * 60)

    # 1. Initialize Database
    init_db()
    db = SessionLocal()

    try:
        # 2. Ingest Dataset
        print("\n[Step 1] Ingesting DevGPT dataset files...")
        ingest_res = dataset_processor.scan_and_ingest(db)
        print(f" -> Added: {ingest_res['files_added']} files. Total: {ingest_res['total_files']}")

        # 3. Check Scanners
        print("\n[Step 2] Checking scanner availability...")
        statuses = scanner_manager.get_scanner_statuses()
        for s in statuses:
            state = "Installed" if s["installed"] else "Not installed"
            print(f" -> {s['scanner_name']}: {state} {s['version'] or ''}")

        # 4. Run Flawfinder Scan
        print("\n[Step 3] Running Flawfinder scan on dataset...")
        scan_res = scanner_manager.run_scanner("Flawfinder", dataset_processor.base_dir)
        findings = scan_res.get("findings", [])
        print(f" -> Flawfinder finished in {scan_res.get('execution_time')}s. Found {len(findings)} potential security issues.")

        # Save run and findings
        run_record = ScannerRun(
            scanner_name="Flawfinder",
            scanner_version=scanner_manager.scanners["Flawfinder"].get_version(),
            target_path=dataset_processor.base_dir,
            status=scan_res.get("status", "success"),
            execution_time_seconds=scan_res.get("execution_time", 0.0),
            files_scanned=ingest_res['total_files'],
            findings_count=len(findings),
            raw_output=scan_res.get("raw_output", "")[:50000]
        )
        db.add(run_record)
        db.commit()
        db.refresh(run_record)

        # Map to database files
        files_map = {f.filename: f for f in db.query(SourceFile).all()}
        new_findings_count = 0
        saved_findings = []

        for f in findings:
            fname = os.path.basename(f["file_path"])
            matched_file = files_map.get(fname)
            if matched_file:
                existing = db.query(SecurityFinding).filter(
                    SecurityFinding.source_file_id == matched_file.id,
                    SecurityFinding.scanner == "Flawfinder",
                    SecurityFinding.line_number == f["line_number"],
                    SecurityFinding.rule_id == f["rule_id"]
                ).first()
                if not existing:
                    sf = SecurityFinding(
                        finding_uuid=f["finding_uuid"],
                        source_file_id=matched_file.id,
                        scanner_run_id=run_record.id,
                        scanner="Flawfinder",
                        rule_id=f["rule_id"],
                        line_number=f["line_number"],
                        column_number=f["column_number"],
                        severity=f["severity"],
                        message=f["message"],
                        cwe_id=f["cwe_id"],
                        cwe_description=f["cwe_description"],
                        code_snippet=f["code_snippet"],
                        confidence=f["confidence"]
                    )
                    db.add(sf)
                    db.commit()
                    db.refresh(sf)
                    saved_findings.append(sf)
                    new_findings_count += 1
                else:
                    saved_findings.append(existing)

        print(f" -> Stored {new_findings_count} new findings in database.")

        # 5. Review & Repair Demonstration
        print("\n[Step 4] Running Repair Engine on detected vulnerabilities...")
        for sf in saved_findings[:3]:
            # Generate repair patch
            rep_res = repair_engine.generate_repair(db, sf.id, engine_type="rule_based")
            if rep_res.get("success"):
                patch_id = rep_res["patch_id"]
                print(f" -> Generated Patch #{patch_id} for Finding #{sf.id} ({sf.cwe_id})")
                # Apply and rescan
                apply_res = repair_engine.apply_patch(db, patch_id)
                print(f"    Rescan passed: {apply_res.get('rescan_passed')}")

        # 6. Generate Reports
        print("\n[Step 5] Exporting evaluation reports to reports/...")
        reports = evaluator.generate_reports(db)
        for name, path in reports.items():
            print(f" -> {name}: {path}")

        print("\n" + "=" * 60)
        print("Local Evaluation Pipeline Completed Successfully!")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    main()
