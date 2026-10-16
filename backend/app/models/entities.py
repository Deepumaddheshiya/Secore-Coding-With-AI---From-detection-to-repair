import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class SourceFile(Base):
    __tablename__ = "source_files"

    id = Column(Integer, primary_key=True, index=True)
    relative_path = Column(String(500), unique=True, index=True, nullable=False)
    filename = Column(String(255), nullable=False)
    snapshot = Column(String(50), index=True, nullable=False)  # snapshot_20231012 or snapshot_20240514
    language = Column(String(50), index=True, nullable=False)  # c, cpp, csharp
    sharing_name = Column(String(255), index=True, nullable=True)
    source_origin = Column(String(50), default="unknown")  # user, gpt3.5, gpt4, etc.
    total_lines = Column(Integer, default=0)
    code_lines = Column(Integer, default=0)
    comment_lines = Column(Integer, default=0)
    blank_lines = Column(Integer, default=0)
    file_size_bytes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    findings = relationship("SecurityFinding", back_populates="source_file", cascade="all, delete-orphan")
    reviews = relationship("VulnerabilityReview", back_populates="source_file", cascade="all, delete-orphan")
    patches = relationship("RepairPatch", back_populates="source_file", cascade="all, delete-orphan")

class ScannerRun(Base):
    __tablename__ = "scanner_runs"

    id = Column(Integer, primary_key=True, index=True)
    scanner_name = Column(String(100), nullable=False)
    scanner_version = Column(String(50), nullable=True)
    target_path = Column(String(500), nullable=False)
    status = Column(String(50), default="pending")  # pending, completed, failed, not_installed, requires_auth
    execution_time_seconds = Column(Float, default=0.0)
    files_scanned = Column(Integer, default=0)
    files_skipped = Column(Integer, default=0)
    findings_count = Column(Integer, default=0)
    raw_output = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    findings = relationship("SecurityFinding", back_populates="run", cascade="all, delete-orphan")

class SecurityFinding(Base):
    __tablename__ = "security_findings"

    id = Column(Integer, primary_key=True, index=True)
    finding_uuid = Column(String(100), unique=True, index=True, nullable=False)
    source_file_id = Column(Integer, ForeignKey("source_files.id"), nullable=False)
    scanner_run_id = Column(Integer, ForeignKey("scanner_runs.id"), nullable=True)
    scanner = Column(String(50), index=True, nullable=False)
    rule_id = Column(String(100), nullable=True)
    line_number = Column(Integer, nullable=False)
    column_number = Column(Integer, default=0)
    severity = Column(String(50), index=True, nullable=False)  # error, warning, note/info
    message = Column(Text, nullable=False)
    cwe_id = Column(String(50), index=True, nullable=True)  # e.g., CWE-120
    cwe_description = Column(String(255), nullable=True)
    code_snippet = Column(Text, nullable=True)
    confidence = Column(String(50), default="medium")
    raw_reference = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    source_file = relationship("SourceFile", back_populates="findings")
    run = relationship("ScannerRun", back_populates="findings")
    reviews = relationship("VulnerabilityReview", back_populates="finding", cascade="all, delete-orphan")
    patches = relationship("RepairPatch", back_populates="finding", cascade="all, delete-orphan")

class VulnerabilityReview(Base):
    __tablename__ = "vulnerability_reviews"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("security_findings.id"), nullable=False)
    source_file_id = Column(Integer, ForeignKey("source_files.id"), nullable=False)
    status = Column(String(50), default="unreviewed")  # confirmed_vulnerability, false_positive, uncertain
    assigned_cwes = Column(String(100), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=datetime.datetime.utcnow)

    finding = relationship("SecurityFinding", back_populates="reviews")
    source_file = relationship("SourceFile", back_populates="reviews")

class RepairPatch(Base):
    __tablename__ = "repair_patches"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("security_findings.id"), nullable=False)
    source_file_id = Column(Integer, ForeignKey("source_files.id"), nullable=False)
    engine_type = Column(String(50), default="rule_based")  # rule_based, ollama_local
    model_name = Column(String(100), nullable=True)
    original_snippet = Column(Text, nullable=False)
    proposed_code = Column(Text, nullable=False)
    diff_unified = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    status = Column(String(50), default="proposed")  # proposed, approved, rejected, applied, rolled_back
    applied_at = Column(DateTime, nullable=True)
    backup_path = Column(String(500), nullable=True)
    rescan_passed = Column(Boolean, nullable=True)
    rescan_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    finding = relationship("SecurityFinding", back_populates="patches")
    source_file = relationship("SourceFile", back_populates="patches")

class LocalEvaluation(Base):
    __tablename__ = "local_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_uuid = Column(String(100), unique=True, index=True, nullable=False)
    dataset_version = Column(String(50), default="DevGPT v10")
    files_processed = Column(Integer, default=0)
    lines_of_code = Column(Integer, default=0)
    scanners_used = Column(String(255), default="")
    total_findings = Column(Integer, default=0)
    confirmed_vulnerabilities = Column(Integer, default=0)
    false_positives = Column(Integer, default=0)
    repair_attempts = Column(Integer, default=0)
    successful_repairs = Column(Integer, default=0)
    repair_fix_rate = Column(Float, default=0.0)
    summary_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SystemAuditLog(Base):
    __tablename__ = "system_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    status = Column(String(50), default="success")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
