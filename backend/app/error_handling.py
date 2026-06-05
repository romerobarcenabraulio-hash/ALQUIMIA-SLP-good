"""Standardized error response handling."""

from typing import Optional
from fastapi import HTTPException
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Standard error response format."""
    error: str
    detail: Optional[str] = None
    code: str
    timestamp: str


class ValidationException(HTTPException):
    """Validation error with standard format."""

    def __init__(self, detail: str, code: str = "VALIDATION_ERROR"):
        super().__init__(status_code=400, detail=detail)
        self.code = code


class NotFoundException(HTTPException):
    """Not found error with standard format."""

    def __init__(self, entity: str, entity_id: Optional[str] = None):
        if entity_id:
            detail = f"{entity} with ID {entity_id} not found"
        else:
            detail = f"{entity} not found"
        super().__init__(status_code=404, detail=detail)
        self.code = "NOT_FOUND"


class AuthorizationException(HTTPException):
    """Authorization error with standard format."""

    def __init__(self, detail: str = "Not authorized"):
        super().__init__(status_code=403, detail=detail)
        self.code = "FORBIDDEN"


class ConflictException(HTTPException):
    """Conflict error (e.g., duplicate entity)."""

    def __init__(self, detail: str, code: str = "CONFLICT"):
        super().__init__(status_code=409, detail=detail)
        self.code = code


class InternalServerException(HTTPException):
    """Internal server error."""

    def __init__(self, detail: str = "Internal server error", code: str = "INTERNAL_ERROR"):
        super().__init__(status_code=500, detail=detail)
        self.code = code


# Helper functions for common validations
def ensure_not_none(value, field_name: str):
    """Raise ValidationException if value is None."""
    if value is None:
        raise ValidationException(f"{field_name} is required", code="MISSING_FIELD")


def ensure_positive(value: float, field_name: str):
    """Raise ValidationException if value is not positive."""
    if value is None or value <= 0:
        raise ValidationException(
            f"{field_name} must be greater than 0",
            code="INVALID_VALUE"
        )


def ensure_in_range(value: float, min_val: float, max_val: float, field_name: str):
    """Raise ValidationException if value is out of range."""
    if value < min_val or value > max_val:
        raise ValidationException(
            f"{field_name} must be between {min_val} and {max_val}",
            code="OUT_OF_RANGE"
        )
