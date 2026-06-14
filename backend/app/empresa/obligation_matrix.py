"""§3 ObligationMatrix — giro × jurisdiction → legal obligation checklist.

The matrix encodes which federal, state, and municipal RSU obligations apply
to a company given its SCIAN sector code and its location (estado_mx).

Design:
- FEDERAL_OBLIGATIONS: apply to all giros nation-wide (LGPGIR, NOM-083, etc.)
- GIRO_OBLIGATIONS: additional obligations triggered by specific sectors
- STATE_OBLIGATIONS: state-level regulations keyed by estado_mx ISO code
- get_obligations(): merges all three layers, deduplicates, sorts by priority

Each obligation entry:
  obligation_id    unique slug
  norm             legal reference (ley / norma / reglamento)
  descripcion      plain-language summary
  jurisdiccion     federal | estatal | municipal
  cumplimiento     checklist items the company must complete
  aplica_si_kg     minimum kg/año threshold (None = always applies)
  fuente           source for the norm reference
  prioridad        1 (highest) → 3 (advisory)
"""
from __future__ import annotations

from typing import Optional

# ---------------------------------------------------------------------------
# Federal obligations (apply regardless of estado or municipality)
# ---------------------------------------------------------------------------
FEDERAL_OBLIGATIONS: list[dict] = [
    {
        "obligation_id": "fed_lgpgir_plan_manejo",
        "norm": "LGPGIR Art. 28",
        "descripcion": "Registrar Plan de Manejo ante SEMARNAT si generas residuos de manejo especial.",
        "jurisdiccion": "federal",
        "cumplimiento": [
            "Determinar si los residuos son RME (Residuos de Manejo Especial)",
            "Elaborar Plan de Manejo según Art. 28 LGPGIR",
            "Registrar el Plan en SEMARNAT",
            "Actualizar el Plan anualmente",
        ],
        "aplica_si_kg": 10_000,  # Gran Generador: ≥10 ton/año
        "fuente": "LGPGIR 2003 (DOF 08-10-2003), última reforma 2021",
        "prioridad": 1,
    },
    {
        "obligation_id": "fed_coa_semarnat",
        "norm": "LGEEPA Art. 109 BIS / NMX-AA-61",
        "descripcion": "Cédula de Operación Anual (COA) si eres gran generador.",
        "jurisdiccion": "federal",
        "cumplimiento": [
            "Clasificar residuos generados (RSU vs RME vs RP)",
            "Registrarse en el sistema COA de SEMARNAT",
            "Reportar anualmente antes del 31 de marzo",
        ],
        "aplica_si_kg": 10_000,
        "fuente": "LGEEPA Art. 109 BIS; Instructivo COA SEMARNAT 2023",
        "prioridad": 1,
    },
    {
        "obligation_id": "fed_separacion_nom",
        "norm": "NOM-161-SEMARNAT-2011",
        "descripcion": "Separación en origen de residuos sólidos urbanos en dos corrientes mínimas.",
        "jurisdiccion": "federal",
        "cumplimiento": [
            "Instalar contenedores diferenciados (orgánicos / inorgánicos)",
            "Capacitar al personal en separación",
            "Verificar que el servicio municipal recolecte de forma separada",
        ],
        "aplica_si_kg": None,  # Aplica siempre
        "fuente": "NOM-161-SEMARNAT-2011 (DOF 01-02-2013)",
        "prioridad": 2,
    },
    {
        "obligation_id": "fed_disposicion_final",
        "norm": "NOM-083-SEMARNAT-2003",
        "descripcion": "Los residuos deben disponerse en sitios autorizados conforme a NOM-083.",
        "jurisdiccion": "federal",
        "cumplimiento": [
            "Verificar que el servicio de recolección entregue a sitio autorizado",
            "Solicitar al municipio constancia del destino final",
        ],
        "aplica_si_kg": None,
        "fuente": "NOM-083-SEMARNAT-2003 (DOF 20-10-2004)",
        "prioridad": 2,
    },
]

# ---------------------------------------------------------------------------
# Sector-specific obligations (keyed by giro_codigo prefix or exact code)
# ---------------------------------------------------------------------------
GIRO_OBLIGATIONS: dict[str, list[dict]] = {
    "722511": [  # Restaurantes
        {
            "obligation_id": "giro_restaurante_aceite",
            "norm": "NOM-138-SEMARNAT/SS-2003",
            "descripcion": "Aceites y grasas residuales deben manejarse como residuos especiales, no vaciarse al drenaje.",
            "jurisdiccion": "federal",
            "cumplimiento": [
                "Contratar empresa autorizada para recolección de aceite vegetal usado",
                "Conservar manifiestos de entrega por 5 años",
            ],
            "aplica_si_kg": None,
            "fuente": "NOM-138-SEMARNAT/SS-2003; LGPGIR Art. 19",
            "prioridad": 1,
        },
    ],
    "621111": [  # Servicios médicos
        {
            "obligation_id": "giro_medico_rpbi",
            "norm": "NOM-087-SEMARNAT-SSA1-2002",
            "descripcion": "Residuos Peligrosos Biológico-Infecciosos (RPBI) deben manejarse separados de RSU.",
            "jurisdiccion": "federal",
            "cumplimiento": [
                "Clasificar RPBI (punzocortantes, anatomopatológicos, cultivos, sangre)",
                "Almacenar en contenedores rígidos y bolsas rojas/amarillas según tipo",
                "Contratar empresa autorizada para recolección y tratamiento de RPBI",
                "Registrar manifiestos de RPBI ante SEMARNAT",
            ],
            "aplica_si_kg": None,
            "fuente": "NOM-087-SEMARNAT-SSA1-2002 (DOF 17-02-2003)",
            "prioridad": 1,
        },
    ],
    "236110": [  # Construcción
        {
            "obligation_id": "giro_construccion_rcd",
            "norm": "LGPGIR Art. 19 fracción VI",
            "descripcion": "Residuos de construcción y demolición (RCD) son de manejo especial.",
            "jurisdiccion": "federal",
            "cumplimiento": [
                "Elaborar Plan de Manejo para RCD",
                "Utilizar sitios de disposición autorizados por el municipio",
                "No mezclar RCD con RSU domiciliarios",
            ],
            "aplica_si_kg": None,
            "fuente": "LGPGIR Art. 19 fr. VI; guía SEMARNAT RCD 2019",
            "prioridad": 1,
        },
    ],
}

