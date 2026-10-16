import subprocess
import shutil
import time
import csv
import io
import uuid
from typing import List, Dict, Any, Optional
from backend.app.scanners.base import BaseScanner

class FlawfinderAdapter(BaseScanner):
    def __init__(self):
        super().__init__(name="Flawfinder", supported_languages=["c", "cpp"])

    def check_installed(self) -> bool:
        return shutil.which("flawfinder") is not None

    def get_version(self) -> Optional[str]:
        if not self.check_installed():
            return None
        try:
            res = subprocess.run(["flawfinder", "--version"], capture_output=True, text=True, timeout=10)
            if res.returncode == 0:
                return res.stdout.strip()
        except Exception:
            pass
        return None

    def scan(self, target_path: str) -> Dict[str, Any]:
        if not self.check_installed():
            return {
                "status": "not_installed",
                "execution_time": 0.0,
                "findings": [],
                "raw_output": "",
                "error": "Flawfinder is not installed or not in PATH."
            }

        start_time = time.time()
        try:
            # Flawfinder supports CSV output format: --csv
            if isinstance(target_path, list):
                cmd = ["flawfinder", "--csv"] + [p for p in target_path if p]
            else:
                cmd = ["flawfinder", "--csv", str(target_path)]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            duration = round(time.time() - start_time, 3)

            raw_output = res.stdout
            findings = self._parse_csv_output(raw_output)

            return {
                "status": "success" if res.returncode == 0 else "failed",
                "execution_time": duration,
                "findings": findings,
                "raw_output": raw_output,
                "error": res.stderr if res.returncode != 0 else None
            }
        except subprocess.TimeoutExpired:
            return {
                "status": "failed",
                "execution_time": 120.0,
                "findings": [],
                "raw_output": "",
                "error": "Flawfinder scan timed out after 120 seconds."
            }
        except Exception as e:
            return {
                "status": "failed",
                "execution_time": round(time.time() - start_time, 3),
                "findings": [],
                "raw_output": "",
                "error": str(e)
            }

    def _parse_csv_output(self, csv_text: str) -> List[Dict[str, Any]]:
        findings = []
        if not csv_text.strip():
            return findings

        try:
            f = io.StringIO(csv_text.strip())
            reader = csv.DictReader(f)
            for row in reader:
                file_path = row.get("File", "").replace("\\", "/")
                line_str = row.get("Line", "1")
                try:
                    line = int(line_str)
                except ValueError:
                    line = 1

                level_str = row.get("Level", "1")
                try:
                    level = int(level_str)
                except ValueError:
                    level = 1

                # Normalize severity matching research paper:
                # 4-5: Error / Severe; 2-3: Warning; 1: Note/Info
                if level >= 4:
                    severity = "error"
                elif level >= 2:
                    severity = "warning"
                else:
                    severity = "note/info"

                cwe_raw = row.get("CWEs", "")
                cwe_id = None
                if cwe_raw:
                    # Clean CWE string (e.g., 'CWE-119!/CWE-120' -> 'CWE-120')
                    parts = [p.strip().replace("!", "") for p in cwe_raw.split("/")]
                    cwe_id = parts[-1] if parts else None

                finding = {
                    "finding_uuid": f"flawfinder-{uuid.uuid4().hex[:12]}",
                    "scanner": "Flawfinder",
                    "rule_id": row.get("RuleId") or row.get("Name", "FF_RULE"),
                    "file_path": file_path,
                    "line_number": line,
                    "column_number": int(row.get("Column", 0)) if row.get("Column", "0").isdigit() else 0,
                    "severity": severity,
                    "message": row.get("Warning", "Potential security issue detected by Flawfinder"),
                    "cwe_id": cwe_id or "Unknown",
                    "cwe_description": row.get("Suggestion", ""),
                    "code_snippet": row.get("Context", "").strip(),
                    "confidence": "high" if level >= 4 else "medium"
                }
                findings.append(finding)
        except Exception:
            pass
        return findings
