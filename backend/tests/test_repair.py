import pytest
from backend.app.repair.engine import repair_engine
from backend.app.models.entities import SecurityFinding, SourceFile

def test_rule_based_cwe120_repair():
    code = """#include <string.h>
void func(char *in) {
    char buf[64];
    strcpy(buf, in);
}
"""
    finding = SecurityFinding(
        finding_uuid="test-uuid",
        source_file_id=1,
        scanner="Flawfinder",
        line_number=4,
        severity="error",
        message="Buffer overflow in strcpy",
        cwe_id="CWE-120"
    )
    source_file = SourceFile(
        relative_path="test.c",
        filename="test.c",
        snapshot="snapshot_20231012",
        language="c"
    )

    res = repair_engine._repair_with_rules(code, finding, source_file)
    assert res["success"] is True
    assert "strncpy(buf, in, sizeof(buf) - 1);" in res["proposed_code"]
    assert "buf[sizeof(buf) - 1] = '\\0';" in res["proposed_code"]

def test_rule_based_cwe327_repair():
    code = """#include <cstdlib>
int get_rand() {
    srand(1234);
    return rand();
}
"""
    finding = SecurityFinding(
        finding_uuid="test-rand",
        source_file_id=1,
        scanner="Flawfinder",
        line_number=3,
        severity="warning",
        message="Insecure random function",
        cwe_id="CWE-327"
    )
    source_file = SourceFile(
        relative_path="test.cpp",
        filename="test.cpp",
        snapshot="snapshot_20240514",
        language="cpp"
    )

    res = repair_engine._repair_with_rules(code, finding, source_file)
    assert res["success"] is True
    assert "std::random_device rd;" in res["proposed_code"]
    assert "std::mt19937 gen(rd());" in res["proposed_code"]
