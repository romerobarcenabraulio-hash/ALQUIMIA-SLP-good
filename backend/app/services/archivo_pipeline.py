"""ARCHIVO Pipeline · 8-step document processing engine

Core principle: Cero invención · documentos → claims → DataPoints con trazabilidad
Each step registers provenance, confidence, and methodological limits.

8-Step Process:
1. Ingestión: recibe PDF/doc, genera request_id, almacena
2. Extracción: pdfplumber → texto plano por página
3. Claims: extrae cifras, artículos, fechas via regex
4. Clasificación: asigna DataPointCategory
5. Contraste: compara vs existing DataPoints
6. Propagación: inserta DataPoints en DB, cierra DocumentGaps
7. AUDITOR: verifica confidence, documenta supuestos
8. Notificaciones: webhook frontend + pendientes
"""
from __future__ import annotations

import json
import logging
import os
import re
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.data_point import (
    DataPoint, DataPointHistory, EvidenceConflict, ModuleCompletionStatus,
    BibliographyEntry, TenantDataSnapshot
)
from app.models.document_archive import TenantDocument, DocumentGap

logger = logging.getLogger("app.archivo_pipeline")

# ─── Types ───────────────────────────────────────────────────────────────────

class ClaimType(str, Enum):
    NUMERIC = "numeric"
    REGULATION_ARTICLE = "regulation_article"
    DATE = "date"
    TEXT_STATEMENT = "text_statement"
    BOOLEAN = "boolean"


@dataclass
class ArchivoRequest:
    """Metadata for document processing request"""
    id: str
    tenant_id: str
    document_id: str
    original_filename: str
    module_id: str
    uploaded_by_user_id: str
    created_at: datetime
    status: str  # pending, processing, completed, failed


@dataclass
class ExtractedClaim:
    """Raw claim from OCR/NLP"""
    claim_type: ClaimType
    text: str
    raw_value: str
    confidence: float  # 0-100
    location: Optional[Dict[str, Any]]  # page number
    context_before: Optional[str]
    context_after: Optional[str]


@dataclass
class ClassifiedClaim:
    """Claim with assigned DataPointCategory"""
    field_key: str
    value: str
    unit: Optional[str]
    category: str  # from DataPointCategory
    source_id: str
    source_name: str
    source_institution: str
    confidence: float
    notes: Optional[str]


@dataclass
class ProcessingResult:
    """Final result of ARCHIVO pipeline"""
    request_id: str
    status: str  # success, partial, failed
    data_points_created: int
    conflicts_detected: int
    gaps_closed: List[str]
    warnings: List[str]
    errors: List[str]
    processing_duration_ms: float
    processed_at: datetime


# ─── Regex patterns for Step 3 ───────────────────────────────────────────────

# Numeric: e.g. "1,234.56 toneladas", "340 kg/día", "45%"
_RE_NUMERIC = re.compile(
    r'(?P<value>[\d]{1,3}(?:[,\.][\d]{3})*(?:[,\.][\d]+)?)\s*'
    r'(?P<unit>ton(?:eladas?)?|kg(?:/día|/día)?|litros?|Lt?|m[23]|%|habitantes?|empresas?|generadores?|pesos?|MXN)?',
    re.IGNORECASE
)

# Regulation articles: "Artículo 45", "Art. 12 bis", "Artículo 3o"
_RE_ARTICLE = re.compile(
    r'Art(?:ículo|\.)\s*(?P<num>\d+\s*(?:bis|ter|quáter)?(?:\s*[A-Z])?)',
    re.IGNORECASE
)

# Dates: "enero 2024", "01/06/2023", "2022-11-15"
_RE_DATE = re.compile(
    r'(?P<date>'
    r'\d{4}-\d{2}-\d{2}'
    r'|\d{1,2}/\d{1,2}/\d{4}'
    r'|(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+\d{4}'
    r')',
    re.IGNORECASE
)

# Unit keywords for classification
_WASTE_KEYWORDS = re.compile(
    r'residuo|basura|desecho|ton(?:elada)?|kg|reciclaje|composta|relleno\s*sanitario|recolección|generador',
    re.IGNORECASE
)
_POPULATION_KEYWORDS = re.compile(r'habitante|población|censo|vivienda', re.IGNORECASE)
_REGULATION_KEYWORDS = re.compile(r'artículo|reglamento|ley\s+|norma\s+|nom-|lgpgir|decreto', re.IGNORECASE)


# ─── Pipeline Steps ──────────────────────────────────────────────────────────

