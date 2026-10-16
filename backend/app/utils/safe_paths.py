import os

def is_safe_path(base_dir: str, path: str, follow_symlinks: bool = True) -> bool:
    """Verifies that the target path does not escape base_dir (directory traversal defense)."""
    if follow_symlinks:
        match_path = os.path.realpath(path)
        base_path = os.path.realpath(base_dir)
    else:
        match_path = os.path.abspath(path)
        base_path = os.path.abspath(base_dir)
    return base_path == match_path or match_path.startswith(base_path + os.sep)
