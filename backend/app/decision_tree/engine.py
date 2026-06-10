"""Decision tree questionnaire engine for sector classification and residue estimation."""

from typing import Dict, Any, List, Optional
import json


# CONSTRUCCION decision tree and residue estimation
CONSTRUCCION_QUESTIONS = [
    {
        "id": "tipo_obra",
        "text": "¿Qué tipo de obras realiza?",
        "tipo": "single_choice",
        "opciones": [
            {"id": "vivienda", "label": "Vivienda (residencial)"},
            {"id": "comercial", "label": "Comercial o industrial"},
            {"id": "ambas", "label": "Ambas (vivienda y comercial)"},
        ]
    },
    {
        "id": "proyectos_anio",
        "text": "¿Cuántos proyectos realiza por año?",
        "tipo": "single_choice",
        "opciones": [
            {"id": "1_5", "label": "1-5 proyectos"},
            {"id": "6_20", "label": "6-20 proyectos"},
            {"id": "20_plus", "label": "Más de 20 proyectos"},
        ]
    },
    {
        "id": "promedio_viviendas",
        "text": "¿Cuál es el promedio de viviendas por proyecto? (si aplica)",
        "tipo": "single_choice",
        "condition": {"campo": "tipo_obra", "valor": ["vivienda", "ambas"]},
        "opciones": [
            {"id": "1_10", "label": "1-10 viviendas"},
            {"id": "11_50", "label": "11-50 viviendas"},
            {"id": "50_plus", "label": "Más de 50 viviendas"},
        ]
    },
]


HOSPITAL_QUESTIONS = [
    {
        "id": "tipo_hospital",
        "text": "¿Qué tipo de hospital?",
        "tipo": "single_choice",
        "opciones": [
            {"id": "general", "label": "Hospital general"},
            {"id": "especializado", "label": "Hospital especializado"},
            {"id": "clinica", "label": "Clínica privada"},
        ]
    },
    {
        "id": "camas",
        "text": "¿Número de camas?",
        "tipo": "single_choice",
        "opciones": [
            {"id": "1_50", "label": "1-50 camas"},
            {"id": "51_200", "label": "51-200 camas"},
            {"id": "200_plus", "label": "Más de 200 camas"},
        ]
    },
]


COMERCIO_QUESTIONS = [
    {
        "id": "tipo_comercio",
        "text": "¿Tipo de negocio?",
        "tipo": "single_choice",
        "opciones": [
            {"id": "tienda", "label": "Tienda minorista"},
            {"id": "supermercado", "label": "Supermercado"},
            {"id": "oficina", "label": "Oficina"},
            {"id": "centro_comercial", "label": "Centro comercial"},
        ]
    },
    {
        "id": "area_m2",
        "text": "¿Área aproximada en m²?",
        "tipo": "single_choice",
        "opciones": [
            {"id": "1_500", "label": "1-500 m²"},
            {"id": "501_2000", "label": "501-2000 m²"},
            {"id": "2000_plus", "label": "Más de 2000 m²"},
        ]
    },
]


RESTAURANTE_QUESTIONS = [
    {
        "id": "tipo_restaurante",
        "text": "¿Tipo de establecimiento?",
        "tipo": "single_choice",
        "opciones": [
            {"id": "comida_rapida", "label": "Comida rápida"},
            {"id": "casual", "label": "Casual dining"},
            {"id": "fine_dining", "label": "Fine dining"},
        ]
    },
    {
        "id": "cobertura_diaria",
        "text": "¿Cobertura diaria (clientes/día)?",
        "tipo": "single_choice",
        "opciones": [
            {"id": "50_200", "label": "50-200"},
            {"id": "201_500", "label": "201-500"},
            {"id": "500_plus", "label": "Más de 500"},
        ]
    },
]


TREE_CONFIGS = {
    "construccion": {
        "questions": CONSTRUCCION_QUESTIONS,
        "isic": "4120",
        "isic_desc": "Construcción de edificios",
    },
    "hospital": {
        "questions": HOSPITAL_QUESTIONS,
        "isic": "8610",
        "isic_desc": "Actividades de hospitalización",
    },
    "comercio": {
        "questions": COMERCIO_QUESTIONS,
        "isic": "4711",
        "isic_desc": "Comercio al por menor",
    },
    "restaurante": {
        "questions": RESTAURANTE_QUESTIONS,
        "isic": "5610",
        "isic_desc": "Expendio de comidas",
    },
}


# Residue estimation factors (tons/month baseline + multipliers)
RESIDUE_FACTORS = {
    "construccion": {
        "base_tons_mes": 10.0,
        "by_tipo_obra": {
            "vivienda": 1.0,
            "comercial": 1.5,
            "ambas": 1.2,
        },
        "by_proyectos": {
            "1_5": 1.0,
            "6_20": 2.5,
            "20_plus": 5.0,
        },
        "by_viviendas": {
            "1_10": 1.0,
            "11_50": 2.0,
            "50_plus": 4.0,
        },
        "materials": {
            "concreto": 0.45,  # % of total
            "acero": 0.10,
            "madera": 0.15,
            "vidrio": 0.08,
            "plastico": 0.12,
            "otros": 0.10,
        }
    },
    "hospital": {
        "base_tons_mes": 5.0,
        "by_tipo_hospital": {
            "general": 1.5,
            "especializado": 2.0,
            "clinica": 1.0,
        },
        "by_camas": {
            "1_50": 1.0,
            "51_200": 2.0,
            "200_plus": 4.0,
        },
        "materials": {
            "papel": 0.35,
            "plastico": 0.30,
            "vidrio": 0.15,
            "metal": 0.10,
            "otros": 0.10,
        }
    },
    "comercio": {
        "base_tons_mes": 3.0,
        "by_tipo_comercio": {
            "tienda": 1.0,
            "supermercado": 3.0,
            "oficina": 0.5,
            "centro_comercial": 2.0,
        },
        "by_area": {
            "1_500": 1.0,
            "501_2000": 2.0,
            "2000_plus": 4.0,
        },
        "materials": {
            "papel": 0.35,
            "plastico": 0.25,
            "carton": 0.25,
            "metal": 0.10,
            "otros": 0.05,
        }
    },
    "restaurante": {
        "base_tons_mes": 2.0,
        "by_tipo": {
            "comida_rapida": 1.0,
            "casual": 1.5,
            "fine_dining": 2.0,
        },
        "by_cobertura": {
            "50_200": 1.0,
            "201_500": 2.0,
            "500_plus": 3.0,
        },
        "materials": {
            "organico": 0.50,
            "papel": 0.20,
            "plastico": 0.15,
            "vidrio": 0.10,
            "metal": 0.05,
        }
    },
}


