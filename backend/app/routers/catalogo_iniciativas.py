"""
Router: /catalogo-iniciativas

Catálogo nacional de iniciativas regulatorias que aplican a municipios mexicanos.
Sprint 34 — Seed catalog of 15 key regulations (LGPGIR, NOMs, GRI, CSRD, ASF).

Moat asset: this grows with each tenant, becoming the reference dataset
for all municipal regulatory compliance in Mexico.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/catalogo-iniciativas", tags=["catalogo-iniciativas"])
logger = logging.getLogger(__name__)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class IniciativaRegulatorio(BaseModel):
    id: str
    clave: str              # e.g. "LGPGIR", "NOM-083"
    titulo: str
    organismo: str          # SEMARNAT, DOF, GRI, etc.
    ambito: str             # federal | estatal | norma_tecnica | estandar_internacional
    estado_mx: Optional[str] = None   # None = aplica a todos
    resumen: str
    aplica_rsu: bool = True
    aplica_rcd: bool = False
    aplica_agua: bool = False
    articulos_clave: List[str]
    obligacion_municipal: str    # qué debe hacer el municipio
    consecuencia_incumplimiento: str
    url_oficial: Optional[str] = None
    vigente: bool = True
    ultima_actualizacion: str


CATALOGO: List[IniciativaRegulatorio] = [
    IniciativaRegulatorio(
        id="lgpgir",
        clave="LGPGIR",
        titulo="Ley General para la Prevención y Gestión Integral de los Residuos",
        organismo="Cámara de Diputados / DOF",
        ambito="federal",
        resumen="Ley marco que establece la clasificación de residuos, las responsabilidades "
                "municipales (RSU y RME), los planes de manejo, y las bases para la prevención "
                "y valorización. Estructura los tres niveles de gobierno en gestión de residuos.",
        aplica_rsu=True,
        aplica_rcd=True,
        aplica_agua=False,
        articulos_clave=["Art. 5 (definiciones)", "Art. 9 (municipios)", "Art. 18-22 (RSU)", "Art. 36 (planes de manejo)"],
        obligacion_municipal="Prestar el servicio de limpia, recolección, traslado, tratamiento y disposición final de RSU; elaborar e instrumentar el Programa Municipal.",
        consecuencia_incumplimiento="Sanciones administrativas, multas, clausura de instalaciones. Responsabilidad del presidente municipal.",
        url_oficial="https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPGIR.pdf",
        ultima_actualizacion="2022-06-09",
    ),
    IniciativaRegulatorio(
        id="nom083",
        clave="NOM-083-SEMARNAT-2003",
        titulo="Especificaciones de protección ambiental para la selección del sitio, diseño, construcción, operación, monitoreo, clausura y obras complementarias de un sitio de disposición final de residuos sólidos urbanos y de manejo especial",
        organismo="SEMARNAT",
        ambito="norma_tecnica",
        resumen="Norma Oficial Mexicana que establece los requisitos técnicos para rellenos sanitarios. "
                "Aplica a todo sitio de disposición final de RSU. Criterios de selección de sitio, "
                "diseño ingenieril, operación diaria, monitoreo ambiental y cierre.",
        aplica_rsu=True,
        aplica_rcd=False,
        articulos_clave=["§4 Criterios de selección de sitio", "§5 Diseño e infraestructura", "§6 Operación", "§7 Monitoreo"],
        obligacion_municipal="Operar el sitio de disposición final conforme a los parámetros técnicos. Llevar bitácora diaria de operación.",
        consecuencia_incumplimiento="Clausura del relleno sanitario. Responsabilidad penal por contaminación ambiental.",
        url_oficial="https://www.dof.gob.mx/nota_detalle.php?codigo=724648&fecha=20/08/2004",
        ultima_actualizacion="2004-08-20",
    ),
    IniciativaRegulatorio(
        id="nom161",
        clave="NOM-161-SEMARNAT-2011",
        titulo="Criterios para clasificar a los Residuos de Manejo Especial y determinar cuáles están sujetos a Plan de Manejo",
        organismo="SEMARNAT",
        ambito="norma_tecnica",
        resumen="Define qué residuos califican como RME y cuáles requieren plan de manejo. "
                "Relevante para escombro, residuos de construcción, llantas y electrónicos.",
        aplica_rsu=False,
        aplica_rcd=True,
        articulos_clave=["§4 Clasificación", "§5 Criterios de inclusión en plan de manejo"],
        obligacion_municipal="Verificar que generadores de RME en el territorio elaboren planes de manejo.",
        consecuencia_incumplimiento="Sanción a generadores y al municipio como autoridad de supervisión.",
        url_oficial="https://www.dof.gob.mx/nota_detalle.php?codigo=5232668&fecha=01/02/2012",
        ultima_actualizacion="2012-02-01",
    ),
    IniciativaRegulatorio(
        id="lgeepa_art135",
        clave="LGEEPA — Art. 135-147",
        titulo="Ley General del Equilibrio Ecológico y la Protección al Ambiente — Capítulo Residuos",
        organismo="Cámara de Diputados / DOF",
        ambito="federal",
        resumen="Establece las bases generales de política ambiental. El capítulo de residuos "
                "(Art. 135-147) precede a LGPGIR y sigue vigente en aspectos complementarios.",
        aplica_rsu=True,
        articulos_clave=["Art. 135-137 (política de residuos)", "Art. 140 (municipios)"],
        obligacion_municipal="Aplicar la política de prevención y gestión de residuos como parte de la política ambiental municipal.",
        consecuencia_incumplimiento="Responsabilidad solidaria con federación y estados.",
        url_oficial="https://www.diputados.gob.mx/LeyesBiblio/pdf/LGEEPA.pdf",
        ultima_actualizacion="2022-01-18",
    ),
    IniciativaRegulatorio(
        id="gri306_2020",
        clave="GRI 306:2020",
        titulo="GRI Standard 306: Waste (2020)",
        organismo="Global Reporting Initiative",
        ambito="estandar_internacional",
        resumen="Estándar internacional de reporte ESG para residuos. Requiere declarar "
                "generación total, composición por tipo, métodos de disposición y desviación "
                "de relleno sanitario. Base del reporte ESG trimestral ALQUIMIA.",
        aplica_rsu=True,
        aplica_rcd=True,
        articulos_clave=["GRI 306-1 (generación y composición)", "GRI 306-2 (gestión)", "GRI 306-3 (ton generadas)", "GRI 306-4 (desviadas)", "GRI 306-5 (relleno sanitario)"],
        obligacion_municipal="No obligatorio por ley, pero requerido por financiadores BID/BANOBRAS/NAFIN para créditos verdes.",
        consecuencia_incumplimiento="Elegibilidad restringida para financiamiento verde.",
        url_oficial="https://www.globalreporting.org/standards/media/2096/gri-306-waste-2020.pdf",
        ultima_actualizacion="2020-07-01",
    ),
    IniciativaRegulatorio(
        id="ley_ingresos_municipal",
        clave="Ley de Ingresos Municipal",
        titulo="Ley de Ingresos para los Municipios (estatal, anual)",
        organismo="Congreso Estatal",
        ambito="estatal",
        resumen="Aprobada anualmente por el congreso estatal. Define las cuotas de servicios "
                "de limpia y recolección que puede cobrar el municipio. Limita la capacidad "
                "de autofinanciamiento del servicio.",
        aplica_rsu=True,
        articulos_clave=["Cuotas por servicio de limpia", "Exenciones"],
        obligacion_municipal="Cobrar únicamente las cuotas autorizadas. No puede exceder los montos aprobados.",
        consecuencia_incumplimiento="Recursos de inconstitucionalidad. Observaciones ASF.",
        ultima_actualizacion="2025-12-31",
    ),
    IniciativaRegulatorio(
        id="pro_aire",
        clave="ProAire (estatal)",
        titulo="Programa de Gestión para Mejorar la Calidad del Aire",
        organismo="SEMARNAT / Gobierno Estatal",
        ambito="estatal",
        resumen="Programa estatal que establece metas de reducción de emisiones. "
                "Los municipios deben alinear su gestión de RSU (quema de residuos, "
                "biogás de rellenos) a los objetivos del ProAire.",
        aplica_rsu=True,
        articulos_clave=["Medidas sector residuos", "Metas por municipio"],
        obligacion_municipal="Reportar emisiones de CH4 del relleno sanitario y adoptar medidas de control.",
        consecuencia_incumplimiento="Observaciones federales y restricción de transferencias condicionadas.",
        ultima_actualizacion="2022-09-15",
    ),
    IniciativaRegulatorio(
        id="asf_auditoria",
        clave="ASF — Auditoría al Servicio de Limpia",
        titulo="Criterios de Auditoría Superior de la Federación para Servicios de Limpia Municipal",
        organismo="ASF (Auditoría Superior de la Federación)",
        ambito="federal",
        resumen="La ASF audita el ejercicio de recursos federales en servicios de limpia "
                "(FORTAMUN, FAFEF). Revisa eficiencia, trazabilidad y cumplimiento normativo. "
                "Un municipio con diagnóstico ALQUIMIA puede demostrar trazabilidad.",
        aplica_rsu=True,
        articulos_clave=["Criterios de eficiencia operativa", "Documentación de gasto"],
        obligacion_municipal="Mantener evidencia documental de la prestación del servicio y el destino de recursos federales.",
        consecuencia_incumplimiento="Observaciones, reintegros al erario y responsabilidad del tesorero.",
        ultima_actualizacion="2024-01-01",
    ),
    IniciativaRegulatorio(
        id="banobras_verde",
        clave="BANOBRAS — Línea Sustentable",
        titulo="Criterios de Elegibilidad para Crédito Sustentable Municipal (BANOBRAS)",
        organismo="BANOBRAS",
        ambito="federal",
        resumen="BANOBRAS requiere evaluación técnica de proyectos de gestión de residuos "
                "para otorgar crédito en condiciones preferenciales. Un Plan Maestro con "
                "AUDITOR pass de ALQUIMIA puede servir como evidencia técnica.",
        aplica_rsu=True,
        articulos_clave=["Evaluación técnica del proyecto", "Indicadores de sostenibilidad"],
        obligacion_municipal="Presentar proyecto técnico con indicadores verificables, fuentes de repago y análisis de riesgo.",
        consecuencia_incumplimiento="Denegación del crédito o tasa no preferencial.",
        url_oficial="https://www.banobras.gob.mx/",
        ultima_actualizacion="2024-03-01",
    ),
    IniciativaRegulatorio(
        id="csrd_art8",
        clave="CSRD — Art. 8 (referencia LATAM)",
        titulo="Corporate Sustainability Reporting Directive — Relevancia para municipios exportadores",
        organismo="Comisión Europea / UE",
        ambito="estandar_internacional",
        resumen="Directiva europea que obliga a grandes empresas europeas a reportar "
                "su cadena de valor. Empresas ancla (recicladores, compradores) con "
                "operaciones en México deben demostrar trazabilidad de residuos. "
                "Los municipios que venden materiales a estas empresas se benefician "
                "de tener datos verificables.",
        aplica_rsu=True,
        articulos_clave=["Art. 8 (due diligence en cadena de valor)", "ESRS E5 (uso de recursos y economía circular)"],
        obligacion_municipal="No directa — pero favorece a municipios con datos trazables al vender materiales.",
        consecuencia_incumplimiento="Pérdida de contratos con empresas ancla europeas.",
        url_oficial="https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en",
        ultima_actualizacion="2023-07-31",
    ),
]

# Build indexes for fast lookup
_BY_ID: Dict[str, IniciativaRegulatorio] = {i.id: i for i in CATALOGO}
_BY_AMBITO: Dict[str, List[IniciativaRegulatorio]] = {}
for ini in CATALOGO:
    _BY_AMBITO.setdefault(ini.ambito, []).append(ini)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[IniciativaRegulatorio])
async def list_iniciativas(
    ambito: Optional[str] = Query(None, description="federal | estatal | norma_tecnica | estandar_internacional"),
    aplica_rsu: Optional[bool] = Query(None),
    aplica_rcd: Optional[bool] = Query(None),
    q: Optional[str] = Query(None, description="Búsqueda en clave, título y resumen"),
    vigente: bool = Query(True),
):
    """List regulatory initiatives, optionally filtered."""
    result = [i for i in CATALOGO if i.vigente == vigente]
    if ambito:
        result = [i for i in result if i.ambito == ambito]
    if aplica_rsu is not None:
        result = [i for i in result if i.aplica_rsu == aplica_rsu]
    if aplica_rcd is not None:
        result = [i for i in result if i.aplica_rcd == aplica_rcd]
    if q:
        q_lower = q.lower()
        result = [
            i for i in result
            if q_lower in i.clave.lower()
            or q_lower in i.titulo.lower()
            or q_lower in i.resumen.lower()
        ]
    return result


@router.get("/{iniciativa_id}", response_model=IniciativaRegulatorio)
async def get_iniciativa(iniciativa_id: str):
    """Get a specific initiative by ID."""
    ini = _BY_ID.get(iniciativa_id)
    if not ini:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Iniciativa '{iniciativa_id}' no encontrada")
    return ini


@router.get("/municipio/{estado_mx}/aplicables", response_model=List[IniciativaRegulatorio])
async def get_aplicables(estado_mx: str):
    """Get all initiatives that apply to a specific state's municipalities."""
    return [
        i for i in CATALOGO
        if i.vigente and (i.estado_mx is None or i.estado_mx.lower() == estado_mx.lower())
    ]
