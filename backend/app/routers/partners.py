"""
Router: /api/v1/partners

Partner ecosystem: recyclers, buyers, processors per ZM.
Sprint 46-48.
"""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.partner import PartnerOrganization, TenantPartnerLink
from app.routers.auth import UserInfo, get_current_user

router = APIRouter(prefix="/partners", tags=["partners"])
logger = logging.getLogger(__name__)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class PartnerDTO(BaseModel):
    id: str
    nombre: str
    nombre_corto: Optional[str] = None
    tipo: str
    zm: str
    estado_mx: str
    municipio: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    materiales: List[str]
    capacidad_ton_mes: Optional[float] = None
    precio_compra_json: dict
    contacto_nombre: Optional[str] = None
    contacto_email: Optional[str] = None
    contacto_telefono: Optional[str] = None
    url: Optional[str] = None
    certificaciones: List[str]
    activo: bool
    fuente: str


class PartnerCreate(BaseModel):
    nombre: str
    nombre_corto: Optional[str] = None
    tipo: str
    zm: str
    estado_mx: str
    municipio: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    materiales: List[str] = []
    capacidad_ton_mes: Optional[float] = None
    precio_compra_json: dict = {}
    contacto_nombre: Optional[str] = None
    contacto_email: Optional[str] = None
    contacto_telefono: Optional[str] = None
    url: Optional[str] = None
    certificaciones: List[str] = []
    fuente: str = "manual"


class LinkCreate(BaseModel):
    partner_id: str
    estatus: str = "identificado"
    material: Optional[str] = None
    precio_acordado_ton: Optional[float] = None
    volumen_acordado_ton_mes: Optional[float] = None
    notas: Optional[str] = None


class LinkDTO(BaseModel):
    id: str
    tenant_id: str
    partner_id: str
    partner_nombre: Optional[str] = None
    estatus: str
    material: Optional[str] = None
    precio_acordado_ton: Optional[float] = None
    volumen_acordado_ton_mes: Optional[float] = None
    notas: Optional[str] = None


# ─── Seed data (SLP ZM) ───────────────────────────────────────────────────────

_SLP_SEED = [
    {
        "nombre": "Recicla SLP S.A. de C.V.",
        "nombre_corto": "Recicla SLP",
        "tipo": "recicladora",
        "zm": "SLP",
        "estado_mx": "San Luis Potosí",
        "municipio": "San Luis Potosí",
        "materiales": ["PET", "HDPE", "cartón", "papel"],
        "capacidad_ton_mes": 150,
        "precio_compra_json": {"PET": 4500, "HDPE": 3800, "cartón": 1200, "papel": 900},
        "fuente": "manual",
    },
    {
        "nombre": "Grupo Metalúrgico del Altiplano",
        "nombre_corto": "GMA",
        "tipo": "comprador_ancla",
        "zm": "SLP",
        "estado_mx": "San Luis Potosí",
        "municipio": "San Luis Potosí",
        "materiales": ["acero", "aluminio", "cobre", "chatarra"],
        "capacidad_ton_mes": 500,
        "precio_compra_json": {"acero": 5800, "aluminio": 21000, "cobre": 85000, "chatarra": 4200},
        "fuente": "manual",
    },
    {
        "nombre": "Vidrio del Potosí",
        "nombre_corto": "VidrioSLP",
        "tipo": "recicladora",
        "zm": "SLP",
        "estado_mx": "San Luis Potosí",
        "municipio": "San Luis Potosí",
        "materiales": ["vidrio transparente", "vidrio café", "vidrio verde"],
        "capacidad_ton_mes": 80,
        "precio_compra_json": {"vidrio transparente": 600, "vidrio café": 500, "vidrio verde": 450},
        "fuente": "manual",
    },
    {
        "nombre": "BANOBRAS — Ventanilla Sustentable",
        "nombre_corto": "BANOBRAS",
        "tipo": "financiero",
        "zm": "SLP",
        "estado_mx": "San Luis Potosí",
        "municipio": "San Luis Potosí",
        "materiales": [],
        "capacidad_ton_mes": None,
        "precio_compra_json": {},
        "certificaciones": ["BID Verde", "Climate Finance"],
        "url": "https://www.banobras.gob.mx/",
        "fuente": "manual",
    },
]


def _ensure_seed(db: Session):
    """Insert seed partners if table is empty."""
    count = db.query(PartnerOrganization).count()
    if count == 0:
        for p in _SLP_SEED:
            partner = PartnerOrganization(**p)
            db.add(partner)
        db.commit()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[PartnerDTO])
