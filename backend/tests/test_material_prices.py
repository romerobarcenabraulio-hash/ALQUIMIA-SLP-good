"""Tests para Material Prices Monitor."""
import pytest
from app.planning.financial_model.material_prices import (
    check_all_precios,
    check_precio_material,
    get_precio_ancla,
)


def test_precio_ancla_sin_alerta():
    r = check_precio_material("PET", 5.50)
    assert r["alerta"] is False
    assert r["desviacion_pct"] == pytest.approx(0.0, abs=0.01)


def test_precio_ancla_override():
    precio, fuente = get_precio_ancla("PET", precio_ancla_override=6.00)
    assert precio == 6.00
    assert "simulatorStore" in fuente


def test_precio_cae_mas_del_10_pct():
    r = check_precio_material("PET", 4.90)
    assert r["alerta"] is True
    assert r["desviacion_pct"] < -10


def test_precio_sube_mas_del_10_pct():
    r = check_precio_material("aluminio", 17.00)
    assert r["alerta"] is True
    assert r["desviacion_pct"] > 10


def test_impacto_mensual_negativo_cuando_precio_cae():
    r = check_precio_material("aluminio", 12.50)
    assert r["impacto_mensual_mxn"] < 0


def test_material_invalido():
    with pytest.raises(ValueError, match="no reconocido"):
        check_precio_material("cobre", 10.0)


def test_precio_no_positivo():
    with pytest.raises(ValueError, match="debe ser positivo"):
        check_precio_material("PET", 0)


def test_check_all_precios():
    resultados = check_all_precios({"PET": 5.50, "vidrio": 2.30})
    assert len(resultados) == 2
    assert all(not r["alerta"] for r in resultados)


def test_check_all_precios_omite_material_invalido():
    resultados = check_all_precios({"PET": 5.50, "cobre": 99.0})
    assert len(resultados) == 1
    assert resultados[0]["material"] == "PET"
