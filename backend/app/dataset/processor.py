import os
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.models.entities import SourceFile, SystemAuditLog
from backend.app.utils.loc_counter import count_file_lines
from backend.app.utils.safe_paths import is_safe_path

LANGUAGE_EXTENSIONS = {
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".hpp": "cpp",
    ".cs": "csharp"
}

class DatasetProcessor:
    def __init__(self, base_dir: str = settings.DATASET_DIR):
        self.base_dir = os.path.abspath(base_dir)

    def scan_and_ingest(self, db: Session, target_dir: Optional[str] = None) -> Dict[str, Any]:
        dir_to_scan = os.path.abspath(target_dir) if target_dir else self.base_dir
        if not os.path.exists(dir_to_scan):
            return {
                "success": False,
                "error": f"Dataset directory '{dir_to_scan}' does not exist.",
                "files_added": 0,
                "total_files": 0
            }

        files_added = 0
        existing_files = {f.relative_path: f for f in db.query(SourceFile).all()}

        for root, _, files in os.walk(dir_to_scan):
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in LANGUAGE_EXTENSIONS:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, self.base_dir).replace("\\", "/")

                    # Determine snapshot
                    snapshot = "unknown"
                    if "snapshot_20231012" in rel_path or "20231012" in rel_path:
                        snapshot = "snapshot_20231012"
                    elif "snapshot_20240514" in rel_path or "20240514" in rel_path:
                        snapshot = "snapshot_20240514"

                    language = LANGUAGE_EXTENSIONS[ext]

                    # Extract sharing name or folder identifier
                    path_parts = rel_path.split("/")
                    sharing_name = None
                    for part in path_parts:
                        if part.startswith("File_") or part.startswith("Sharing_"):
                            sharing_name = part
                            break

                    # Determine source_origin if discoverable from metadata or folder
                    source_origin = "unknown"
                    if "user" in rel_path.lower():
                        source_origin = "user"
                    elif "gpt3.5" in rel_path.lower():
                        source_origin = "gpt3.5"
                    elif "gpt4" in rel_path.lower():
                        source_origin = "gpt4"

                    # Calculate lines of code
                    loc_data = count_file_lines(full_path)
                    file_size = os.path.getsize(full_path)

                    if rel_path in existing_files:
                        db_file = existing_files[rel_path]
                        db_file.total_lines = loc_data["total_lines"]
                        db_file.code_lines = loc_data["code_lines"]
                        db_file.comment_lines = loc_data["comment_lines"]
                        db_file.blank_lines = loc_data["blank_lines"]
                        db_file.file_size_bytes = file_size
                    else:
                        new_file = SourceFile(
                            relative_path=rel_path,
                            filename=file,
                            snapshot=snapshot,
                            language=language,
                            sharing_name=sharing_name,
                            source_origin=source_origin,
                            total_lines=loc_data["total_lines"],
                            code_lines=loc_data["code_lines"],
                            comment_lines=loc_data["comment_lines"],
                            blank_lines=loc_data["blank_lines"],
                            file_size_bytes=file_size
                        )
                        db.add(new_file)
                        files_added += 1

        db.commit()

        # Record audit log
        audit = SystemAuditLog(
            action="DATASET_INGEST",
            entity_type="SourceFile",
            details=f"Ingested from {dir_to_scan}. Added: {files_added} new files."
        )
        db.add(audit)
        db.commit()

        total_files = db.query(SourceFile).count()
        return {
            "success": True,
            "directory": dir_to_scan,
            "files_added": files_added,
            "total_files": total_files
        }

    def get_summary(self, db: Session) -> Dict[str, Any]:
        files = db.query(SourceFile).all()
        files_by_lang = {"c": 0, "cpp": 0, "csharp": 0}
        lines_by_lang = {"c": 0, "cpp": 0, "csharp": 0}
        files_by_snap = {"snapshot_20231012": 0, "snapshot_20240514": 0, "unknown": 0}
        total_loc = 0

        for f in files:
            lang = f.language.lower()
            if lang in files_by_lang:
                files_by_lang[lang] += 1
                lines_by_lang[lang] += f.code_lines
            else:
                files_by_lang[lang] = 1
                lines_by_lang[lang] = f.code_lines

            snap = f.snapshot
            if snap in files_by_snap:
                files_by_snap[snap] += 1
            else:
                files_by_snap[snap] = 1

            total_loc += f.code_lines

        return {
            "total_files": len(files),
            "files_by_language": files_by_lang,
            "lines_by_language": lines_by_lang,
            "files_by_snapshot": files_by_snap,
            "total_loc": total_loc
        }

dataset_processor = DatasetProcessor()
