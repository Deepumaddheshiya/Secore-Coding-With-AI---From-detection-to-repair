import os
import json
import csv
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Response
from backend.app.config import settings

router = APIRouter(prefix="/benchmarks", tags=["Research Paper Benchmarks"])

def load_tables() -> List[Dict[str, Any]]:
    if not os.path.exists(settings.BENCHMARKS_JSON):
        raise HTTPException(status_code=404, detail="Benchmark dataset JSON not found.")
    with open(settings.BENCHMARKS_JSON, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/tables")
def get_all_tables() -> List[Dict[str, Any]]:
    """Returns all 18 numbered tables from the research paper."""
    tables = load_tables()
    summary = []
    for t in tables:
        summary.append({
            "table_number": t.get("table_number"),
            "title": t.get("title"),
            "page": t.get("page"),
            "category": t.get("category"),
            "columns": t.get("columns", []),
            "row_count": len(t.get("rows", [])),
            "notes": t.get("notes")
        })
    return summary

@router.get("/tables/{table_number}")
def get_table_by_number(table_number: int) -> Dict[str, Any]:
    """Returns the full table data including columns, rows, and source notes."""
    tables = load_tables()
    for t in tables:
        if t.get("table_number") == table_number:
            return t
    raise HTTPException(status_code=404, detail=f"Table {table_number} not found.")

@router.get("/records")
def get_flattened_records(
    table_number: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200)
) -> Dict[str, Any]:
    """Returns filterable, paginated quantitative benchmark records."""
    tables = load_tables()
    records = []
    for t in tables:
        if table_number is not None and t.get("table_number") != table_number:
            continue
        if category and category.lower() not in t.get("category", "").lower():
            continue
        
        t_num = t.get("table_number")
        t_title = t.get("title")
        t_page = t.get("page")
        t_cat = t.get("category")

        for idx, row in enumerate(t.get("rows", [])):
            record_str = json.dumps(row).lower()
            if search and search.lower() not in record_str and search.lower() not in t_title.lower():
                continue
            
            records.append({
                "table_number": t_num,
                "table_title": t_title,
                "source_page": t_page,
                "category": t_cat,
                "row_index": idx + 1,
                "data": row
            })

    total = len(records)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = records[start:end]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "records": paginated
    }

@router.get("/export-json")
def export_benchmarks_json():
    """Exports complete paper benchmarks JSON with strict attribution."""
    if not os.path.exists(settings.BENCHMARKS_JSON):
        raise HTTPException(status_code=404, detail="Benchmark JSON file missing.")
    with open(settings.BENCHMARKS_JSON, "r", encoding="utf-8") as f:
        content = f.read()
    return Response(content=content, media_type="application/json", headers={
        "Content-Disposition": "attachment; filename=paper_benchmarks.json"
    })

@router.get("/export-csv")
def export_benchmarks_csv():
    """Exports flattened benchmark records as CSV with strict attribution."""
    if not os.path.exists(settings.BENCHMARKS_CSV):
        raise HTTPException(status_code=404, detail="Benchmark CSV file missing.")
    with open(settings.BENCHMARKS_CSV, "r", encoding="utf-8") as f:
        content = f.read()
    return Response(content=content, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=paper_benchmarks.csv"
    })