async def list_partners(
    zm: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    material: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List partner organizations."""
    if db is None:
        return []

    _ensure_seed(db)

    q = db.query(PartnerOrganization).filter(PartnerOrganization.activo == True)
    if zm:
        q = q.filter(PartnerOrganization.zm == zm)
    if tipo:
        q = q.filter(PartnerOrganization.tipo == tipo)

    partners = q.order_by(PartnerOrganization.nombre).all()

    # Filter by material in Python (JSON array)
    if material:
        mat_lower = material.lower()
        partners = [p for p in partners if any(mat_lower in m.lower() for m in p.materiales)]

    return [
        PartnerDTO(
            id=p.id, nombre=p.nombre, nombre_corto=p.nombre_corto,
            tipo=p.tipo, zm=p.zm, estado_mx=p.estado_mx, municipio=p.municipio,
            lat=p.lat, lon=p.lon, materiales=p.materiales,
            capacidad_ton_mes=p.capacidad_ton_mes, precio_compra_json=p.precio_compra_json,
            contacto_nombre=p.contacto_nombre, contacto_email=p.contacto_email,
            contacto_telefono=p.contacto_telefono, url=p.url,
            certificaciones=p.certificaciones, activo=p.activo, fuente=p.fuente,
        )
        for p in partners
    ]


@router.post("", response_model=PartnerDTO, status_code=201)
async def create_partner(
    body: PartnerCreate,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a partner organization."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    partner = PartnerOrganization(**body.model_dump())
    db.add(partner)
    db.commit()
    db.refresh(partner)
    logger.info("partner_created id=%s nombre=%s", partner.id, partner.nombre)

    return PartnerDTO(
        id=partner.id, nombre=partner.nombre, nombre_corto=partner.nombre_corto,
        tipo=partner.tipo, zm=partner.zm, estado_mx=partner.estado_mx,
        municipio=partner.municipio, lat=partner.lat, lon=partner.lon,
        materiales=partner.materiales, capacidad_ton_mes=partner.capacidad_ton_mes,
        precio_compra_json=partner.precio_compra_json,
        contacto_nombre=partner.contacto_nombre, contacto_email=partner.contacto_email,
        contacto_telefono=partner.contacto_telefono, url=partner.url,
        certificaciones=partner.certificaciones, activo=partner.activo, fuente=partner.fuente,
    )


@router.get("/tenant/{tenant_id}/links", response_model=List[LinkDTO])
async def list_tenant_links(
    tenant_id: str,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all partner links for a tenant."""
    if db is None:
        return []

    links = db.query(TenantPartnerLink).filter(
        TenantPartnerLink.tenant_id == tenant_id
    ).all()

    partner_ids = [l.partner_id for l in links]
    partners = {
        p.id: p for p in db.query(PartnerOrganization).filter(
            PartnerOrganization.id.in_(partner_ids)
        ).all()
    } if partner_ids else {}

    return [
        LinkDTO(
            id=l.id, tenant_id=l.tenant_id, partner_id=l.partner_id,
            partner_nombre=partners.get(l.partner_id, PartnerOrganization()).nombre
                if l.partner_id in partners else None,
            estatus=l.estatus, material=l.material,
            precio_acordado_ton=l.precio_acordado_ton,
            volumen_acordado_ton_mes=l.volumen_acordado_ton_mes,
            notas=l.notas,
        )
        for l in links
    ]


@router.post("/tenant/{tenant_id}/links", response_model=LinkDTO, status_code=201)
async def create_tenant_link(
    tenant_id: str,
    body: LinkCreate,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Link a partner to a tenant."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Avoid duplicates for same material
    existing = db.query(TenantPartnerLink).filter(
        TenantPartnerLink.tenant_id == tenant_id,
        TenantPartnerLink.partner_id == body.partner_id,
        TenantPartnerLink.material == body.material,
    ).first()

    if existing:
        existing.estatus = body.estatus
        if body.precio_acordado_ton:
            existing.precio_acordado_ton = body.precio_acordado_ton
        if body.volumen_acordado_ton_mes:
            existing.volumen_acordado_ton_mes = body.volumen_acordado_ton_mes
        if body.notas:
            existing.notas = body.notas
        db.commit()
        db.refresh(existing)
        link = existing
    else:
        link = TenantPartnerLink(tenant_id=tenant_id, **body.model_dump())
        db.add(link)
        db.commit()
        db.refresh(link)

    logger.info("partner_link_created tenant=%s partner=%s", tenant_id, body.partner_id)

    partner = db.query(PartnerOrganization).filter(
        PartnerOrganization.id == link.partner_id
    ).first()

    return LinkDTO(
        id=link.id, tenant_id=link.tenant_id, partner_id=link.partner_id,
        partner_nombre=partner.nombre if partner else None,
        estatus=link.estatus, material=link.material,
        precio_acordado_ton=link.precio_acordado_ton,
        volumen_acordado_ton_mes=link.volumen_acordado_ton_mes,
        notas=link.notas,
    )


@router.patch("/links/{link_id}/estatus")
async def update_link_status(
    link_id: str,
    estatus: str,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update link status (e.g., identificado → contratado)."""
    VALID_STATUSES = {"identificado", "contactado", "cotizando", "contratado", "activo", "pausado"}
    if estatus not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"estatus must be one of {VALID_STATUSES}")

    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    link = db.query(TenantPartnerLink).filter(TenantPartnerLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    link.estatus = estatus
    db.commit()
    db.refresh(link)
    logger.info("partner_link_status tenant=%s link=%s status=%s", link.tenant_id, link_id, estatus)

    return {"id": link.id, "estatus": link.estatus}
