# System Usage Guide

This guide describes how to operate SecureCode AI from the command line and web interface.

---

## 1. Running the Backend Server

From the project root in Windows PowerShell:
```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI interactive documentation is available at:
`http://127.0.0.1:8000/docs`

---

## 2. Running the Frontend Dashboard

From the `frontend` folder in Windows PowerShell:
```powershell
cd frontend
npm run dev
```
Open your browser to:
`http://localhost:5173`

---

## 3. Running Data Quality Validation Script

To validate all 18 research paper benchmark tables, check consistency, and generate the validation report:
```powershell
python scripts/validate_benchmarks.py
```
Outputs validation status and writes `docs/BENCHMARK_VALIDATION_REPORT.md`.

---

## 4. Running the Complete Local Evaluation Pipeline

To ingest the dataset, run Flawfinder, generate rule-based patches, rescan, and export CSV reports:
```powershell
python scripts/run_local_evaluation.py
```
Report files generated in `reports/`:
- `reports/dataset_report.csv`
- `reports/scanner_results.csv`
- `reports/normalized_findings.csv`
- `reports/cwe_distribution.csv`
- `reports/repair_results.csv`
- `reports/final_evaluation_report.md`

---

## 5. Running Automated Pytest Suite

```powershell
python -m pytest backend/tests/ -v
```
All 16 unit and integration tests will execute and report status.
