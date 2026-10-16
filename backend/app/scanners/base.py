from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseScanner(ABC):
    def __init__(self, name: str, supported_languages: List[str]):
        self.name = name
        self.supported_languages = supported_languages

    @abstractmethod
    def check_installed(self) -> bool:
        """Returns True if the scanner executable is available in PATH or local environment."""
        pass

    @abstractmethod
    def get_version(self) -> Optional[str]:
        """Returns the version string of the installed scanner."""
        pass

    @abstractmethod
    def scan(self, target_path: Any) -> Dict[str, Any]:
        """
        Executes scanner on the target file, list of files, or directory.
        Returns dict containing:
          - status: "success", "failed", "not_installed", "requires_auth"
          - execution_time: float
          - findings: List[Dict[str, Any]] (normalized schema)
          - raw_output: str
          - error: Optional[str]
        """
        pass
