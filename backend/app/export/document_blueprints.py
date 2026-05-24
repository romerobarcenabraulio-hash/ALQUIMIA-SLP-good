"""
Blueprints documentales ALQUIMIA — estructura consultoría (McKinsey × BCG × ALQUIMIA).

Cada entregable define:
  - Portada institucional (campos, clasificación, marco narrativo)
  - Índice de contenidos (secciones con títulos de acción)
  - Exhibits obligatorios
  - Audiencia y decisión que habilita

Referencia humana: cursor-rules/INDICE_MAESTRO_ENTREGABLES.md
Fuente ÁGORA: app/agents/document_specs.py
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


class ConsultingFrame(str, Enum):
    """Marco narrativo — híbrido McKinsey SCQA + BCG action-oriented."""
    scqa = "scqa"              # Situación → Complicación → Pregunta → Respuesta
    action = "action"          # Hallazgos → Recomendaciones → Próximos pasos
    operational = "operational"
    legal = "legal"
    citizen = "citizen"
    audit = "audit"


@dataclass(frozen=True)
class TocEntry:
    number: str
    title: str
    action_title: str
    exhibits: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class DocumentBlueprint:
    document_id: str
    codigo: str
    titulo_corto: str
    titulo_portada: str
    subtitulo_portada: str
    clasificacion: str
    frame: ConsultingFrame
    audiencia: List[str]
    decision_que_habilita: str
    max_paginas: int
    indice: List[TocEntry]
    mensajes_clave: List[str] = field(default_factory=list)


def _bp(
    document_id: str,
    codigo: str,
    titulo_corto: str,
    titulo_portada: str,
    frame: ConsultingFrame,
    audiencia: List[str],
    decision: str,
    max_pag: int,
    indice: List[tuple[str, str, str]],
    mensajes: Optional[List[str]] = None,
) -> DocumentBlueprint:
    return DocumentBlueprint(
        document_id=document_id,
        codigo=codigo,
        titulo_corto=titulo_corto,
        titulo_portada=titulo_portada,
        subtitulo_portada="Plataforma de consultoría integral · Gestión pública municipal",
        clasificacion="Confidencial — Uso institucional",
        frame=frame,
        audiencia=audiencia,
        decision_que_habilita=decision,
        max_paginas=max_pag,
        indice=[
            TocEntry(n, t, a) for n, t, a in indice
        ],
        mensajes_clave=mensajes or [],
    )


# ─── 00 Índice maestro del paquete ────────────────────────────────────────────

BLUEPRINT_INDICE_MAESTRO = DocumentBlueprint(
    document_id="00_indice_maestro_paquete",
    codigo="00",
    titulo_corto="Índice maestro del paquete",
    titulo_portada="Índice maestro de entregables",
    subtitulo_portada="Paquete documental ALQUIMIA · ÁGORA GOV",
    clasificacion="Confidencial — Uso institucional",
    frame=ConsultingFrame.action,
    audiencia=["PMO municipal", "Equipo ALQUIMIA", "Auditor"],
    decision_que_habilita="Orientar la lectura secuencial del paquete y verificar completitud",
    max_paginas=4,
    indice=[],
    mensajes_clave=[
        "Los documentos 01–07 son el núcleo de decisión; 08–11 son capa logística.",
        "Cada PDF incluye portada, índice y estructura de consultoría independiente.",
    ],
)


# ─── 01–11 Entregables individuales ───────────────────────────────────────────

BLUEPRINTS: dict[str, DocumentBlueprint] = {
    "01_resumen_ejecutivo_municipal": _bp(
        "01_resumen_ejecutivo_municipal",
        "01",
        "Resumen ejecutivo",
        "Resumen ejecutivo municipal",
        ConsultingFrame.scqa,
        ["Presidente municipal", "Cabildo", "Tesorería"],
        "Autorizar presentación ante Cabildo e inicio de ruta reglamentaria",
        4,
        [
            ("1", "Página de decisión", "Qué debe decidir el Cabildo en esta sesión"),
            ("2", "Situación actual", "El municipio enfrenta una brecha de circularidad medible"),
            ("3", "Propuesta ALQUIMIA", "Captura progresiva con retorno financiero y ambiental"),
            ("4", "Inversión y retorno", "CAPEX, TIR y payback en lenguaje de tesorería"),
            ("5", "Impacto y empleos", "CO₂e evitadas y empleos directos del programa"),
            ("6", "Riesgos principales", "Tres riesgos que pueden revertir la viabilidad"),
            ("7", "Próximos 30 días", "Secuencia inmediata post-autorización"),
            ("8", "Tabla de decisión", "Opciones: autorizar · diferir · solicitar análisis"),
        ],
        [
            "Lectura objetivo: ≤5 minutos en sesión de Cabildo.",
            "Semáforo de viabilidad vinculado al score de datos del escenario.",
        ],
    ),
    "02_modelo_tecnico_financiero": _bp(
        "02_modelo_tecnico_financiero",
        "02",
        "Modelo técnico-financiero",
        "Modelo técnico-financiero",
        ConsultingFrame.action,
        ["Tesorería", "Finanzas", "Auditor"],
        "Validar viabilidad financiera y autorizar CAPEX",
        20,
        [
            ("1", "Supuestos del modelo", "Qué supuestos gobiernan TIR, VPN y payback"),
            ("2", "CAPEX y OPEX", "Inversión por fase y costo operativo anual"),
            ("3", "Ingresos por material", "Precios, volúmenes y compradores"),
            ("4", "Flujo de caja", "Serie anual consolidada del horizonte"),
            ("5", "Sensibilidad", "Variables que más mueven el resultado"),
            ("6", "Stress tests", "Escenarios adversos y puntos de quiebre"),
            ("7", "Riesgos financieros", "Riesgos residuales no capturados en el modelo"),
            ("8", "Trazabilidad de precios", "Fuente y fecha de cada input crítico"),
            ("9", "Anexo de fórmulas", "Definiciones reproducibles del simulador"),
        ],
    ),
    "03_diagnostico_reforma": _bp(
        "03_diagnostico_reforma",
        "03",
        "Diagnóstico jurídico",
        "Diagnóstico y reforma reglamentaria",
        ConsultingFrame.legal,
        ["Sindicatura", "Jurídico municipal", "Cabildo"],
        "Aprobar iniciativa de reforma al Reglamento de Limpia",
        25,
        [
            ("1", "Marco vigente", "Qué reglamento rige y con qué fecha"),
            ("2", "Artículos relevantes", "Disposiciones que habilitan o bloquean el programa"),
            ("3", "Brechas identificadas", "Dónde el marco actual no sostiene la operación"),
            ("4", "Artículos propuestos", "Redacción orientativa de reforma"),
            ("5", "Justificación técnica", "Por qué cada cambio es necesario y proporcional"),
            ("6", "Ruta de Cabildo", "Secuencia de acuerdos y plazos legales"),
            ("7", "Riesgos legales", "Contencioso y mitigaciones"),
        ],
    ),
    "04_coordinacion_metropolitana": _bp(
        "04_coordinacion_metropolitana",
        "04",
        "Coordinación metropolitana",
        "Coordinación metropolitana",
        ConsultingFrame.scqa,
        ["Presidentes municipales ZM", "Coordinación regional"],
        "Firmar convenio marco de coordinación metropolitana",
        30,
        [
            ("1", "Qué homologar", "Estándares compartidos sin erosionar autonomía"),
            ("2", "Qué no homologar", "Competencias que permanecen municipales"),
            ("3", "Convenio marco", "Estructura propuesta del instrumento"),
            ("4", "Estándar de datos", "Interoperabilidad y trazabilidad ZM"),
            ("5", "Oleadas de arranque", "Secuencia por municipio líder"),
            ("6", "Incentivos", "Mecanismos de coordinación y financiamiento"),
        ],
    ),
    "05_manual_operativo_90_dias": _bp(
        "05_manual_operativo_90_dias",
        "05",
        "Manual operativo 90 días",
        "Manual operativo — primeros 90 días",
        ConsultingFrame.operational,
        ["Director de Limpia", "Coordinadores", "Operadores CA"],
        "Iniciar operación del programa en campo",
        40,
        [
            ("1", "Semanas 1–4", "Arranque y sensibilización operativa"),
            ("2", "Semanas 5–8", "Expansión del piloto"),
            ("3", "Semanas 9–12", "Consolidación y métricas"),
            ("4", "Roles RACI", "Quién decide, ejecuta y reporta"),
            ("5", "Rutas y bitácoras", "Protocolo diario de recolección"),
            ("6", "Incidencias", "Escalamiento y evidencia fotográfica"),
        ],
    ),
    "06_guia_ciudadana_separacion": _bp(
        "06_guia_ciudadana_separacion",
        "06",
        "Guía ciudadana",
        "Guía ciudadana de separación en origen",
        ConsultingFrame.citizen,
        ["Hogares", "Comercios", "Escuelas"],
        "Comenzar separación correcta en origen",
        6,
        [
            ("1", "Qué separar", "Fracciones y contenedores"),
            ("2", "Cómo entregarlo", "Horarios y puntos de entrega"),
            ("3", "Qué no hacer", "Errores que contaminan el material"),
            ("4", "Beneficios", "Por qué importa para la familia y el municipio"),
            ("5", "Preguntas frecuentes", "Respuestas en lenguaje claro"),
        ],
    ),
    "07_fuentes_trazabilidad": _bp(
        "07_fuentes_trazabilidad",
        "07",
        "Fuentes y trazabilidad",
        "Anexo de fuentes y trazabilidad",
        ConsultingFrame.audit,
        ["Auditor", "Equipo técnico", "Oposición"],
        "Verificar trazabilidad completa de datos del paquete",
        15,
        [
            ("1", "Manifest de datos", "Inventario del escenario modelado"),
            ("2", "Fuentes por KPI", "Provenance y confianza"),
            ("3", "Supuestos documentados", "Qué es dato duro vs estimado"),
            ("4", "Limitaciones", "Qué no puede afirmar este paquete"),
            ("5", "Advertencias activas", "Bloqueos y notas de incertidumbre"),
        ],
    ),
    "08_plan_rutas_recoleccion": _bp(
        "08_plan_rutas_recoleccion",
        "08",
        "Plan de rutas",
        "Plan de rutas de recolección separada",
        ConsultingFrame.operational,
        ["Director Servicios Públicos", "Jefe de Recolección"],
        "Aprobar diseño de rutas y costo operativo mensual",
        8,
        [
            ("1", "Zonificación", "Sectores y centros de acopio asignados"),
            ("2", "Rutas por sector", "Km, frecuencia y costo mensual"),
            ("3", "Supuestos operativos", "Diesel, mantenimiento y fuentes"),
        ],
    ),
    "09_dimensionamiento_flota": _bp(
        "09_dimensionamiento_flota",
        "09",
        "Dimensionamiento de flota",
        "Dimensionamiento de flota vehicular",
        ConsultingFrame.action,
        ["Servicios Públicos", "Tesorería", "Comité de Adquisiciones"],
        "Autorizar licitación y adquisición de flota",
        10,
        [
            ("1", "Demanda", "Ton/día y unidades requeridas"),
            ("2", "Especificaciones", "Tipo y capacidad de vehículo"),
            ("3", "CAPEX flota", "Precio unitario con fuente verificada"),
            ("4", "OPEX vehicular", "Diesel y mantenimiento mensual"),
        ],
    ),
    "10_segmentacion_territorial": _bp(
        "10_segmentacion_territorial",
        "10",
        "Segmentación territorial",
        "Segmentación territorial y secuencia de arranque",
        ConsultingFrame.action,
        ["Servicios Públicos", "Presidencia", "Comunicación Social"],
        "Definir orden de arranque por zonas",
        8,
        [
            ("1", "Zonificación A/B/C", "Criterios de priorización"),
            ("2", "Cobertura por ola", "Porcentaje de viviendas por fase"),
            ("3", "Riesgos de participación", "Mitigaciones por zona"),
        ],
    ),
    "11_cadena_suministro_comercializacion": _bp(
        "11_cadena_suministro_comercializacion",
        "11",
        "Cadena de suministro",
        "Cadena de suministro y comercialización",
        ConsultingFrame.action,
        ["Servicios Públicos", "Tesorería", "Operador CA"],
        "Confirmar compradores y proyectar ingresos reales",
        10,
        [
            ("1", "Volúmenes por material", "Ton/año recuperables"),
            ("2", "Precios de mercado", "Fuente y fecha por material"),
            ("3", "Compradores ZM", "Identificación y riesgo de off-take"),
            ("4", "Ingresos proyectados", "Bruto y ajustado por material"),
        ],
    ),
    "12_expediente_inspeccion": _bp(
        "12_expediente_inspeccion",
        "12",
        "Expediente de inspección",
        "Acta técnica de inspección predial",
        ConsultingFrame.legal,
        ["Inspector municipal", "Jurídico", "Sindicatura"],
        "Integrar borrador al procedimiento administrativo sancionatorio",
        8,
        [
            ("1", "Aviso de borrador", "No constituye acto de autoridad hasta firma competente"),
            ("2", "Identificación del predio", "Ubicación y uso declarado"),
            ("3", "Acta de inspección", "Hallazgos, fecha e inspector responsable"),
            ("4", "Sanción orientativa", "Rango UMA/MXN y artículo reglamentario"),
            ("5", "Cadena probatoria", "Evidencia y derecho de audiencia"),
            ("6", "Limitaciones", "Disclaimer sistémico y competencia municipal"),
        ],
        [
            "Borrador técnico — requiere validación jurídica antes de notificación.",
            "La resolución sancionatoria corresponde exclusivamente a la autoridad municipal.",
        ],
    ),
    BLUEPRINT_INDICE_MAESTRO.document_id: BLUEPRINT_INDICE_MAESTRO,
}


def get_blueprint(document_id: str) -> Optional[DocumentBlueprint]:
    """Resuelve blueprint; acepta prefijo 03_diagnostico_reforma_*."""
    if document_id in BLUEPRINTS:
        return BLUEPRINTS[document_id]
    if document_id.startswith("03_diagnostico_reforma"):
        return BLUEPRINTS["03_diagnostico_reforma"]
    return None


def list_package_blueprints() -> List[DocumentBlueprint]:
    """Orden canónico 01–12 para índice maestro."""
    order = [
        "01_resumen_ejecutivo_municipal",
        "02_modelo_tecnico_financiero",
        "03_diagnostico_reforma",
        "04_coordinacion_metropolitana",
        "05_manual_operativo_90_dias",
        "06_guia_ciudadana_separacion",
        "07_fuentes_trazabilidad",
        "08_plan_rutas_recoleccion",
        "09_dimensionamiento_flota",
        "10_segmentacion_territorial",
        "11_cadena_suministro_comercializacion",
        "12_expediente_inspeccion",
    ]
    return [BLUEPRINTS[k] for k in order]


FRAME_LABEL = {
    ConsultingFrame.scqa: "Marco SCQA (Situación · Complicación · Pregunta · Respuesta)",
    ConsultingFrame.action: "Marco orientado a la acción (Hallazgos · Recomendaciones · Implementación)",
    ConsultingFrame.operational: "Marco operativo (Protocolo · Roles · Métricas)",
    ConsultingFrame.legal: "Marco jurídico-técnico (Vigente · Brecha · Reforma · Ruta)",
    ConsultingFrame.citizen: "Marco ciudadano (Qué · Cómo · Beneficio · FAQ)",
    ConsultingFrame.audit: "Marco de auditoría (Fuentes · Supuestos · Limitaciones)",
}
