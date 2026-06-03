from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.research.router import router


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_bibliography_registry_returns_fallback_corpus_without_database():
    client = _client()
    response = client.get("/research/bibliography", params={"municipio_id": "24028"})

    assert response.status_code == 200
    body = response.json()
    assert body["llm_used"] is False
    assert body["deterministic"] is True
    assert body["record_count"] >= 3
    assert any(record["institution"] == "INEGI" for record in body["records"])
    assert any(record["evidence_scope"] == "benchmark" for record in body["records"])
    assert any(record["source_table"] == "local_pdf_corpus" for record in body["records"])


def test_bibliography_registry_indexes_local_pdf_corpus_with_limits():
    client = _client()
    response = client.get("/research/bibliography", params={"municipio_id": "24028"})

    assert response.status_code == 200
    records = response.json()["records"]
    local_pdf_records = [record for record in records if record["source_table"] == "local_pdf_corpus"]
    assert len(local_pdf_records) >= 10
    assert any(record["module_id"] == "M03B" for record in local_pdf_records)
    assert any(record["module_id"] == "M18" for record in local_pdf_records)
    assert any(record["method"] == "local_pdf_inventory_pending_extraction" for record in local_pdf_records)
    assert any("No soporta afirmacion municipal directa" in " ".join(record["limitations"]) for record in local_pdf_records)


def test_bibliography_coverage_maps_modules_and_calculation_readiness():
    client = _client()
    response = client.get("/research/bibliography/coverage", params={"municipio_id": "24028"})

    assert response.status_code == 200
    coverage = response.json()["coverage"]
    assert coverage["by_module"]["M01"] >= 2
    assert "M10" in coverage["calculation_ready_modules"]
    assert "M00" in coverage["missing_modules"]


def test_bibliography_recommendations_keep_benchmark_out_of_local_truth():
    client = _client()
    response = client.get(
        "/research/bibliography/recommendations",
        params={"municipio_id": "24028", "module_id": "M01"},
    )

    assert response.status_code == 200
    recommendations = response.json()["recommendations"]
    assert recommendations
    benchmark = next(item for item in recommendations if item["tag"] == "benchmark")
    assert "no sustituye estudio local" in benchmark["explanation"].lower()
    assert "No convierte evidencia comparable" in benchmark["record"]["claim_cannot_support"]


def test_claim_ledger_exports_chicago_citation_and_limits():
    client = _client()
    response = client.get("/research/bibliography/claim-ledger", params={"municipio_id": "24028"})

    assert response.status_code == 200
    body = response.json()
    assert body["claim_count"] >= 3
    assert body["rule"].startswith("Cero cifra")
    assert all("citation" in claim for claim in body["claims"])
    assert any("Consultado el" in claim["citation"] for claim in body["claims"])
