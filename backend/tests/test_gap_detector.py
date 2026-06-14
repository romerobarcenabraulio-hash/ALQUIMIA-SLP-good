"""§5 GapDetector — nightly canonical document gap detection."""
from __future__ import annotations

import uuid

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.tenant_isolation import install_tenant_filter
from app.models.document_archive import DocumentGap, TenantDocument
from app.services.gap_detector import (
    CANONICAL_DOCS,
    run_gap_detector,
    scan_tenant,
)


@pytest.fixture(scope="module")
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine, tables=[TenantDocument.__table__, DocumentGap.__table__])
    Session = sessionmaker(bind=engine)
    install_tenant_filter(Session)
    db = Session()
    yield db
    db.close()


def _tid() -> str:
    return str(uuid.uuid4())


def test_canonical_docs_cover_all_gates():
    gates = {c["required_for_gate"] for c in CANONICAL_DOCS}
    assert "G1" in gates and "G2" in gates and "G3" in gates
    assert len(CANONICAL_DOCS) >= 10


def test_scan_tenant_creates_gaps_for_empty_tenant(db_session):
    tid = _tid()
    result = scan_tenant(tid, db_session)
    assert result["gaps_created"] == len(CANONICAL_DOCS)
    gaps = db_session.query(DocumentGap).filter(DocumentGap.tenant_id == tid).all()
    assert len(gaps) == len(CANONICAL_DOCS)
    assert all(g.status == "pending" for g in gaps)
    assert all(g.detection_method == "gap_detector_nightly" for g in gaps)


def test_scan_tenant_idempotent(db_session):
    tid = _tid()
    scan_tenant(tid, db_session)
    result2 = scan_tenant(tid, db_session)
    assert result2["gaps_created"] == 0  # already open, not duplicated


def test_scan_tenant_skips_uploaded_document(db_session):
    tid = _tid()
    first_canon = CANONICAL_DOCS[0]
    db_session.add(
        TenantDocument(
            id=str(uuid.uuid4()),
            tenant_id=tid,
            module_id=first_canon["module_id"],
            document_type=first_canon["document_type"],
            original_filename="reglamento.pdf",
            mime_type="application/pdf",
            file_size_bytes=1000,
            storage_path_or_url="/tmp/reglamento.pdf",
            upload_status="processed",
        )
    )
    db_session.commit()
    result = scan_tenant(tid, db_session)
    assert result["gaps_created"] == len(CANONICAL_DOCS) - 1


def test_scan_tenant_graceful_without_db():
    result = scan_tenant("any-tenant", None)
    assert result["skipped"] is True


def test_run_gap_detector_graceful_without_db():
    result = run_gap_detector(None)
    assert result["skipped"] is True
