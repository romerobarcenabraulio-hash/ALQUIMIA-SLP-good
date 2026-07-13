"""PDF intake diagnostics for ALQ-111.

This module keeps the PM brief rules executable and auditable:
- standards are catalog inputs, never tenant data;
- municipal PDFs are tenant/client evidence;
- official newspaper/DOF PDFs are initiatives and require CID-safe extraction.
"""
from __future__ import annotations

import io
import os
import re
import shutil
import subprocess
import tempfile
import uuid
from urllib.parse import unquote
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Iterable, Literal

DocumentType = Literal["norma", "dato_cliente", "iniciativa", "otro"]
PipelineStatus = Literal["ok", "failed", "pending", "not_applicable"]


def utc_now() -> str:
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
    word_count: int
    replacement_ratio: float
    suspicious: bool
    provenance: Provenance


@dataclass(frozen=True)
class OcrResult:
    text: str
    method: str
    image_count: int
    claims: list[str]
    provenance: Provenance


@dataclass(frozen=True)
class PdfInventoryRow:
    archivo: str
    tipo: DocumentType
    texto_extraible: Literal["si", "no", "parcial"]
    dato_clave: str
    modulo_destino: str
    estado: str
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
    """Raised when OCR is required but no OCR backend is available."""


def classify_pdf_path(path: str | Path) -> PdfClassification:
    raw_path = str(path)
    lower = unquote(unquote(raw_path)).lower()
    name = Path(raw_path).name
    provenance = Provenance(raw_path, utc_now(), "filename_path_rules_v1")

    official_publication = bool(
        re.search(r"(^|[\W_])dof([\W_]|$)|dof\.gob\.mx|gaceta\d+", lower)
    ) or any(
        token in lower
        for token in (
            "periodico oficial",
            "periodico_oficial",
            "periodico-oficial",
            "periódico oficial",
            "periódico_oficial",
            "periódico-oficial",
            "diario oficial",
            "diario_oficial",
            "diario-oficial",
            "gaceta oficial",
            "gaceta_oficial",
            "gaceta-oficial",
            "gaceta municipal",
            "gaceta_municipal",
            "gaceta-municipal",
            "nota_detalle",
        )
    )
    if official_publication:
        return PdfClassification(
            archivo=raw_path,
            tipo="iniciativa",
            dato_clave=_initiative_key(name),
            modulo_destino="catalogo_iniciativas / Modo B / M03B",
            estado="pendiente_extraer_claims_y_alerta",
            provenance=provenance,
        )

    if any(
        token in lower
        for token in (
            "reglamento",
            "municipal",
            "municipio",
            "licitacion",
            "licitación",
            "contrato",
            "aseo",
            "limpia",
            "contexto_slp",
            "adendos",
            "capitulo san luis",
            "bitacora",
            "bitácora",
        )
    ):
        return PdfClassification(
            archivo=raw_path,
            tipo="dato_cliente",
            dato_clave=_tenant_key(name),
            modulo_destino="M03/M03B legal municipal",
            estado="pendiente_validacion_juridica",
            provenance=provenance,
        )

    if any(token in lower for token in ("gri", "iso", "nom-", "norma", "esrs", "tcfd", "aa1000")):
        return PdfClassification(
            archivo=raw_path,
            tipo="norma",
            dato_clave=_standard_key(name),
            modulo_destino="catalogo_estandares / M18-M19",
            estado="pendiente_catalogar",
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
    upper = name.upper().replace("_", " ")
    for pattern in (r"GRI\s*\d+[A-Z-]*", r"NOM-\d+[-A-Z0-9]*", r"ISO[-\s]*\d+"):
        match = re.search(pattern, upper)
        if match:
            return match.group(0).strip()
    if "ESRS" in upper:
        return "ESRS sustainability reporting standards"
    if "TCFD" in upper:
        return "TCFD climate disclosure guidance"
    if "AA1000" in upper:
        return "AA1000 stakeholder engagement standard"
    return Path(name).stem[:90]


def _initiative_key(name: str) -> str:
    stem = Path(name).stem.replace("_", " ").replace("-", " ")
    return f"Publicacion oficial: {stem[:90]}"


def _tenant_key(name: str) -> str:
    stem = Path(name).stem.replace("_", " ").replace("-", " ")
    return f"Documento municipal/cliente: {stem[:90]}"


def assess_text_quality(text: str, *, min_chars: int = 120) -> tuple[bool, float, int]:
    stripped = (text or "").strip()
    words = re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3,}", stripped)
    if len(stripped) < min_chars:
        return True, 0.0, len(words)

    replacement_count = stripped.count("\ufffd")
    control_count = sum(1 for char in stripped if ord(char) < 32 and char not in "\n\r\t")
    replacement_ratio = (replacement_count + control_count) / max(1, len(stripped))
    alpha_count = sum(1 for char in stripped if char.isalpha())
    alpha_ratio = alpha_count / max(1, len(stripped))
    cid_markers = len(re.findall(r"\(cid:\d+\)|cidfont|identity-h", stripped, flags=re.IGNORECASE))
    lexical_diversity = len({word.lower() for word in words}) / max(1, len(words))
    suspicious = (
        replacement_ratio > 0.02
        or alpha_ratio < 0.35
        or len(words) < 30
        or cid_markers > 0
        or (len(words) >= 30 and lexical_diversity < 0.15)
    )
    return suspicious, replacement_ratio, len(words)


