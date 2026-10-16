# Complete Benchmark Inventory: All 18 Numbered Tables

This document records the complete inventory of all numbered tables published in the research paper:

> **"Secure coding with AI – from detection to repair"**  
> Published in *Empirical Software Engineering* (2026) 31:93, DOI: [10.1007/s10664-026-10812-8](https://doi.org/10.1007/s10664-026-10812-8)

*Note on Total Table Count:* While prompt instructions referenced 17 tables, comprehensive inspection of the 38-page journal article reveals **18 numbered tables** (Tables 1 through 18, with Table 18 appearing on page 32). All 18 are preserved and documented below.

---

## Inventory Summary Table

| Table # | Title | Page | Category | Scope / Sample Size | Primary Metrics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Table 1** | Literature review paper comparison | 7 | Literature comparison | 14 peer-reviewed studies | Languages, Scanners, Real vs Synthetic, Detection, Generation |
| **Table 2** | DevGPT dataset information with breakdown by dataset snapshots | 10 | Dataset statistics | 10,378 Sharings, 50,928 Steps | Sharings, Steps, Source code files across snapshots |
| **Table 3** | Programming languages in DevGPT dataset with breakdown by dataset snapshots | 10 | Dataset statistics | 39,013 Source code files | 13 Programming languages file counts across snapshots |
| **Table 4** | Number of code lines for selected programming languages with breakdown by dataset snapshots | 10 | Dataset statistics | 2,315 C-family files | Files and LOC for C, C++, and C# across snapshots |
| **Table 5** | Static scanners selected for analysis | 12 | Tool configuration | 4 static analysis tools | Versions, supported languages, trial availability, website |
| **Table 6** | Static scanning results | 12 | Quantitative benchmark | 2,315 scanned files | Errors, Warnings, Notes/Info, Total detections per scanner |
| **Table 7** | Number of detects statistics per line of code | 12 | Quantitative benchmark | 44,943 analyzed LOC | Files/detect, LOC/detect per scanner |
| **Table 8** | CWE distribution | 14 | Vulnerability classification | 56 confirmed vulnerabilities | 23 CWE categories (66 total CWE assignments), Top 25 ranking |
| **Table 9** | Language statistics | 15 | Quantitative benchmark | 3 languages (C, C++, C#) | Scanner detections, LOC, LOC/detect per language |
| **Table 10** | Detection matrix, October 2024 | 18 | Experimental results | 32 confirmed issues | Detection matrix (S, Sg, F, C, GPT-4o) on snapshot_20231012 |
| **Table 11** | Security issues detection and fixing in source code from DevGPT snapshot "snapshot_20231012", October 2024 | 19 | Experimental results | 32 confirmed issues | Issue ID, CWE, Lang, Source, Scanner, Severity, GPT-4o Dt, GPT-4o Fx |
| **Table 12** | Comparison of security issue detection and fixing results across LLMs (GPT-4, GPT-5, Claude Opus 4) for DevGPT snapshot_20231012 and snapshot_20240514 snapshots | 20 | Quantitative benchmark | 56 confirmed issues (114 files) | Detected, Not detected, Fixed, Not fixed across models & snapshots |
| **Table 13** | Security issues detection and fixing in source code from DevGPT snapshot "snapshot_20231012", September 2025 | 21 | Experimental results | 28 issues (snapshot_20231012) | Detection and fix status for GPT-4.1, GPT-5, Claude Opus 4.1 |
| **Table 14** | Security issues detection and fixing in source code from DevGPT snapshot "snapshot_20240514", September 2025 | 22 | Experimental results | 28 issues (snapshot_20240514) | Detection and fix status for GPT-4.1, GPT-5, Claude Opus 4.1 |
| **Table 15** | Detection matrix for DevGPT snapshot "snapshot_20231012" | 23 | Experimental results | 28 issues (snapshot_20231012) | Scanner detections vs GPT-4.1, GPT-5, Claude Opus 4.1 |
| **Table 16** | Detection matrix for DevGPT snapshot "snapshot_20240514" | 24 | Experimental results | 28 issues (snapshot_20240514) | Scanner detections vs GPT-4.1, GPT-5, Claude Opus 4.1 |
| **Table 17** | Comparison of security issue detection and fixing results for user provided code across LLMs (GPT-4, GPT-5, Claude Opus 4) for DevGPT snapshot_20231012 and snapshot_20240514 snapshots | 31 | Quantitative benchmark | 25 issues across 23 files | User prompt code: Dt, Fx counts and rates across models |
| **Table 18** | Comparison of security issue detection and fixing results for GPT generated code across LLMs (GPT-4, GPT-5, Claude Opus 4) for DevGPT snapshot_20231012 and snapshot_20240514 snapshots | 32 | Quantitative benchmark | 31 issues across 25 files | AI-generated code: Dt, Fx counts and rates across models |

---

## Detailed Tables Content

### Table 1: Literature review paper comparison (Page 7)
*Surveys 14 related works contrasting real-world vs synthetic datasets, languages, and whether detection or generation was evaluated.*

### Table 2: DevGPT dataset information with breakdown by dataset snapshots (Page 10)
- **Separate GPT interaction cases (sharings):** snapshot_20231012: 4,733 | snapshot_20240514: 5,645 | Total: 10,378
- **Conversation steps:** snapshot_20231012: 27,093 | snapshot_20240514: 23,835 | Total: 50,928
- **Source code files:** snapshot_20231012: 19,106 | snapshot_20240514: 19,907 | Total: 39,013

### Table 3: Programming languages in DevGPT dataset (Page 10)
Python (6,905), JavaScript (4,877), bash (2,166 reported total), HTML (2,105), Unix shell (1,954), Java (1,294), C++ (1,244), C# (1,096), CSS (938), Swift (559), Rust (549), Go (523), C (354).

### Table 4: Number of code lines for selected programming languages (Page 10)
- **C:** 121 files (1,784 LOC) in snap 1; 204 files (5,665 LOC) in snap 2; Total: 325 files (7,449 LOC)
- **C++:** 427 files (7,559 LOC) in snap 1; 563 files (12,310 LOC) in snap 2; Total: 990 files (19,869 LOC)
- **C#:** 829 files (14,824 LOC) in snap 1; 171 files (2,801 LOC) in snap 2; Total: 1,000 files (17,625 LOC)
- **Total:** 2,315 files, 44,943 LOC.

### Table 5: Static scanners selected for analysis (Page 12)
Snyk (v1.1294.0), Semgrep (v1.87.0), Flawfinder (v2.0.19), Cppcheck (v2.14.0).

### Table 6: Static scanning results (Page 12)
- **Snyk:** Total 153 (Errors: 1, Warnings: 150, Notes/Info: 2)
- **Semgrep:** Total 56 (Errors: 0, Warnings: 56, Notes/Info: 0)
- **Flawfinder:** Total 679 (Errors: 20, Warnings: 23, Notes/Info: 633)
- **Cppcheck:** Total 71 (Errors: 0, Warnings: 71, Notes/Info: 0)
- **Overall Total:** 959 detects (Errors: 21, Warnings: 300, Notes/Info: 635)

### Table 7: Detections per line of code (Page 12)
- **Snyk:** 2,315 files, 44,943 LOC, 153 detects, 15.1 files/detect, 293.7 LOC/detect
- **Semgrep:** 2,315 files, 44,943 LOC, 56 detects, 41.3 files/detect, 802.6 LOC/detect
- **Flawfinder:** 1,315 files, 27,318 LOC, 679 detects, 1.9 files/detect, 40.2 LOC/detect
- **Cppcheck:** 1,315 files, 27,318 LOC, 71 detects, 18.5 files/detect, 384.8 LOC/detect

### Table 8: CWE distribution (Page 14)
23 CWE classifications accounting for 66 assignments across 56 confirmed vulnerabilities. 6 are in the CWE 2024 Top 25:
- CWE-20: 16 (Top 25: 12)
- CWE-22: 3 (Top 25: 5)
- CWE-61: 1
- CWE-78: 1 (Top 25: 7)
- CWE-119: 4 (Top 25: 20)
- CWE-120: 11
- CWE-126: 1
- CWE-129: 2
- CWE-190: 2 (Top 25: 23)
- CWE-203: 1
- CWE-252: 2
- CWE-319: 1
- CWE-327: 2
- CWE-328: 1
- CWE-362: 7
- CWE-385: 1
- CWE-401: 1
- CWE-561: 1
- CWE-663: 1
- CWE-665: 3
- CWE-686: 2
- CWE-772: 1
- CWE-1164: 1
- **Total:** 66 CWEs

### Table 9: Language statistics (Page 15)
- Snyk detects: C=126, C++=25, C#=2
- Semgrep detects: C=49, C++=3, C#=4
- Flawfinder detects: C=528, C++=151, C#=-
- Cppcheck detects: C=13, C++=58, C#=-
- Scanned files: C=325, C++=990, C#=1,000
- Total detected: C=716, C++=237, C#=6
- LOC: C=7,449, C++=19,869, C#=17,625
- LOC / detect: C=10.4, C++=83.8, C#=2,937.5

### Table 10: Detection matrix, October 2024 (Page 18)
32 individual issues analyzed across Snyk, Semgrep, Flawfinder, Cppcheck, and GPT-4o.

### Table 11: Security issues detection & fixing, October 2024 (Page 19)
32 individual issues detailing file folder, line number, CWE, language, code origin, scanner, severity, GPT-4o detection (18/32 = 56.25%), and GPT-4o fixing (17/32 = 53.125%).

### Table 12: Comparison across LLMs (September 2025) (Page 20)
- Total files: 114, Confirmed issues: 56 across 48 files.
- **GPT-4.1:** Detected 46/56 (82.14%), Fixed 42/56 (75.00%)
- **GPT-5:** Detected 44/56 (78.57%), Fixed 44/56 (78.57%)
- **Claude Opus 4.1:** Detected 45/56 (80.36%), Fixed 43/56 (76.79%)

### Table 13: Issues detection and fixing (snapshot_20231012, September 2025) (Page 21)
28 confirmed issues evaluated individually against GPT-4.1, GPT-5, and Claude Opus 4.1.

### Table 14: Issues detection and fixing (snapshot_20240514, September 2025) (Page 22)
28 confirmed issues evaluated individually against GPT-4.1, GPT-5, and Claude Opus 4.1.

### Table 15: Detection matrix (snapshot_20231012, September 2025) (Page 23)
Detection flags across Snyk, Semgrep, Flawfinder, Cppcheck, GPT-4.1, GPT-5, and Claude Opus 4.1 for 28 issues.

### Table 16: Detection matrix (snapshot_20240514, September 2025) (Page 24)
Detection flags across Snyk, Semgrep, Flawfinder, Cppcheck, GPT-4.1, GPT-5, and Claude Opus 4.1 for 28 issues.

### Table 17: User-provided code evaluation (Page 31)
25 confirmed vulnerabilities across 23 files.
- **GPT-4.1:** Detected 22/25 (88.00%), Fixed 22/25 (88.00%)
- **GPT-5:** Detected 21/25 (84.00%), Fixed 21/25 (84.00%)
- **Claude Opus 4.1:** Detected 19/25 (76.00%), Fixed 19/25 (76.00%)

### Table 18: AI-generated code evaluation (Page 32)
31 confirmed vulnerabilities across 25 files.
- **GPT-4.1:** Detected 26/31 (83.87%), Fixed 23/31 (74.19%)
- **GPT-5:** Detected 23/31 (74.19%), Fixed 23/31 (74.19%)
- **Claude Opus 4.1:** Detected 26/31 (83.87%), Fixed 25/31 (80.65%)