def get_questions_for_tree(tree_type: str) -> List[Dict[str, Any]]:
    """Get questionnaire for a tree type."""
    config = TREE_CONFIGS.get(tree_type)
    if not config:
        return []
    return config["questions"]


def estimate_residues(tree_type: str, answers: Dict[str, Any]) -> Dict[str, Any]:
    """Estimate monthly residue generation based on answers."""

    factors = RESIDUE_FACTORS.get(tree_type)
    if not factors:
        return {"error": "Unknown tree type"}

    base_tons = factors.get("base_tons_mes", 1.0)
    multiplier = 1.0

    # Apply answer-based multipliers
    if tree_type == "construccion":
        tipo_obra = answers.get("tipo_obra")
        multiplier *= factors["by_tipo_obra"].get(tipo_obra, 1.0)

        proyectos = answers.get("proyectos_anio")
        multiplier *= factors["by_proyectos"].get(proyectos, 1.0)

        viviendas = answers.get("promedio_viviendas")
        if viviendas and tipo_obra in ["vivienda", "ambas"]:
            multiplier *= factors["by_viviendas"].get(viviendas, 1.0)

    elif tree_type == "hospital":
        tipo = answers.get("tipo_hospital")
        multiplier *= factors["by_tipo_hospital"].get(tipo, 1.0)

        camas = answers.get("camas")
        multiplier *= factors["by_camas"].get(camas, 1.0)

    elif tree_type == "comercio":
        tipo = answers.get("tipo_comercio")
        multiplier *= factors["by_tipo_comercio"].get(tipo, 1.0)

        area = answers.get("area_m2")
        multiplier *= factors["by_area"].get(area, 1.0)

    elif tree_type == "restaurante":
        tipo = answers.get("tipo_restaurante")
        multiplier *= factors["by_tipo"].get(tipo, 1.0)

        cobertura = answers.get("cobertura_diaria")
        multiplier *= factors["by_cobertura"].get(cobertura, 1.0)

    estimated_tons = base_tons * multiplier

    # Calculate material breakdown
    materials = factors.get("materials", {})
    materials_breakdown = {
        mat: round(estimated_tons * pct, 2)
        for mat, pct in materials.items()
    }

    return {
        "residue_generation_tons_mes": round(estimated_tons, 2),
        "residue_breakdown": materials_breakdown,
        "materiales_generados": list(materials.keys()),
        "estimation_confidence_pct": 75.0,  # Conservative estimate
        "factors_applied": {
            "base_tons": base_tons,
            "multiplier": multiplier,
        }
    }


def generate_compliance_guide(tree_type: str, answers: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a compliance guide based on tree type and answers."""

    # Map tree types to relevant regulations
    regulations_map = {
        "construccion": [
            "NOM-083-SEMARNAT (Residuos de construcción)",
            "LGEEPA (Ley General del Equilibrio Ecológico)",
            "Normativa municipal de residuos",
        ],
        "hospital": [
            "NOM-087-SEMARNAT (Residuos peligrosos hospitalarios)",
            "LGEEPA",
            "Reglamento de Bio-seguridad",
        ],
        "comercio": [
            "NOM-083-SEMARNAT (Residuos sólidos urbanos)",
            "LGPGIR (Ley General para la Prevención y Gestión Integral de Residuos)",
        ],
        "restaurante": [
            "NOM-083-SEMARNAT",
            "Normativa de manejo de residuos orgánicos",
            "Salud pública municipal",
        ],
    }

    config = TREE_CONFIGS.get(tree_type)
    if not config:
        return {"error": "Unknown tree type"}

    guide = {
        "tree_type": tree_type,
        "titulo": f"Guía de Cumplimiento — {config['isic_desc']}",
        "isic": config["isic"],
        "sections": [
            {
                "id": "clasificacion",
                "titulo": "Clasificación de tu empresa",
                "contenido": f"Según ISIC: {config['isic']} — {config['isic_desc']}",
            },
            {
                "id": "residues",
                "titulo": "Residuos que generas",
                "contenido": "Basado en tus respuestas, generarás aproximadamente...",
            },
            {
                "id": "regulations",
                "titulo": "Normativa aplicable",
                "regulations": regulations_map.get(tree_type, []),
            },
            {
                "id": "best_practices",
                "titulo": "Mejores prácticas",
                "practices": [
                    "Segregación en origen de residuos reciclables",
                    "Almacenamiento temporal adecuado",
                    "Capacitación del personal",
                    "Mantener registros de generación",
                ],
            },
        ],
        "resources": [
            {
                "titulo": "SEMARNAT — Portal de Residuos",
                "url": "https://www.gob.mx/semarnat",
            },
            {
                "titulo": "INEGI — Clasificación ISIC",
                "url": "https://www.inegi.org.mx",
            },
        ],
    }

    return guide