class ArchivoStep1_Ingestión:
    """Step 1: Receive document, generate request ID, store metadata"""

    @staticmethod
    def execute(
        tenant_id: str,
        document_id: str,
        original_filename: str,
        module_id: str,
        uploaded_by_user_id: str,
    ) -> ArchivoRequest:
        request = ArchivoRequest(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            document_id=document_id,
            original_filename=original_filename,
            module_id=module_id,
            uploaded_by_user_id=uploaded_by_user_id,
            created_at=datetime.now(timezone.utc),
            status="processing",
        )
        return request


class ArchivoStep2_Extracción:
    """Step 2: Extract text from PDF using pdfplumber"""

    @staticmethod
    def execute(document_path: str, document_id: str) -> Dict[str, Any]:
        """Extract text per page from PDF. Falls back gracefully if not PDF."""
        pages_text: List[Dict[str, Any]] = []
        full_text = ""
        confidence = 0.0

        if not os.path.exists(document_path):
            logger.warning(f"ARCHIVO Step2: file not found at {document_path}")
            return {
                "document_id": document_id,
                "pages": [],
                "full_text": "",
                "ocr_confidence": 0.0,
                "extracted_at": datetime.now(timezone.utc).isoformat(),
                "error": "file_not_found",
            }

        try:
            import pdfplumber

            with pdfplumber.open(document_path) as pdf:
                for i, page in enumerate(pdf.pages, start=1):
                    text = page.extract_text() or ""
                    pages_text.append({"page": i, "text": text, "chars": len(text)})
                    full_text += f"\n--- Página {i} ---\n{text}"

            total_chars = sum(p["chars"] for p in pages_text)
            # Rough confidence: if we extracted meaningful text, confidence is high
            confidence = min(95.0, 50.0 + (total_chars / 100)) if total_chars > 0 else 10.0

            logger.info(
                f"ARCHIVO Step2: {document_id} — {len(pages_text)} páginas, "
                f"{total_chars} chars, confidence={confidence:.1f}"
            )

        except Exception as e:
            logger.error(f"ARCHIVO Step2 extraction error for {document_id}: {e}")
            return {
                "document_id": document_id,
                "pages": [],
                "full_text": "",
                "ocr_confidence": 0.0,
                "extracted_at": datetime.now(timezone.utc).isoformat(),
                "error": str(e),
            }

        return {
            "document_id": document_id,
            "pages": pages_text,
            "full_text": full_text,
            "ocr_confidence": confidence,
            "extracted_at": datetime.now(timezone.utc).isoformat(),
        }


class ArchivoStep3_Claims:
    """Step 3: Extract cifras, artículos, fechas via regex"""

    @staticmethod
    def execute(extracted_text: str) -> List[ExtractedClaim]:
        """Find numeric claims, regulation articles, dates."""
        claims: List[ExtractedClaim] = []
        lines = extracted_text.splitlines()

        for line_no, line in enumerate(lines, start=1):
            stripped = line.strip()
            if not stripped:
                continue

            context_before = lines[line_no - 2].strip() if line_no >= 2 else None
            context_after = lines[line_no].strip() if line_no < len(lines) else None

            # Numeric claims — only include lines with waste/population context
            if _WASTE_KEYWORDS.search(stripped) or _POPULATION_KEYWORDS.search(stripped):
                for m in _RE_NUMERIC.finditer(stripped):
                    raw = m.group("value")
                    unit = m.group("unit")
                    if not raw or raw in ("0", ""):
                        continue
                    claims.append(ExtractedClaim(
                        claim_type=ClaimType.NUMERIC,
                        text=stripped[:200],
                        raw_value=raw,
                        confidence=75.0,
                        location={"line": line_no},
                        context_before=context_before,
                        context_after=context_after,
                    ))
                    # Limit per-line extraction
                    if len(claims) > 200:
                        break

            # Regulation articles
            if _REGULATION_KEYWORDS.search(stripped):
                for m in _RE_ARTICLE.finditer(stripped):
                    claims.append(ExtractedClaim(
                        claim_type=ClaimType.REGULATION_ARTICLE,
                        text=stripped[:200],
                        raw_value=f"Artículo {m.group('num')}",
                        confidence=85.0,
                        location={"line": line_no},
                        context_before=context_before,
                        context_after=context_after,
                    ))

            # Dates
            for m in _RE_DATE.finditer(stripped):
                claims.append(ExtractedClaim(
                    claim_type=ClaimType.DATE,
                    text=stripped[:200],
                    raw_value=m.group("date"),
                    confidence=90.0,
                    location={"line": line_no},
                    context_before=context_before,
                    context_after=context_after,
                ))

        logger.info(f"ARCHIVO Step3: {len(claims)} claims extraídos del texto")
        return claims


