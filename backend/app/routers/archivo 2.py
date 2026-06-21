"""
Router: /api/v1/archivo

ARCHIVO: semantic document search and clustering.
Provides full-text search across regulations, guides, case studies.
"""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.archivo import ArchivoDocument, ArchivoCluster, ArchivoSearchLog
from app.routers.auth import UserInfo, get_current_user
from app.archivo.embeddings import (
    compute_tfidf_vector,
    build_corpus_idf,
    cosine_similarity,
    decode_vector,
)

router = APIRouter(prefix="/archivo", tags=["archivo"])
logger = logging.getLogger(__name__)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ArchivoDocumentDTO(BaseModel):
    id: str
    titulo: str
    descripcion: str
    source_type: str
    author_org: Optional[str] = None
    tags: List[str]
    ambito: Optional[str] = None
    url: Optional[str] = None
    url_label: Optional[str] = None
    relevance_score: Optional[float] = None
    cluster_id: Optional[str] = None


class ArchivoCusterDTO(BaseModel):
    id: str
    nombre: str
    descripcion: Optional[str] = None
    tema_principal: str
    doc_count: int


class SearchResponse(BaseModel):
    total: int
    results: List[ArchivoDocumentDTO]
    clusters: List[ArchivoCusterDTO]
    query: str


class ClustersResponse(BaseModel):
    total: int
    clusters: List[ArchivoCusterDTO]


# ─── Search helpers ───────────────────────────────────────────────────────────

def _search_documents(
    db: Session,
    query_text: str,
    ambito: Optional[str] = None,
    source_type: Optional[str] = None,
    limit: int = 20,
) -> tuple[List[ArchivoDocument], dict]:
    """Search documents using semantic similarity."""
    if db is None or not query_text.strip():
        return [], {}

    # Get all documents in DB
    q = db.query(ArchivoDocument)
    if ambito:
        q = q.filter(ArchivoDocument.ambito == ambito)
    if source_type:
        q = q.filter(ArchivoDocument.source_type == source_type)

    all_docs = q.all()
    if not all_docs:
        return [], {}

    # Build corpus IDF
    corpus_texts = [
        f"{d.titulo} {d.descripcion}".strip()
        for d in all_docs
    ]
    corpus_idf = build_corpus_idf(corpus_texts, min_freq=1)

    # Compute query vector and scores
    query_vector = compute_tfidf_vector(query_text, corpus_idf)
    results = []

    for doc in all_docs:
        doc_text = f"{doc.titulo} {doc.descripcion}".strip()
        doc_vector = compute_tfidf_vector(doc_text, corpus_idf)
        similarity = cosine_similarity(query_vector, doc_vector)

        if similarity > 0.1:  # Threshold to avoid noise
            results.append((doc, similarity))

    # Sort by similarity descending
    results.sort(key=lambda x: x[1], reverse=True)

    ranked_docs = [doc for doc, _ in results[:limit]]
    scores = {doc.id: sim for doc, sim in results[:limit]}

    return ranked_docs, scores


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/search", response_model=SearchResponse)
async def search_archivo(
    q: str = Query(..., min_length=1, max_length=300),
    ambito: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    user: Optional[UserInfo] = Depends(get_current_user) if False else None,
    db: Session = Depends(get_db),
):
    """Search across ARCHIVO document catalog."""
    results, scores = _search_documents(db, q, ambito, source_type, limit)

    # Log search
    try:
        log = ArchivoSearchLog(
            user_id=user.id if user else None,
            query=q,
            results_count=len(results),
            filters_json={
                "ambito": ambito,
                "source_type": source_type,
            },
        )
        db.add(log)
        db.commit()
    except Exception as exc:
        logger.warning("search_log_failed: %s", exc)

    # Get unique clusters from results
    cluster_ids = set(d.cluster_id for d in results if d.cluster_id)
    clusters = []
    if cluster_ids:
        clusters = db.query(ArchivoCluster).filter(ArchivoCluster.id.in_(cluster_ids)).all()

    return SearchResponse(
        total=len(results),
        query=q,
        results=[
            ArchivoDocumentDTO(
                id=d.id,
                titulo=d.titulo,
                descripcion=d.descripcion,
                source_type=d.source_type,
                author_org=d.autor,
                tags=d.tags,
                ambito=d.ambito,
                url=d.url,
                url_label=d.url_label,
                relevance_score=scores.get(d.id),
                cluster_id=d.cluster_id,
            )
            for d in results
        ],
        clusters=[
            ArchivoCusterDTO(
                id=c.id,
                nombre=c.nombre,
                descripcion=c.descripcion,
                tema_principal=c.tema_principal,
                doc_count=c.doc_count,
            )
            for c in clusters
        ],
    )


@router.get("/clusters", response_model=ClustersResponse)
async def list_clusters(
    tema: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List document clusters."""
    if db is None:
        return ClustersResponse(total=0, clusters=[])

    q = db.query(ArchivoCluster)
    if tema:
        q = q.filter(ArchivoCluster.tema_principal == tema)

    clusters = q.order_by(ArchivoCluster.doc_count.desc()).all()

    return ClustersResponse(
        total=len(clusters),
        clusters=[
            ArchivoCusterDTO(
                id=c.id,
                nombre=c.nombre,
                descripcion=c.descripcion,
                tema_principal=c.tema_principal,
                doc_count=c.doc_count,
            )
            for c in clusters
        ],
    )


@router.get("/{doc_id}", response_model=ArchivoDocumentDTO)
async def get_document(
    doc_id: str,
    db: Session = Depends(get_db),
):
    """Get a specific ARCHIVO document."""
    if db is None:
        raise Exception("Database not available")

    doc = db.query(ArchivoDocument).filter(ArchivoDocument.id == doc_id).first()
    if not doc:
        raise Exception("Document not found")

    return ArchivoDocumentDTO(
        id=doc.id,
        titulo=doc.titulo,
        descripcion=doc.descripcion,
        source_type=doc.source_type,
        author_org=doc.autor,
        tags=doc.tags,
        ambito=doc.ambito,
        url=doc.url,
        url_label=doc.url_label,
        cluster_id=doc.cluster_id,
    )
