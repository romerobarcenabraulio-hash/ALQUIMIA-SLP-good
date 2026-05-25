"""Schemas POLIS — perfiles y resultados de validación."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class Severity(str, Enum):
    VETO = "VETO"
    ERROR = "ERROR"
    WARNING = "WARNING"


@dataclass
class ValidationFinding:
    severity: Severity
    code: str
    message: str
    file_path: str | None = None
    line: int | None = None
    expected: str | None = None
    found: str | None = None


@dataclass
class ValidationReport:
    validator: str
    municipio_id: str | None
    passed: bool
    findings: list[ValidationFinding] = field(default_factory=list)
    files_scanned: int = 0
    meta: dict[str, Any] = field(default_factory=dict)

    def veto_count(self) -> int:
        return sum(1 for f in self.findings if f.severity == Severity.VETO)

    def to_dict(self) -> dict[str, Any]:
        return {
            "validator": self.validator,
            "municipio_id": self.municipio_id,
            "passed": self.passed,
            "files_scanned": self.files_scanned,
            "veto_count": self.veto_count(),
            "findings": [
                {
                    "severity": f.severity.value,
                    "code": f.code,
                    "message": f.message,
                    "file_path": f.file_path,
                    "line": f.line,
                    "expected": f.expected,
                    "found": f.found,
                }
                for f in self.findings
            ],
            "meta": self.meta,
        }
