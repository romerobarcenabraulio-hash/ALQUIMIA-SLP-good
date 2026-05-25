"""Tests cron HERMES → AURUM → KRONOS."""
from __future__ import annotations

from datetime import date
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.cron.jobs import job_logistics_daily_summary, job_weekly_status
from app.main import app


def test_job_logistics_daily_summary(tmp_path, monkeypatch):
    summary_dir = tmp_path / "daily_summary"
    summary_dir.mkdir()
    costs_dir = tmp_path / "costs"
    costs_dir.mkdir()

    monkeypatch.setattr(
        "modules.logistics.kpi_calculator.daily_summary.daily_summary_dir",
        lambda: summary_dir,
    )
    monkeypatch.setattr(
        "modules.planning.budget.kronos_publisher.costs_data_dir",
        lambda: costs_dir,
    )

    result = job_logistics_daily_summary(
        municipio_id="slp",
        fecha=date(2026, 5, 22),
        persist_db=False,
        db=None,
    )
    assert result["ok"] is True
    assert result["hermes"]["semaforo"] in {"VERDE", "AMARILLO", "ROJO"}
    assert (summary_dir / "2026-05-22.json").is_file()
    assert result["aurum"]["ac_total_mxn"] is not None


def test_job_weekly_status(tmp_path, monkeypatch):
    reports = tmp_path / "reports"
    latest = tmp_path / "weekly_status_latest.json"
    monkeypatch.setattr("app.planning.weekly_status.REPORTS_DIR", reports)
    monkeypatch.setattr("app.planning.weekly_status.LATEST_PATH", latest)

    result = job_weekly_status(municipio_id="slp", db=None)
    assert result["ok"] is True
    assert result["evm_fuente"] in {"aurum_hermes_integrado", "sintetico_fase_0_1", "evm_snapshots"}
    assert latest.is_file()


def test_cron_endpoint_requires_secret():
    client = TestClient(app)
    r = client.post("/api/v1/cron/logistics-daily-summary", json={"municipio_id": "slp"})
    assert r.status_code in {401, 503}


def test_cron_endpoint_with_secret(monkeypatch, tmp_path):
    monkeypatch.setenv("CRON_SECRET", "test-cron-secret")
    summary_dir = tmp_path / "daily_summary"
    summary_dir.mkdir()
    costs_dir = tmp_path / "costs"
    costs_dir.mkdir()
    monkeypatch.setattr(
        "modules.logistics.kpi_calculator.daily_summary.daily_summary_dir",
        lambda: summary_dir,
    )
    monkeypatch.setattr(
        "modules.planning.budget.kronos_publisher.costs_data_dir",
        lambda: costs_dir,
    )

    client = TestClient(app)
    r = client.post(
        "/api/v1/cron/logistics-daily-summary",
        json={"municipio_id": "slp", "persist_db": False},
        headers={"X-Cron-Secret": "test-cron-secret"},
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True
