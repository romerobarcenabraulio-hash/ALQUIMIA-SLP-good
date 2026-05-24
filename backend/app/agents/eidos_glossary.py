"""
Glosario canónico ALQUIMIA (EIDOS) — versión machine-readable para runtime.

Fuente normativa: cursor-rules/eidos.md (Wave 2, decisiones S1–S11).
Solo lectura; no modifica lógica de negocio.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TermRule:
    canonical: str
    prohibited: tuple[str, ...]
    reason: str = ""


# Términos operativos — reemplazar variantes por canónico en copy institucional
OPERATIONAL_TERMS: tuple[TermRule, ...] = (
    TermRule("centro de acopio", ("nodo de transferencia", "punto de captación", "centro de reciclaje")),
    TermRule("fracción", ("desecho genérico",)),
    TermRule("valorización", ("valoración", "aprovechamiento")),
    TermRule("concesionario", ("operador genérico", "contratista")),
    TermRule(
        "cadena de custodia",
        (),
        "legal/normativo — reglamento, folio, sanción",
    ),
    TermRule(
        "trazabilidad",
        (),
        "técnica — evidencia digital, fuentes M19",
    ),
)

# Sustituciones directas (case-insensitive) en documentos formales
PROHIBITED_PHRASES: tuple[tuple[str, str], ...] = (
    ("simulador rsu", "plataforma ALQUIMIA"),
    ("alquimia slp", "ALQUIMIA"),
    (" npv", " VPN"),
    (" irr", " TIR"),
    ("tracking", "seguimiento"),
    ("pipeline", "flujo de proceso"),
    ("performance", "desempeño"),
    ("stakeholder", "actor"),
    ("dashboard", "tablero de control"),
    ("software alquimia", "plataforma ALQUIMIA"),
    ("app alquimia", "plataforma ALQUIMIA"),
    ("herramienta alquimia", "plataforma ALQUIMIA"),
)

# Identidad producto (S1)
IDENTITY_RULES: tuple[str, ...] = (
    "Nombre propio: ALQUIMIA (no «Alquimia SLP» ni «simulador RSU»).",
    "Descriptor: plataforma de consultoría integral de gestión pública municipal.",
)

# Registro por tono documental (dos registros EIDOS)
REGISTER_BY_TONO: dict[str, str] = {
    "ejecutivo-institucional": (
        "Registro ejecutivo: formal, narrativo, sin jerga; párrafos cortos con conclusión al inicio."
    ),
    "técnico-riguroso": (
        "Registro técnico: preciso, con tablas y supuestos explícitos; VPN/TIR en español."
    ),
    "jurídico-técnico": (
        "Registro jurídico: cadena de custodia (no trazabilidad) para folios y sanciones; "
        "sin lenguaje coloquial."
    ),
    "institucional-diplomático": (
        "Registro metropolitano: separar coordinación ZM de obligación municipal."
    ),
    "operativo-claro": (
        "Registro operativo: instructivo, directo, secundaria-técnica."
    ),
    "ciudadano-accesible": (
        "Registro ciudadano: secundaria, sin anglicismos; explicar KPI en primera mención."
    ),
    "técnico-operativo": (
        "Registro técnico-operativo: métricas + acción verificable."
    ),
    "técnico-financiero": (
        "Registro financiero: CAPEX/OPEX/VPN/TIR; no mezclar derrama y ahorro público."
    ),
}

# Docs jurídicos: cadena de custodia sí; trazabilidad solo en contexto técnico explícito
JURIDICO_DOC_PREFIX = "03_diagnostico_reforma"
FUENTES_DOC_ID = "07_fuentes_trazabilidad"


def compact_glossary_for_prompt(tono: str | None = None) -> str:
    """Bloque compacto para inyectar en prompts de agentes (~ bajo costo en tokens)."""
    lines = [
        "## Glosario EIDOS (terminología canónica — obligatorio):",
        "  - ALQUIMIA = plataforma de consultoría integral (no «simulador RSU», no «app»).",
        "  - centro de acopio (no nodo, no punto de captación).",
        "  - fracción / valorización / concesionario según LGPGIR y convenio.",
        "  - cadena de custodia = legal (reglamento, folio); trazabilidad = técnica (evidencia M19).",
        "  - actor o parte interesada (no stakeholder en docs formales).",
        "  - VPN y TIR (no NPV/IRR en español).",
        "  - Prohibido: revolucionario, garantizado, sin precedentes, dictamen oficial.",
    ]
    if tono and tono in REGISTER_BY_TONO:
        lines.append(f"  - {REGISTER_BY_TONO[tono]}")
    return "\n".join(lines)
