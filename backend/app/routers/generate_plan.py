"""
Router: POST /generate/plan
Dispara el motor ÁGORA en background y retorna progress via SSE o polling.

Fase 3C: persiste PackageRecord tras completar, expone endpoints de consulta,
manifest y descarga directa como ZIP.
"""
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import StreamingResponse, Response
from typing import Dict
import asyncio
import json
import logging
import uuid

from app.agents.agora import run_agora, PlanInput
from app.schemas.generate_plan import GeneratePlanRequest  # schema separado de auth
from app.legal.diagnostic import build_diagnostic

router = APIRouter()
logger = logging.getLogger(__name__)

# Store de trabajos en memoria (en prod: Redis)
jobs: Dict[str, dict] = {}


@router.post("/plan")
async def trigger_plan(
    request: GeneratePlanRequest,
    background_tasks: BackgroundTasks,
):
    # ── Gate jurídico — checa TODOS los municipios activos ───────────────────
    # Principio: Una ZM no es un municipio. Cada municipio tiene su propio
    # reglamento con autoridad independiente. Si cualquier municipio activo
    # tiene su fuente sin verificar, ÁGORA no puede generar documentos legales.
    from fastapi import HTTPException
    from app.legal.repository import get_repo

    # Construir lista de municipios a verificar
    municipios_a_verificar: list[str] = []
    if request.municipios_activos:
        municipios_a_verificar = [m.lower() for m in request.municipios_activos]
    else:
        # Fallback: usar los municipios de la ZM
        repo = get_repo()
        zm_upper = (request.zm or "").upper()
        municipios_a_verificar = repo.get_municipios_by_zm(zm_upper) or [(request.municipio or request.zm or "").lower()]

    bloqueados = []
    for m_id in municipios_a_verificar:
        diag = build_diagnostic(m_id)
        if diag and diag.agora_bloqueado:
            bloqueados.append({
                "municipio_id":     m_id,
                "reglamento":       diag.reglamento_nombre,
                "version":          diag.reglamento_version,
                "fuente":           diag.reglamento_fuente,
                "score_legal":      diag.score_legal,
                "brecha_critica":   diag.brecha_critica,
                "endpoint_verificar": f"PUT /legal/{m_id}/verificar",
            })

    if bloqueados:
        raise HTTPException(
            status_code=422,
            detail={
                "error":            "gate_juridico_bloqueado",
                "zm":               request.zm,
                "municipios_bloqueados": bloqueados,
                "motivo":           (
                    f"{len(bloqueados)} municipio(s) activo(s) tienen reglamentos sin fuente verificada. "
                    f"Un jurista debe validar cada fuente antes de que ÁGORA pueda generar documentos legales. "
                    f"Ver endpoints 'endpoint_verificar' para cada municipio bloqueado."
                ),
            },
        )

    # Fase 2.5: gate de datos — avisar si hay KPIs críticos sin dato o baja confianza.
    # NO bloquea (ÁGORA puede generar con advertencias), pero registra en el job.
    advertencias_datos: list[str] = []
    if request.data_provenance:
        advertencias_raw = request.data_provenance.get("advertencias", [])
        for adv in advertencias_raw:
            if adv.get("bloquea_agora"):
                advertencias_datos.append(
                    f"KPI crítico sin dato verificado: {adv.get('kpi_label', adv.get('kpi_id', '?'))} — {adv.get('advertencia', '')}"
                )
        score_datos = request.data_provenance.get("score_datos", 100)
        if score_datos < 50:
            advertencias_datos.append(
                f"Score de datos bajo ({score_datos}/100). Los documentos generados deben indicar "
                f"que los valores clave requieren validación con fuentes oficiales."
            )

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status": "pending", "progress": 0, "step": "Iniciando...", "output": None,
        "advertencias_datos": advertencias_datos,  # Fase 2.5
    }

    async def run():
        async def progress_cb(pct: int, msg: str):
            jobs[job_id]["progress"] = pct
            jobs[job_id]["step"]     = msg
            jobs[job_id]["status"]   = "running"

        try:
            plan_input = PlanInput(
                municipio=request.municipio,
                zm=request.zm,
                scenario_json=request.scenario.dict(),
                kpis_json=request.resultados_completos or request.kpis or {},
                data_provenance=request.data_provenance,  # Fase 2.5 / Fase 3
                market_summary=request.market_summary,    # Fase 5
                macro_impact_summary=request.macro_impact_summary,  # Fase 6
                reasoning_graph=request.reasoning_graph,  # Fase 7
                municipio_profiles=request.municipio_profiles,  # Fase 8
                coverage_statuses=request.coverage_statuses,  # Fase 8
                legal_sources=request.legal_sources,  # Fase 8
                operations_summary=request.operations_summary,  # Fase 9
            )
            # Fase 3: pasar lista de municipios activos al orquestador
            # para que el Director de Paquete genere un doc jurídico por municipio
            municipios_activos = (
                [m.lower() for m in request.municipios_activos]
                if request.municipios_activos
                else None
            )
            output = await run_agora(
                plan_input,
                progress_cb,
                municipios_activos=municipios_activos,
            )
            jobs[job_id]["status"]   = "completed"
            jobs[job_id]["progress"] = 100
            jobs[job_id]["output"]   = {
                "docs_drive_ids":   output.docs_drive_ids,
                "reporte_ejecutivo": output.reporte_ejecutivo,
                "plan_impl":        output.plan_impl,
            }

            # ── Fase 3C: persistir PackageRecord ─────────────────────────────
            if output.export_bundle:
                try:
                    from app.services.package_store import save_package
                    record = save_package(
                        package_id=job_id,
                        export_bundle=output.export_bundle,
                        draft_bundle=output.draft_bundle,
                    )
                    jobs[job_id]["package_id"]   = job_id
                    jobs[job_id]["checksum"]     = record.checksum
                    jobs[job_id]["n_documents"]  = record.n_documents
                    jobs[job_id]["n_defendibles"] = record.n_defendibles
                    jobs[job_id]["n_bloqueados"] = record.n_bloqueados
                    logger.info(
                        f"PackageRecord {job_id} persistido | "
                        f"{record.n_documents} docs | checksum={record.checksum[:8]}..."
                    )
                except Exception as e:
                    logger.warning(f"No se pudo persistir PackageRecord: {e}")

            logger.info(f"Job {job_id} completado")
        except Exception as e:
            logger.error(f"Job {job_id} falló: {e}")
            jobs[job_id]["status"]  = "failed"
            jobs[job_id]["error"]   = str(e)

    background_tasks.add_task(run)
    return {"job_id": job_id, "status": "started"}


