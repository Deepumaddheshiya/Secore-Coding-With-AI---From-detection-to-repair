# Final Evaluation Report: SecureCode AI

**Generated:** 2026-10-15T20:16:17.119802Z

## 1. Local Implementation Metrics

- **Files Processed:** 10
- **Lines of Code:** 113
- **Total Scanner Findings:** 15
- **Confirmed Vulnerabilities:** 1
- **False Positives:** 1
- **Repair Attempts:** 11
- **Verified Repairs (Rescan Passed):** 7
- **Local Fix Rate:** 63.64%

## 2. Research Paper vs Local Execution Comparison

| Metric | Paper Reported Value | Local Result | Comparable? | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Total Source Files Evaluated | 2315 | 10 | No | Full DevGPT analysis in paper analyzed 2,315 C-family files. Local system operates on loaded dataset directory. |
| Total Lines of Code (LOC) | 44943 | 113 | No | Paper calculated code lines using cloc tool across C, C++, and C# files. |
| Flawfinder Detections | 679 | 15 | No | Paper Table 6 reports 679 Flawfinder detections (20 errors, 23 warnings, 633 notes/info). |
| Snyk Detections | 153 | 0 | No | Snyk requires account authentication. In local offline execution, marked unavailable per strict No-API-Key policy unless authenticated. |
| Semgrep Detections | 56 | 0 | No | Paper Table 6 reports 56 Semgrep warnings across 2,315 files. |
| Cppcheck Detections | 71 | 0 | No | Paper Table 6 reports 71 Cppcheck warnings. |
| Confirmed Vulnerabilities | 56 | 1 | No | Paper confirmed 56 genuine vulnerabilities across 48 files after expert manual review of 114 candidate files. |
| Automated Repair Fix Rate (%) | 75.0% - 78.6% (GPT-4.1 / GPT-5 / Opus 4.1) | 63.64% | No | Paper evaluated cloud frontier models (GPT-4.1, GPT-5, Claude Opus 4.1). Local system operates via deterministic rule-based repair or local Ollama. |
