"""Gates Auditoría multimunicipio 2026-05-07 — P0 disclaimers / interpretaciones."""
from __future__ import annotations

import pytest

from app.city.repository import baseline_for, list_city_options
from app.legal.metropolitan import build_paquete_metropolitano
from app.legal.repository import ZM_MUNICIPIOS
from app.legal.diagnostic import build_diagnostic
from app.data.schemas import DataProvenance, FuenteTipo, KPIConProvenance, SnapshotDatos


def _minimal_snapshot(zm: str, pop: float) -> SnapshotDatos:
    return SnapshotDatos(
        zm=zm,
        timestamp="2026-04-28T00:00:00+00:00",
        kpis=[
            KPIConProvenance(
                kpi_id="poblacion_total",
                kpi_label=f"Población ZM {zm}",
                valor=pop,
                unidad="habitantes",
                provenance=DataProvenance(
                    tipo=FuenteTipo.estimado,
                    fuente_nombre="Test",
                    fuente_organismo="Test",
                    confianza=0.5,
                    requiere_clave_api=False,
                ),
            ),
            KPIConProvenance(
                kpi_id="gen_percapita_kg_dia",
                kpi_label="Gen/cap",
                valor=0.90,
                unidad="kg/hab/día",
                provenance=DataProvenance(
                    tipo=FuenteTipo.estimado,
                    fuente_nombre="Test",
                    fuente_organismo="Test",
                    confianza=0.5,
                    requiere_clave_api=False,
                ),
            ),
        ],
        advertencias=[],
        score_datos=50,
        bloquea_agora=False,
    )


@pytest.fixture(autouse=True)
def reset_repo():
    import app.legal.repository as mod
    mod._repo = None
    yield
    mod._repo = None


@pytest.mark.parametrize("zm", ["SLP", "MTY", "QRO", "GDL"])
def test_disclaimer_unique_per_municipality_in_zm_paquete(zm: str) -> None:
    p = build_paquete_metropolitano(zm, ZM_MUNICIPIOS[zm])
    disclaimers = [dm.diagnostic.legal_disclaimer for dm in p.paquete_municipal]
    assert len(disclaimers) == len(ZM_MUNICIPIOS[zm])
    assert len(set(disclaimers)) == len(disclaimers)


def test_interpretation_unique_slp_mty_qro_gdl() -> None:
    snaps = {
        "SLP": _minimal_snapshot("SLP", 1_200_000),
        "MTY": _minimal_snapshot("MTY", 5_000_000),
        "QRO": _minimal_snapshot("QRO", 1_400_000),
        "GDL": _minimal_snapshot("GDL", 3_000_000),
    }
    texts = []
    for cid in ("SLP", "MTY", "QRO", "GDL"):
        b = baseline_for(cid, snaps[cid])
        assert b is not None
        texts.append(b.interpretation)
    assert len(set(texts)) == 4


def test_spg_sanctions_blocked_manifest_not_verified() -> None:
    d = build_diagnostic("spg")
    assert d is not None
    assert d.score_legal >= 50
    assert d.can_enable_sanctions is False
    assert d.sanctions_blocked_reason
    assert "manifest no verificado" in d.sanctions_blocked_reason.lower()


def test_list_city_options_hides_gdl_when_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALQUIMIA_HIDE_GDL", "1")
    opts = list_city_options()
    assert all(o.city_id != "GDL" for o in opts)
