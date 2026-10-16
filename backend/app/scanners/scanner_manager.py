from typing import List, Dict, Any, Optional
from backend.app.scanners.flawfinder_adapter import FlawfinderAdapter
from backend.app.scanners.semgrep_adapter import SemgrepAdapter
from backend.app.scanners.cppcheck_adapter import CppcheckAdapter
from backend.app.scanners.snyk_adapter import SnykAdapter

class ScannerManager:
    def __init__(self):
        self.scanners = {
            "Flawfinder": FlawfinderAdapter(),
            "Semgrep": SemgrepAdapter(),
            "Cppcheck": CppcheckAdapter(),
            "Snyk": SnykAdapter()
        }

    def get_scanner_statuses(self, db = None) -> List[Dict[str, Any]]:
        statuses = []
        install_help = {
            "Semgrep": "Install in PowerShell: pip install semgrep",
            "Cppcheck": "Install in PowerShell: winget install Cppcheck.Cppcheck (or https://cppcheck.sourceforge.io/)",
            "Snyk": "Install via: npm install -g snyk (Requires 'snyk auth' account. Under strict no-API-key policy, remains unauthenticated)",
            "Flawfinder": "Installed and verified locally via Python PATH (v2.0.20)."
        }
        for name, adapter in self.scanners.items():
            installed = adapter.check_installed()
            version = adapter.get_version() if installed else None
            notes = None
            if not installed:
                notes = f"{name} is not installed locally in system PATH."
            elif name == "Snyk":
                notes = "Requires local Snyk token for cloud rules. Unauthenticated mode reports local status per strict No-API-Key policy."
            
            last_run = None
            if db:
                from backend.app.models.entities import ScannerRun
                last_run = db.query(ScannerRun).filter(ScannerRun.scanner_name == name).order_by(ScannerRun.created_at.desc()).first()

            statuses.append({
                "scanner_name": name,
                "installed": installed,
                "version": version,
                "supported_languages": adapter.supported_languages,
                "notes": notes,
                "install_instructions": install_help.get(name),
                "last_run_time": last_run.created_at if last_run else None,
                "last_files_scanned": last_run.files_scanned if last_run else None,
                "last_files_skipped": getattr(last_run, "files_skipped", 0) if last_run else None,
                "last_findings_count": last_run.findings_count if last_run else None,
                "last_duration_seconds": last_run.execution_time_seconds if last_run else None,
                "last_status": last_run.status if last_run else None,
                "last_error": last_run.error_message if last_run else None,
                "last_run_id": last_run.id if last_run else None
            })
        return statuses

    def run_scanner(self, scanner_name: str, target_path: Any) -> Dict[str, Any]:
        if scanner_name not in self.scanners:
            return {
                "status": "failed",
                "execution_time": 0.0,
                "findings": [],
                "raw_output": "",
                "error": f"Unknown scanner: {scanner_name}"
            }
        return self.scanners[scanner_name].scan(target_path)

    def run_all_available_scanners(self, target_path: str) -> List[Dict[str, Any]]:
        results = []
        for name, adapter in self.scanners.items():
            if adapter.check_installed():
                res = adapter.scan(target_path)
                res["scanner_name"] = name
                results.append(res)
            else:
                results.append({
                    "scanner_name": name,
                    "status": "not_installed",
                    "execution_time": 0.0,
                    "findings": [],
                    "raw_output": "",
                    "error": f"{name} not installed locally."
                })
        return results

scanner_manager = ScannerManager()
