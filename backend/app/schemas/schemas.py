from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class SourceFileBase(BaseModel):
    relative_path: str
    filename: str
    snapshot: str
    language: str
    sharing_name: Optional[str] = None
    source_origin: Optional[str] = "unknown"
    total_lines: int = 0
    code_lines: int = 0
    comment_lines: int = 0
    blank_lines: int = 0
    file_size_bytes: int = 0

class SourceFileOut(SourceFileBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ScannerRunOut(BaseModel):
    id: int
    scanner_name: str
    scanner_version: Optional[str] = None
    target_path: str
    status: str
    execution_time_seconds: float
    files_scanned: int
    files_skipped: int = 0
    findings_count: int
    error_message: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SecurityFindingBase(BaseModel):
    finding_uuid: str
    source_file_id: int
    scanner: str
    rule_id: Optional[str] = None
    line_number: int
    column_number: int = 0
    severity: str
    message: str
    cwe_id: Optional[str] = None
    cwe_description: Optional[str] = None
    code_snippet: Optional[str] = None
    confidence: Optional[str] = "medium"

class SecurityFindingOut(SecurityFindingBase):
    id: int
    created_at: datetime
    file_path: Optional[str] = None
    snapshot: Optional[str] = None
    language: Optional[str] = None
    review_status: Optional[str] = "unreviewed"
    model_config = ConfigDict(from_attributes=True)

class VulnerabilityReviewCreate(BaseModel):
    finding_id: int
    status: str  # confirmed_vulnerability, false_positive, uncertain
    assigned_cwes: Optional[str] = None
    reviewer_notes: Optional[str] = None

class VulnerabilityReviewOut(BaseModel):
    id: int
    finding_id: int
    source_file_id: int
    status: str
    assigned_cwes: Optional[str] = None
    reviewer_notes: Optional[str] = None
    reviewed_at: datetime
    model_config = ConfigDict(from_attributes=True)

class RepairGenerateRequest(BaseModel):
    finding_id: int
    engine_type: str = "rule_based"  # rule_based or ollama_local
    model_name: Optional[str] = None

class RepairPatchOut(BaseModel):
    id: int
    finding_id: int
    source_file_id: int
    engine_type: str
    model_name: Optional[str] = None
    original_snippet: str
    proposed_code: str
    diff_unified: Optional[str] = None
    explanation: Optional[str] = None
    status: str
    applied_at: Optional[datetime] = None
    rescan_passed: Optional[bool] = None
    rescan_details: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PatchActionRequest(BaseModel):
    patch_id: int
    action: str  # approve, reject, rollback

class ScannerStatus(BaseModel):
    scanner_name: str
    installed: bool
    version: Optional[str] = None
    supported_languages: List[str]
    notes: Optional[str] = None
    install_instructions: Optional[str] = None
    last_run_time: Optional[datetime] = None
    last_files_scanned: Optional[int] = None
    last_files_skipped: Optional[int] = None
    last_findings_count: Optional[int] = None
    last_duration_seconds: Optional[float] = None
    last_status: Optional[str] = None
    last_error: Optional[str] = None
    last_run_id: Optional[int] = None

class DatasetProcessRequest(BaseModel):
    target_directory: Optional[str] = None

class DatasetSummary(BaseModel):
    total_files: int
    files_by_language: Dict[str, int]
    lines_by_language: Dict[str, int]
    files_by_snapshot: Dict[str, int]
    total_loc: int

class CWEDistributionItem(BaseModel):
    cwe: str
    description: str
    count: int
    top_25_rank: Optional[str] = None

class LanguageStatisticsItem(BaseModel):
    language: str
    files: int
    lines_of_code: int
    detections: int
    loc_per_detection: float
    files_per_detection: float

class PaperVsLocalComparison(BaseModel):
    metric: str
    paper_value: Any
    local_value: Any
    absolute_difference: Optional[Any] = None
    comparable: bool
    notes: str
