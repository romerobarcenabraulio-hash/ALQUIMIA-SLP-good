"""Tests catálogo INEGI nacional y registro dinámico municipal."""
from __future__ import annotations

from app.city.inegi_catalog import fetch_municipios_inegi, list_estados_completos, zm_for_estado
from app.city.municipios_mx import list_municipios_mx
from app.legal.dynamic_municipio import ensure_municipio_registered
from app.legal.repository import get_repo


def test_list_estados_completos_32():
    estados = list_estados_completos()
    assert len(estados) == 32
    assert ("24", "San Luis Potosí") in estados


def test_fetch_municipios_slp_via_inegi():
    rows = fetch_municipios_inegi("24")
    assert len(rows) >= 50
    assert any(r.clave_inegi == "24028" for r in rows)


def test_catalogo_municipal_nacional_cubre_cves_oficiales():
    rows = list_municipios_mx()
    estados = {row.estado_id for row in rows}
    claves = {row.clave_inegi for row in rows}

    assert len(rows) >= 2469
    assert len(estados) == 32
    assert "99999" not in claves
    assert all(row.clave_inegi.isdigit() and len(row.clave_inegi) == 5 for row in rows)
    assert all("01" <= row.estado_id <= "32" for row in rows)


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
