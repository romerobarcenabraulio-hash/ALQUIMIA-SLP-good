"""
Motor de coordinación metropolitana — Fase 1.5.

Genera el PaqueteMetropolitano de dos capas para una ZM:
  Capa 1: diagnóstico + estrategia por municipio individual
  Capa 2: coordinación regional (convenio, oleadas, infraestructura compartida)

Principio: NO mezclar convenio metropolitano, reglamento municipal,
adenda contractual ni lineamientos técnicos.
"""
from __future__ import annotations

import math
from app.legal.diagnostic import build_diagnostic
from app.legal.reform_strategy import select_strategy
from app.legal.repository import get_repo
from app.legal.schemas import (
    CoordinacionMetropolitana, DiagnosticoMunicipal,
    OleadaImplementacion, PaqueteMetropolitano,
)

# ─── Configuración por ZM ─────────────────────────────────────────────────────

# Coordinación únicamente — Navigator §5: ZM ≠ municipio con poder sancionatorio propio.
_COORD_SCOPE_PREFIX = "Ámbito de coordinación ZM (sin autoridad sancionatoria única ni sustituta del ayuntamiento). "

_ZM_CONFIG: dict[str, dict] = {
    "SLP": {
        "convenio_marco_zm":          "pendiente",
        "homologacion_fracciones":    "Propuesta: separación mínima en 2 fracciones (orgánicos / inorgánicos). Pendiente acuerdo de Cabildo en Soledad.",
        "estandar_datos":             "ALQUIMIA RSU v1 — API REST / JSON. Pendiente adopción en Soledad, Cerro de San Pedro y Villa de Pozos.",
        "interoperabilidad_rutas":    "Rutas de SLP y Soledad operan bajo el mismo concesionario (SERV). Sin trazabilidad digital. Pendiente GPS.",
        "infraestructura_compartida": "Relleno sanitario regional compartido con vida útil estimada de 12 años (SEPLAP 2023). Sin planta de compostaje ZM.",
        "nota": (
            _COORD_SCOPE_PREFIX
            + "SLP es el municipio líder obligatorio — tiene el mayor volumen (73% de la ZM) y el único marco jurídico "
            "con posibilidad de reforma en corto plazo. Soledad debe actuar en paralelo dado su crecimiento. "
            "Cerro de San Pedro y Villa de Pozos son micro-municipios; adoptar por decreto de supletoriedad estatal."
        ),
        "oleadas": [
            OleadaImplementacion(numero=1, nombre="Reforma y piloto capital",
                municipios=["slp"], descripcion="Reforma reglamento SLP + instalar 3 CAs-P piloto. Gate: reforma aprobada en Cabildo.",
                mes_inicio=1, mes_fin=6),
            OleadaImplementacion(numero=2, nombre="Expansión a Soledad",
                municipios=["sol"], descripcion="Formalizar mancomunidad + adenda contractual con concesionario SERV + replicar modelo CAs.",
                mes_inicio=4, mes_fin=12),
            OleadaImplementacion(numero=3, nombre="Micro-municipios por decreto",
                municipios=["csp", "vip"], descripcion="Adoptar reglamento tipo por decreto municipal. Servicio mínimo compartido con SLP.",
                mes_inicio=9, mes_fin=18),
        ],
        "municipios_lider": ["slp"],
    },
    "QRO": {
        "convenio_marco_zm":          "borrador",
        "homologacion_fracciones":    "Querétaro ya usa 2 fracciones. Extender mandato a Corregidora y El Marqués. Huimilpan: servicio básico.",
        "estandar_datos":             "SIFGEI-QRO plataforma estatal existente. Integración con ALQUIMIA RSU v1 en desarrollo.",
        "interoperabilidad_rutas":    "Querétaro y Corregidora comparten zona de transferencia en La Cañada. Sin acuerdo formal de trazabilidad.",
        "infraestructura_compartida": "Relleno sanitario ZM compartido (RSQRO) — vida útil 9 años. Planta de compostaje QRO con capacidad excedente.",
        "nota": (
            _COORD_SCOPE_PREFIX
            + "Querétaro es el municipio líder evidente — reglamento verificado, más capacidad administrativa. "
            "Corregidora y El Marqués tienen masa crítica industrial que justifica CAs propios. "
            "Huimilpan debe integrarse vía supletoriedad y mancomunidad de hecho."
        ),
        "oleadas": [
            OleadaImplementacion(numero=1, nombre="Completar brechas QRO capital",
                municipios=["qro"], descripcion="Fortalecer compostaje y evidencia operativa para inspección/fiscalización existente; no crear sancionalidad nueva.",
                mes_inicio=1, mes_fin=6),
            OleadaImplementacion(numero=2, nombre="Industriales: Corregidora y El Marqués",
                municipios=["cor", "mar"], descripcion="Reforma integral 6 meses. Énfasis en RSU industrial + CAs especializados.",
                mes_inicio=3, mes_fin=12),
            OleadaImplementacion(numero=3, nombre="Rural: Huimilpan",
                municipios=["hui"], descripcion="Servicio básico diferenciado + reglamento tipo por supletoriedad.",
                mes_inicio=9, mes_fin=18),
        ],
        "municipios_lider": ["qro"],
    },
    "MTY": {
        "convenio_marco_zm":          "firmado",
        "homologacion_fracciones":    "Convenio Marco AMM 2022 establece mínimo de 3 fracciones en los 9 municipios. San Pedro ya usa 5.",
        "estandar_datos":             "SIMEPRODE-DATA v2 + integración ALQUIMIA RSU v1. San Pedro y Monterrey ya reportan en tiempo real.",
        "interoperabilidad_rutas":    "Red SIMEPRODE coordina transferencia entre municipios. Pendiente integración GPS en Apodaca, García y Juárez.",
        "infraestructura_compartida": "Relleno Sanitario Metropolitano SIMEPRODE — vida útil 8 años. Planta de compostaje Monterrey + SPG en operación.",
        "nota": (
            _COORD_SCOPE_PREFIX
            + "MTY ZM tiene el convenio marco más avanzado, pero heterogeneidad interna alta: San Pedro es el más avanzado, "
            "Juárez y García son los más rezagados. La estrategia de oleadas debe priorizar por impacto de volumen "
            "(Guadalupe 686K y Apodaca 643K) antes que por preparación jurídica."
        ),
        "oleadas": [
            OleadaImplementacion(numero=1, nombre="Líderes con reglamento completo",
                municipios=["mty", "spg"], descripcion="Resolver conflicto Art. 4 MTY (SIMEPRODE) + escalar CAs. SPG: modelo de excelencia.",
                mes_inicio=1, mes_fin=4),
            OleadaImplementacion(numero=2, nombre="Municipios de mayor volumen",
                municipios=["gua", "apo", "snl", "esc"], descripcion="Reforma integral simultánea. 4 municipios × 6 meses. Apoyo jurídico del Estado.",
                mes_inicio=3, mes_fin=12),
            OleadaImplementacion(numero=3, nombre="Periferia en crecimiento",
                municipios=["sca", "gar", "jua"], descripcion="Reglamentos nuevos + integración SIMEPRODE. Mayor riesgo político por cambios de administración.",
                mes_inicio=9, mes_fin=18),
        ],
        "municipios_lider": ["mty", "spg"],
    },
}


