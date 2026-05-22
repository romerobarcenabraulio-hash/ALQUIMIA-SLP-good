"""
Router: /data — DataProvenance endpoints.

GET /data/{zm}/snapshot   → SnapshotDatos con todos los KPIs y provenance
GET /data/fuentes         → Lista de FuenteStatus de todos los adapters
GET /data/{zm}/kpi/{kpi_id} → Un KPI específico con provenance
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException

from app.data.registry import DataRegistry
from app.data.schemas import FuenteStatus, KPIConProvenance, SnapshotDatos

router = APIRouter(prefix="/data", tags=["data-provenance"])


@router.get(
    "/fuentes",
    response_model=List[FuenteStatus],
    summary="Estado de todas las fuentes de datos registradas",
)
async def get_fuentes() -> List[FuenteStatus]:
    """
    Retorna el estado estático de cada adapter registrado:
    nombre, organismo, tipo máximo alcanzable, KPIs que cubre,
    si requiere clave API, si está disponible.

    Este endpoint NO hace llamadas externas — solo reporta metadata
    de los adapters. Útil para el panel de FuentesDatos.
    """
    return DataRegistry.instance().fuentes_status()


@router.get(
    "/{zm}/snapshot",
    response_model=SnapshotDatos,
    summary="Snapshot completo de KPIs con trazabilidad para una ZM",
)
async def get_snapshot(zm: str) -> SnapshotDatos:
    """
    Ejecuta todos los adapters registrados para la ZM indicada y
    retorna un SnapshotDatos con:
    - Todos los KPIs con su provenance completo
    - Advertencias consolidadas
    - Score de datos (0-100)
    - Flag bloquea_agora

    Nunca retorna error 500 — los fallos de adapters se reflejan
    como tipo=no_disponible en el provenance del KPI afectado.
    """
    zm_upper = zm.upper()
    snapshot = await DataRegistry.instance().snapshot(zm_upper)
    return snapshot


@router.get(
    "/{zm}/kpi/{kpi_id}",
    response_model=KPIConProvenance,
    summary="Un KPI específico con provenance para una ZM",
)
async def get_kpi(zm: str, kpi_id: str) -> KPIConProvenance:
    """
    Retorna un único KPI con su provenance.
    Útil para widgets individuales que necesitan una sola métrica.

    Retorna 404 si el kpi_id no es reconocido por ningún adapter.
    """
    zm_upper = zm.upper()
    snapshot = await DataRegistry.instance().snapshot(zm_upper)

    for kpi in snapshot.kpis:
        if kpi.kpi_id == kpi_id:
            return kpi

    raise HTTPException(
        status_code=404,
        detail=f"KPI '{kpi_id}' no encontrado para ZM '{zm_upper}'. "
               f"KPIs disponibles: {[k.kpi_id for k in snapshot.kpis]}",
    )


@router.get(
    "/municipio/{cve_municipio}/poblacion",
    response_model=KPIConProvenance,
    summary="Población CONAPO proyectada por CVE municipal y año",
)
async def get_poblacion_conapo(
    cve_municipio: str,
    anio: int = 2026,
) -> KPIConProvenance:
    """
    Proyección CONAPO offline (catálogo ALQUIMIA).
    2020 = censo; 2021–2030 = proyección (tipo estimado).
    """
    from app.data.adapters.conapo import ConapoProyeccionesAdapter
    adapter = ConapoProyeccionesAdapter()
    return adapter.get_poblacion_proyectada(cve_municipio, anio)
