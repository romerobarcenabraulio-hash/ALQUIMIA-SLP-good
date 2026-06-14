"""§4 ContainerInventory — Container model for RSU infrastructure census."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.tenant_isolation import HasTenantId


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Container(HasTenantId, Base):
    """Physical waste container registered in a tenant's municipal territory.

    Captured via:
    - field survey (source="field_survey")
    - CSV bulk import (source="csv_import")
    - citizen report (source="citizen_report")
    - automatic inference from HERMES data (source="hermes_inferred")
    """
    __tablename__ = "containers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    # tenant_id comes from HasTenantId mixin

    # Identity
    codigo: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    tipo: Mapped[str] = mapped_column(
        String(40), nullable=False,
        # contenedor_metalico | contenedor_plastico | papelera | contenedor_organico
        # | contenedor_reciclaje | camion_compactador | otro
    )
    capacidad_litros: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Location
    colonia: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    calle: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    latitud: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitud: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    zona: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)

    # State
    estado_fisico: Mapped[str] = mapped_column(
        String(30), nullable=False, default="operativo"
        # operativo | danado | saturado | fuera_de_servicio
    )
    tiene_tapa: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    tiene_separacion: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    accesible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Schedule
    frecuencia_recoleccion: Mapped[Optional[str]] = mapped_column(
        String(30), nullable=True
        # diaria | 2x_semana | semanal | quincenal
    )
    ultimo_vaciado: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Provenance
    source: Mapped[str] = mapped_column(
        String(40), nullable=False, default="field_survey"
    )
    registrado_por: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
