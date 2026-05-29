"""
Fase 4 — schemas.py

Contratos para el pipeline de exportación profesional.
Separados de los contratos de ÁGORA para no contaminar el motor de contenido.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class DocumentTheme(BaseModel):
    """Tema visual e institucional del paquete documental."""
    brand_name:      str = "ALQUIMIA · paquete documental"
    municipio:       str = ""
    zm:              str = ""
    date:            str = ""
    version:         str = "0.1-borrador"
    color_primary:   str = "#3B6D11"     # Verde ALQUIMIA
    color_secondary: str = "#1A5FA8"     # Azul institucional
    typography:      str = "Times New Roman"
    footer_text:     str = "Generado por paquete documental — ALQUIMIA · Confidencial"
    logo_path:       Optional[str] = None


class RenderedAsset(BaseModel):
    """
    Archivo generado por el pipeline de exportación profesional.
    Cada asset tiene checksum, mime_type y estado verificable.
    """
    asset_id:           str = Field(default_factory=lambda: str(uuid.uuid4()))
    package_id:         str
    source_document_id: Optional[str] = None   # DraftDocument origen
    filename:           str
    format:             str                     # "docx" | "xlsx" | "pdf" | "json"
    mime_type:          str
    path:               str
    checksum:           str                     # SHA-256
    size_bytes:         int
    status:             str = "ok"              # "ok" | "bloqueado" | "error"
    warnings:           List[str] = Field(default_factory=list)
    created_at:         datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class BlockedAsset(BaseModel):
    """Archivo que no se pudo generar, con razón explícita."""
    filename: str
    format:   str
    reason:   str
    code:     str = "RENDER_BLOQUEADO"


class RenderReport(BaseModel):
    """
    Reporte del pipeline de exportación.
    Siempre existe aunque haya errores — un paquete sin render_report
    no es auditable.

    qa_status:
      "ok"      → todos los assets principales generados
      "partial" → algunos bloqueados pero ZIP tiene contenido útil
      "failed"  → sin assets utilizables
    """
    package_id:      str
    rendered_at:     datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    rendered_assets: List[RenderedAsset] = Field(default_factory=list)
    blocked_assets:  List[BlockedAsset]  = Field(default_factory=list)
    warnings:        List[str]           = Field(default_factory=list)
    errors:          List[str]           = Field(default_factory=list)
    qa_status:       str = "ok"

    def n_ok(self) -> int:
        return sum(1 for a in self.rendered_assets if a.status == "ok")

    def n_bloqueados(self) -> int:
        return len(self.blocked_assets)

    def has_docx(self) -> bool:
        return any(a.format == "docx" and a.status == "ok" for a in self.rendered_assets)

    def has_xlsx(self) -> bool:
        return any(a.format == "xlsx" and a.status == "ok" for a in self.rendered_assets)

    def has_pdf(self) -> bool:
        return any(a.format == "pdf" and a.status == "ok" for a in self.rendered_assets)


# ─── Fase 13.6: Exportación ejecutiva modelada (sin binarios) ───────────────

class ExportFormat(str, Enum):
    pdf = "pdf"
    excel = "excel"


class ExportSection(str, Enum):
    infraestructura = "infraestructura"
    macrogeneradores = "macrogeneradores"
    flujos = "flujos"
    roadmap = "roadmap"
    portal_empresarial = "portal_empresarial"


class ExportRequest(BaseModel):
    municipio_id: str
    municipio_nombre: str
    secciones: List[ExportSection]
    formato: ExportFormat
    incluir_trazabilidad: bool = True
    incluir_advertencias: bool = True


class SeccionExportada(BaseModel):
    nombre: str
    titulo: str
    resumen: str
    datos_clave: Dict[str, str]
    advertencias: List[str] = Field(default_factory=list)
    trazabilidad: Optional[str] = None


class ExportResponse(BaseModel):
    status: Literal["ready", "blocked"]
    blockers: List[str] = Field(default_factory=list)
    municipio_id: str
    formato: ExportFormat
    secciones_exportadas: List[SeccionExportada]
    metadata: Dict[str, str]


class ExecutivePdfRequest(BaseModel):
    """Payload para PDF ejecutivo desde simulador (sin paquete ÁGORA previo).

    contexto_municipal: árbol de decisión, noticias, programas y grafo causal —
    varía por municipio; el backend enriquece con diagnóstico jurídico del PDF cargado.
    """
    zm: str = "ZM"
    municipio_id: str
    municipio_nombre: str = ""
    document_id: str = "01_resumen_ejecutivo_municipal"
    resultados: Optional[Dict[str, float]] = None
    snapshot_datos: Optional[Dict[str, object]] = None
    module_label: Optional[str] = None
    contexto_municipal: Optional[Dict[str, object]] = None


class IndexPdfRequest(BaseModel):
    """Índice maestro del paquete documental (doc 00)."""
    zm: str = "ZM"
    municipio_id: str
    municipio_nombre: str = ""
    snapshot_datos: Optional[Dict[str, object]] = None


class ExpedientePdfRequest(BaseModel):
    """Acta técnica de inspección predial (doc 12)."""
    zm: str = "ZM"
    predio: Dict[str, object]
    inspeccion: Dict[str, object]
    expediente: Dict[str, object]