def extract_text_direct_from_bytes(pdf_bytes: bytes, *, source: str, max_pages: int = 10) -> DirectTextResult:
    text = ""
    method = "pdftotext"
    pdftotext = os.environ.get("PDFTOTEXT_PATH") or shutil.which("pdftotext")
    if pdftotext:
        try:
            with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
                tmp.write(pdf_bytes)
                tmp.flush()
                proc = subprocess.run(
                    [pdftotext, "-f", "1", "-l", str(max_pages), tmp.name, "-"],
                    check=True,
                    capture_output=True,
                    text=True,
                    timeout=45,
                )
                text = proc.stdout
        except Exception:
            text = ""

    if not text.strip():
        try:
            import pdfplumber

            method = "pdfplumber"
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages[:max_pages])
        except Exception:
            try:
                try:
                    from pypdf import PdfReader
                    method = "pypdf"
                except Exception:
                    from PyPDF2 import PdfReader
                    method = "PyPDF2"

                reader = PdfReader(io.BytesIO(pdf_bytes))
                text = "\n".join(reader.pages[i].extract_text() or "" for i in range(min(max_pages, len(reader.pages))))
            except Exception:
                method = "direct_extraction_failed"
                text = ""

    suspicious, replacement_ratio, word_count = assess_text_quality(text)
    return DirectTextResult(
        text=text[:50000],
        method=method,
        char_count=len(text),
        word_count=word_count,
        replacement_ratio=replacement_ratio,
        suspicious=suspicious,
        provenance=Provenance(source, utc_now(), method),
    )


def extract_text_direct_from_path(pdf_path: str | Path, *, max_pages: int = 10) -> DirectTextResult:
    path = Path(pdf_path)
    return extract_text_direct_from_bytes(path.read_bytes(), source=str(path), max_pages=max_pages)


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
    pdf_bytes: bytes,
    output_dir: str | Path,
    *,
    source: str,
    resolution: int = 150,
    max_pages: int = 3,
) -> list[Path]:
    pdftoppm = _pdftoppm_path()
    if not pdftoppm:
        raise FileNotFoundError("pdftoppm no disponible; instale poppler-utils o configure PDFTOPPM_PATH")

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
        tmp.write(pdf_bytes)
        tmp.flush()
        prefix = out_dir / f"page-{uuid.uuid4().hex}"
        cmd = [
            pdftoppm,
            "-jpeg",
            "-r",
            str(resolution),
            "-f",
            "1",
            "-l",
            str(max_pages),
            tmp.name,
            str(prefix),
        ]
        subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=60)
    return sorted(out_dir.glob(f"{prefix.name}-*.jpg"))


def rasterize_pdf_path_to_jpeg(
    pdf_path: str | Path,
    output_dir: str | Path,
    *,
    resolution: int = 150,
    max_pages: int = 3,
) -> list[Path]:
    path = Path(pdf_path)
    return rasterize_pdf_to_jpeg(
        path.read_bytes(),
        output_dir,
        source=str(path),
        resolution=resolution,
        max_pages=max_pages,
    )


