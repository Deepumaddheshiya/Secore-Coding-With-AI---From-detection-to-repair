# Benchmark Validation Report

**Generated At:** 2026-10-15
**Source Study:** "Secure coding with AI – from detection to repair"  
**Journal:** *Empirical Software Engineering* (2026) 31:93  
**DOI:** [10.1007/s10664-026-10812-8](https://doi.org/10.1007/s10664-026-10812-8)

---

## 1. Executive Summary

| Metric | Value | Status |
| :--- | :--- | :--- |
| **Total Numbered Tables in Paper** | **18** (Tables 1 to 18) | Complete |
| **Tables Extracted Successfully** | **18 / 18** (100.0%) | Validated |
| **Tables Partially Extracted** | **0** | None |
| **Tables Needing Manual Review** | **0** (All verified against PDF text) | Clear |
| **Total Benchmark Records** | **298** rows | Verified |
| **Total Quantitative Metrics** | **>310** metrics | Verified |
| **Known Discrepancies in Paper** | **2** documented | Documented |
| **Validation Status** | **PASSED (100% Completeness)** | Optimal |

---

## 2. Table-by-Table Verification Inventory

| Table # | Title | Page | Category | Extracted Rows | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Table 1 | Literature review paper comparison | Page 7 | Literature-review comparisons | 14 | Verified |
| Table 2 | DevGPT dataset information with breakdown by dataset snapshots | Page 10 | Dataset statistics | 3 | Verified |
| Table 3 | Programming languages in DevGPT dataset with breakdown by dataset snapshots | Page 10 | Dataset statistics | 13 | Verified |
| Table 4 | Number of code lines for selected programming languages with breakdown by dataset snapshots | Page 10 | Dataset statistics | 3 | Verified |
| Table 5 | Static scanners selected for analysis | Page 12 | Tool configuration or comparison | 4 | Verified |
| Table 6 | Static scanning results | Page 12 | Quantitative benchmark results | 5 | Verified |
| Table 7 | Number of detects statistics per line of code | Page 12 | Quantitative benchmark results | 4 | Verified |
| Table 8 | CWE distribution | Page 14 | Vulnerability classifications | 24 | Verified |
| Table 9 | Language statistics | Page 15 | Quantitative benchmark results | 8 | Verified |
| Table 10 | Detection matrix, October 2024 | Page 18 | Experimental results | 32 | Verified |
| Table 11 | Security issues detection and fixing in source code from DevGPT snapshot 'snapshot_20231012', October 2024 | Page 19 | Experimental results | 32 | Verified |
| Table 12 | Comparison of security issue detection and fixing results across LLMs (GPT-4, GPT-5, Claude Opus 4) for DevGPT snapshot_20231012 and snapshot_20240514 snapshots | Page 20 | Quantitative benchmark results | 16 | Verified |
| Table 13 | Security issues detection and fixing in source code from DevGPT snapshot 'snapshot_20231012', September 2025 | Page 21 | Experimental results | 28 | Verified |
| Table 14 | Security issues detection and fixing in source code from DevGPT snapshot 'snapshot_20240514', September 2025 | Page 22 | Experimental results | 28 | Verified |
| Table 15 | Detection matrix for DevGPT snapshot 'snapshot_20231012' | Page 23 | Experimental results | 28 | Verified |
| Table 16 | Detection matrix for DevGPT snapshot 'snapshot_20240514' | Page 24 | Experimental results | 28 | Verified |
| Table 17 | Comparison of security issue detection and fixing results for user provided code across LLMs (GPT-4, GPT-5, Claude Opus 4) for DevGPT snapshot_20231012 and snapshot_20240514 snapshots | Page 31 | Quantitative benchmark results | 14 | Verified |
| Table 18 | Comparison of security issue detection and fixing results for GPT generated code across LLMs (GPT-4, GPT-5, Claude Opus 4) for DevGPT snapshot_20231012 and snapshot_20240514 snapshots | Page 32 | Quantitative benchmark results | 14 | Verified |

---

## 3. Discrepancy & Fidelity Documentation

In accordance with strict research reproducibility rules, known typographical or arithmetical anomalies in the published paper are preserved rather than silently modified:

- **Table 3 (bash file count)**: Reported as `2166`. Context: Original paper Table 3 page 10 lists bash snapshot_20231012 as 2166, snapshot_20240514 as 1750, and total as 2166 instead of 3916.
- **Table 17 (GPT-4.1 Not fixed issues percent)**: Reported as `90.91`. Context: Table 17 page 31 prints '90.91' for GPT-4.1 Not fixed Issues (total 3 out of 25 = 12.00%). Preserved faithfully with source note.

---

## 4. Integrity Checks

1. **Separation of Concerns**: All benchmark records are strictly isolated under `data/paper_benchmarks.json` and `data/paper_benchmarks.csv` with explicit tags: `RESEARCH PAPER REPORTED RESULTS — NOT LOCAL EXECUTION RESULTS`.
2. **No Fabricated Data**: No synthetic or simulated values were injected into the paper benchmark dataset.
3. **Traceability**: Every record references its original table number, title, and page in the published PDF.

**Status:** ALL INTEGRITY TESTS PASSED.
