import pytest
from backend.app.scanners.scanner_manager import scanner_manager
from backend.app.scanners.flawfinder_adapter import FlawfinderAdapter

def test_scanner_statuses():
    statuses = scanner_manager.get_scanner_statuses()
    names = [s["scanner_name"] for s in statuses]
    assert "Flawfinder" in names
    assert "Semgrep" in names
    assert "Cppcheck" in names
    assert "Snyk" in names

def test_flawfinder_installed():
    adapter = FlawfinderAdapter()
    assert adapter.check_installed() is True
    ver = adapter.get_version()
    assert ver is not None

def test_flawfinder_csv_parsing():
    adapter = FlawfinderAdapter()
    sample_csv = """File,Line,Column,DefaultLevel,Level,Category,Name,Warning,Suggestion,Note,CWEs,Context,Fingerprint,ToolVersion,RuleId,HelpUri
data/test.c,10,5,4,4,buffer,strcpy,Does not check for buffer overflows,,,CWE-120,strcpy(buf, in);,abc123,2.0.20,FF1001,http://cwe
"""
    findings = adapter._parse_csv_output(sample_csv)
    assert len(findings) == 1
    assert findings[0]["severity"] == "error"
    assert findings[0]["cwe_id"] == "CWE-120"
    assert findings[0]["scanner"] == "Flawfinder"
