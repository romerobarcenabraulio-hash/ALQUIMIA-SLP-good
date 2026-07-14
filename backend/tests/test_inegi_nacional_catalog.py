"""Tests catálogo INEGI nacional y registro dinámico municipal."""
from __future__ import annotations

from app.city import inegi_catalog
from app.city.inegi_catalog import fetch_municipios_inegi, list_estados_completos, zm_for_estado
from app.legal.dynamic_municipio import ensure_municipio_registered
from app.legal.repository import get_repo


def test_list_estados_completos_32():
    estados = list_estados_completos()
    assert len(estados) == 32
    assert ("24", "San Luis Potosí") in estados


def test_fetch_municipios_slp_via_inegi(monkeypatch):
    inegi_catalog._municipios_cache.clear()

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "datos": [
                    {
                        "cvegeo": "240280001",
                        "cve_ent": "24",
                        "nomgeo": "San Luis Potosí",
                        "pob_total": "912871",
                    },
                    {
                        "cvegeo": "240310001",
                        "cve_ent": "24",
                        "nomgeo": "Soledad de Graciano Sánchez",
                        "pob_total": "323409",
                    },
                ]
            }

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return None

        def get(self, url):
            return FakeResponse()

    monkeypatch.setattr(inegi_catalog.httpx, "Client", FakeClient)

    rows = fetch_municipios_inegi("24")
    assert len(rows) == 2
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
