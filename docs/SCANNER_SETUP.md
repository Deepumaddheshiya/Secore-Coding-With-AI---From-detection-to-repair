# Static Security Scanner Setup Guide

This guide describes how to configure, verify, and run the four static application security testing (SAST) tools used in the research paper: **Flawfinder, Semgrep, Cppcheck, and Snyk**.

---

## 1. Scanner Overview & Availability Policy

The application **never crashes** if one or more scanners are missing. Instead, it checks local binary availability dynamically and reports status gracefully in the UI.

| Scanner | Paper Version | Local Compatibility | Authentication | Installation Method |
| :--- | :--- | :--- | :--- | :--- |
| **Flawfinder** | 2.0.19 | Windows / Linux / macOS | None (Offline) | `pip install flawfinder` |
| **Semgrep** | 1.87.0 | Windows / Linux / macOS | None for OSS rules | `pip install semgrep` |
| **Cppcheck** | 2.14.0 | Windows / Linux / macOS | None (Offline) | Winget / Chocolatey / GitHub binary |
| **Snyk** | 1.1294.0 | Windows / Linux / macOS | Snyk Account / Token | `npm install -g snyk` (optional) |

---

## 2. Installation on Windows

### A. Flawfinder (Python package - Pre-verified on current machine)
Flawfinder is installed and available under Python's scripts path:
```powershell
flawfinder --version
# Expected output: 2.0.20 or 2.0.19
```
If installing on a new machine:
```powershell
pip install flawfinder
```

### B. Semgrep
```powershell
pip install semgrep
semgrep --version
```

### C. Cppcheck
Using Windows Package Manager (Winget):
```powershell
winget install -e --id Cppcheck.Cppcheck
```
Or via Chocolatey:
```powershell
choco install cppcheck
```

### D. Snyk
```powershell
npm install -g snyk
```
*Note on Snyk Policy:* Snyk mandates authentication to run scans (`snyk auth`). In compliance with our **Strict No API Key / No Account Requirement**, the adapter checks if Snyk is authenticated. If not authenticated or uninstalled, it is marked as `Unavailable - Requires Authentication` with an explicit notice, rather than blocking the application or spoofing results.

---

## 3. Scanner Output Normalization

Each scanner produces different output formats (Flawfinder produces text or CSV, Semgrep produces JSON/SARIF, Cppcheck produces XML or text, Snyk produces SARIF). Our adapter normalizes all findings into a unified schema:
- `finding_id`
- `scanner`
- `rule_id`
- `file_path`
- `line_number`
- `column_number`
- `severity` (`error`, `warning`, `note/info`)
- `message`
- `cwe_ids`
- `code_snippet`
- `snapshot`
- `language`
