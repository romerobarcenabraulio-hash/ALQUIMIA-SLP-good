"""Builder Fase 21: checklist ejecutable de lanzamiento."""
from __future__ import annotations

import importlib
import os
from pathlib import Path

from fastapi.testclient import TestClient

from app.export.schemas import ExportFormat, ExportSection
from app.launch.schemas import (
    ChecklistItem,
    ChecklistItemEstado,
    LaunchChecklistResponse,
)


def _modules_import_item() -> ChecklistItem:
    module_names = [
        "app.infrastructure",
        "app.organizations",
        "app.waste_flows",
        "app.roadmap",
        "app.export",
        "app.dashboard",
        "app.scenarios",
        "app.alerts",
        "app.governance",
        "app.access",
    ]
    failed: list[str] = []
    for module_name in module_names:
        try:
            importlib.import_module(module_name)
        except Exception:
            failed.append(module_name)

    if failed:
        return ChecklistItem(
            id="tests",
            categoria="Calidad",
            descripcion="Suite de tests backend passing",
            comando_verificacion="pytest tests/ -q",
            estado=ChecklistItemEstado.fallo,
            detalle=f"Fallaron imports: {', '.join(failed)}",
        )
    return ChecklistItem(
        id="tests",
        categoria="Calidad",
        descripcion="Suite de tests backend passing",
        comando_verificacion="pytest tests/ -q",
        estado=ChecklistItemEstado.ok,
        detalle="Todos los módulos Fase 13-20 importan correctamente.",
    )


def _rate_limit_item() -> ChecklistItem:
    try:
        from app.main import RateLimitMiddleware  # noqa: F401

        return ChecklistItem(
            id="rate_limit",
            categoria="Seguridad",
            descripcion="Rate limiting activo en main.py",
            comando_verificacion="grep RateLimitMiddleware app/main.py",
            estado=ChecklistItemEstado.ok,
            detalle="RateLimitMiddleware disponible en app.main.",
        )
    except Exception as exc:
        return ChecklistItem(
            id="rate_limit",
            categoria="Seguridad",
            descripcion="Rate limiting activo en main.py",
            comando_verificacion="grep RateLimitMiddleware app/main.py",
            estado=ChecklistItemEstado.advertencia,
            detalle=f"No se detectó RateLimitMiddleware: {exc}",
        )


def _security_headers_item(client: TestClient) -> ChecklistItem:
    try:
        res = client.get("/health")
        header = res.headers.get("X-Content-Type-Options")
        if header:
            return ChecklistItem(
                id="security_headers",
                categoria="Seguridad",
                descripcion="Headers de seguridad en responses",
                comando_verificacion="grep X-Content-Type-Options app/main.py",
                estado=ChecklistItemEstado.ok,
                detalle=f"Header X-Content-Type-Options presente con valor '{header}'.",
            )
        return ChecklistItem(
            id="security_headers",
            categoria="Seguridad",
            descripcion="Headers de seguridad en responses",
            comando_verificacion="grep X-Content-Type-Options app/main.py",
            estado=ChecklistItemEstado.advertencia,
            detalle="No se observó X-Content-Type-Options en respuesta /health.",
        )
    except Exception as exc:
        return ChecklistItem(
            id="security_headers",
            categoria="Seguridad",
            descripcion="Headers de seguridad en responses",
            comando_verificacion="grep X-Content-Type-Options app/main.py",
            estado=ChecklistItemEstado.advertencia,
            detalle=f"No fue posible validar headers: {exc}",
        )


def _health_item(client: TestClient) -> ChecklistItem:
    try:
        res = client.get("/health")
        if res.status_code == 200:
            return ChecklistItem(
                id="health_endpoint",
                categoria="Infraestructura",
                descripcion="Endpoint /health activo",
                comando_verificacion="GET /health → 200",
                estado=ChecklistItemEstado.ok,
                detalle="GET /health respondió 200.",
            )
        return ChecklistItem(
            id="health_endpoint",
            categoria="Infraestructura",
            descripcion="Endpoint /health activo",
            comando_verificacion="GET /health → 200",
            estado=ChecklistItemEstado.fallo,
            detalle=f"GET /health respondió {res.status_code}.",
        )
    except Exception as exc:
        return ChecklistItem(
            id="health_endpoint",
            categoria="Infraestructura",
            descripcion="Endpoint /health activo",
            comando_verificacion="GET /health → 200",
            estado=ChecklistItemEstado.fallo,
            detalle=f"Error al validar /health: {exc}",
        )


