"""Background job scheduler for periodic tasks."""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger("app.scheduler")


class BackgroundScheduler:
    """Background job scheduler for async tasks.

    Note: This is a simple in-process scheduler. For production,
    use APScheduler with a proper backend (Redis, database, etc).
    """

    def __init__(self):
        self.running = False
        self.tasks = {}

    async def start(self):
        """Start the scheduler."""
        if self.running:
            logger.warning("Scheduler already running")
            return

        self.running = True
        logger.info("Background scheduler started")

        # Schedule periodic tasks
        await self._schedule_scraper_jobs()
        await self._schedule_residue_aggregation()

    async def stop(self):
        """Stop the scheduler."""
        self.running = False
        logger.info("Background scheduler stopped")

    async def _schedule_scraper_jobs(self):
        """Schedule web scraper jobs to run periodically."""

        while self.running:
            try:
                from app.db.session import get_sync_db
                from app.web_scraper.scheduler import process_due_jobs

                with get_sync_db() as db:
                    if db:
                        results = await process_due_jobs(db)
                        if results["jobs_processed"] > 0:
                            logger.info(
                                f"Scraper: processed {results['jobs_processed']} "
                                f"(success: {results['jobs_successful']}, "
                                f"failed: {results['jobs_failed']})"
                            )

                # Check every 5 minutes for due jobs
                await asyncio.sleep(300)

            except Exception as e:
                logger.error(f"Error in scraper scheduler: {e}")
                await asyncio.sleep(60)

    async def _schedule_residue_aggregation(self):
        """Schedule daily residue aggregation at midnight."""

        while self.running:
            try:
                from app.db.session import get_sync_db
                from app.residue_tracking.aggregator import MunicipalAggregator
                from app.models.generador import GeneratorResidueRecord

                # Calculate next midnight
                now = datetime.utcnow()
                next_midnight = (now + timedelta(days=1)).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
                sleep_seconds = (next_midnight - now).total_seconds()

                logger.info(f"Residue aggregation scheduled for {sleep_seconds} seconds")
                await asyncio.sleep(sleep_seconds)

                if not self.running:
                    break

                # Run aggregation
                with get_sync_db() as db:
                    if db:
                        # Get all municipalities with residue data
                        records = db.query(GeneratorResidueRecord).filter(
                            GeneratorResidueRecord.fecha_generacion
                            == datetime.utcnow().strftime("%Y-%m-%d")
                        ).all()

                        municipios = set(
                            (r.tenant_id, r.generador_id) for r in records
                        )

                        aggregated = 0
                        for tenant_id, generador_id in municipios:
                            # Get generador to find municipio
                            from app.models.generador import GeneradorEntity
                            gen = db.query(GeneradorEntity).filter_by(
                                id=generador_id
                            ).first()
                            if gen:
                                MunicipalAggregator.aggregate_for_date(
                                    db,
                                    str(tenant_id),
                                    gen.municipio,
                                    gen.estado_mx,
                                    datetime.utcnow().strftime("%Y-%m-%d"),
                                )
                                aggregated += 1

                        logger.info(f"Residue aggregation complete: {aggregated} municipalities")

            except Exception as e:
                logger.error(f"Error in residue aggregation: {e}")
                # Try again in 1 hour if failed
                await asyncio.sleep(3600)


# Global scheduler instance
_scheduler: Optional[BackgroundScheduler] = None


def get_scheduler() -> BackgroundScheduler:
    """Get or create the global scheduler instance."""
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundScheduler()
    return _scheduler


async def start_scheduler():
    """Start the background scheduler."""
    scheduler = get_scheduler()
    await scheduler.start()


async def stop_scheduler():
    """Stop the background scheduler."""
    scheduler = get_scheduler()
    await scheduler.stop()
