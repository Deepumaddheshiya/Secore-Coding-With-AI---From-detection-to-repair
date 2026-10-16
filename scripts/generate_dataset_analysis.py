"""
generate_dataset_analysis.py
Calculates live dataset statistics, inventory, and produces:
- data/dataset_inventory.csv
- data/dataset_statistics.json
- reports/dataset_analysis_report.md
"""

import os
import json
import csv
import hashlib
from datetime import datetime

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEVGPT_DIR = os.path.join(BASE_DIR, "data", "devgpt")
INVENTORY_CSV = os.path.join(BASE_DIR, "data", "dataset_inventory.csv")
STATS_JSON = os.path.join(BASE_DIR, "data", "dataset_statistics.json")
REPORT_MD = os.path.join(BASE_DIR, "reports", "dataset_analysis_report.md")

LANG_EXTENSIONS = {
    ".c": "C",
    ".h": "C",
    ".cpp": "C++",
    ".cc": "C++",
    ".cxx": "C++",
    ".hpp": "C++",
    ".cs": "C#"
}

def count_lines(filepath):
    total = 0
    code = 0
    blank = 0
    comment = 0
    in_block = False
    
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            total += 1
            s = line.strip()
            if not s:
                blank += 1
                continue
            if in_block:
                comment += 1
                if "*/" in s:
                    in_block = False
                continue
            if s.startswith("/*"):
                comment += 1
                if "*/" not in s:
                    in_block = True
                continue
            if s.startswith("//"):
                comment += 1
                continue
            code += 1
    return total, code, blank, comment

