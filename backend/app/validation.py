"""Centralized input validation for all endpoints."""

import re
from typing import Tuple, Optional
from datetime import datetime


class ValidationError(Exception):
    """Validation error with detailed message."""
    pass


class InputValidator:
    """Standard input validation methods."""

    @staticmethod
    def validate_rfc(rfc: Optional[str]) -> Tuple[bool, Optional[str]]:
        """Validate Mexican RFC format.

        Returns (is_valid, error_message)
        """
        if not rfc:
            return True, None  # Optional field

        # RFC format: 6 letters + 6 date digits (YYMMDD) + 3 check digits
        rfc_pattern = r'^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$'

        if not re.match(rfc_pattern, rfc.upper()):
            return False, "RFC debe tener formato válido (ej: ABC123456XYZ)"

        return True, None

    @staticmethod
    def validate_email(email: Optional[str]) -> Tuple[bool, Optional[str]]:
        """Validate email format.

        Returns (is_valid, error_message)
        """
        if not email:
            return True, None  # Optional field

        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        if not re.match(email_pattern, email):
            return False, "Email inválido"

        return True, None

    @staticmethod
    def validate_phone(phone: Optional[str]) -> Tuple[bool, Optional[str]]:
        """Validate Mexican phone format.

        Returns (is_valid, error_message)
        """
        if not phone:
            return True, None  # Optional field

        # Remove common separators
        cleaned = re.sub(r'[\s\-\(\)]', '', phone)

        # Should be 10 digits (Mexican format)
        if not re.match(r'^\d{10}$', cleaned):
            return False, "Teléfono debe tener 10 dígitos"

        return True, None

    @staticmethod
    def validate_fecha_generacion(fecha: str) -> Tuple[bool, Optional[str]]:
        """Validate date format YYYY-MM-DD.

        Returns (is_valid, error_message)
        """
        if not fecha:
            return False, "Fecha es requerida"

        try:
            datetime.strptime(fecha, "%Y-%m-%d")
            return True, None
        except ValueError:
            return False, "Fecha debe estar en formato YYYY-MM-DD"

    @staticmethod
    def validate_isic(isic: Optional[str]) -> Tuple[bool, Optional[str]]:
        """Validate ISIC code format.

        Returns (is_valid, error_message)
        """
        if not isic:
            return True, None  # Optional field

        # ISIC is 4 digits
        if not re.match(r'^\d{4}$', isic):
            return False, "ISIC debe ser 4 dígitos"

        return True, None

    @staticmethod
    def validate_residue_quantity(cantidad: float, max_tons: float = 10000) -> Tuple[bool, Optional[str]]:
        """Validate residue quantity.

        Returns (is_valid, error_message)
        """
        if cantidad <= 0:
            return False, "Cantidad debe ser mayor a 0"

        if cantidad > max_tons:
            return False, f"Cantidad excede máximo permitido ({max_tons} tons)"

        return True, None

    @staticmethod
    def validate_material_breakdown(materiales: dict, total_tons: float, tolerance_pct: float = 10) -> Tuple[bool, Optional[str]]:
        """Validate material breakdown consistency.

        Returns (is_valid, error_message)
        """
        if not materiales:
            return False, "Desglose de materiales es requerido"

        suma = sum(float(v) for v in materiales.values())

        if suma == 0:
            return False, "Suma de materiales es cero"

        diferencia_pct = abs(suma - total_tons) / total_tons * 100

        if diferencia_pct > tolerance_pct:
            return False, f"Suma de materiales ({suma}) difiere {diferencia_pct:.1f}% del total ({total_tons}). Máximo tolerado: {tolerance_pct}%"

        return True, None

    @staticmethod
    def validate_entity_name(name: str, min_length: int = 3, max_length: int = 255) -> Tuple[bool, Optional[str]]:
        """Validate entity name length and format.

        Returns (is_valid, error_message)
        """
        if not name or not name.strip():
            return False, "Nombre es requerido"

        name = name.strip()

        if len(name) < min_length:
            return False, f"Nombre debe tener al menos {min_length} caracteres"

        if len(name) > max_length:
            return False, f"Nombre no puede exceder {max_length} caracteres"

        # Only alphanumeric, spaces, hyphens, and parentheses
        if not re.match(r"^[a-zA-Z0-9\s\-\(\)áéíóúñÁÉÍÓÚÑ]+$", name):
            return False, "Nombre contiene caracteres inválidos"

        return True, None

    @staticmethod
    def validate_municipio(municipio: str) -> Tuple[bool, Optional[str]]:
        """Validate municipio name.

        Returns (is_valid, error_message)
        """
        return InputValidator.validate_entity_name(municipio, min_length=2, max_length=100)

    @staticmethod
    def validate_estado_mx(estado: str) -> Tuple[bool, Optional[str]]:
        """Validate Mexican state name.

        Returns (is_valid, error_message)
        """
        valid_estados = {
            "Aguascalientes", "Baja California", "Baja California Sur",
            "Campeche", "Chiapas", "Chihuahua", "Ciudad de México",
            "Coahuila", "Colima", "Durango", "Estado de México",
            "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán",
            "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
            "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
            "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz",
            "Yucatán", "Zacatecas"
        }

        if estado not in valid_estados:
            return False, f"Estado '{estado}' no es válido"

        return True, None


# Helper for endpoint validation
def validate_inputs(**validations) -> Optional[str]:
    """Validate multiple inputs. Returns first error message or None.

    Usage:
        error = validate_inputs(
            rfc=(rfc_value, InputValidator.validate_rfc),
            email=(email_value, InputValidator.validate_email),
        )
        if error:
            raise HTTPException(status_code=400, detail=error)
    """
    for field_name, (value, validator_func) in validations.items():
        is_valid, error_msg = validator_func(value)
        if not is_valid:
            return error_msg or f"Validación falló para {field_name}"
    return None
