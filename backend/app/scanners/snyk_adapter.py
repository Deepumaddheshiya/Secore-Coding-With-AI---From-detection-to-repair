import subprocess
import shutil
import time
import json
import uuid
from typing import List, Dict, Any, Optional
from backend.app.scanners.base import BaseScanner

class SnykAdapter(BaseScanner):
    def __init__(self):
        super().__init__(name="Snyk", supported_languages=["c", "cpp", "csharp"])

    def check_installed(self) -> bool:
        return shutil.which("snyk") is not None

    def get_version(self) -> Optional[str]:
        if not self.check_installed():
            return None
        try:
            res = subprocess.run(["snyk", "--version"], capture_output=True, text=True, timeout=10)
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
                "error": "Snyk CLI is not installed or not in PATH."
            }

        start_time = time.time()
        try:
            # Snyk Code test: snyk code test <target> --json
            # In strict adherence to Rule 2, do NOT prompt for or require any API token.
            # If not authenticated, Snyk returns exit code 2 or error message.
            cmd = ["snyk", "code", "test", target_path, "--json"]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            duration = round(time.time() - start_time, 3)

            raw_output = res.stdout or res.stderr
            if "authenticate" in raw_output.lower() or "auth" in raw_output.lower():
                return {
                    "status": "requires_auth",
                    "execution_time": duration,
                    "findings": [],
                    "raw_output": raw_output,
                    "error": "Snyk requires account authentication/token. Marked as Unavailable per strict No-API-Key policy."
                }

            findings = self._parse_snyk_json(raw_output)
            return {
                "status": "success",
                "execution_time": duration,
                "findings": findings,
                "raw_output": raw_output,
                "error": None
            }
        except subprocess.TimeoutExpired:
            return {
                "status": "failed",
                "execution_time": 120.0,
                "findings": [],
                "raw_output": "",
                "error": "Snyk scan timed out."
            }
        except Exception as e:
            return {
                "status": "failed",
                "execution_time": round(time.time() - start_time, 3),
                "findings": [],
                "raw_output": "",
                "error": str(e)
            }

    def _parse_snyk_json(self, json_text: str) -> List[Dict[str, Any]]:
        findings = []
        if not json_text.strip():
            return findings
        try:
            data = json.loads(json_text)
            runs = data.get("runs", [])
            for run in runs:
                results = run.get("results", [])
                for item in results:
                    rule_id = item.get("ruleId", "snyk-rule")
                    msg = item.get("message", {}).get("text", "")
                    level = item.get("level", "warning").lower()

                    severity = "warning"
                    if level == "error":
                        severity = "error"
                    elif level in ["note", "none"]:
                        severity = "note/info"

                    locations = item.get("locations", [])
                    file_path = ""
                    line = 1
                    col = 0
                    if locations:
                        phys = locations[0].get("physicalLocation", {})
                        file_path = phys.get("artifactLocation", {}).get("uri", "").replace("\\", "/")
                        region = phys.get("region", {})
                        line = region.get("startLine", 1)
                        col = region.get("startColumn", 0)

                    findings.append({
                        "finding_uuid": f"snyk-{uuid.uuid4().hex[:12]}",
                        "scanner": "Snyk",
                        "rule_id": rule_id,
                        "file_path": file_path,
                        "line_number": line,
                        "column_number": col,
                        "severity": severity,
                        "message": msg,
                        "cwe_id": "Unknown",
                        "cwe_description": "",
                        "code_snippet": "",
                        "confidence": "high" if severity == "error" else "medium"
                    })
        except Exception:
            pass
        return findings
