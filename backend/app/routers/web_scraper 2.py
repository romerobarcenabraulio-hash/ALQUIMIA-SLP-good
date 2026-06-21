from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime
from uuid import UUID
from typing import Optional

from app.db.session import get_db
from app.db.security import current_user
from app.models.user_account import User
from app.models.web_scraper import (
    ScrapedDocument, ScraperJob, ScraperLog, ScraperSource
)
from app.web_scraper.scheduler import (
    execute_scraper_job, process_due_jobs, initialize_scraper_jobs, get_scraper_status
)
from app.rate_limiter import get_client_ip, check_rate_limit, public_documents_limiter

router = APIRouter()


# ─── Public Endpoints (no auth required) ──────────────────────────────────────


@router.get("/documents/scraped")
async def list_scraped_documents(
    request: Request,
    source: Optional[str] = Query(None),
    tema: Optional[str] = Query(None),
    ambito: Optional[str] = Query(None),
    aplicable_rsu: Optional[bool] = Query(None),
    aplicable_rcd: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> dict:
    """List scraped documents with optional filters."""

    # Rate limiting for public endpoint
    client_ip = get_client_ip(request)
    allowed, remaining = check_rate_limit(public_documents_limiter, client_ip, "documents/scraped")

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 300 requests per minute per IP.",
            headers={"Retry-After": "60"},
        )

    query = db.query(ScrapedDocument).filter(ScrapedDocument.activo == True)

    if source:
        query = query.filter(ScrapedDocument.source == source)
    if tema:
        query = query.filter(ScrapedDocument.tema == tema)
    if ambito:
        query = query.filter(ScrapedDocument.ambito == ambito)
    if aplicable_rsu:
        query = query.filter(ScrapedDocument.aplicable_rsu == aplicable_rsu)
    if aplicable_rcd:
        query = query.filter(ScrapedDocument.aplicable_rcd == aplicable_rcd)

    total = query.count()
    docs = query.order_by(desc(ScrapedDocument.fecha_publicacion)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "documents": [
            {
                "id": str(d.id),
                "titulo": d.titulo,
                "source": d.source.value,
                "tema": d.tema,
                "ambito": d.ambito,
                "aplicable_rsu": d.aplicable_rsu,
                "aplicable_rcd": d.aplicable_rcd,
                "fecha_publicacion": d.fecha_publicacion,
                "url": d.url,
                "procesado": d.procesado,
                "indexado": d.indexado,
            }
            for d in docs
        ],
    }


@router.get("/documents/scraped/{doc_id}")
async def get_scraped_document(
    doc_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Get full details of a scraped document."""

    try:
        did = UUID(doc_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    doc = db.query(ScrapedDocument).filter(ScrapedDocument.id == did).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "id": str(doc.id),
        "titulo": doc.titulo,
        "descripcion": doc.descripcion,
        "source": doc.source.value,
        "url": doc.url,
        "fecha_publicacion": doc.fecha_publicacion,
        "tema": doc.tema,
        "ambito": doc.ambito,
        "aplicable_rsu": doc.aplicable_rsu,
        "aplicable_rcd": doc.aplicable_rcd,
        "contenido_text": doc.contenido_text[:5000] if doc.contenido_text else None,  # First 5000 chars
        "palabras_clave": doc.palabras_clave,
        "procesado": doc.procesado,
        "extraido_text": doc.extraido_text,
        "indexado": doc.indexado,
        "created_at": doc.created_at.isoformat(),
    }


# ─── Admin Endpoints (require auth) ──────────────────────────────────────────


@router.get("/scraper/status")
async def get_scraper_status_endpoint(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Get scraper job status and statistics.

    Only accessible to admins.
    """
    if user.rol not in ["admin", "analista"]:
        raise HTTPException(status_code=403, detail="Access denied")

    status = get_scraper_status(db)
    return status


@router.post("/scraper/jobs/{source}/trigger")
async def trigger_scraper_job(
    source: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Manually trigger a scraper job for a specific source.

    Only accessible to admins.
    """
    if user.rol not in ["admin", "analista"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Find or create job
    job = db.query(ScraperJob).filter(ScraperJob.source == source).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Execute job
    try:
        import asyncio
        log = asyncio.run(execute_scraper_job(db, job))

        return {
            "job_id": str(job.id),
            "log_id": str(log.id),
            "estado": log.estado,
            "documentos_procesados": log.documentos_procesados,
            "duracion_segundos": (log.fin - log.inicio).total_seconds() if log.fin else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scraper/process-due-jobs")
async def process_due_jobs_endpoint(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Process all jobs that are due to run.

    This is typically called by a periodic task, but can be triggered manually.
    Only accessible to admins.
    """
    if user.rol not in ["admin", "analista"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        import asyncio
        results = asyncio.run(process_due_jobs(db))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scraper/jobs")
async def list_scraper_jobs(
    source: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """List scraper jobs.

    Only accessible to admins.
    """
    if user.rol not in ["admin", "analista"]:
        raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(ScraperJob)

    if source:
        query = query.filter(ScraperJob.source == source)

    total = query.count()
    jobs = query.order_by(desc(ScraperJob.updated_at)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "jobs": [
            {
                "id": str(j.id),
                "source": j.source.value,
                "schedule": j.schedule.value,
                "activo": j.activo,
                "last_run_at": j.last_run_at.isoformat() if j.last_run_at else None,
                "next_run_at": j.next_run_at.isoformat() if j.next_run_at else None,
                "ultima_ejecucion_status": j.ultima_ejecucion_status,
                "documentos_encontrados": j.documentos_encontrados,
                "documentos_nuevos": j.documentos_nuevos,
                "documentos_duplicados": j.documentos_duplicados,
                "intentos_fallidos": j.intentos_fallidos,
                "ultimo_error": j.ultimo_error,
            }
            for j in jobs
        ],
    }


@router.get("/scraper/jobs/{job_id}/logs")
async def get_job_logs(
    job_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Get logs for a specific scraper job.

    Only accessible to admins.
    """
    if user.rol not in ["admin", "analista"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        jid = UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    query = db.query(ScraperLog).filter(ScraperLog.job_id == jid)
    total = query.count()
    logs = query.order_by(desc(ScraperLog.inicio)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "logs": [
            {
                "id": str(l.id),
                "estado": l.estado,
                "inicio": l.inicio.isoformat(),
                "fin": l.fin.isoformat() if l.fin else None,
                "duracion_segundos": (l.fin - l.inicio).total_seconds() if l.fin else None,
                "documentos_procesados": l.documentos_procesados,
                "errores": l.errores,
            }
            for l in logs
        ],
    }


@router.post("/scraper/init-jobs")
async def init_jobs_endpoint(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Initialize default scraper jobs.

    Only accessible to admins. Safe to call multiple times (only creates missing jobs).
    """
    if user.rol not in ["admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    await initialize_scraper_jobs(db)
    return {"status": "initialized"}
