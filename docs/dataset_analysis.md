# DevGPT Dataset Analysis & Empirical Evaluation

This document provides a deep empirical analysis of the DevGPT dataset as utilized in *"Secure coding with AI – from detection to repair"* (Empirical Software Engineering 2026, Volume 31, Article 93, DOI: [10.1007/s10664-026-10812-8](https://doi.org/10.1007/s10664-026-10812-8)).

---

## 1. Dataset Provenance and Selection

The research paper evaluates software security vulnerabilities across historical snapshots of the **DevGPT** dataset, an empirical repository collecting real-world developer interactions with ChatGPT, including shared code prompts and LLM-generated source snippets:

- **Snapshot 1:** `snapshot_20231012` (October 12, 2023)
- **Snapshot 2:** `snapshot_20240514` (May 14, 2024)

### Target Scope: C-Family Languages
The authors specifically scoped their in-depth static analysis and manual verification to C-family languages, which exhibit severe memory safety, pointer, and input validation vulnerabilities (CWE-119, CWE-120, CWE-78, etc.):

| Language | Paper Evaluated Files | Paper LOC | Local Implementation Support |
|:---|:---:|:---:|:---:|
| **C** | 325 | - | Full (Flawfinder, Semgrep, Snyk) |
| **C++** | 990 | - | Full (Flawfinder, Cppcheck, Semgrep, Snyk) |
| **C#** | 1,000 | - | Full (Semgrep, Snyk) |
| **Total** | **2,315** | **44,943** | **Integrated in SQLite & Pipeline** |

---

## 2. Line of Code (LOC) Counting Methodology

In the paper, lines of code are calculated using the `cloc` tool, counting only actual code lines (excluding blank lines and comment blocks). 

Our local implementation reproduces this via [`backend/app/utils/loc_counter.py`](file:///c:/Users/Deepu/OneDrive/Desktop/SECURE_CODING_WITH_AI/backend/app/utils/loc_counter.py), implementing an AST-aware comment state machine that:
1. Skips blank and whitespace-only lines.
2. Identifies and skips single-line comments (`//`).
3. Tracks multi-line block comment state (`/* ... */`) and excludes enclosed lines.
4. Preserves all executable statements and preprocessor directives.

---

## 3. Dataset Preprocessing & Ingestion Pipeline

The automated ingestion pipeline performs the following verified steps:
1. **Directory Discovery:** Safely iterates through `data/devgpt/snapshot_20231012` and `data/devgpt/snapshot_20240514`.
2. **Path Sanitization:** Uses [`backend/app/utils/safe_paths.py`](file:///c:/Users/Deepu/OneDrive/Desktop/SECURE_CODING_WITH_AI/backend/app/utils/safe_paths.py) to prevent any path traversal outside the authorized data root.
3. **Language Detection:** Classifies source code based on standard file extensions (`.c`, `.h`, `.cpp`, `.cc`, `.cxx`, `.hpp`, `.cs`).
4. **Deduplication:** Computes cryptographic SHA-256 hashes to detect identical files across snapshots.
5. **Database Sync:** Populates or updates records in the `source_files` table of `securecode_ai.db`.

---

## 4. Local Dataset State vs. Research Paper

| Metric | Paper Reported (Table 4) | Local Active Dataset | Status |
|:---|:---:|:---:|:---|
| **Total Files** | 2,315 | 10 sample files | Sample active; expandable to full corpus |
| **C Files** | 325 | 4 | Real C code with buffer handling & system calls |
| **C++ Files** | 990 | 4 | Real C++ code with STL, pointers, random generators |
| **C# Files** | 1,000 | 2 | Real C# code with async tasks & network calls |
| **Total Code LOC** | 44,943 | 352 | Counted via verified LOC counter |
| **Detected Duplicates** | Disclosed in text | 0 duplicates | Monitored in `data/dataset_statistics.json` |

---

## 5. Artifacts & Generated Files

- **`data/dataset_inventory.csv`**: Full inventory of all files with line counts, SHA-256 hashes, and snapshot origins.
- **`data/dataset_statistics.json`**: Machine-readable statistics and comparative deltas.
- **`reports/dataset_analysis_report.md`**: Generated evaluation report.
- **`docs/DATASET_SETUP.md`**: Guide for acquiring the full 2,315-file public DevGPT dataset.