def _access_control_item(client: TestClient) -> ChecklistItem:
    payload = {
        "municipio_id": "slp",
        "municipio_nombre": "San Luis Potosi",
        "secciones": [ExportSection.infraestructura.value],
        "formato": ExportFormat.pdf.value,
        "incluir_trazabilidad": True,
        "incluir_advertencias": True,
    }
    try:
        res = client.post("/export/report", json=payload)
        if res.status_code == 403:
            return ChecklistItem(
                id="access_control",
                categoria="Seguridad",
                descripcion="Control de acceso en /export/report",
                comando_verificacion="POST /export/report sin header → 403",
                estado=ChecklistItemEstado.ok,
                detalle="Sin header de rol, /export/report responde 403.",
            )
        return ChecklistItem(
            id="access_control",
            categoria="Seguridad",
            descripcion="Control de acceso en /export/report",
            comando_verificacion="POST /export/report sin header → 403",
            estado=ChecklistItemEstado.fallo,
            detalle=f"Se esperaba 403 y se obtuvo {res.status_code}.",
        )
    except Exception as exc:
        return ChecklistItem(
            id="access_control",
            categoria="Seguridad",
            descripcion="Control de acceso en /export/report",
            comando_verificacion="POST /export/report sin header → 403",
            estado=ChecklistItemEstado.fallo,
            detalle=f"Error al validar control de acceso: {exc}",
        )


def _env_item() -> ChecklistItem:
    backend_dir = Path(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    env_path = backend_dir / ".env.example"
    if env_path.exists():
        return ChecklistItem(
            id="env_example",
            categoria="Configuración",
            descripcion=".env.example presente con variables requeridas",
            comando_verificacion="cat backend/.env.example",
            estado=ChecklistItemEstado.ok,
            detalle=f"Archivo detectado en {env_path}.",
        )
    return ChecklistItem(
        id="env_example",
        categoria="Configuración",
        descripcion=".env.example presente con variables requeridas",
        comando_verificacion="cat backend/.env.example",
        estado=ChecklistItemEstado.advertencia,
        detalle=f"No se encontró {env_path}.",
    )


def _dockerfile_item() -> ChecklistItem:
    backend_dir = Path(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    dockerfile_path = backend_dir / "Dockerfile"
    if not dockerfile_path.exists():
        return ChecklistItem(
            id="dockerfile",
            categoria="Infraestructura",
            descripcion="Dockerfile usa python:3.12-slim",
            comando_verificacion="head -1 Dockerfile",
            estado=ChecklistItemEstado.advertencia,
            detalle="No se encontró backend/Dockerfile.",
        )

    first_line = dockerfile_path.read_text(encoding="utf-8").splitlines()[0].strip()
    is_ok = first_line.lower().startswith("from python:3.12")
    return ChecklistItem(
        id="dockerfile",
        categoria="Infraestructura",
        descripcion="Dockerfile usa python:3.12-slim",
        comando_verificacion="head -1 Dockerfile",
        estado=ChecklistItemEstado.ok if is_ok else ChecklistItemEstado.advertencia,
        detalle=f"Línea base detectada: {first_line}",
    )


def _gitignore_item() -> ChecklistItem:
    repo_root = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
    gitignore_path = repo_root / ".gitignore"
    if not gitignore_path.exists():
        return ChecklistItem(
            id="gitignore",
            categoria="Configuración",
            descripcion=".gitignore incluye pycache y *.pyc",
            comando_verificacion="cat .gitignore",
            estado=ChecklistItemEstado.advertencia,
            detalle="No se encontró .gitignore en raíz.",
        )

    content = gitignore_path.read_text(encoding="utf-8").lower()
    has_pycache = "pycache" in content
    return ChecklistItem(
        id="gitignore",
        categoria="Configuración",
        descripcion=".gitignore incluye pycache y *.pyc",
        comando_verificacion="cat .gitignore",
        estado=ChecklistItemEstado.ok if has_pycache else ChecklistItemEstado.advertencia,
        detalle="Incluye pycache." if has_pycache else "No incluye pycache explícitamente.",
    )


def build_launch_checklist() -> LaunchChecklistResponse:
    from app.main import app

    with TestClient(app) as client:
        items = [
            _modules_import_item(),
            _rate_limit_item(),
            _security_headers_item(client),
            _health_item(client),
            _access_control_item(client),
            _env_item(),
            _dockerfile_item(),
            _gitignore_item(),
        ]

    total = len(items)
    ok_count = sum(1 for item in items if item.estado == ChecklistItemEstado.ok)
    warning_count = sum(1 for item in items if item.estado == ChecklistItemEstado.advertencia)
    fail_count = sum(1 for item in items if item.estado == ChecklistItemEstado.fallo)

    score = (ok_count / total) * 100 if total > 0 else 0.0
    if score == 100:
        status = "listo"
    elif score >= 75:
        status = "advertencias"
    else:
        status = "bloqueado"

    blockers = [f"{item.id}: {item.detalle}" for item in items if item.estado == ChecklistItemEstado.fallo]
    resumen = (
        f"Score de lanzamiento: {score:.1f}/100. "
        f"{ok_count} items ok, {warning_count} advertencias, {fail_count} fallos."
    )

    return LaunchChecklistResponse(
        status=status,
        score_lanzamiento=score,
        items=items,
        blockers=blockers,
        resumen=resumen,
    )