@router.get("/plan/{job_id}")
async def get_plan_status(
    job_id: str,
):
    if job_id not in jobs:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job no encontrado")
    return jobs[job_id]


@router.get("/plan/{job_id}/stream")
async def stream_plan_progress(job_id: str):
    """Server-Sent Events para progreso en tiempo real."""
    async def event_generator():
        while True:
            job = jobs.get(job_id)
            if not job:
                yield f"data: {json.dumps({'error': 'Job no encontrado'})}\n\n"
                break
            yield f"data: {json.dumps({'progress': job['progress'], 'step': job['step'], 'status': job['status']})}\n\n"
            if job["status"] in ("completed", "failed"):
                break
            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ─── Fase 3C: Endpoints de recuperación, manifest y descarga ─────────────────

@router.get("/plan/{package_id}/manifest")
async def get_package_manifest(
    package_id: str,
):
    """
    Retorna el manifest.json del paquete generado.
    Incluye archivos, fuentes, KPIs, warnings y score de datos.
    """
    from fastapi import HTTPException
    from app.services.package_store import get_manifest

    manifest = get_manifest(package_id)
    if manifest is None:
        raise HTTPException(
            status_code=404,
            detail=f"Manifest no encontrado para package_id={package_id}",
        )
    return manifest


@router.get("/plan/{package_id}/download")
async def download_package(
    package_id: str,
):
    """
    Descarga el paquete documental como package.zip.
    El ZIP contiene manifest.json + todos los documentos .md/.json.
    Nunca incluye .txt.
    """
    from fastapi import HTTPException
    from app.services.package_store import get_zip_bytes, get_record

    zip_bytes = get_zip_bytes(package_id)
    if zip_bytes is None:
        raise HTTPException(
            status_code=404,
            detail=f"Paquete no disponible para descarga: package_id={package_id}",
        )

    record = get_record(package_id)
    zm     = record.zm if record else "ZM"

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="alquimia_{zm}_{package_id[:8]}.zip"',
            "X-Package-Id":  package_id,
            "X-Checksum":    record.checksum if record else "",
            "X-N-Documents": str(record.n_documents) if record else "0",
        },
    )


