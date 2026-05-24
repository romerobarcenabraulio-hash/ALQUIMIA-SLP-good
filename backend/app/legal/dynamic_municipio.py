"""
Registro dinámico de municipios México (fuera de semilla ZM).

Permite subir PDF y diagnosticar cualquier municipio INEGI sin redeploy.
"""
from __future__ import annotations

from app.city.inegi_catalog import (
    get_municipio_by_clave_resolved,
    municipio_simulator_id_from_cve,
    zm_for_estado,
)
from app.legal.repository import _todos_ausentes, get_repo
from app.legal.schemas import Reglamento


def ensure_municipio_registered(
    *,
    municipio_id: str | None = None,
    clave_inegi: str | None = None,
    nombre: str | None = None,
    estado_id: str | None = None,
    estado_nombre: str | None = None,
) -> str | None:
    """
    Garantiza fila legal para el municipio. Retorna municipio_id normalizado o None.
    """
    repo = get_repo()
    mid: str | None = None
    zm: str | None = None

    if clave_inegi:
        row = get_municipio_by_clave_resolved(clave_inegi)
        if row:
            mid = row.municipio_simulator_id
            nombre = nombre or row.nombre
            estado_id = estado_id or row.estado_id
            zm = row.zm_simulator_id
        else:
            cve = clave_inegi.strip().zfill(5)
            mid = municipio_simulator_id_from_cve(cve)
            estado_id = estado_id or cve[:2]
            zm = zm_for_estado(estado_id)
            nombre = nombre or f"Municipio CVE {cve}"
    elif municipio_id:
        mid = municipio_id.lower().strip()
        if repo.get_reglamento(mid):
            return mid
        zm = zm_for_estado((estado_id or "00").zfill(2))
    else:
        return None

    if not mid:
        return None

    mid = mid.lower()
    if repo.get_reglamento(mid):
        return mid

    eid = (estado_id or "00").zfill(2)
    zm = zm or zm_for_estado(eid)
    display = nombre or mid.upper()
    repo.register_municipio_nombre(mid, display)

    reg = Reglamento(
        municipio_id=mid,
        zm=zm,
        nombre=f"Reglamento de aseo o limpia — {display}",
        version="pendiente de análisis",
        fecha_publicacion="",
        fuente="Carga municipal ALQUIMIA",
        url=None,
        verificado=False,
        requiere_revision_juridica=True,
    )
    repo.upsert_reglamento(reg)
    repo.set_articulos(
        mid,
        _todos_ausentes(
            fuente="PDF municipal pendiente de análisis — matriz genérica hasta revisión jurídica"
        ),
    )
    repo.register_in_zm(zm, mid)
    return mid
