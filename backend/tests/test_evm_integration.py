"""Tests integración EVM AURUM + HERMES."""
import datetime as _dt
import json
from pathlib import Path

import pytest

from app.planning.budget.evm_integration import derive_evm_from_aurum_hermes


class _FrozenDate(_dt.date):
    """Congela hoy a la fecha de los fixtures HERMES para que la ventana de
    14 días siempre los incluya, sin depender de la fecha real de ejecución."""

    @classmethod
    def today(cls):
        return _dt.date(2026, 5, 25)


def test_derive_evm_from_aurum_hermes_with_repo_fixtures(monkeypatch):
    import modules.planning.budget.hermes_consumer as _hc
    monkeypatch.setattr(_hc, "date", _FrozenDate)

    ac_path = Path(__file__).resolve().parents[2] / "data" / "financial" / "costs" / "ac_latest.json"
    if not ac_path.is_file():
        pytest.skip("ac_latest.json no disponible")

    block, fuente, missing, meta = derive_evm_from_aurum_hermes("slp")
    assert fuente == "aurum_hermes_integrado"
    expected_ac = float(json.loads(ac_path.read_text())["ac_total_mxn"])
    assert block["ac"] == pytest.approx(expected_ac, rel=0.01)
    assert block["cpi"] > 0
    assert block["spi"] > 0
    assert block["semaforo"] in {"VERDE", "AMARILLO", "ROJO"}
    assert meta["feeds_consumidos"] >= 1
    assert meta["aurum_fuente"] == "aurum_pipeline"