# ─── Constructor ─────────────────────────────────────────────────────────────

def build_paquete_metropolitano(zm: str, municipios: list[str]) -> PaqueteMetropolitano:
    repo   = get_repo()
    config = _ZM_CONFIG.get(zm, {})

    # Capa 1 — diagnóstico municipal
    paquete_municipal: list[DiagnosticoMunicipal] = []
    bloqueados = 0
    scores_ponderados: list[tuple[int, int]] = []  # (score, pop proxy)

    for m_id in municipios:
        diag  = build_diagnostic(m_id)
        if diag is None:
            continue
        strat = select_strategy(diag)
        if diag.agora_bloqueado:
            bloqueados += 1
        # Proxy de peso: usamos el orden de seeds (capital = más grande)
        # En prod se usaría población real de la BD
        weight = max(1, len(municipios) - municipios.index(m_id))
        scores_ponderados.append((diag.score_legal, weight))

        paquete_municipal.append(DiagnosticoMunicipal(
            municipio_id=m_id,
            municipio_nombre=repo.get_municipio_nombre(m_id),
            zm=zm,
            diagnostic=diag,
            strategy=strat,
        ))

    # Score ZM = promedio ponderado (por orden proxy)
    total_w  = sum(w for _, w in scores_ponderados) or 1
    score_zm = math.floor(sum(s * w for s, w in scores_ponderados) / total_w)

    # Capa 2 — coordinación metropolitana
    municipios_bloqueados_ids = [
        d.municipio_id for d in paquete_municipal if d.diagnostic.agora_bloqueado
    ]
    coord = CoordinacionMetropolitana(
        zm=zm,
        convenio_marco_zm=         config.get("convenio_marco_zm",          "pendiente"),
        homologacion_fracciones=   config.get("homologacion_fracciones",    "Sin definir"),
        estandar_datos=            config.get("estandar_datos",             "Sin definir"),
        interoperabilidad_rutas=   config.get("interoperabilidad_rutas",    "Sin definir"),
        infraestructura_compartida=config.get("infraestructura_compartida", "Sin definir"),
        municipios_lider=          config.get("municipios_lider",           []),
        municipios_bloqueados=     municipios_bloqueados_ids,
        oleadas=                   config.get("oleadas",                    []),
        nota=                      config.get("nota",                       ""),
    )

    return PaqueteMetropolitano(
        zm=zm,
        total_municipios=len(paquete_municipal),
        municipios_bloqueados=bloqueados,
        score_legal_zm=score_zm,
        paquete_municipal=paquete_municipal,
        paquete_metropolitano=coord,
    )