def compute_hash(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def analyze_dataset():
    files_data = []
    snapshot_counts = {}
    lang_counts = {}
    lang_loc = {}
    total_loc = 0
    total_raw_lines = 0
    seen_hashes = {}
    duplicates = []
    
    if not os.path.exists(DEVGPT_DIR):
        print(f"Dataset directory missing: {DEVGPT_DIR}")
        return

    for root, dirs, files in os.walk(DEVGPT_DIR):
        for fname in sorted(files):
            ext = os.path.splitext(fname)[1].lower()
            if ext not in LANG_EXTENSIONS:
                continue
            
            fpath = os.path.join(root, fname)
            rel_path = os.path.relpath(fpath, DEVGPT_DIR)
            parts = rel_path.split(os.sep)
            snapshot = parts[0] if len(parts) > 0 else "unknown"
            folder = parts[1] if len(parts) > 1 else ""
            
            lang = LANG_EXTENSIONS[ext]
            tot, cod, blk, cmt = count_lines(fpath)
            f_hash = compute_hash(fpath)
            
            if f_hash in seen_hashes:
                duplicates.append({
                    "original": seen_hashes[f_hash],
                    "duplicate": rel_path,
                    "sha256": f_hash
                })
            else:
                seen_hashes[f_hash] = rel_path
                
            snapshot_counts[snapshot] = snapshot_counts.get(snapshot, 0) + 1
            lang_counts[lang] = lang_counts.get(lang, 0) + 1
            lang_loc[lang] = lang_loc.get(lang, 0) + cod
            total_loc += cod
            total_raw_lines += tot
            
            files_data.append({
                "relative_path": rel_path.replace("\\", "/"),
                "filename": fname,
                "snapshot": snapshot,
                "folder": folder,
                "language": lang,
                "extension": ext,
                "total_lines": tot,
                "code_lines": cod,
                "blank_lines": blk,
                "comment_lines": cmt,
                "sha256": f_hash
            })
            
    # 1. Write data/dataset_inventory.csv
    os.makedirs(os.path.dirname(INVENTORY_CSV), exist_ok=True)
    with open(INVENTORY_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([
            "relative_path", "filename", "snapshot", "folder", 
            "language", "extension", "total_lines", "code_lines", 
            "blank_lines", "comment_lines", "sha256"
        ])
        for row in files_data:
            w.writerow([
                row["relative_path"], row["filename"], row["snapshot"], row["folder"],
                row["language"], row["extension"], row["total_lines"], row["code_lines"],
                row["blank_lines"], row["comment_lines"], row["sha256"]
            ])
    print(f"Wrote {len(files_data)} records to {INVENTORY_CSV}")

    # 2. Write data/dataset_statistics.json
    stats = {
        "analysis_timestamp": datetime.utcnow().isoformat() + "Z",
        "dataset_directory": "data/devgpt",
        "dataset_scope": "Sample subset of public DevGPT corpus (C, C++, C#)",
        "total_files": len(files_data),
        "total_lines_of_code": total_loc,
        "total_raw_lines": total_raw_lines,
        "by_snapshot": snapshot_counts,
        "by_language": lang_counts,
        "code_lines_by_language": lang_loc,
        "duplicates_count": len(duplicates),
        "duplicates": duplicates,
        "comparison_with_paper": {
            "paper_total_files": 2315,
            "paper_total_loc": 44943,
            "paper_c_files": 325,
            "paper_cpp_files": 990,
            "paper_csharp_files": 1000,
            "local_processed_files": len(files_data),
            "local_processed_loc": total_loc,
            "status": "Local sample directory processed; full DevGPT corpus can be imported into data/devgpt/"
        }
    }
    
    with open(STATS_JSON, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
    print(f"Wrote statistics to {STATS_JSON}")

    # 3. Write reports/dataset_analysis_report.md
    os.makedirs(os.path.dirname(REPORT_MD), exist_ok=True)
    with open(REPORT_MD, "w", encoding="utf-8") as f:
        f.write("# DevGPT Dataset Analysis Report\n\n")
        f.write(f"**Date:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\n\n")
        f.write("## 1. Dataset Overview\n\n")
        f.write("- **Scope:** DevGPT C-family snapshots (`snapshot_20231012`, `snapshot_20240514`)\n")
        f.write(f"- **Local Files Analyzed:** {len(files_data)}\n")
        f.write(f"- **Total Lines of Code (LOC):** {total_loc} (Raw lines: {total_raw_lines})\n")
        f.write(f"- **Identified Duplicates:** {len(duplicates)}\n\n")
        
        f.write("## 2. Per-Language Distribution\n\n")
        f.write("| Language | Local Files | Local Code LOC | Paper Files (Table 4) | Paper LOC (Table 4) |\n")
        f.write("|:---|:---:|:---:|:---:|:---:|\n")
        for lang in ["C", "C++", "C#"]:
            l_files = lang_counts.get(lang, 0)
            l_loc = lang_loc.get(lang, 0)
            p_files = 325 if lang == "C" else (990 if lang == "C++" else 1000)
            p_loc = "Not split in Table 4 total" if lang != "Total" else "44,943"
            f.write(f"| {lang} | {l_files} | {l_loc} | {p_files} | - |\n")
        f.write(f"| **Total** | **{len(files_data)}** | **{total_loc}** | **2,315** | **44,943** |\n\n")

        f.write("## 3. Per-Snapshot Distribution\n\n")
        f.write("| Snapshot | Local Files |\n")
        f.write("|:---|:---:|\n")
        for snap, cnt in sorted(snapshot_counts.items()):
            f.write(f"| `{snap}` | {cnt} |\n")
        f.write("\n")

        f.write("## 4. File-by-File Inventory\n\n")
        f.write("| Path | Language | Snapshot | Code LOC | Blank | Comment | SHA-256 (prefix) |\n")
        f.write("|:---|:---:|:---:|:---:|:---:|:---:|:---|\n")
        for row in files_data:
            f.write(f"| `{row['relative_path']}` | {row['language']} | {row['snapshot']} | {row['code_lines']} | {row['blank_lines']} | {row['comment_lines']} | `{row['sha256'][:10]}...` |\n")
        f.write("\n")

        f.write("## 5. Data Quality & Limitations\n\n")
        f.write("- **Sample Dataset:** Currently analyzed files represent active sample instances illustrating both snapshots and all three target C-family languages.\n")
        f.write("- **Full Ingestion Guide:** Instructions to download the complete 2,315-file corpus from the official DevGPT GitHub release and place in `data/devgpt/` are provided in `docs/DATASET_SETUP.md`.\n")

    print(f"Wrote report to {REPORT_MD}")

if __name__ == "__main__":
    analyze_dataset()