class ArchivoStep4_Clasificación:
    """Step 4: Assign DataPointCategory to each claim"""

    @staticmethod
    def classify_claim(
        claim: ExtractedClaim,
        document_metadata: Dict[str, Any],
        module_id: str,
    ) -> ClassifiedClaim:
        """Classify based on source origin (always client_document for uploaded docs)."""
        text = claim.text.lower()
        unit: Optional[str] = None
        field_key_suffix = uuid.uuid4().hex[:8]

        if claim.claim_type == ClaimType.NUMERIC:
            # Infer unit from context
            for kw, u in [("ton", "ton/año"), ("kg", "kg/día"), ("%", "%"),
                           ("habitante", "habitantes"), ("empresa", "empresas")]:
                if kw in text:
                    unit = u
                    break
            field_key = f"doc_{module_id}_{claim.claim_type.value}_{field_key_suffix}"
        elif claim.claim_type == ClaimType.REGULATION_ARTICLE:
            field_key = f"doc_reg_art_{field_key_suffix}"
        else:
            field_key = f"doc_{claim.claim_type.value}_{field_key_suffix}"

        return ClassifiedClaim(
            field_key=field_key,
            value=claim.raw_value,
            unit=unit,
            category="client_document",
            source_id=f"upload_{document_metadata.get('document_id', 'unknown')}",
            source_name=document_metadata.get("filename", "Documento subido"),
            source_institution=document_metadata.get("institution", ""),
            confidence=claim.confidence,
            notes=claim.text[:300] if claim.text else None,
        )


