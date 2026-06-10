"""Scheduler for periodic web scraping tasks."""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.web_scraper import (
    ScrapedDocument, ScraperJob, ScraperLog, ScraperSource, ScraperSchedule
)
from app.web_scraper.scrapers import (
    MultiSourceScraper, classify_document, extract_text_from_pdf
)

logger = logging.getLogger(__name__)


KEYWORD_SETS = {
    "residuos": ["residuos sólidos", "RSU", "rellenos sanitarios", "composición residuos"],
    "construccion": ["residuos construcción", "RCD", "escombros", "NOM-083"],
    "regulaciones": ["NOM", "reglamento", "LGEEPA", "LGPGIR"],
}


async def scrape_and_store_documents(
    db: Session,
    source: ScraperSource,
    keywords: list[str],
    days_back: int = 7,
) -> Dict[str, Any]:
    """Scrape documents and store in database with deduplication.

    Returns dict with:
    - documentos_encontrados: total documents found
    - documentos_nuevos: new documents stored
    - documentos_duplicados: duplicates detected
    - errores: list of errors
    """

    scraper = MultiSourceScraper()
    results = {
        "documentos_encontrados": 0,
        "documentos_nuevos": 0,
        "documentos_duplicados": 0,
        "errores": [],
    }

    try:
        # Scrape documents
        docs = await scraper.scrape_specific_source(
            source.value,
            keywords,
            days_back
        )

        results["documentos_encontrados"] = len(docs)

        # Process each document
        for doc_info in docs:
            try:
                # Check for duplicate by PDF hash
                existing = db.query(ScrapedDocument).filter(
                    ScrapedDocument.pdf_hash == doc_info.pdf_hash
                ).first()

                if existing:
                    results["documentos_duplicados"] += 1
                    continue

                # Create new document
                doc = ScrapedDocument(
                    source=source,
                    titulo=doc_info.titulo,
                    descripcion=doc_info.descripcion,
                    url=doc_info.url,
                    fecha_publicacion=doc_info.fecha_publicacion,
                    contenido_text=doc_info.contenido_text,
                    pdf_hash=doc_info.pdf_hash,
                )

                # Classify document
                classification = classify_document(doc_info.titulo, doc_info.contenido_text)
                doc.ambito = classification.get("ambito")
                doc.tema = classification.get("tema")
                doc.aplicable_rsu = classification.get("aplicable_rsu", False)
                doc.aplicable_rcd = classification.get("aplicable_rcd", False)

                db.add(doc)
                results["documentos_nuevos"] += 1

            except Exception as e:
                logger.error(f"Error processing document {doc_info.titulo}: {e}")
                results["errores"].append({"documento": doc_info.titulo, "error": str(e)})

        db.commit()

    except Exception as e:
        logger.error(f"Scraping error for source {source.value}: {e}")
        results["errores"].append({"source": source.value, "error": str(e)})
        db.rollback()

    return results


