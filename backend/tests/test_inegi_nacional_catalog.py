"""Tests catálogo INEGI nacional y registro dinámico municipal."""
from __future__ import annotations

from app.city.inegi_catalog import fetch_municipios_inegi, list_estados_completos, zm_for_estado
from app.legal.dynamic_municipio import ensure_municipio_registered
from app.legal.repository import get_repo


def test_list_estados_completos_32():
    estados = list_estados_completos()
    assert len(estados) == 32
    assert ("24", "San Luis Potosí") in estados


def test_fetch_municipios_slp_via_inegi():
    rows = fetch_municipios_inegi("24")
    # La API viva de INEGI entrega los 58 municipios; sin red (CI / 403) cae al
    # catálogo semilla en memoria. En ambos casos debe traer municipios de SLP
    # e incluir la capital (24028), sin inventar datos faltantes.
    assert len(rows) >= 4
    assert any(r.clave_inegi == "24028" for r in rows)


def test_ensure_municipio_registered_dynamic():
    mid = ensure_municipio_registered(
        clave_inegi="01001",
        nombre="Aguascalientes",
        estado_id="01",
        estado_nombre="Aguascalientes",
    )
    assert mid is not None
    repo = get_repo()
    assert repo.get_reglamento(mid) is not None
    assert zm_for_estado("01") == "EDO01"
    assert mid in repo.get_municipios_by_zm("EDO01")
