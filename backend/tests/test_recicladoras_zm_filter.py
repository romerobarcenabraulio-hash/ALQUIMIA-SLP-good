"""Tests filtro ZM en catálogo de compradores."""
from app.market.registry import get_all_buyers, get_buyers


def test_get_buyers_slp_prefiere_zm_specific():
    buyers = get_buyers("pet", zm="SLP")
    assert len(buyers) >= 1
    assert any(b.buyer_id == "slp-pet-ecooro" for b in buyers)
    assert all(b.zm_simulator_id in (None, "SLP") or b.buyer_id.startswith("slp-") for b in buyers if b.zm_simulator_id)


def test_get_buyers_mty_distinto_slp():
    mty = get_buyers("pet", zm="MTY")
    slp = get_buyers("pet", zm="SLP")
    mty_ids = {b.buyer_id for b in mty}
    slp_ids = {b.buyer_id for b in slp}
    assert "mty-pet-alpek" in mty_ids
    assert "slp-pet-ecooro" in slp_ids
    assert mty_ids.isdisjoint({"slp-pet-ecooro"})


def test_get_all_buyers_qro_no_vacio():
    buyers = get_all_buyers(zm="QRO")
    assert len(buyers) >= 1
