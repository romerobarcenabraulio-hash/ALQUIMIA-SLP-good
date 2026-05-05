from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

from app.routers.auth import get_current_user, UserInfo

router = APIRouter()
logger = logging.getLogger(__name__)

class Documento(BaseModel):
    id:           str
    nombre:       str
    tipo:         str
    estado:       str        # borrador | revision | defendible | bloqueado | publicado | aprobado
    fecha:        str
    zm:           str
    drive_id:     Optional[str] = None
    url_pub:      Optional[str] = None
    # Fase 3B: metadata documental
    document_id:  Optional[str] = None   # canonical document_id del paquete
    version:      Optional[str] = None
    source:       Optional[str] = None   # "llm" | "template" | "bloqueado"
    warnings:     Optional[list] = None
    municipios:   Optional[list] = None

# Store en memoria (en prod: PostgreSQL)
_docs: List[Documento] = [
    Documento(id="1", nombre="Diagnóstico Reglamento Vigente SLP", tipo="Marco Legal",
              estado="publicado", fecha="2025-01-15", zm="SLP", url_pub="/municipio/slp/public"),
    Documento(id="2", nombre="Modelo CFO San Luis Potosí", tipo="Modelo Financiero",
              estado="publicado", fecha="2025-01-10", zm="SLP"),
    Documento(id="3", nombre="Iniciativa de Reforma SLP", tipo="Marco Legal",
              estado="aprobado", fecha="2025-02-01", zm="SLP"),
]


@router.get("/docs/{zm}", response_model=List[Documento])
async def list_docs(zm: str, _user: UserInfo = Depends(get_current_user)):
    return [d for d in _docs if d.zm == zm.upper()]


@router.put("/docs/{doc_id}/estado")
async def update_estado(
    doc_id: str,
    estado: str,
    _user: UserInfo = Depends(get_current_user),
):
    doc = next((d for d in _docs if d.id == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if _user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo admin puede aprobar documentos")
    doc.estado = estado
    return {"ok": True, "doc_id": doc_id, "estado": estado}


@router.post("/docs")
async def create_doc(doc: Documento, _user: UserInfo = Depends(get_current_user)):
    _docs.append(doc)
    return {"ok": True, "id": doc.id}


@router.post("/docs/export-bundle")
async def register_export_bundle(
    payload: dict,
    _user: UserInfo = Depends(get_current_user),
):
    """
    Registra un ExportBundle en el Hub.
    El frontend o el job de generate/plan llama este endpoint
    para que el Hub pueda mostrar estado, warnings y fuentes.
    """
    import uuid
    from datetime import date

    zm       = payload.get("zm", "?")
    docs_in  = payload.get("documents", [])
    warnings = payload.get("warnings", [])
    version  = payload.get("version", "0.1-borrador")
    today    = str(date.today())

    registrados = []
    for d in docs_in:
        doc_id = str(uuid.uuid4())
        _docs.append(Documento(
            id=doc_id,
            nombre=d.get("filename", d.get("document_id", "?")),
            tipo=d.get("format", "md").upper(),
            estado=d.get("status", "borrador"),
            fecha=today,
            zm=zm.upper(),
            document_id=d.get("document_id"),
            version=version,
            source=d.get("source"),
            warnings=d.get("warnings", []),
        ))
        registrados.append(doc_id)

    return {
        "ok": True,
        "registrados": len(registrados),
        "ids": registrados,
        "warnings_activos": len(warnings),
    }


@router.get("/docs/{zm}/estado-documental")
async def estado_documental(zm: str, _user: UserInfo = Depends(get_current_user)):
    """
    Resumen del estado documental de una ZM:
    cuántos documentos hay por estado (borrador/revision/defendible/bloqueado).
    """
    docs_zm = [d for d in _docs if d.zm == zm.upper()]
    resumen: dict[str, int] = {}
    for d in docs_zm:
        resumen[d.estado] = resumen.get(d.estado, 0) + 1
    return {
        "zm": zm.upper(),
        "total": len(docs_zm),
        "por_estado": resumen,
        "documentos": [
            {
                "id": d.id,
                "nombre": d.nombre,
                "estado": d.estado,
                "document_id": d.document_id,
                "version": d.version,
                "source": d.source,
                "warnings": d.warnings or [],
            }
            for d in docs_zm
        ],
    }
