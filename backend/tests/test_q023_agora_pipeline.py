"""Q-023 — pipeline ZIP ÁGORA con mock de Claude (sin red)."""

from __future__ import annotations

import io
import re
import zipfile

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.agora.pipeline as agora_pipeline
from app.agora.router import router
from app.main import app as main_app
from app.legal.agora_export_disclaimers import AGORA_EXPORT_COVER_DISCLAIMER, EXPORT_LIABILITY_WAIVER


def _word_count_es(text: str) -> int:
    return len(re.findall(r"\S+", text))


@pytest.fixture()
def mini_app():
    a = FastAPI()
    a.include_router(router, prefix="/api/v1/agora")
    return a


@pytest.fixture()
def client_mini(mini_app):
    return TestClient(mini_app)


@pytest.fixture()
def fake_markdown():
    body = ("# encabezado\n\n" + (" palabra " * 220)).strip()
    assert _word_count_es(body) >= 200
    return body


@pytest.fixture()
def fake_runner(fake_markdown):
    async def _runner(_req, _prompt: str, fname: str) -> str:
        return f"## Doc {fname}\n\n{fake_markdown}"

    return _runner


@pytest.fixture(autouse=True)
def clear_agora_runner():
    yield
    agora_pipeline.set_completion_runner(None)


def test_zip_contains_seven_files_min_words(fake_runner, client_mini):
    agora_pipeline.set_completion_runner(fake_runner)
    resp = client_mini.post(
        "/api/v1/agora/generate-plan",
        json={
            "municipio": "San Luis Potosí",
            "estado": "San Luis Potosí",
            "poblacion": 912871,
            "generacion_rsu_dia": 450.25,
            "ingreso_estimado_anual_mxn": 12_500_000.0,
            "escenario": "moderado",
            "sector_pack_id": "politica_publica_rsu_mx_v1",
        },
    )
    assert resp.status_code == 200, resp.text
    assert resp.headers.get("content-type", "").startswith("application/zip")
    disp = resp.headers.get("content-disposition", "")
    assert "attachment" in disp.lower()
    assert ".zip" in disp

    buf = io.BytesIO(resp.content)
    with zipfile.ZipFile(buf) as zf:
        names = sorted(zf.namelist())
        assert len(names) == 7
        assert names == [
            "01_marco_legal.md",
            "02_iniciativa_reforma.md",
            "03_modelo_concesion.md",
            "04_plan_implementacion.md",
            "05_benchmark_latam.md",
            "06_mapeo_stakeholders.md",
            "07_reporte_ejecutivo.md",
        ]
        for n in names:
            inner = zf.read(n).decode("utf-8")
            assert _word_count_es(inner) >= 200
            assert AGORA_EXPORT_COVER_DISCLAIMER[:40] in inner
            assert EXPORT_LIABILITY_WAIVER[:40] in inner


def test_main_app_registers_agora_route():
    routes = [getattr(r, "path", "") for r in main_app.routes]
    assert any(p == "/api/v1/agora/generate-plan" for p in routes)
