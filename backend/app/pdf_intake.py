"""PDF intake helpers for standards, tenant documents, and initiatives.

The module is deterministic: it classifies documents by path/name, records
provenance, tries direct text extraction first, and only falls back to image OCR
when the extracted text is missing or suspicious.
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Literal

DocumentType = Literal["norma", "dato_cliente", "iniciativa", "otro"]
PipelineStatus = Literal["ok", "failed", "pending", "not_applicable"]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(frozen=True)
class Provenance:
    source: str
    fecha: str
    metodo: str


@dataclass(frozen=True)
class PdfClassification:
    archivo: str
    tipo: DocumentType
    dato_clave: str
    modulo_destino: str
    estado: str
    provenance: Provenance


@dataclass(frozen=True)
class DirectTextResult:
    text: str
    method: str
    char_count: int
    replacement_ratio: float
    word_count: int
    suspicious: bool
    provenance: Provenance


@dataclass(frozen=True)
class OcrResult:
    text: str
    image_count: int
    method: str
    claims: list[str]
    provenance: Provenance


@dataclass(frozen=True)
class ChecklistStep:
    step: int
    name: str
    status: PipelineStatus
    evidence: str
    provenance: Provenance


@dataclass(frozen=True)
class ChecklistResult:
    steps: list[ChecklistStep]
    broken_step: int | None
    summary: str


class OcrUnavailableError(RuntimeError):
    """Raised when OCR is required but no OCR backend is configured."""


def classify_pdf_path(path: str | Path) -> PdfClassification:
    raw_path = str(path)
    lower = raw_path.lower()
    name = Path(raw_path).name
    provenance = Provenance(source=raw_path, fecha=_now(), metodo="filename_path_rules_v1")

    if any(token in lower for token in ("gri", "iso", "nom-", "norma", "esrs", "tcfd", "aa1000")):
        return PdfClassification(
            archivo=raw_path,
            tipo="norma",
            dato_clave=_standard_key(name),
            modulo_destino="catalogo_estandares / M18-M19",
            estado="pendiente_catalogar" if "estandares internacionales" in lower else "referencia_existente",
            provenance=provenance,
        )

    if any(token in lower for token in ("periodico", "diario", "dof", "gaceta", "nota_detalle")):
        return PdfClassification(
            archivo=raw_path,
            tipo="iniciativa",
            dato_clave=_initiative_key(name),
            modulo_destino="catalogo_iniciativas / Modo B / M03B",
            estado="pendiente_extraer_claims",
            provenance=provenance,
        )

    if any(token in lower for token in ("reglamento", "licitacion", "contrato", "aseo", "limpia", "contexto_slp", "adendos")):
        return PdfClassification(
            archivo=raw_path,
            tipo="dato_cliente",
            dato_clave=_tenant_key(name),
            modulo_destino="M03/M03B legal municipal",
            estado="pendiente_validacion_juridica",
            provenance=provenance,
        )

    return PdfClassification(
        archivo=raw_path,
        tipo="otro",
        dato_clave="PDF sin clasificacion automatica",
        modulo_destino="revision_manual",
        estado="pendiente_clasificar",
        provenance=provenance,
    )


def _standard_key(name: str) -> str:
    upper = name.upper()
    for pattern in (r"GRI\s*\d+[A-Z-]*", r"NOM-\d+[-A-Z0-9]*", r"ISO[-\s]*\d+"):
        match = re.search(pattern, upper)
        if match:
            return match.group(0).replace("_", " ").strip()
    if "ESRS" in upper:
        return "ESRS sustainability reporting standards"
    if "TCFD" in upper:
        return "TCFD climate disclosure guidance"
    return Path(name).stem[:90]


def _initiative_key(name: str) -> str:
    stem = Path(name).stem.replace("_", " ").replace("-", " ")
    return f"Publicacion oficial: {stem[:90]}"


def _tenant_key(name: str) -> str:
    stem = Path(name).stem.replace("_", " ").replace("-", " ")
    return f"Documento municipal/cliente: {stem[:90]}"


def is_suspicious_text(text: str, *, min_chars: int = 120) -> tuple[bool, float, int]:
    stripped = (text or "").strip()
    if len(stripped) < min_chars:
        return True, 0.0, len(re.findall(r"\w+", stripped, flags=re.UNICODE))

    replacement_count = stripped.count("\ufffd") + stripped.count("�")
    control_count = sum(1 for char in stripped if ord(char) < 32 and char not in "\n\r\t")
    replacement_ratio = (replacement_count + control_count) / max(1, len(stripped))
    words = re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3,}", stripped)
    word_count = len(words)
    alpha_count = sum(1 for char in stripped if char.isalpha())
    alpha_ratio = alpha_count / max(1, len(stripped))
    cid_markers = len(re.findall(r"\(cid:\d+\)|cidfont|identity-h", stripped, flags=re.IGNORECASE))
    suspicious = (
        replacement_ratio > 0.02
        or alpha_ratio < 0.35
        or word_count < 30
        or cid_markers > 0
    )
    return suspicious, replacement_ratio, word_count


def extract_text_direct(pdf_path: str | Path, *, max_pages: int = 10) -> DirectTextResult:
    path = Path(pdf_path)
    text = ""
    method = "pdfplumber"
    try:
        import pdfplumber

        with pdfplumber.open(path) as pdf:
            pages = pdf.pages[:max_pages]
            text = "\n".join(page.extract_text() or "" for page in pages)
    except Exception:
        try:
            from pypdf import PdfReader

            method = "pypdf"
            reader = PdfReader(str(path))
            text = "\n".join(page.extract_text() or "" for page in reader.pages[:max_pages])
        except Exception:
            method = "direct_extraction_failed"
            text = ""

    suspicious, replacement_ratio, word_count = is_suspicious_text(text)
    return DirectTextResult(
        text=text[:50000],
        method=method,
        char_count=len(text),
        replacement_ratio=replacement_ratio,
        word_count=word_count,
        suspicious=suspicious,
        provenance=Provenance(source=str(path), fecha=_now(), metodo=method),
    )


def _pdftoppm_path() -> str | None:
    configured = os.environ.get("PDFTOPPM_PATH")
    if configured:
        return configured
    found = shutil.which("pdftoppm")
    if found:
        return found
    bundled = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pdftoppm"
    return str(bundled) if bundled.exists() else None


def rasterize_pdf_to_jpeg(
    pdf_path: str | Path,
    output_dir: str | Path,
    *,
    resolution: int = 150,
    max_pages: int = 3,
) -> list[Path]:
    pdftoppm = _pdftoppm_path()
    if not pdftoppm:
        raise FileNotFoundError("pdftoppm no disponible; instale poppler-utils o configure PDFTOPPM_PATH")

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    prefix = out_dir / "page"
    cmd = [
        pdftoppm,
        "-jpeg",
        "-r",
        str(resolution),
        "-f",
        "1",
        "-l",
        str(max_pages),
        str(pdf_path),
        str(prefix),
    ]
    subprocess.run(cmd, check=True, capture_output=True, text=True)
    return sorted(out_dir.glob("page-*.jpg"))


def tesseract_ocr(image_paths: list[Path]) -> str:
    tesseract = shutil.which("tesseract") or os.environ.get("TESSERACT_PATH")
    if not tesseract:
        raise OcrUnavailableError("OCR requerido pero tesseract no esta disponible")

    chunks: list[str] = []
    for image_path in image_paths:
        proc = subprocess.run(
            [tesseract, str(image_path), "stdout", "-l", "spa+eng"],
            check=True,
            capture_output=True,
            text=True,
        )
        chunks.append(proc.stdout)
    return "\n".join(chunks)


def extract_claims(text: str, *, limit: int = 12) -> list[str]:
    clean = re.sub(r"\s+", " ", text or "").strip()
    if not clean:
        return []
    sentences = re.split(r"(?<=[.;:])\s+", clean)
    claim_markers = re.compile(
        r"\b(art[ií]culo|deber[aá]|obligaci[oó]n|municipio|residuo|reglamento|norma|iniciativa|publica|publicaci[oó]n)\b",
        flags=re.IGNORECASE,
    )
    claims: list[str] = []
    for sentence in sentences:
        if len(sentence) < 25:
            continue
        if claim_markers.search(sentence):
            claims.append(sentence[:280])
        if len(claims) >= limit:
            break
    return claims


def extract_with_raster_ocr(
    pdf_path: str | Path,
    *,
    ocr_backend: Callable[[list[Path]], str] = tesseract_ocr,
    max_pages: int = 3,
) -> OcrResult:
    with tempfile.TemporaryDirectory(prefix="alquimia-pdf-ocr-") as tmp:
        images = rasterize_pdf_to_jpeg(pdf_path, tmp, resolution=150, max_pages=max_pages)
        text = ocr_backend(images)
    return OcrResult(
        text=text[:50000],
        image_count=len(images),
        method="pdftoppm_jpeg_150_then_ocr",
        claims=extract_claims(text),
        provenance=Provenance(source=str(pdf_path), fecha=_now(), metodo="pdftoppm -jpeg -r 150 -> OCR -> claims"),
    )


def run_pdf_scraping_checklist(
    pdf_path: str | Path,
    *,
    downloaded: bool,
    source_kind: Literal["norma", "dato_cliente", "iniciativa", "otro"] | None = None,
    tenant_exists: bool = False,
    ocr_backend: Callable[[list[Path]], str] = tesseract_ocr,
) -> ChecklistResult:
    steps: list[ChecklistStep] = []
    path = Path(pdf_path)
    base_source = str(path)

    def add(step: int, name: str, status: PipelineStatus, evidence: str, method: str) -> None:
        steps.append(ChecklistStep(step, name, status, evidence, Provenance(base_source, _now(), method)))

    if not downloaded or not path.exists():
        add(1, "descarga", "failed", "PDF no existe en almacenamiento local", "filesystem_exists_check")
        return ChecklistResult(steps, 1, "Se rompe en descarga/almacenamiento.")
    add(1, "descarga", "ok", f"PDF localizado: {path.stat().st_size} bytes", "filesystem_exists_check")

    direct = extract_text_direct(path)
    ocr_result: OcrResult | None = None
    if direct.suspicious:
        try:
            ocr_result = extract_with_raster_ocr(path, ocr_backend=ocr_backend)
            add(2, "extrae", "ok", f"Directo sospechoso; OCR produjo {len(ocr_result.text)} caracteres y {len(ocr_result.claims)} claims", ocr_result.provenance.metodo)
        except Exception as exc:
            add(2, "extrae", "failed", f"Directo sospechoso ({direct.char_count} chars, {direct.word_count} palabras); OCR no completo: {exc}", "direct_extraction_then_raster_ocr")
            return ChecklistResult(steps, 2, "Se rompe en extraccion: PDF sospechoso/CID y OCR no disponible o fallido.")
    else:
        add(2, "extrae", "ok", f"Texto directo legible: {direct.char_count} caracteres, {direct.word_count} palabras", direct.method)

    classification = classify_pdf_path(path)
    expected_type = source_kind or classification.tipo
    if classification.tipo != expected_type:
        add(3, "clasifica", "failed", f"Clasificado como {classification.tipo}, esperado {expected_type}", classification.provenance.metodo)
        return ChecklistResult(steps, 3, "Se rompe en clasificacion.")
    add(3, "clasifica", "ok", f"{classification.tipo} -> {classification.modulo_destino}", classification.provenance.metodo)

    claims = ocr_result.claims if ocr_result else extract_claims(direct.text)
    if not claims:
        add(4, "aplica", "failed", "No hay claims aplicables al modulo destino", "claims_extraction_v1")
        return ChecklistResult(steps, 4, "Se rompe en aplicacion: no hay claims que alimentar.")
    add(4, "aplica", "ok", f"{len(claims)} claims listos para {classification.modulo_destino}", "claims_extraction_v1")

    if tenant_exists and classification.tipo in {"dato_cliente", "iniciativa"}:
        add(5, "alerta", "pending", "Documento nuevo podria afectar tenant existente; falta crear/emitir alerta persistente", "tenant_impact_alert_check")
        return ChecklistResult(steps, 5, "Se rompe en alerta: impacto detectado pero no hay emision persistente.")

    add(5, "alerta", "not_applicable", "Sin tenant existente afectado o documento no requiere alerta", "tenant_impact_alert_check")
    return ChecklistResult(steps, None, "Checklist completo sin ruptura obligatoria.")
