"""Tests persistencia EVM — save_evm_snapshot."""
from datetime import date
from unittest.mock import MagicMock

from app.planning.budget.evm_engine import calculate_evm
from app.planning.budget.persistence import save_evm_snapshot


def test_save_evm_snapshot_adds_row():
    db = MagicMock()
    row_holder: dict = {}

    def _flush():
        row = db.add.call_args[0][0]
        row.id = 42
        row_holder["row"] = row

    db.flush.side_effect = _flush

    result = calculate_evm(bac=1_000_000, pv=500_000, ev=450_000, ac=480_000)
    snap_id = save_evm_snapshot(
        db,
        result,
        gate_id="G1",
        municipio_id="slp",
        notas="test",
        fecha=date(2026, 5, 22),
    )

    assert snap_id == 42
    row = row_holder["row"]
    assert row.gate_id == "G1"
    assert row.municipio_id == "slp"
    assert row.semaforo == "AMARILLO"
    assert row.cpi == result.cpi
    db.add.assert_called_once()
