# DevGPT Dataset Analysis Report

**Date:** 2026-10-15 19:42:28 UTC

## 1. Dataset Overview

- **Scope:** DevGPT C-family snapshots (`snapshot_20231012`, `snapshot_20240514`)
- **Local Files Analyzed:** 10
- **Total Lines of Code (LOC):** 113 (Raw lines: 140)
- **Identified Duplicates:** 0

## 2. Per-Language Distribution

| Language | Local Files | Local Code LOC | Paper Files (Table 4) | Paper LOC (Table 4) |
|:---|:---:|:---:|:---:|:---:|
| C | 4 | 34 | 325 | - |
| C++ | 4 | 54 | 990 | - |
| C# | 2 | 25 | 1000 | - |
| **Total** | **10** | **113** | **2,315** | **44,943** |

## 3. Per-Snapshot Distribution

| Snapshot | Local Files |
|:---|:---:|
| `snapshot_20231012` | 6 |
| `snapshot_20240514` | 4 |

## 4. File-by-File Inventory

| Path | Language | Snapshot | Code LOC | Blank | Comment | SHA-256 (prefix) |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| `snapshot_20231012/File_04/Code_001.c` | C | snapshot_20231012 | 13 | 2 | 1 | `cc7fa1b4fa...` |
| `snapshot_20231012/File_05/Code_001.cs` | C# | snapshot_20231012 | 12 | 2 | 1 | `b0d89bac46...` |
| `snapshot_20231012/File_10/Code_001.cpp` | C++ | snapshot_20231012 | 16 | 4 | 0 | `c82c71866d...` |
| `snapshot_20231012/File_20/Code_001.cpp` | C++ | snapshot_20231012 | 18 | 2 | 1 | `c0e2f98e39...` |
| `snapshot_20231012/File_55/Code_001.c` | C | snapshot_20231012 | 10 | 1 | 1 | `a2017c9f0c...` |
| `snapshot_20231012/File_61/Code_002.cpp` | C++ | snapshot_20231012 | 13 | 3 | 1 | `1300983d49...` |
| `snapshot_20240514/File_07/Code_001.c` | C | snapshot_20240514 | 6 | 1 | 1 | `a74b1beeeb...` |
| `snapshot_20240514/File_11/Code_001.cs` | C# | snapshot_20240514 | 13 | 1 | 1 | `5a943c32c0...` |
| `snapshot_20240514/File_16/Code_001.c` | C | snapshot_20240514 | 5 | 1 | 1 | `3102bd7e94...` |
| `snapshot_20240514/File_47/Code_001.cpp` | C++ | snapshot_20240514 | 7 | 1 | 1 | `008b1c5b19...` |

## 5. Data Quality & Limitations

- **Sample Dataset:** Currently analyzed files represent active sample instances illustrating both snapshots and all three target C-family languages.
- **Full Ingestion Guide:** Instructions to download the complete 2,315-file corpus from the official DevGPT GitHub release and place in `data/devgpt/` are provided in `docs/DATASET_SETUP.md`.
