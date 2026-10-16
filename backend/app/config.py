import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "SecureCode AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    DATASET_DIR: str = os.path.join(BASE_DIR, "data", "devgpt")
    BENCHMARKS_JSON: str = os.path.join(BASE_DIR, "data", "paper_benchmarks.json")
    BENCHMARKS_CSV: str = os.path.join(BASE_DIR, "data", "paper_benchmarks.csv")
    REPORTS_DIR: str = os.path.join(BASE_DIR, "reports")
    BACKUP_DIR: str = os.path.join(BASE_DIR, "data", "backups")
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'securecode_ai.db')}")
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    DEFAULT_OLLAMA_MODEL: str = os.getenv("DEFAULT_OLLAMA_MODEL", "qwen2.5-coder:1.5b")
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