# ---------------------------------------------------------------------------
# State-level obligations (keyed by estado_mx 2-letter ISO code)
# ---------------------------------------------------------------------------
STATE_OBLIGATIONS: dict[str, list[dict]] = {
    "SLP": [
        {
            "obligation_id": "slp_ley_ecologia",
            "norm": "Ley Ambiental del Estado de San Luis Potosí, Art. 76",
            "descripcion": "Las empresas generadoras deben notificar al municipio su volumen anual estimado.",
            "jurisdiccion": "estatal",
            "cumplimiento": [
                "Presentar declaración anual de generación al Ayuntamiento",
                "Registrarse en el padrón municipal de generadores si >400 kg/año",
            ],
            "aplica_si_kg": 400,
            "fuente": "Ley Ambiental del Estado de SLP (POE 2019)",
            "prioridad": 2,
        },
    ],
    "JAL": [
        {
            "obligation_id": "jal_ley_residuos",
            "norm": "Ley para la Gestión Integral de los Residuos del Estado de Jalisco, Art. 32",
            "descripcion": "Generadores comerciales deben acreditar separación en origen.",
            "jurisdiccion": "estatal",
            "cumplimiento": [
                "Acreditar separación en origen ante SEMADES",
                "Conservar bitácora de separación",
            ],
            "aplica_si_kg": None,
            "fuente": "Ley GIRE Jalisco (POE 2008, reforma 2019)",
            "prioridad": 2,
        },
    ],
    "CDMX": [
        {
            "obligation_id": "cdmx_padrón",
            "norm": "Ley de Residuos Sólidos del Distrito Federal, Art. 44",
            "descripcion": "Establecimientos comerciales deben inscribirse en el Registro de Generadores.",
            "jurisdiccion": "estatal",
            "cumplimiento": [
                "Inscribirse en el Registro de Generadores de SEDEMA CDMX",
                "Presentar declaración semestral de generación",
                "Cumplir días y horarios de recolección diferenciada",
            ],
            "aplica_si_kg": None,
            "fuente": "Ley de Residuos Sólidos CDMX (GODF 2003, reforma 2019)",
            "prioridad": 1,
        },
    ],
}


def get_obligations(
    giro_codigo: str,
    estado_mx: str,
    kg_rsu_anual: Optional[float] = None,
) -> dict:
    """Return the obligation checklist for a giro × estado combination.

    Args:
        giro_codigo: 6-digit SCIAN code
        estado_mx:   2-letter state abbreviation (e.g. "SLP", "JAL", "CDMX")
        kg_rsu_anual: estimated annual waste kg (used to filter threshold-based
                      obligations); None = include all obligations

    Returns dict with:
        giro_codigo, estado_mx, kg_rsu_anual,
        obligaciones: list of applicable obligations sorted by priority,
        total: count,
        prioridad_alta: count of prioridad==1
    """
    collected: list[dict] = []
    seen: set[str] = set()

    def _add(obs: list[dict]) -> None:
        for ob in obs:
            if ob["obligation_id"] in seen:
                continue
            threshold = ob.get("aplica_si_kg")
            if threshold is not None and kg_rsu_anual is not None and kg_rsu_anual < threshold:
                continue
            seen.add(ob["obligation_id"])
            collected.append(ob)

    _add(FEDERAL_OBLIGATIONS)
    _add(GIRO_OBLIGATIONS.get(giro_codigo, []))
    _add(STATE_OBLIGATIONS.get(estado_mx.upper(), []))

    collected.sort(key=lambda o: o["prioridad"])

    return {
        "giro_codigo": giro_codigo,
        "estado_mx": estado_mx.upper(),
        "kg_rsu_anual": kg_rsu_anual,
        "obligaciones": collected,
        "total": len(collected),
        "prioridad_alta": sum(1 for o in collected if o["prioridad"] == 1),
        "disclaimer": (
            "Lista orientativa — no constituye asesoría jurídica. "
            "Verifica con el Ayuntamiento y SEMARNAT la normatividad vigente."
        ),
    }
