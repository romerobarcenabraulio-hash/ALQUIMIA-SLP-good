"""Tests registro de riesgos — 9 riesgos base R01–R09."""
from pathlib import Path
from unittest.mock import patch

from app.planning.risk.risk_register import load_risk_register, _BASE_RISK_DEFS


def test_base_risk_defs_count():
    assert len(_BASE_RISK_DEFS) == 9
    ids = {d["id"] for d in _BASE_RISK_DEFS}
    assert ids == {f"R{i:02d}" for i in range(1, 10)}


def test_merge_adds_missing_risks(tmp_path):
    risk_path = tmp_path / "risk_register.json"
    risk_path.write_text('{"R01": {"descripcion": "legacy", "score": 9, "status": "ROJO"}}', encoding="utf-8")
    with patch("app.planning.risk.risk_register.RISK_REGISTER_PATH", risk_path):
        register = load_risk_register()
    assert len(register) == 9
    assert register["R01"]["descripcion"] == "legacy"
    assert "R09" in register
