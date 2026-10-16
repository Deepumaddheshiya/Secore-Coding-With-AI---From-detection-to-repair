import subprocess
import shutil
import time
import re
import uuid
from typing import List, Dict, Any, Optional
from backend.app.scanners.base import BaseScanner

class CppcheckAdapter(BaseScanner):
    def __init__(self):
        super().__init__(name="Cppcheck", supported_languages=["c", "cpp"])

    def check_installed(self) -> bool:
        return shutil.which("cppcheck") is not None

    def get_version(self) -> Optional[str]:
        if not self.check_installed():
            return None
        try:
            res = subprocess.run(["cppcheck", "--version"], capture_output=True, text=True, timeout=10)
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
                "error": "Cppcheck is not installed or not in PATH. Install via winget or package manager."
            }

        start_time = time.time()
        try:
            # Cppcheck outputs warnings to stderr by default
            cmd = [
                "cppcheck",
                "--enable=warning,style,performance,portability",
                "--template={file}:{line}:{column}:{severity}:{id}:{message}",
                target_path
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            duration = round(time.time() - start_time, 3)

            raw_output = res.stderr or res.stdout
            findings = self._parse_text_output(raw_output)

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
                "error": "Cppcheck scan timed out after 120 seconds."
            }
        except Exception as e:
            return {
                "status": "failed",
                "execution_time": round(time.time() - start_time, 3),
                "findings": [],
                "raw_output": "",
                "error": str(e)
            }

    def _parse_text_output(self, text: str) -> List[Dict[str, Any]]:
        findings = []
        if not text.strip():
            return findings

        # Format: file:line:column:severity:id:message
        for line in text.strip().splitlines():
            line = line.strip()
            if not line or ":" not in line:
                continue
            parts = line.split(":", 5)
            if len(parts) >= 6:
                file_path = parts[0].replace("\\", "/")
                try:
                    line_no = int(parts[1])
                except ValueError:
                    line_no = 1
                try:
                    col_no = int(parts[2])
                except ValueError:
                    col_no = 0
                sev_raw = parts[3].lower()
                rule_id = parts[4]
                msg = parts[5]

                if sev_raw in ["error"]:
                    severity = "error"
                elif sev_raw in ["warning", "style", "portability"]:
                    severity = "warning"
                else:
                    severity = "note/info"

                # Infer CWE from rule_id or msg if available
                cwe_id = "Unknown"
                if "buffer" in rule_id.lower() or "overflow" in rule_id.lower():
                    cwe_id = "CWE-120"
                elif "memleak" in rule_id.lower() or "memory" in rule_id.lower():
                    cwe_id = "CWE-401"
                elif "uninit" in rule_id.lower() or "initialization" in msg.lower():
                    cwe_id = "CWE-665"
                elif "nullpointer" in rule_id.lower():
                    cwe_id = "CWE-476"

                findings.append({
                    "finding_uuid": f"cppcheck-{uuid.uuid4().hex[:12]}",
                    "scanner": "Cppcheck",
                    "rule_id": rule_id,
                    "file_path": file_path,
                    "line_number": line_no,
                    "column_number": col_no,
                    "severity": severity,
                    "message": msg,
                    "cwe_id": cwe_id,
                    "cwe_description": f"Cppcheck rule: {rule_id}",
                    "code_snippet": "",
                    "confidence": "high" if severity == "error" else "medium"
                })
        return findings