def tesseract_ocr(image_paths: list[Path]) -> str:
    tesseract = os.environ.get("TESSERACT_PATH") or shutil.which("tesseract")
    if not tesseract:
        raise OcrUnavailableError("OCR requerido pero tesseract no esta disponible")

    chunks: list[str] = []
    for image_path in image_paths:
        proc = subprocess.run(
            [tesseract, str(image_path), "stdout", "-l", "spa+eng"],
            check=True,
            capture_output=True,
            text=True,
            timeout=60,
        )
        chunks.append(proc.stdout)
    return "\n".join(chunks)


def extract_claims(text: str, *, limit: int = 12) -> list[str]:
    clean = re.sub(r"\s+", " ", text or "").strip()
    if not clean:
        return []
    markers = re.compile(
        r"\b(art[ií]culo|deber[aá]|obligaci[oó]n|municipio|ayuntamiento|residuo|reglamento|norma|iniciativa|publicaci[oó]n|diario oficial|gaceta)\b",
        flags=re.IGNORECASE,
    )
    body_markers = re.compile(
        r"\b(deber[aá]|obligaci[oó]n|municipio|ayuntamiento|residuo|reglamento|norma|iniciativa|publicaci[oó]n|diario oficial|gaceta)\b",
        flags=re.IGNORECASE,
    )
    claims: list[str] = []
    pending_marker: str | None = None
    for sentence in re.split(r"(?<=[.;:])\s+", clean):
        if pending_marker:
            marker = pending_marker
            pending_marker = None
            if not body_markers.search(sentence):
                continue
            sentence = f"{marker} {sentence}".strip()
        elif len(sentence) < 25 and markers.search(sentence):
            pending_marker = sentence
            continue
        if len(sentence) < 25:
            continue
        if markers.search(sentence):
            claims.append(sentence[:280])
        if len(claims) >= limit:
            break
    return claims


def extract_with_raster_ocr_from_bytes(
    pdf_bytes: bytes,
    *,
    source: str,
    ocr_backend: Callable[[list[Path]], str] = tesseract_ocr,
    max_pages: int = 3,
) -> OcrResult:
    with tempfile.TemporaryDirectory(prefix="alquimia-pdf-ocr-") as tmp:
        images = rasterize_pdf_to_jpeg(pdf_bytes, tmp, source=source, resolution=150, max_pages=max_pages)
        if not images:
            raise OcrUnavailableError("OCR requerido pero no se generaron imagenes del PDF")
        text = ocr_backend(images)
    return OcrResult(
        text=text[:50000],
        method="pdftoppm_jpeg_150_then_ocr",
        image_count=len(images),
        claims=extract_claims(text),
        provenance=Provenance(source, utc_now(), "pdftoppm -jpeg -r 150 -> OCR -> claims"),
    )


def extract_with_raster_ocr_from_path(
    pdf_path: str | Path,
    *,
    ocr_backend: Callable[[list[Path]], str] = tesseract_ocr,
    max_pages: int = 3,
) -> OcrResult:
    path = Path(pdf_path)
    return extract_with_raster_ocr_from_bytes(
        path.read_bytes(),
        source=str(path),
        ocr_backend=ocr_backend,
        max_pages=max_pages,
    )


def extract_pdf_text_with_fallback(
    pdf_bytes: bytes,
    *,
    source: str,
    force_ocr_for_official: bool = False,
    ocr_backend: Callable[[list[Path]], str] = tesseract_ocr,
) -> tuple[str, DirectTextResult, OcrResult | None]:
    direct = extract_text_direct_from_bytes(pdf_bytes, source=source)
    needs_ocr = direct.suspicious or force_ocr_for_official
    if not needs_ocr:
        return direct.text, direct, None
    try:
        ocr = extract_with_raster_ocr_from_bytes(pdf_bytes, source=source, ocr_backend=ocr_backend)
    except (FileNotFoundError, OcrUnavailableError):
        if force_ocr_for_official and not direct.suspicious and direct.text.strip():
            return direct.text, direct, None
        raise
    if not ocr.text.strip():
        if direct.text.strip():
            return direct.text, direct, ocr
        raise OcrUnavailableError("OCR requerido pero no produjo texto")
    return ocr.text, direct, ocr