@router.get("/plan/{package_id}/assets")
async def get_package_assets(
    package_id: str,
):
    """
    Lista los archivos descargables del paquete.
    Si hay assets profesionales (DOCX/XLSX/PDF), los incluye.
    """
    from fastapi import HTTPException
    from app.services.package_store import get_assets, get_record
    from app.export.package_renderer import get_render_report

    record = get_record(package_id)
    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"Paquete no encontrado: package_id={package_id}",
        )

    base_assets = get_assets(package_id)
    render_report = get_render_report(package_id)

    # Assets profesionales del render (Fase 4)
    pro_assets = []
    if render_report:
        for a in render_report.get("rendered_assets", []):
            pro_assets.append({
                "asset_id":   a.get("asset_id", ""),
                "filename":   a.get("filename", ""),
                "mime_type":  a.get("mime_type", ""),
                "size_bytes": a.get("size_bytes", 0),
                "checksum":   a.get("checksum", ""),
                "status":     a.get("status", "ok"),
                "format":     a.get("format", ""),
                "type":       "professional",
            })

    base_list = [
        {
            "asset_id":   a.asset_id,
            "filename":   a.filename,
            "mime_type":  a.mime_type,
            "size_bytes": a.size_bytes,
            "checksum":   a.checksum,
            "type":       "base",
        }
        for a in base_assets
    ]

    return {
        "package_id":       package_id,
        "zm":               record.zm,
        "n_documents":      record.n_documents,
        "checksum":         record.checksum,
        "has_professional": bool(pro_assets),
        "render_report":    render_report,
        "assets":           pro_assets if pro_assets else base_list,
    }


# ─── Fase 4: Render profesional ───────────────────────────────────────────────

@router.post("/plan/{package_id}/render")
async def render_professional(
    package_id: str,
    payload: dict = {},
):
    """
    Dispara el pipeline de exportación profesional para el paquete.
    Produce DOCX × N, XLSX × 2, PDF (o PDF bloqueado con razón), render_report.json
    y professional_package.zip.

    payload (opcional):
      resultados: dict con KPIs del simulador — si se omite, celdas XLSX quedan N/D
    """
    from fastapi import HTTPException
    from app.services.package_store import get_record
    from app.export.package_renderer import render_package

    record = get_record(package_id)
    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"Paquete no encontrado: package_id={package_id}",
        )

    resultados = payload.get("resultados") if payload else None

    try:
        report = render_package(package_id, resultados=resultados)
        return {
            "ok":             True,
            "package_id":     package_id,
            "qa_status":      report.qa_status,
            "n_rendered":     report.n_ok(),
            "n_bloqueados":   report.n_bloqueados(),
            "has_docx":       report.has_docx(),
            "has_xlsx":       report.has_xlsx(),
            "has_pdf":        report.has_pdf(),
            "warnings":       report.warnings,
            "errors":         report.errors,
            "blocked_assets": [b.model_dump() for b in report.blocked_assets],
        }
    except Exception as e:
        logger.error(f"Render falló para {package_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Render falló: {e}")


@router.get("/plan/{package_id}/render-report")
async def get_render_report_endpoint(
    package_id: str,
):
    """Retorna el render_report.json del paquete profesional."""
    from fastapi import HTTPException
    from app.export.package_renderer import get_render_report

    report = get_render_report(package_id)
    if report is None:
        raise HTTPException(
            status_code=404,
            detail=f"Render report no encontrado. ¿Ya ejecutó POST /render?",
        )
    return report


@router.get("/plan/{package_id}/download-professional")
async def download_professional_package(
    package_id: str,
):
    """
    Descarga el professional_package.zip con DOCX/XLSX/PDF + manifest + render_report.
    Si no existe, sugiere ejecutar POST /render primero.
    """
    from fastapi import HTTPException
    from app.export.package_renderer import get_professional_zip_bytes
    from app.services.package_store import get_record

    zip_bytes = get_professional_zip_bytes(package_id)
    if zip_bytes is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Paquete profesional no generado para {package_id}. "
                "Ejecutar primero POST /generate/plan/{package_id}/render"
            ),
        )

    record = get_record(package_id)
    zm     = record.zm if record else "ZM"

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": (
                f'attachment; filename="alquimia_profesional_{zm}_{package_id[:8]}.zip"'
            ),
            "X-Package-Id": package_id,
            "X-Type":       "professional",
        },
    )
