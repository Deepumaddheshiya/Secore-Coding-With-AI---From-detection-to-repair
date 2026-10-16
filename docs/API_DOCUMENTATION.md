# API Documentation

The SecureCode AI backend exposes RESTful endpoints with FastAPI. Interactive OpenAPI Swagger UI is available at `/docs`.

---

## 1. Benchmarks API (`/api/benchmarks`)

- `GET /api/benchmarks/tables`: Retrieves inventory of all 18 numbered tables from the paper.
- `GET /api/benchmarks/tables/{table_number}`: Retrieves the full table schema, rows, and source citations for a specific table (1–18).
- `GET /api/benchmarks/records`: Returns paginated, searchable quantitative benchmark rows. Query parameters: `table_number`, `category`, `search`, `page`, `page_size`.
- `GET /api/benchmarks/export-json`: Downloads `paper_benchmarks.json`.
- `GET /api/benchmarks/export-csv`: Downloads `paper_benchmarks.csv`.

---

## 2. Dataset Management API (`/api/dataset`)

- `POST /api/dataset/ingest`: Recursively scans a target directory for C, C++, and C# files, calculates LOC metrics, detects snapshots (`snapshot_20231012` vs `snapshot_20240514`), and updates database.
- `GET /api/dataset/summary`: Returns counts of files and lines broken down by language and snapshot.
- `GET /api/dataset/files`: Lists indexed files with pagination and language filters.
- `GET /api/dataset/files/{id}`: Returns file metadata and source code text for safe inspection.

---

## 3. Scanner Management API (`/api/scanners`)

- `GET /api/scanners/status`: Checks local availability and versions of Flawfinder, Semgrep, Cppcheck, and Snyk.
- `POST /api/scanners/run`: Executes static analysis on the dataset directory. Body: `{"scanner_name": "Flawfinder" | "all", "target_path": null}`.
- `GET /api/scanners/runs`: History of past scanner executions.

---

## 4. Security Findings & Review API (`/api/findings`)

- `GET /api/findings`: Lists normalized findings. Supports filters: `severity`, `scanner`, `cwe`, `language`, `snapshot`.
- `GET /api/findings/{id}`: Detailed finding record with source file context and reviews.
- `POST /api/findings/{id}/review`: Records manual expert review (`confirmed_vulnerability`, `false_positive`, `uncertain`).
- `GET /api/findings/analytics/cwe-distribution`: CWE frequency aggregation.
- `GET /api/findings/analytics/language-statistics`: Defect density by language.

---

## 5. Repair Engine API (`/api/repair`)

- `POST /api/repair/generate`: Generates a proposed code patch using deterministic AST/regex rules or local Ollama. Body: `{"finding_id": 1, "engine_type": "rule_based" | "ollama_local", "model_name": null}`.
- `GET /api/repair/patches`: Lists generated patches and rescan outcomes.
- `GET /api/repair/patches/{id}`: Unified diff preview and explanation.
- `POST /api/repair/apply`: Backs up original file, writes patch to disk, rescans with SAST scanner, and records verification result.
- `POST /api/repair/rollback`: Restores file from backup copy.

---

## 6. Evaluation & Comparison API (`/api/evaluation`)

- `GET /api/evaluation/local-metrics`: Local scanner counts, confirmed bugs, and fix rates.
- `GET /api/evaluation/paper-vs-local`: Side-by-side comparison matrix separating Section A (Paper Reported) from Section B (Local Execution).
- `POST /api/evaluation/generate-reports`: Exports CSV reports and Markdown summary to `reports/`.

---

## 7. System & Health API (`/api/system`)

- `GET /api/system/health`: System status confirming offline mode, zero cloud calls, zero API keys.
- `GET /api/system/ollama-status`: Localhost Ollama connectivity and local model list.
- `GET /api/system/audit-logs`: Audit trail of all scan and patch operations.
