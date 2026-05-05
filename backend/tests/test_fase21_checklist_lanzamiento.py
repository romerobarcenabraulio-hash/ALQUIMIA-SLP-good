from fastapi.testclient import TestClient

from app.launch.checklist import build_launch_checklist
from app.main import app


def test_checklist_retorna_8_items():
    result = build_launch_checklist()
    assert len(result.items) == 8


def test_tests_item_estado_ok():
    result = build_launch_checklist()
    item = next(i for i in result.items if i.id == "tests")
    assert item.estado == "ok"


def test_health_item_estado_ok():
    result = build_launch_checklist()
    item = next(i for i in result.items if i.id == "health_endpoint")
    assert item.estado == "ok"


def test_access_control_item_estado_ok():
    result = build_launch_checklist()
    item = next(i for i in result.items if i.id == "access_control")
    assert item.estado == "ok"


def test_score_mayor_75():
    result = build_launch_checklist()
    assert result.score_lanzamiento >= 75.0


def test_endpoint_200():
    client = TestClient(app)
    response = client.get("/launch/checklist")
    assert response.status_code == 200
    assert "score_lanzamiento" in response.json()
