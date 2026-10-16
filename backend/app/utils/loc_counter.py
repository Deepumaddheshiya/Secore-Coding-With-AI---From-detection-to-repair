"""
Consistent line of code counter for C, C++, and C# files.
Differentiates between blank lines, single-line/multi-line comments, and pure code lines.
"""

def count_file_lines(file_path: str) -> dict:
    total_lines = 0
    blank_lines = 0
    comment_lines = 0
    code_lines = 0
    
    in_block_comment = False
    
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for raw_line in f:
                total_lines += 1
                line = raw_line.strip()
                
                if not line:
                    blank_lines += 1
                    continue
                
                if in_block_comment:
                    comment_lines += 1
                    if "*/" in line:
                        in_block_comment = False
                    continue
                
                if line.startswith("/*"):
                    comment_lines += 1
                    if "*/" not in line:
                        in_block_comment = True
                    continue
                
                if line.startswith("//"):
                    comment_lines += 1
                    continue
                
                code_lines += 1
    except Exception:
        pass
        
    return {
        "total_lines": total_lines,
        "code_lines": code_lines,
        "comment_lines": comment_lines,
        "blank_lines": blank_lines
    }
