# Dataset Description: DevGPT Version 10

This document describes the structure, origin, and characteristics of the DevGPT dataset as utilized in the research paper.

---

## 1. Overview & Acquisition

- **Dataset Name:** DevGPT (Version 10)
- **Archive URL:** [Zenodo Record 16392320](https://zenodo.org/records/16392320)
- **License:** Open Access / Permissive
- **Domain:** Developer-ChatGPT interaction sessions retrieved via GitHub and Hacker News APIs across 6 artifact categories:
  1. GitHub Issues
  2. GitHub Pull Requests
  3. GitHub Discussions
  4. GitHub Commits
  5. GitHub Source Code Files
  6. Hacker News Threads

---

## 2. Dataset Snapshots

The study investigated two primary snapshot releases:
1. **`snapshot_20231012` (October 12, 2023):**
   - 4,733 Sharings
   - 27,093 Conversation steps
   - 19,106 Source code files across all languages
   - 1,377 C-family files analyzed in the paper (121 C, 427 C++, 829 C#)
2. **`snapshot_20240514` (May 14, 2024):**
   - 5,645 Sharings
   - 23,835 Conversation steps
   - 19,907 Source code files across all languages
   - 938 C-family files analyzed in the paper (204 C, 563 C++, 171 C#)
3. **Combined Scope:**
   - 10,378 Total Sharings
   - 50,928 Total Steps
   - 39,013 Total Files across all programming languages
   - **2,315 Total C-Family Files** analyzed in the study (44,943 Lines of Code)

---

## 3. Directory Layout in DevGPT Extraction

When unpacked by the author's auxiliary toolset (`MS_DataEngineering_Public`), conversations are structured hierarchically:

```text
data/devgpt/
  ├── snapshot_20231012/
  │     └── Code/
  │           └── <JsonFile_Folder>/
  │                 └── Source_<Name>/
  │                       └── Sharing_<Name_Date>/
  │                             ├── sharing_info.txt   (Title, date, URL, GPT model)
  │                             ├── html_content.html  (Full HTML conversation)
  │                             └── Conversation_<N>/
  │                                   └── Code_001.cpp (Extracted raw code snippet)
  └── snapshot_20240514/
        └── ...
```

---

## 4. C-Family Source Code Breakdown

| Language | 20231012 Files | 20231012 LOC | 20240514 Files | 20240514 LOC | Total Files | Total LOC | LOC/File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C** | 121 | 1,784 | 204 | 5,665 | 325 | 7,449 | 22.9 |
| **C++** | 427 | 7,559 | 563 | 12,310 | 990 | 19,869 | 20.1 |
| **C#** | 829 | 14,824 | 171 | 2,801 | 1,000 | 17,625 | 17.6 |
| **Total** | **1,377** | **24,167** | **938** | **20,776** | **2,315** | **44,943** | **19.4** |

---

## 5. Local Setup & Safe Ingestion Policy

- Untrusted dataset code files are strictly treated as passive text files. **They are NEVER executed directly.**
- Local dataset storage defaults to `data/devgpt/`.
- If full gigabyte-scale DevGPT archives are not downloaded, the application runs on curated sample snippets from the paper, allowing users to import any directory at runtime.
