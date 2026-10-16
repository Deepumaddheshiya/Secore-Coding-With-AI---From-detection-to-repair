import os
import json
import pytest
from backend.app.config import settings

def test_paper_benchmarks_file_exists():
    assert os.path.exists(settings.BENCHMARKS_JSON)
    assert os.path.exists(settings.BENCHMARKS_CSV)

def test_all_18_tables_present():
    with open(settings.BENCHMARKS_JSON, "r", encoding="utf-8") as f:
        tables = json.load(f)
    assert len(tables) == 18
    table_numbers = [t["table_number"] for t in tables]
    assert table_numbers == list(range(1, 19))

def test_key_benchmarks_integrity():
    with open(settings.BENCHMARKS_JSON, "r", encoding="utf-8") as f:
        tables = json.load(f)
    table_map = {t["table_number"]: t for t in tables}

    # Table 6: Static scanning results
    t6 = table_map[6]
    tot_row = [r for r in t6["rows"] if r.get("Scanner") == "Total"][0]
    assert tot_row["Number of detects"] == 959
    assert tot_row["Errors"] == 21
    assert tot_row["Warnings"] == 300
    assert tot_row["Notes/Info"] == 635

    # Table 8: CWE distribution (66 CWEs)
    t8 = table_map[8]
    tot_cwe = [r for r in t8["rows"] if r.get("CWE") == "Total number"][0]
    assert tot_cwe["No. of CWEs"] == 66

    # Table 12: September 2025 LLM results
    t12 = table_map[12]
    gpt4_detected = [r for r in t12["rows"] if r.get("Metric name") == "GPT-4.1: Detected issues"][0]
    assert gpt4_detected["Total Number"] == 46
    assert gpt4_detected["Percent"] == "82.14"
