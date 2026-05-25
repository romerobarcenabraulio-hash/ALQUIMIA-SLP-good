"""Tests catálogo nacional centros de acopio + operadores logísticos."""
from __future__ import annotations

from app.centros_acopio import file_store, repository
from app.centros_acopio.nacional_sync import denue_establecimiento_to_centro


def test_load_operadores_slp():
    instalaciones = file_store.load_operadores("24028")
    assert len(instalaciones) >= 2
    principal = [i for i in instalaciones if i.es_operador_principal]
    assert len(principal) >= 2
    assert any(i.tipo.value == "bodega_concesionario" for i in principal)
    assert any(i.tipo.value == "patio_concesionario" for i in principal)


def test_repository_includes_operador_principal():
    centros = repository.list_centros(clave_inegi="24028", zm="SLP")
    assert any(c.es_operador_principal for c in centros)


def test_repository_solo_operador_filter():
    centros = repository.list_centros(clave_inegi="24028", solo_operador=True)
    assert centros
    assert all(c.es_operador_principal for c in centros)


def test_coverage_manifest_loads():
    summary = file_store.coverage_summary()
    assert "manifest" in summary
    assert summary["manifest"].get("municipios")


def test_denue_mapping_scian():
    centro = denue_establecimiento_to_centro(
        {
            "id": "99",
            "nombre": "Recicla Test",
            "actividad_scian": "562112",
            "actividad_label": "Acopio",
            "municipio": "Test",
            "lat": 22.1,
            "lon": -100.9,
        },
        clave_inegi="24028",
        zm="SLP",
        estado="San Luis Potosí",
    )
    assert centro.fuente == "denue"
    assert centro.clave_inegi == "24028"
    assert centro.tipo.value == "empresa_recicladora"


def test_sync_municipio_skips_if_exists(tmp_path, monkeypatch):
    from app.centros_acopio import nacional_sync
    from app.centros_acopio import file_store

    municipios_dir = tmp_path / "municipios"
    municipios_dir.mkdir()
    manifest = tmp_path / "manifest.json"
    monkeypatch.setattr(file_store, "MUNICIPIOS_DIR", municipios_dir)
    monkeypatch.setattr(file_store, "MANIFEST_PATH", manifest)
    monkeypatch.setattr(
        file_store,
        "municipio_file",
        lambda cve: municipios_dir / f"{cve.zfill(5)}.json",
    )
    file_store.save_municipio_centros(
        "99999",
        [],
        municipio="Test",
        estado="Test",
        fuente="test",
    )
    r = nacional_sync.sync_municipio_denue("99999", force=False)
    assert r.get("skipped") is True
