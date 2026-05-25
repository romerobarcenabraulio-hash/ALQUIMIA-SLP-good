"""Normalización de teléfonos móviles México (+52)."""
from __future__ import annotations

import re


def normalize_phone_mx(raw: str) -> str | None:
    digits = re.sub(r"\D", "", raw.strip())
    if len(digits) == 10:
        return f"+52{digits}"
    if len(digits) == 12 and digits.startswith("52"):
        return f"+{digits}"
    if len(digits) == 13 and digits.startswith("521"):
        return f"+{digits[:2]}{digits[3:]}"
    if raw.strip().startswith("+") and 12 <= len(digits) <= 15:
        return f"+{digits}"
    return None


def mask_phone(e164: str) -> str:
    if len(e164) < 6:
        return "****"
    return f"{e164[:3]} *** **{e164[-2:]}"
