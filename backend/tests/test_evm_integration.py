"""Tests integración EVM AURUM + HERMES."""
from pathlib import Path

import pytest

from app.planning.budget.evm_integration import derive_evm_from_aurum_hermes


def test_derive_evm_from_aurum_hermes_with_repo_fixtures():
    ac_path = Path(__file__).resolve().parents[2] / "data" / "financial" / "costs" / "ac_latest.json"
    if not ac_path.is_file():
        pytest.skip("ac_latest.json no disponible")

    block, fuente, missing, meta = derive_evm_from_aurum_hermes("slp")
    assert fuente == "aurum_hermes_integrado"
    assert block["ac"] == pytest.approx(1034.7, rel=0.01)
    assert block["cpi"] > 0
    assert block["spi"] > 0
    assert block["semaforo"] in {"VERDE", "AMARILLO", "ROJO"}
    assert meta["feeds_consumidos"] >= 1
    assert meta["aurum_fuente"] == "aurum_pipeline"
