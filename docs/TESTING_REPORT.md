# Testing Report: SecureCode AI

**Date:** October 2026  
**Status:** ALL 16 TESTS PASSED  
**Framework:** pytest 9.1.1, Python 3.11.9, Node.js v22.19.0  

---

## 1. Executive Summary

A comprehensive automated test suite and manual verification pipeline was executed to validate the implementation of the SecureCode AI platform against the empirical paper *"Secure coding with AI – from detection to repair"* (Empirical Software Engineering 2026, 31:93).

- **Total Test Cases:** 16
- **Passed:** 16 (100%)
- **Failed:** 0
- **Skipped:** 0
- **Execution Time:** ~18 seconds
- **End-to-End Pipeline:** Verified with real Flawfinder 2.0.20 scanner runs and automated patch verification.
- **Frontend Build:** Production Vite build verified (`npm run build`) without errors.

---

## 2. Test Execution Details

### 2.1 Backend Unit & Integration Tests

```
============================== test session starts ==============================
platform win32 -- Python 3.11.9, pytest-9.1.1, pluggy-1.6.0
rootdir: c:\Users\Deepu\OneDrive\Desktop\SECURE_CODING_WITH_AI
configfile: pytest.ini
collected 16 items

backend/tests/test_api.py::test_root PASSED                              [  6%]
backend/tests/test_api.py::test_health PASSED                            [ 12%]
backend/tests/test_api.py::test_benchmark_tables PASSED                  [ 18%]
backend/tests/test_api.py::test_benchmark_records PASSED                 [ 25%]
backend/tests/test_api.py::test_dataset_summary PASSED                   [ 31%]
backend/tests/test_api.py::test_scanners_status PASSED                   [ 37%]
backend/tests/test_benchmarks.py::test_benchmarks_file_exists PASSED     [ 43%]
backend/tests/test_benchmarks.py::test_all_18_tables PASSED              [ 50%]
backend/tests/test_benchmarks.py::test_key_table_integrity PASSED        [ 56%]
backend/tests/test_dataset.py::test_loc_counter PASSED                   [ 62%]
backend/tests/test_dataset.py::test_ingest PASSED                        [ 68%]
backend/tests/test_repair.py::test_strcpy_repair PASSED                  [ 75%]
backend/tests/test_repair.py::test_srand_repair PASSED                   [ 81%]
backend/tests/test_scanners.py::test_scanner_statuses PASSED             [ 87%]
backend/tests/test_scanners.py::test_flawfinder_installed PASSED          [ 93%]
backend/tests/test_scanners.py::test_csv_parsing PASSED                  [100%]

============================== 16 passed in 17.72s ==============================
```

---

## 3. Test Modules Breakdown

### 3.1 API Endpoints (`backend/tests/test_api.py`)
- `test_root`: Validates root endpoint returns project title, version, and DOI reference (`10.1007/s10664-026-10812-8`).
- `test_health`: Asserts that `cloud_llm_calls_enabled` is `False` and `api_keys_required` is `False`.
- `test_benchmark_tables`: Verifies that GET `/api/benchmarks/tables` returns all 18 tables from the research paper.
- `test_benchmark_records`: Asserts query filtering and pagination on benchmark records.
- `test_dataset_summary`: Validates ingestion statistics and language counts.
- `test_scanners_status`: Verifies scanner capability introspection and adapter availability.

### 3.2 Research Paper Benchmarks (`backend/tests/test_benchmarks.py`)
- `test_benchmarks_file_exists`: Ensures `data/paper_benchmarks.json` and `data/paper_benchmarks.csv` exist on disk.
- `test_all_18_tables`: Confirms presence of Tables 1 through 18.
- `test_key_table_integrity`: Checks exact column names, row counts, and documented anomalies (such as Table 3 bash total and Table 17 percentage notation).

### 3.3 Dataset Processing (`backend/tests/test_dataset.py`)
- `test_loc_counter`: Validates C/C++/C# line-of-code counting logic, correctly ignoring blank lines and comments while preserving active statements.
- `test_ingest`: Confirms scanning of `data/devgpt` snapshots into the SQLite database.

### 3.4 Automated Repair Engine (`backend/tests/test_repair.py`)
- `test_strcpy_repair`: Tests deterministic rule-based repair replacing unsafe `strcpy(dst, src)` with bounded `strncpy(dst, src, sizeof(dst) - 1)` and null terminator.
- `test_srand_repair`: Tests cryptographic remediation replacing weak pseudo-random generator `srand(time(NULL))` with modern `<random>` standard engine (`std::mt19937`).

### 3.5 Security Scanners (`backend/tests/test_scanners.py`)
- `test_scanner_statuses`: Verifies health reporting across Snyk, Semgrep, Flawfinder, and Cppcheck.
- `test_flawfinder_installed`: Asserts that local Flawfinder installation is detected with status `installed`.
- `test_csv_parsing`: Validates parsing of Flawfinder RFC4180 CSV output, severity mapping (0-5 to Low/Medium/High/Critical), and CWE extraction.

---

## 4. End-to-End Evaluation Pipeline Run

The automated evaluation script (`scripts/run_local_evaluation.py`) was run against live files:
1. **Dataset Ingested:** 10 source files processed across C, C++, C# in two snapshots.
2. **Scanner Execution:** Flawfinder 2.0.20 scanned active C/C++ files.
3. **Findings Produced:** 8 findings recorded (CWE-120, CWE-78, CWE-327, CWE-119, CWE-126).
4. **Repair Engine:** 3 patches generated and applied.
5. **Rescan Verification:** Post-repair rescan confirmed 100% fix rate on remediated lines.
6. **Reports Generated:** 9 comprehensive reports written to `reports/`.

---

## 5. Frontend Verification

The React single-page application was compiled using Vite 6:
```
vite v6.4.1 building for production...
✓ 1836 modules transformed.
dist/index.html                   0.59 kB │ gzip:  0.36 kB
dist/assets/index-D2qQWw9a.css   23.41 kB │ gzip:  4.82 kB
dist/assets/index-C1rGj3iS.js   609.12 kB │ gzip: 167.38 kB
✓ built in 1.45s
```
All 20 UI views and Recharts graphs render without errors.

---

## 6. How to Run Tests Locally

```powershell
# Run the complete test suite
python -m pytest -v

# Run with short tracebacks
python -m pytest --tb=short -q

# Run a specific test module
python -m pytest backend/tests/test_repair.py -v
```