class ArchivoStep5_Contraste:
    """Step 5: Compare against existing DataPoints — stub, non-blocking"""

    @staticmethod
    def execute(
        classified_claims: List[ClassifiedClaim],
        tenant_id: str,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        # Placeholder: conflict detection deferred to future sprint
        return {"conflicts_detected": 0, "conflicts": [], "missing_context": []}


class ArchivoStep6_PropagaciónReactiva:
    """Step 6: Insert DataPoints into DB, close DocumentGaps"""

    @staticmethod
    def execute(
        db: Session,
        tenant_id: str,
        module_id: str,
        document_id: str,
        data_points_to_insert: List[DataPoint],
    ) -> List[str]:
        """Returns list of gap IDs that were closed."""
        gaps_closed: List[str] = []

        if not data_points_to_insert:
            return gaps_closed

        try:
            # Batch insert DataPoints
            db.add_all(data_points_to_insert)
            db.flush()

            # Close any DocumentGaps for this module that are still pending
            pending_gaps = (
                db.query(DocumentGap)
                .filter(
                    DocumentGap.tenant_id == tenant_id,
                    DocumentGap.module_id == module_id,
                    DocumentGap.status == "pending",
                    DocumentGap.marked_not_applicable == False,
                )
                .all()
            )
            for gap in pending_gaps:
                gap.status = "fulfilled"
                gap.fulfilled_by_document_id = document_id
                gaps_closed.append(gap.id)
                logger.info(f"ARCHIVO Step6: gap {gap.id} cerrado por documento {document_id}")

            # Upsert TenantDataSnapshot
            snapshot = (
                db.query(TenantDataSnapshot)
                .filter(TenantDataSnapshot.tenant_id == tenant_id)
                .first()
            )
            if snapshot is None:
                snapshot = TenantDataSnapshot(tenant_id=tenant_id)
                db.add(snapshot)

            snapshot.total_data_points = (snapshot.total_data_points or 0) + len(data_points_to_insert)
            snapshot.last_archivo_run = datetime.now(timezone.utc)

            # Recalculate overall_confidence as rolling average
            if data_points_to_insert:
                avg_conf = int(
                    sum(dp.confidence for dp in data_points_to_insert) / len(data_points_to_insert)
                )
                prev_total = max(1, snapshot.total_data_points - len(data_points_to_insert))
                snapshot.overall_confidence = int(
                    (snapshot.overall_confidence * prev_total + avg_conf * len(data_points_to_insert))
                    / snapshot.total_data_points
                )

            db.commit()
            logger.info(
                f"ARCHIVO Step6: {len(data_points_to_insert)} DataPoints insertados, "
                f"{len(gaps_closed)} gaps cerrados"
            )

        except Exception as e:
            db.rollback()
            logger.error(f"ARCHIVO Step6 error: {e}")
            raise

        return gaps_closed


class ArchivoStep7_AUDITOR:
    """Step 7: Quality gate"""

    @staticmethod
    def audit(
        data_points: List[DataPoint],
        minimum_confidence: float = 60.0,
    ) -> Dict[str, Any]:
        audit_results: Dict[str, Any] = {"passed": [], "warnings": [], "blocked": []}

        for dp in data_points:
            if dp.confidence < minimum_confidence:
                audit_results["warnings"].append(
                    f"DataPoint {dp.field_key}: confidence {dp.confidence}% below threshold"
                )
            else:
                audit_results["passed"].append(dp.field_key)

        return audit_results


class ArchivoStep8_Notificaciones:
    """Step 8: Log audit trail"""

    @staticmethod
    def notify(request_id: str, tenant_id: str, result: ProcessingResult) -> None:
        logger.info(
            f"ARCHIVO complete · request={request_id} tenant={tenant_id} "
            f"status={result.status} dp_created={result.data_points_created} "
            f"gaps_closed={len(result.gaps_closed)} "
            f"warnings={len(result.warnings)} duration={result.processing_duration_ms:.0f}ms"
        )


# ─── Main Pipeline ──────────────────────────────────────────────────────────

class ArchivoPipeline:
    """Master orchestrator for 8-step pipeline. Uses sync Session (not AsyncSession)."""

    @staticmethod
    def process_document(
        db: Session,
        tenant_id: str,
        document_id: str,
        original_filename: str,
        module_id: str,
        uploaded_by_user_id: str,
        document_path: str,
        institution: str = "",
    ) -> ProcessingResult:
        """Execute full 8-step pipeline synchronously."""
        start_time = datetime.now(timezone.utc)

        try:
            # Step 1: Ingestión
            request = ArchivoStep1_Ingestión.execute(
                tenant_id=tenant_id,
                document_id=document_id,
                original_filename=original_filename,
                module_id=module_id,
                uploaded_by_user_id=uploaded_by_user_id,
            )

            # Step 2: Extracción
            extracted = ArchivoStep2_Extracción.execute(
                document_path=document_path,
                document_id=document_id,
            )

            # Step 3: Claims
            raw_claims = ArchivoStep3_Claims.execute(extracted.get("full_text", ""))

            # Step 4: Clasificación
            classified_claims: List[ClassifiedClaim] = []
            for claim in raw_claims:
                classified = ArchivoStep4_Clasificación.classify_claim(
                    claim=claim,
                    document_metadata={
                        "document_id": document_id,
                        "filename": original_filename,
                        "institution": institution,
                    },
                    module_id=module_id,
                )
                classified_claims.append(classified)

            # Step 5: Contraste (non-blocking)
            contrast_result = ArchivoStep5_Contraste.execute(
                classified_claims=classified_claims,
                tenant_id=tenant_id,
                db=db,
            )

            # Build DataPoint objects
            now = datetime.now(timezone.utc)
            data_points = [
                DataPoint(
                    id=str(uuid.uuid4()),
                    tenant_id=tenant_id,
                    module_id=module_id,
                    field_key=claim.field_key,
                    category=claim.category,
                    status="estimado",
                    value=claim.value,
                    unit=claim.unit,
                    confidence=max(0, min(100, int(claim.confidence))),
                    source_id=claim.source_id,
                    source_name=claim.source_name,
                    source_institution=claim.source_institution,
                    source_url=None,
                    source_year=None,
                    retrieved_at=now,
                    method="ocr_pdf",
                    scope="municipal",
                    created_at=now,
                    updated_at=now,
                    created_by=uploaded_by_user_id,
                    notes=claim.notes,
                )
                for claim in classified_claims
            ]

            # Step 6: Propagación Reactiva
            gaps_closed = ArchivoStep6_PropagaciónReactiva.execute(
                db=db,
                tenant_id=tenant_id,
                module_id=module_id,
                document_id=document_id,
                data_points_to_insert=data_points,
            )

            # Step 7: AUDITOR
            audit_results = ArchivoStep7_AUDITOR.audit(
                data_points=data_points,
                minimum_confidence=60.0,
            )

            # Step 8: Notificaciones
            duration_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            result = ProcessingResult(
                request_id=request.id,
                status="success" if not audit_results["blocked"] else "partial",
                data_points_created=len(data_points),
                conflicts_detected=contrast_result.get("conflicts_detected", 0),
                gaps_closed=gaps_closed,
                warnings=audit_results["warnings"],
                errors=audit_results.get("blocked", []),
                processing_duration_ms=duration_ms,
                processed_at=datetime.now(timezone.utc),
            )

            ArchivoStep8_Notificaciones.notify(
                request_id=request.id,
                tenant_id=tenant_id,
                result=result,
            )

            return result

        except Exception as e:
            logger.exception(f"ARCHIVO pipeline failed for document {document_id}: {e}")
            duration_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            return ProcessingResult(
                request_id=str(uuid.uuid4()),
                status="failed",
                data_points_created=0,
                conflicts_detected=0,
                gaps_closed=[],
                warnings=[],
                errors=[str(e)],
                processing_duration_ms=duration_ms,
                processed_at=datetime.now(timezone.utc),
            )
