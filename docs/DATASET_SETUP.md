# Dataset Setup Guide

This guide details how to configure, import, and validate the DevGPT dataset snapshots for the SecureCode AI system.

---

## 1. Supported Formats & Directory Layout

The system looks for datasets located by default in:
```text
SECURE_CODING_WITH_AI/data/devgpt/
```

Within this folder, source code files should follow either the canonical DevGPT directory hierarchy or a simplified flat structure categorized by snapshot and language:

```text
data/devgpt/
  ├── snapshot_20231012/
  │     ├── c/
  │     ├── cpp/
  │     └── csharp/
  └── snapshot_20240514/
        ├── c/
        ├── cpp/
        └── csharp/
```

---

## 2. Acquiring Official DevGPT Snapshots

The DevGPT dataset version 10 is published on Zenodo:
- **Repository URL:** [https://zenodo.org/records/16392320](https://zenodo.org/records/16392320)
- **Relevant Snapshot Archives:**
  - `snapshot_20231012.zip` (October 2023 release)
  - `snapshot_20240514.zip` (May 2024 release)

### Download & Extraction via PowerShell:
```powershell
# In PowerShell:
# 1. Download desired snapshot archives from Zenodo into data/devgpt/
# 2. Extract contents:
Expand-Archive -Path data/devgpt/snapshot_20231012.zip -DestinationPath data/devgpt/snapshot_20231012
Expand-Archive -Path data/devgpt/snapshot_20240514.zip -DestinationPath data/devgpt/snapshot_20240514
```

---

## 3. Pre-Loaded Curated Dataset (Out-of-the-Box)

To ensure this project runs immediately without requiring gigabytes of downloads, `data/devgpt/` comes pre-populated with:
- Authentic sample snippets referenced in the paper (e.g. Listings 1, 2, 4, 5, 6, 8, covering File_10, File_16, File_20, File_47, File_55, File_61, etc.).
- Coverage across **C, C++, and C#**.
- Representation across both `snapshot_20231012` and `snapshot_20240514`.

---

## 4. Custom Folder Import via Web UI

You can import any local folder of C, C++, or C# files directly through the **Dataset Management** page of the web application. The backend will:
1. Validate directory traversal safety.
2. Scan for `.c`, `.cpp`, `.cc`, `.h`, `.hpp`, `.cs` files.
3. Compute exact physical, code, and comment lines.
4. Add the files to the dataset inventory.
