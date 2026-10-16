# Benchmark Source Mapping

This document provides explicit mapping between the paper's original tables, page numbers, experimental setups, metric definitions, and local software data structures.

---

## 1. Table-to-Source Mapping Matrix

| Table # | Paper Title | Page | Paper Section | Dataset / Experiment | Stored Key in `paper_benchmarks.json` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Table 1** | Literature review paper comparison | 7 | Section 2.3 | 14 Academic Literature Papers | `table_number: 1` |
| **Table 2** | DevGPT dataset information with breakdown by dataset snapshots | 10 | Section 4 | DevGPT version 10 (`snapshot_20231012`, `snapshot_20240514`) | `table_number: 2` |
| **Table 3** | Programming languages in DevGPT dataset with breakdown by dataset snapshots | 10 | Section 4 | DevGPT version 10 (all 13 languages) | `table_number: 3` |
| **Table 4** | Number of code lines for selected programming languages with breakdown by dataset snapshots | 10 | Section 4 | C-family subset (C, C++, C#) | `table_number: 4` |
| **Table 5** | Static scanners selected for analysis | 12 | Section 5.1 | Flawfinder, Snyk, Semgrep, Cppcheck | `table_number: 5` |
| **Table 6** | Static scanning results | 12 | Section 5.1 | Raw detections on 2,315 files | `table_number: 6` |
| **Table 7** | Number of detects statistics per line of code | 12 | Section 5.1 | Defect density (LOC/detect, files/detect) | `table_number: 7` |
| **Table 8** | CWE distribution | 14 | Section 5.3 | 56 confirmed bugs, 66 CWEs | `table_number: 8` |
| **Table 9** | Language statistics | 15 | Section 5.3 | Language-wise scanner counts & density | `table_number: 9` |
| **Table 10** | Detection matrix, October 2024 | 18 | Section 6.2 | 32 confirmed issues, snapshot 1 | `table_number: 10` |
| **Table 11** | Security issues detection and fixing in source code from DevGPT snapshot "snapshot_20231012", October 2024 | 19 | Section 6.2 | GPT-4o repair evaluation (32 issues) | `table_number: 11` |
| **Table 12** | Comparison of security issue detection and fixing results across LLMs (GPT-4, GPT-5, Claude Opus 4) for DevGPT snapshot_20231012 and snapshot_20240514 snapshots | 20 | Section 6.3 | September 2025 experiment (56 issues) | `table_number: 12` |
| **Table 13** | Security issues detection and fixing in source code from DevGPT snapshot "snapshot_20231012", September 2025 | 21 | Section 6.3 | September 2025 issue-level results (28 issues) | `table_number: 13` |
| **Table 14** | Security issues detection and fixing in source code from DevGPT snapshot "snapshot_20240514", September 2025 | 22 | Section 6.3 | September 2025 issue-level results (28 issues) | `table_number: 14` |
| **Table 15** | Detection matrix for DevGPT snapshot "snapshot_20231012" | 23 | Section 6.3 | Scanner vs Model detection matrix | `table_number: 15` |
| **Table 16** | Detection matrix for DevGPT snapshot "snapshot_20240514" | 24 | Section 6.3 | Scanner vs Model detection matrix | `table_number: 16` |
| **Table 17** | Comparison of security issue detection and fixing results for user provided code across LLMs (GPT-4, GPT-5, Claude Opus 4) for DevGPT snapshot_20231012 and snapshot_20240514 snapshots | 31 | Section 6.5 | User-prompt code subset (25 issues) | `table_number: 17` |
| **Table 18** | Comparison of security issue detection and fixing results for GPT generated code across LLMs (GPT-4, GPT-5, Claude Opus 4) for DevGPT snapshot_20231012 and snapshot_20240514 snapshots | 32 | Section 6.5 | AI-generated code subset (31 issues) | `table_number: 18` |

---

## 2. Inconsistencies & Anomalies Recorded from Original Published Paper

1. **Table 3 (bash language count):**
   - Snapshot 1: `2166`, Snapshot 2: `1750`.
   - Reported Total in paper: `2166` (arithmetic sum is `3916`).
   - *Mapping Decision:* Preserved original paper print with an attached `source_note`.
2. **Table 17 (GPT-4.1 Not Fixed Percentage on User Code):**
   - Total user code issues: `25`. GPT-4.1 Not fixed count: `3`.
   - Reported Overall Percent in paper: `90.91%` (3/25 = 12.00%; 90.91% is roughly 10/11 inverted).
   - *Mapping Decision:* Preserved `90.91` with explicit note on calculation discrepancy.
3. **Table Count:**
   - User specification mentions 17 tables; actual published text contains **18 numbered tables**. Both Table 17 and Table 18 represent distinct user-code vs AI-code quantitative comparisons. All 18 are preserved.
