"""ALQ-17: Alertas municipales — notificaciones de cambios en cobertura y datos nacionales.

Sistema de alertas para:
1. Cambios en estado de cobertura (verificado → estimado)
2. Nuevos municipios desbloqueados
3. Cambios en KPIs críticos (RSU ton/día, per cápita)
4. Inconsistencias detectadas por validación
5. Brechas cerradas o abiertas
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from decimal import Decimal


class AlertType(str, Enum):
    """Tipos de alertas municipales"""
    COVERAGE_CHANGED = "coverage_changed"          # Estado de cobertura cambió
    MUNICIPIO_UNLOCKED = "municipio_unlocked"      # Municipio desbloqueado
    KPI_THRESHOLD_EXCEEDED = "kpi_threshold"       # KPI excede umbral (RSU ton/día, per cápita)
    INCONSISTENCY_DETECTED = "inconsistency"       # Inconsistencia en datos
    BREACH_CLOSED = "breach_closed"                # Brecha de datos cerrada
    BREACH_OPENED = "breach_opened"                # Brecha nueva detectada
    VALIDATION_FAILED = "validation_failed"        # Validación de integridad falló


class AlertSeverity(str, Enum):
    """Severidad de alertas"""
    CRITICAL = "critical"          # Acción requerida inmediata
    HIGH = "high"                  # Requiere revisión pronto
    MEDIUM = "medium"              # Informativo, revisar
    LOW = "low"                    # Registro para auditoría


@dataclass
class MunicipalAlert:
    """Estructura de alerta municipal"""
    municipio_id: str
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    description: str
    changed_field: Optional[str] = None           # Qué campo cambió
    old_value: Optional[str] = None               # Valor anterior
    new_value: Optional[str] = None               # Valor nuevo
    metadata: Optional[dict] = None               # Contexto adicional
    created_at: Optional[datetime] = None
    triggered_by: str = "system"                  # 'system' o user_id


# ── Ruleset de Alertas ────────────────────────────────────────────────────────

# COVERAGE_CHANGED: cuando estado de cobertura empeora
COVERAGE_DOWNGRADE_ALERTS = {
    "verificado": {
        "localizado": AlertSeverity.HIGH,
        "estimado": AlertSeverity.HIGH,
        "no_disponible": AlertSeverity.CRITICAL,
        "bloqueado": AlertSeverity.CRITICAL,
    },
    "localizado": {
        "estimado": AlertSeverity.MEDIUM,
        "no_disponible": AlertSeverity.HIGH,
        "bloqueado": AlertSeverity.HIGH,
    },
    "estimado": {
        "no_disponible": AlertSeverity.MEDIUM,
        "bloqueado": AlertSeverity.MEDIUM,
    },
}

# KPI thresholds por municipio (ejemplo)
KPI_THRESHOLDS = {
    "rsu_ton_dia_min": Decimal("5"),              # Menos de 5 ton/día = anomalía
    "rsu_ton_dia_max": Decimal("500"),            # Más de 500 ton/día = revisar
    "per_capita_min": Decimal("0.1"),             # Menos de 0.1 kg/cap/día = revisar
    "per_capita_max": Decimal("2.0"),             # Más de 2.0 kg/cap/día = revisar
}


def evaluate_coverage_change(
    municipio_id: str,
    old_status: str,
    new_status: str,
) -> Optional[MunicipalAlert]:
    """Genera alerta si cobertura empeora"""
    if old_status == new_status:
        return None

    severity = COVERAGE_DOWNGRADE_ALERTS.get(old_status, {}).get(new_status)
    if severity is None:
        return None

    return MunicipalAlert(
        municipio_id=municipio_id,
        alert_type=AlertType.COVERAGE_CHANGED,
        severity=severity,
        title=f"Cambio en cobertura: {old_status} → {new_status}",
        description=f"El estado de cobertura para {municipio_id} cambió de '{old_status}' a '{new_status}'",
        changed_field="coverage_status",
        old_value=old_status,
        new_value=new_status,
    )


def evaluate_kpi_threshold(
    municipio_id: str,
    kpi_name: str,
    current_value: Decimal,
) -> Optional[MunicipalAlert]:
    """Genera alerta si KPI sale de rangos normales"""
    min_key = f"{kpi_name}_min"
    max_key = f"{kpi_name}_max"

    min_val = KPI_THRESHOLDS.get(min_key)
    max_val = KPI_THRESHOLDS.get(max_key)

    if current_value < min_val:
        return MunicipalAlert(
            municipio_id=municipio_id,
            alert_type=AlertType.KPI_THRESHOLD_EXCEEDED,
            severity=AlertSeverity.HIGH,
            title=f"{kpi_name} bajo valor crítico",
            description=f"{kpi_name} = {current_value} (mínimo esperado: {min_val})",
            changed_field=kpi_name,
            new_value=str(current_value),
            metadata={"threshold": "minimum"},
        )

    if max_val and current_value > max_val:
        return MunicipalAlert(
            municipio_id=municipio_id,
            alert_type=AlertType.KPI_THRESHOLD_EXCEEDED,
            severity=AlertSeverity.MEDIUM,
            title=f"{kpi_name} sobre valor esperado",
            description=f"{kpi_name} = {current_value} (máximo esperado: {max_val})",
            changed_field=kpi_name,
            new_value=str(current_value),
            metadata={"threshold": "maximum"},
        )

    return None


def generate_municipio_unlocked_alert(municipio_id: str, reason: str) -> MunicipalAlert:
    """Alerta cuando un municipio se desbloquea"""
    return MunicipalAlert(
        municipio_id=municipio_id,
        alert_type=AlertType.MUNICIPIO_UNLOCKED,
        severity=AlertSeverity.HIGH,
        title=f"Municipio desbloqueado: {municipio_id}",
        description=f"Municipio {municipio_id} está ahora disponible para simulación. Razón: {reason}",
    )


def generate_breach_alert(
    municipio_id: str,
    module_id: str,
    is_opened: bool,
) -> MunicipalAlert:
    """Alerta cuando se abre/cierra una brecha de datos"""
    alert_type = AlertType.BREACH_OPENED if is_opened else AlertType.BREACH_CLOSED
    severity = AlertSeverity.HIGH if is_opened else AlertSeverity.MEDIUM
    action = "abierta" if is_opened else "cerrada"

    return MunicipalAlert(
        municipio_id=municipio_id,
        alert_type=alert_type,
        severity=severity,
        title=f"Brecha de datos {action}: {module_id}",
        description=f"Brecha en módulo {module_id} para {municipio_id} ha sido {action}",
        metadata={"module": module_id},
    )