async def execute_scraper_job(
    db: Session,
    job: ScraperJob,
) -> ScraperLog:
    """Execute a single scraper job and log results."""

    log = ScraperLog(
        job_id=job.id,
        estado="running",
    )
    db.add(log)
    db.commit()

    inicio = datetime.utcnow()

    try:
        # Get keywords based on job source
        keywords = []
        for keyword_set in KEYWORD_SETS.values():
            keywords.extend(keyword_set)

        # Determine days_back based on schedule
        days_back_map = {
            ScraperSchedule.daily: 1,
            ScraperSchedule.weekly: 7,
            ScraperSchedule.monthly: 30,
        }
        days_back = days_back_map.get(job.schedule, 7)

        # Execute scraping
        results = await scrape_and_store_documents(
            db,
            job.source,
            keywords,
            days_back
        )

        # Update job and log
        job.documentos_encontrados = results["documentos_encontrados"]
        job.documentos_nuevos = results["documentos_nuevos"]
        job.documentos_duplicados = results["documentos_duplicados"]
        job.ultimo_error = None
        job.intentos_fallidos = 0
        job.last_run_at = inicio
        job.ultima_ejecucion_status = "success"

        # Calculate next run time
        schedule_deltas = {
            ScraperSchedule.daily: timedelta(days=1),
            ScraperSchedule.weekly: timedelta(weeks=1),
            ScraperSchedule.monthly: timedelta(days=30),
        }
        job.next_run_at = datetime.utcnow() + schedule_deltas.get(job.schedule, timedelta(days=1))

        log.estado = "success"
        log.documentos_procesados = results["documentos_nuevos"]
        log.fin = datetime.utcnow()

        if results["errores"]:
            log.errores = results["errores"]

        logger.info(
            f"Job {job.id} ({job.source.value}) completed: "
            f"{results['documentos_nuevos']} new, "
            f"{results['documentos_duplicados']} duplicates"
        )

    except Exception as e:
        job.ultimo_error = str(e)
        job.intentos_fallidos += 1
        job.ultima_ejecucion_status = "failed"

        # Retry logic: back off if repeated failures
        if job.intentos_fallidos < 3:
            retry_delays = {1: timedelta(hours=1), 2: timedelta(hours=6)}
            job.next_run_at = datetime.utcnow() + retry_delays.get(job.intentos_fallidos, timedelta(days=1))
        else:
            # Disable job after 3 failures
            job.activo = False
            job.next_run_at = None

        log.estado = "failed"
        log.fin = datetime.utcnow()
        log.mensaje = str(e)

        logger.error(f"Job {job.id} ({job.source.value}) failed: {e}")

    db.commit()
    return log


async def process_due_jobs(db: Session) -> Dict[str, Any]:
    """Process all jobs that are due to run.

    This would typically be called by a periodic task (e.g., every 5 minutes).
    """

    now = datetime.utcnow()
    results = {
        "jobs_processed": 0,
        "jobs_successful": 0,
        "jobs_failed": 0,
    }

    # Find due jobs
    due_jobs = db.query(ScraperJob).filter(
        ScraperJob.activo == True,
        (ScraperJob.next_run_at.is_(None)) | (ScraperJob.next_run_at <= now)
    ).all()

    for job in due_jobs:
        try:
            await execute_scraper_job(db, job)
            results["jobs_processed"] += 1
            results["jobs_successful"] += 1
        except Exception as e:
            results["jobs_processed"] += 1
            results["jobs_failed"] += 1
            logger.error(f"Error executing job {job.id}: {e}")

    return results


async def initialize_scraper_jobs(db: Session) -> None:
    """Initialize default scraper jobs if they don't exist."""

    sources = [
        ScraperSource.dof,
        ScraperSource.semarnat,
        ScraperSource.cofemer,
        ScraperSource.inegi,
        ScraperSource.asf,
    ]

    for source in sources:
        existing = db.query(ScraperJob).filter(ScraperJob.source == source).first()
        if not existing:
            # Create job with daily schedule
            job = ScraperJob(
                source=source,
                schedule=ScraperSchedule.daily,
                activo=True,
                next_run_at=datetime.utcnow() + timedelta(minutes=5),
            )
            db.add(job)

    db.commit()
    logger.info("Scraper jobs initialized")


def get_scraper_status(db: Session) -> Dict[str, Any]:
    """Get overall scraper status."""

    jobs = db.query(ScraperJob).all()
    total_docs = db.query(ScrapedDocument).count()

    return {
        "total_jobs": len(jobs),
        "active_jobs": sum(1 for j in jobs if j.activo),
        "total_documents": total_docs,
        "jobs": [
            {
                "id": str(j.id),
                "source": j.source.value,
                "schedule": j.schedule.value,
                "activo": j.activo,
                "last_run_at": j.last_run_at.isoformat() if j.last_run_at else None,
                "next_run_at": j.next_run_at.isoformat() if j.next_run_at else None,
                "ultima_ejecucion_status": j.ultima_ejecucion_status,
                "documentos_nuevos": j.documentos_nuevos,
            }
            for j in jobs
        ]
    }
