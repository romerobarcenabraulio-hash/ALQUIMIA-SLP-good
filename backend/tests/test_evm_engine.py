"""Tests para EVM Engine — verificar set completo de métricas."""
import pytest
from app.planning.budget.evm_engine import calculate_evm, get_semaforo


def test_evm_verde_perfecto():
    result = calculate_evm(bac=100_000, pv=50_000, ev=50_000, ac=50_000)
    assert result.cpi == 1.0
    assert result.spi == 1.0
    assert result.cv == 0.0
    assert result.sv == 0.0
    assert result.semaforo == "VERDE"


def test_evm_rojo():
    result = calculate_evm(bac=100_000, pv=80_000, ev=60_000, ac=75_000)
    assert result.cpi == pytest.approx(0.8, abs=0.001)
    assert result.spi == pytest.approx(0.75, abs=0.001)
    assert result.semaforo == "ROJO"


def test_evm_amarillo():
    result = calculate_evm(bac=100_000, pv=60_000, ev=51_000, ac=56_667)
    assert result.semaforo == "AMARILLO"


def test_evm_set_completo_numericamente():
    result = calculate_evm(bac=1_000_000, pv=500_000, ev=450_000, ac=480_000)
    assert result.cpi == pytest.approx(0.9375, abs=0.0001)
    assert result.spi == pytest.approx(0.90, abs=0.0001)
    assert result.cv == pytest.approx(-30_000, abs=1)
    assert result.sv == pytest.approx(-50_000, abs=1)
    assert result.eac_likely == pytest.approx(1_066_666.67, abs=1.0)
    assert result.eac_optimistic == pytest.approx(1_030_000, abs=1)
    assert result.tcpi == pytest.approx(1.0577, abs=0.001)
    assert result.vac == pytest.approx(-66_666.67, abs=1.0)
    assert result.semaforo == "AMARILLO"


def test_evm_raises_si_ac_cero():
    with pytest.raises(ValueError, match="AC debe ser positivo"):
        calculate_evm(bac=100_000, pv=50_000, ev=40_000, ac=0)


def test_evm_raises_si_bac_cero():
    with pytest.raises(ValueError, match="BAC debe ser positivo"):
        calculate_evm(bac=0, pv=50_000, ev=40_000, ac=40_000)


def test_evm_raises_si_pv_cero():
    with pytest.raises(ValueError, match="PV debe ser positivo"):
        calculate_evm(bac=100_000, pv=0, ev=40_000, ac=40_000)


def test_evm_raises_si_ev_negativo():
    with pytest.raises(ValueError, match="EV no puede ser negativo"):
        calculate_evm(bac=100_000, pv=50_000, ev=-1, ac=40_000)


def test_semaforo_limites():
    assert get_semaforo(0.95, 0.90, 0) == "VERDE"
    assert get_semaforo(0.94, 0.90, 0) == "AMARILLO"
    assert get_semaforo(0.95, 0.89, 0) == "AMARILLO"
    assert get_semaforo(0.85, 0.80, 0) == "AMARILLO"
    assert get_semaforo(0.84, 0.80, 0) == "ROJO"
    assert get_semaforo(0.85, 0.79, 0) == "ROJO"
