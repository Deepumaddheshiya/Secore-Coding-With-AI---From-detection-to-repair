import subprocess
import shutil
import time
import json
import uuid
from typing import List, Dict, Any, Optional
from backend.app.scanners.base import BaseScanner

class SemgrepAdapter(BaseScanner):
    def __init__(self):
        super().__init__(name="Semgrep", supported_languages=["c", "cpp", "csharp"])

    def check_installed(self) -> bool:
        return shutil.which("semgrep") is not None

    def get_version(self) -> Optional[str]:
        if not self.check_installed():
            return None
        try:
            res = subprocess.run(["semgrep", "--version"], capture_output=True, text=True, timeout=10)
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
                "error": "Semgrep is not installed or not in PATH. Install with: pip install semgrep"
            }

        start_time = time.time()
        try:
            cmd = ["semgrep", "--config=auto", "--json", target_path]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            duration = round(time.time() - start_time, 3)

            raw_output = res.stdout
            findings = self._parse_json_output(raw_output)

            return {
                "status": "success" if res.returncode in [0, 1] else "failed",
                "execution_time": duration,
                "findings": findings,
                "raw_output": raw_output,
                "error": res.stderr if res.returncode not in [0, 1] else None
            }
        except subprocess.TimeoutExpired:
            return {
                "status": "failed",
                "execution_time": 120.0,
                "findings": [],
                "raw_output": "",
                "error": "Semgrep scan timed out after 120 seconds."
            }
        except Exception as e:
            return {
                "status": "failed",
                "execution_time": round(time.time() - start_time, 3),
                "findings": [],
                "raw_output": "",
                "error": str(e)
            }

    def _parse_json_output(self, json_text: str) -> List[Dict[str, Any]]:
        findings = []
        if not json_text.strip():
            return findings

        try:
            data = json.loads(json_text)
            results = data.get("results", [])
            for item in results:
                file_path = item.get("path", "").replace("\\", "/")
                start = item.get("start", {})
                line = start.get("line", 1)
                col = start.get("col", 0)
                extra = item.get("extra", {})
                message = extra.get("message", "")
                severity_raw = extra.get("severity", "WARNING").lower()
                
                # Normalize severity
                if severity_raw in ["error", "high"]:
                    severity = "error"
                elif severity_raw in ["warning", "medium"]:
                    severity = "warning"
                else:
                    severity = "note/info"

                metadata = extra.get("metadata", {})
                cwe_raw = metadata.get("cwe", [])
                cwe_id = None
                if isinstance(cwe_raw, list) and cwe_raw:
                    cwe_id = cwe_raw[0].split(":")[0].strip()
                elif isinstance(cwe_raw, str):
                    cwe_id = cwe_raw.split(":")[0].strip()

                finding = {
                    "finding_uuid": f"semgrep-{uuid.uuid4().hex[:12]}",
                    "scanner": "Semgrep",
                    "rule_id": item.get("check_id", "semgrep_rule"),
                    "file_path": file_path,
                    "line_number": line,
                    "column_number": col,
                    "severity": severity,
                    "message": message,
                    "cwe_id": cwe_id or "Unknown",
                    "cwe_description": metadata.get("shortlink", ""),
                    "code_snippet": extra.get("lines", "").strip(),
                    "confidence": extra.get("metadata", {}).get("confidence", "medium")
                }
                findings.append(finding)
        except Exception:
            pass
        return findings
