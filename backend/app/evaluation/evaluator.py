import os
import json
import csv
import shutil
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.models.entities import SourceFile, SecurityFinding, VulnerabilityReview, RepairPatch, LocalEvaluation, ScannerRun

class Evaluator:
    def __init__(self):
        pass

    def get_local_metrics(self, db: Session) -> Dict[str, Any]:
        files = db.query(SourceFile).all()
        findings = db.query(SecurityFinding).all()
        reviews = db.query(VulnerabilityReview).all()
        patches = db.query(RepairPatch).all()

        total_files = len(files)
        total_loc = sum(f.code_lines for f in files)

        scanner_counts = {}
        for f in findings:
            scanner_counts[f.scanner] = scanner_counts.get(f.scanner, 0) + 1

        confirmed = len([r for r in reviews if r.status == "confirmed_vulnerability"])
        false_positives = len([r for r in reviews if r.status == "false_positive"])
        unreviewed = len(findings) - len(reviews)

        patches_attempted = len(patches)
        patches_applied = len([p for p in patches if p.status == "applied"])
        patches_passed = len([p for p in patches if p.rescan_passed is True])

        fix_rate = round((patches_passed / patches_attempted) * 100, 2) if patches_attempted > 0 else 0.0

        return {
            "total_files": total_files,
            "total_loc": total_loc,
            "total_findings": len(findings),
            "scanner_counts": scanner_counts,
            "confirmed_vulnerabilities": confirmed,
            "false_positives": false_positives,
            "unreviewed_findings": unreviewed,
            "repair_attempts": patches_attempted,
            "repairs_applied": patches_applied,
            "repairs_verified": patches_passed,
            "repair_fix_rate": fix_rate
        }

    def get_paper_vs_local_comparison(self, db: Session) -> List[Dict[str, Any]]:
        local = self.get_local_metrics(db)

        # Paper reported benchmarks from Tables 4, 6, 7, 12
        comparisons = [
            {
                "metric": "Total Source Files Evaluated",
                "paper_value": 2315,
                "local_value": local["total_files"],
                "absolute_difference": local["total_files"] - 2315,
                "comparable": local["total_files"] == 2315,
                "notes": "Full DevGPT analysis in paper analyzed 2,315 C-family files. Local system operates on loaded dataset directory."
            },
            {
                "metric": "Total Lines of Code (LOC)",
                "paper_value": 44943,
                "local_value": local["total_loc"],
                "absolute_difference": local["total_loc"] - 44943,
                "comparable": local["total_loc"] == 44943,
                "notes": "Paper calculated code lines using cloc tool across C, C++, and C# files."
            },
            {
                "metric": "Flawfinder Detections",
                "paper_value": 679,
                "local_value": local["scanner_counts"].get("Flawfinder", 0),
                "absolute_difference": local["scanner_counts"].get("Flawfinder", 0) - 679,
                "comparable": local["total_files"] == 2315,
                "notes": "Paper Table 6 reports 679 Flawfinder detections (20 errors, 23 warnings, 633 notes/info)."
            },
            {
                "metric": "Snyk Detections",
                "paper_value": 153,
                "local_value": local["scanner_counts"].get("Snyk", 0),
                "absolute_difference": local["scanner_counts"].get("Snyk", 0) - 153,
                "comparable": False,
                "notes": "Snyk requires account authentication. In local offline execution, marked unavailable per strict No-API-Key policy unless authenticated."
            },
            {
                "metric": "Semgrep Detections",
                "paper_value": 56,
                "local_value": local["scanner_counts"].get("Semgrep", 0),
                "absolute_difference": local["scanner_counts"].get("Semgrep", 0) - 56,
                "comparable": local["total_files"] == 2315,
                "notes": "Paper Table 6 reports 56 Semgrep warnings across 2,315 files."
            },
            {
                "metric": "Cppcheck Detections",
                "paper_value": 71,
                "local_value": local["scanner_counts"].get("Cppcheck", 0),
                "absolute_difference": local["scanner_counts"].get("Cppcheck", 0) - 71,
                "comparable": local["total_files"] == 2315,
                "notes": "Paper Table 6 reports 71 Cppcheck warnings."
            },
            {
                "metric": "Confirmed Vulnerabilities",
                "paper_value": 56,
                "local_value": local["confirmed_vulnerabilities"],
                "absolute_difference": local["confirmed_vulnerabilities"] - 56,
                "comparable": False,
                "notes": "Paper confirmed 56 genuine vulnerabilities across 48 files after expert manual review of 114 candidate files."
            },
            {
                "metric": "Automated Repair Fix Rate (%)",
                "paper_value": "75.0% - 78.6% (GPT-4.1 / GPT-5 / Opus 4.1)",
                "local_value": f"{local['repair_fix_rate']}%",
                "absolute_difference": None,
                "comparable": False,
                "notes": "Paper evaluated cloud frontier models (GPT-4.1, GPT-5, Claude Opus 4.1). Local system operates via deterministic rule-based repair or local Ollama."
            }
        ]
        return comparisons

    def generate_reports(self, db: Session) -> Dict[str, str]:
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
        paths = {}

        # 1. dataset_report.csv
        files = db.query(SourceFile).all()
        p1 = os.path.join(settings.REPORTS_DIR, "dataset_report.csv")
        with open(p1, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["id", "relative_path", "filename", "language", "snapshot", "code_lines", "total_lines"])
            for fl in files:
                w.writerow([fl.id, fl.relative_path, fl.filename, fl.language, fl.snapshot, fl.code_lines, fl.total_lines])
        paths["dataset_report"] = p1

        # 2. scanner_results.csv
        runs = db.query(ScannerRun).all()
        p2 = os.path.join(settings.REPORTS_DIR, "scanner_results.csv")
        with open(p2, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["id", "scanner_name", "scanner_version", "status", "files_scanned", "findings_count", "execution_time_seconds"])
            for r in runs:
                w.writerow([r.id, r.scanner_name, r.scanner_version, r.status, r.files_scanned, r.findings_count, r.execution_time_seconds])
        paths["scanner_results"] = p2

        # 3. normalized_findings.csv
        findings = db.query(SecurityFinding).all()
        p3 = os.path.join(settings.REPORTS_DIR, "normalized_findings.csv")
        with open(p3, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["id", "finding_uuid", "scanner", "rule_id", "file_path", "line_number", "severity", "cwe_id", "message"])
            for fn in findings:
                file_rel = fn.source_file.relative_path if fn.source_file else ""
                w.writerow([fn.id, fn.finding_uuid, fn.scanner, fn.rule_id, file_rel, fn.line_number, fn.severity, fn.cwe_id, fn.message])
        paths["normalized_findings"] = p3

        # 4. cwe_distribution.csv
        p4 = os.path.join(settings.REPORTS_DIR, "cwe_distribution.csv")
        cwe_counts = {}
        for fn in findings:
            c = fn.cwe_id or "Unknown"
            cwe_counts[c] = cwe_counts.get(c, 0) + 1
        with open(p4, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["cwe", "local_count"])
            for k, v in cwe_counts.items():
                w.writerow([k, v])
        paths["cwe_distribution"] = p4

        # 5. repair_results.csv
        patches = db.query(RepairPatch).all()
        p5 = os.path.join(settings.REPORTS_DIR, "repair_results.csv")
        with open(p5, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["id", "finding_id", "engine_type", "model_name", "status", "rescan_passed"])
            for pt in patches:
                w.writerow([pt.id, pt.finding_id, pt.engine_type, pt.model_name, pt.status, pt.rescan_passed])
        paths["repair_results"] = p5

        # 6. final_evaluation_report.md
        metrics = self.get_local_metrics(db)
        comparisons = self.get_paper_vs_local_comparison(db)
        p6 = os.path.join(settings.REPORTS_DIR, "final_evaluation_report.md")
        with open(p6, "w", encoding="utf-8") as f:
            f.write("# Final Evaluation Report: SecureCode AI\n\n")
            f.write(f"**Generated:** {datetime.datetime.utcnow().isoformat()}Z\n\n")
            f.write("## 1. Local Implementation Metrics\n\n")
            f.write(f"- **Files Processed:** {metrics['total_files']}\n")
            f.write(f"- **Lines of Code:** {metrics['total_loc']}\n")
            f.write(f"- **Total Scanner Findings:** {metrics['total_findings']}\n")
            f.write(f"- **Confirmed Vulnerabilities:** {metrics['confirmed_vulnerabilities']}\n")
            f.write(f"- **False Positives:** {metrics['false_positives']}\n")
            f.write(f"- **Repair Attempts:** {metrics['repair_attempts']}\n")
            f.write(f"- **Verified Repairs (Rescan Passed):** {metrics['repairs_verified']}\n")
            f.write(f"- **Local Fix Rate:** {metrics['repair_fix_rate']}%\n\n")
            f.write("## 2. Research Paper vs Local Execution Comparison\n\n")
            f.write("| Metric | Paper Reported Value | Local Result | Comparable? | Notes |\n")
            f.write("| :--- | :--- | :--- | :--- | :--- |\n")
            for c in comparisons:
                f.write(f"| {c['metric']} | {c['paper_value']} | {c['local_value']} | {'Yes' if c['comparable'] else 'No'} | {c['notes']} |\n")
        paths["final_report"] = p6

        # 7. language_statistics.csv
        lang_counts = {}
        for fl in files:
            lang = fl.language or "Unknown"
            if lang not in lang_counts:
                lang_counts[lang] = {"files": 0, "code_lines": 0, "total_lines": 0, "findings": 0}
            lang_counts[lang]["files"] += 1
            lang_counts[lang]["code_lines"] += fl.code_lines or 0
            lang_counts[lang]["total_lines"] += fl.total_lines or 0
        for fn in findings:
            lang = fn.source_file.language if fn.source_file else "Unknown"
            if lang in lang_counts:
                lang_counts[lang]["findings"] += 1
        p7 = os.path.join(settings.REPORTS_DIR, "language_statistics.csv")
        with open(p7, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["language", "files", "code_lines", "total_lines", "findings"])
            for lang, stats in sorted(lang_counts.items()):
                w.writerow([lang, stats["files"], stats["code_lines"], stats["total_lines"], stats["findings"]])
        paths["language_statistics"] = p7

        # 8. paper_benchmarks.csv — copy from data/
        src_bench = os.path.join(settings.BASE_DIR, "data", "paper_benchmarks.csv")
        if os.path.exists(src_bench):
            p8 = os.path.join(settings.REPORTS_DIR, "paper_benchmarks.csv")
            shutil.copy2(src_bench, p8)
            paths["paper_benchmarks"] = p8

        # 9. local_evaluation.csv — paper-vs-local comparison
        comparisons = self.get_paper_vs_local_comparison(db)
        p9 = os.path.join(settings.REPORTS_DIR, "local_evaluation.csv")
        with open(p9, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["metric", "paper_value", "local_value", "absolute_difference", "comparable", "notes"])
            for c in comparisons:
                w.writerow([c["metric"], c["paper_value"], c["local_value"], c["absolute_difference"], c["comparable"], c["notes"]])
        paths["local_evaluation"] = p9

        return paths

evaluator = Evaluator()