def build_inventory(paths: Iterable[str | Path]) -> list[PdfInventoryRow]:
    rows: list[PdfInventoryRow] = []
    for path_like in sorted(paths, key=lambda p: str(p).lower()):
        path = Path(path_like)
        classification = classify_pdf_path(path)
        try:
            direct = extract_text_direct_from_path(path)
        except Exception as exc:
            rows.append(
                PdfInventoryRow(
                    archivo=str(path),
                    tipo=classification.tipo,
                    texto_extraible="no",
                    dato_clave=classification.dato_clave,
                    modulo_destino=classification.modulo_destino,
                    estado="falla: extraccion directa no completada",
                    provenance=Provenance(
                        source=str(path),
                        fecha=utc_now(),
                        metodo=f"direct_extraction_failed; error={type(exc).__name__}: {exc}",
                    ),
                )
            )
            continue
        if direct.suspicious and direct.char_count == 0:
            texto_extraible: Literal["si", "no", "parcial"] = "no"
            estado = "falla: requiere OCR"
        elif direct.suspicious:
            texto_extraible = "parcial"
            estado = "parcial: requiere OCR/revision"
        else:
            texto_extraible = "si"
            estado = _inventory_status(classification.tipo)
        rows.append(
            PdfInventoryRow(
                archivo=str(path),
                tipo=classification.tipo,
                texto_extraible=texto_extraible,
                dato_clave=classification.dato_clave,
                modulo_destino=classification.modulo_destino,
                estado=estado,
                provenance=Provenance(
                    source=str(path),
                    fecha=utc_now(),
                    metodo=f"{direct.method}; chars={direct.char_count}; words={direct.word_count}; suspicious={direct.suspicious}",
                ),
            )
        )
    return rows


def _inventory_status(tipo: DocumentType) -> str:
    if tipo == "norma":
        return "texto extraido; pendiente catalogo estandares"
    if tipo == "dato_cliente":
        return "texto extraido; pendiente validacion juridica/aplicacion"
    if tipo == "iniciativa":
        return "texto extraido; pendiente catalogo iniciativas/alerta"
    return "texto extraido; pendiente clasificacion manual"


def run_pdf_scraping_checklist(
    pdf_path: str | Path,
    *,
    downloaded: bool,
    source_kind: DocumentType | None = None,
    tenant_exists: bool = False,
    ocr_backend: Callable[[list[Path]], str] = tesseract_ocr,
) -> ChecklistResult:
    steps: list[ChecklistStep] = []
    path = Path(pdf_path)
    base_source = str(path)

    def add(step: int, name: str, status: PipelineStatus, evidence: str, method: str) -> None:
        steps.append(ChecklistStep(step, name, status, evidence, Provenance(base_source, utc_now(), method)))

    if not downloaded or not path.exists():
        add(1, "descarga", "failed", "PDF no existe en almacenamiento local", "filesystem_exists_check")
        return ChecklistResult(steps, 1, "Se rompe en descarga/almacenamiento.")
    add(1, "descarga", "ok", f"PDF localizado: {path.stat().st_size} bytes", "filesystem_exists_check")

    direct = extract_text_direct_from_path(path)
    ocr_result: OcrResult | None = None
    if direct.suspicious:
        try:
            ocr_result = extract_with_raster_ocr_from_path(path, ocr_backend=ocr_backend)
            if not ocr_result.text.strip():
                raise OcrUnavailableError("OCR requerido pero no produjo texto")
            add(
                2,
                "extrae",
                "ok",
                f"Directo sospechoso; OCR produjo {len(ocr_result.text)} caracteres y {len(ocr_result.claims)} claims",
                ocr_result.provenance.metodo,
            )
        except Exception as exc:
            add(
                2,
                "extrae",
                "failed",
                f"Directo sospechoso ({direct.char_count} chars, {direct.word_count} palabras); OCR no completo: {exc}",
                "direct_extraction_then_raster_ocr",
            )
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


def inventory_rows_to_markdown(rows: list[PdfInventoryRow]) -> str:
    header = (
        "| Archivo | Tipo | ¿Texto extraíble? | Dato clave | Módulo destino | Estado | Procedencia |\n"
        "|---|---|---|---|---|---|---|"
    )
    body = [
        "| "
        + " | ".join(
            [
                f"`{_escape_md(row.archivo)}`",
                row.tipo,
                row.texto_extraible,
                _escape_md(row.dato_clave),
                _escape_md(row.modulo_destino),
                _escape_md(row.estado),
                _escape_md(f"source={row.provenance.source}; fecha={row.provenance.fecha}; metodo={row.provenance.metodo}"),
            ]
        )
        + " |"
        for row in rows
    ]
    return "\n".join([header, *body])


def _escape_md(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ")
