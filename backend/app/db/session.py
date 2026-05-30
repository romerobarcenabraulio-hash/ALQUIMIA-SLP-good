"""
Capa de base de datos — SQLAlchemy + conexión PostgreSQL.

Diseño:
- Motor síncrono (psycopg2) compatible con FastAPI sync endpoints.
- Motor asíncrono (asyncpg) disponible para endpoints async cuando se instale asyncpg.
- `get_db()` como dependency injection para FastAPI.
- `get_sync_db()` para uso directo en scripts / tests sin DI.
- Graceful degradation: si DATABASE_URL no está disponible, retorna None
  y los endpoints que la necesitan devuelven 503.
"""
from __future__ import annotations

import logging
import os
from contextlib import contextmanager
from typing import Generator, Optional

logger = logging.getLogger(__name__)

# ── Configuración ─────────────────────────────────────────────────────────────

def _get_database_url() -> Optional[str]:
    try:
        from app.config import settings
        return settings.DATABASE_URL
    except Exception:
        return os.environ.get("DATABASE_URL", "postgresql://alquimia:alquimia@localhost:5432/alquimia")


# ── Motor SQLAlchemy (lazy init) ───────────────────────────────────────────────

_engine = None
_SessionLocal = None
_DB_AVAILABLE = False


def _init_engine() -> bool:
    global _engine, _SessionLocal, _DB_AVAILABLE
    if _DB_AVAILABLE:
        return True
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        db_url = _get_database_url()
        if not db_url:
            return False

        engine_kwargs = {"pool_pre_ping": True}
        if db_url.startswith("sqlite"):
            engine_kwargs["connect_args"] = {"check_same_thread": False}
        else:
            engine_kwargs.update({
                "pool_size": 5,
                "max_overflow": 10,
                "connect_args": {"connect_timeout": 5},
            })

        _engine = create_engine(db_url, **engine_kwargs)
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
        _DB_AVAILABLE = True
        logger.info("PostgreSQL conectado: %s", db_url.split("@")[-1])
        return True
    except Exception as exc:
        logger.warning("PostgreSQL no disponible (%s) — modo in-memory activo", exc)
        return False


def is_db_available() -> bool:
    return _DB_AVAILABLE or _init_engine()


def get_engine():
    _init_engine()
    return _engine


@contextmanager
def get_sync_db():
    """Context manager para uso directo fuera de FastAPI."""
    if not _init_engine() or _SessionLocal is None:
        yield None
        return
    db = _SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db() -> Generator:
    """FastAPI dependency — usar como Depends(get_db)."""
    if not _init_engine() or _SessionLocal is None:
        yield None
        return
    db = _SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def create_all_tables() -> bool:
    """Crea todas las tablas en la BD si no existen.

    NOTA DE PRODUCCIÓN: En entornos de producción o staging, las migraciones
    deben ejecutarse con Alembic (`alembic upgrade head` o `./db_migrate.sh`)
    ANTES de arrancar el servidor. Esta función es un fallback de desarrollo
    y no rastreará versiones de esquema.
    """
    if not _init_engine():
        return False
    try:
        from app.db.base import Base, import_all_models

        import_all_models()
        db_url = _get_database_url() or ""
        if db_url.startswith("sqlite"):
            from app.models.document_archive import DocumentGap, TenantDocument
            from app.models.user_account import (
                AccessLog,
                EmailVerificationToken,
                SmsVerificationCode,
                UserAccount,
            )

            Base.metadata.create_all(
                bind=_engine,
                tables=[
                    UserAccount.__table__,
                    EmailVerificationToken.__table__,
                    SmsVerificationCode.__table__,
                    AccessLog.__table__,
                    DocumentGap.__table__,
                    TenantDocument.__table__,
                ],
            )
            logger.info("Tablas MVP verificadas/creadas en SQLite local")
            return True

        Base.metadata.create_all(bind=_engine)
        logger.info("Tablas verificadas/creadas en PostgreSQL")
        return True
    except Exception as exc:
        logger.warning("No se pudieron crear tablas: %s", exc)
        return False
