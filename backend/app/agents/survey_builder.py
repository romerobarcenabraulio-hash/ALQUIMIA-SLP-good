"""
SurveyBuilder — Generador de encuestas social/demográficas (Wave 1).

Crea una SurveyTemplate para el módulo de Riesgos del municipio activo,
enfocada en percepción ciudadana sobre higiene, residuos y calidad de vida.

La encuesta sirve para:
1. Validar en campo los riesgos detectados por los agentes.
2. Obtener datos primarios para apoyar decisiones de localización de CAs.
3. Medir línea base de participación ciudadana en separación.
"""
from __future__ import annotations

import uuid
from typing import List, Optional

from app.agents.schemas import SurveyPregunta, SurveyTemplate


# ─── Banco de preguntas por categoría ────────────────────────────────────────

_PREGUNTAS_BASALES: List[dict] = [
    # SECCIÓN: Datos socioeconómicos
    {
        "texto": "¿En cuántos miembros está conformado su hogar?",
        "tipo": "opcion_multiple",
        "opciones": ["1-2 personas", "3-4 personas", "5-6 personas", "7 o más personas"],
        "seccion": "Datos del hogar",
        "obligatoria": True,
    },
    {
        "texto": "¿Cuántas bolsas de basura genera su hogar por semana?",
        "tipo": "opcion_multiple",
        "opciones": ["1 bolsa", "2-3 bolsas", "4-5 bolsas", "Más de 5 bolsas"],
        "seccion": "Datos del hogar",
        "obligatoria": True,
    },
    # SECCIÓN: Separación y reciclaje
    {
        "texto": "¿Actualmente separa los residuos en su hogar (orgánicos, reciclables, otros)?",
        "tipo": "opcion_multiple",
        "opciones": ["Sí, siempre", "Sí, a veces", "No, no tengo costumbre", "No, no sé cómo hacerlo"],
        "seccion": "Separación y reciclaje",
        "obligatoria": True,
    },
    {
        "texto": "¿Qué materiales separa para reciclar? (puede seleccionar varios)",
        "tipo": "opcion_multiple",
        "opciones": ["Plástico PET", "Cartón/papel", "Vidrio", "Metal/aluminio", "Orgánicos/composta", "Ninguno"],
        "seccion": "Separación y reciclaje",
        "obligatoria": False,
    },
    {
        "texto": "Si hubiera un Centro de Acopio de reciclables cerca de su casa, ¿lo utilizaría?",
        "tipo": "opcion_multiple",
        "opciones": ["Definitivamente sí", "Probablemente sí", "Probablemente no", "Definitivamente no"],
        "seccion": "Separación y reciclaje",
        "obligatoria": True,
    },
    # SECCIÓN: Percepción de limpieza pública
    {
        "texto": "En general, ¿cómo calificaría la limpieza de las calles en su colonia?",
        "tipo": "escala_likert",
        "opciones": ["1 - Muy sucia", "2", "3 - Regular", "4", "5 - Muy limpia"],
        "seccion": "Percepción de limpieza",
        "obligatoria": True,
    },
    {
        "texto": "¿Con qué frecuencia pasa el camión de basura por su colonia?",
        "tipo": "opcion_multiple",
        "opciones": ["Todos los días", "3-4 veces por semana", "1-2 veces por semana", "Menos de una vez por semana", "No pasa regularmente"],
        "seccion": "Percepción de limpieza",
        "obligatoria": True,
    },
    {
        "texto": "¿Ha visto tiraderos clandestinos (basura tirada en terrenos, baldíos o ríos) en su colonia?",
        "tipo": "opcion_multiple",
        "opciones": ["Sí, frecuentemente", "Sí, ocasionalmente", "Rara vez", "Nunca"],
        "seccion": "Percepción de limpieza",
        "obligatoria": True,
    },
    # SECCIÓN: Salud y calidad de vida
    {
        "texto": "¿Considera que la acumulación de basura en su colonia afecta la salud de su familia?",
        "tipo": "escala_likert",
        "opciones": ["1 - No afecta nada", "2", "3 - Afecta moderadamente", "4", "5 - Afecta gravemente"],
        "seccion": "Salud y calidad de vida",
        "obligatoria": True,
    },
    {
        "texto": "¿Ha presentado usted o algún familiar problemas de salud que relacione con la basura o fauna nociva?",
        "tipo": "opcion_multiple",
        "opciones": ["Sí, en el último año", "Sí, hace más de un año", "No, nunca", "No sé"],
        "seccion": "Salud y calidad de vida",
        "obligatoria": False,
    },
    # SECCIÓN: Disposición a participar
    {
        "texto": "¿Estaría dispuesto/a a pagar una cuota mensual adicional ($30-$80 MXN) si garantizara mejor servicio de recolección y reciclaje?",
        "tipo": "opcion_multiple",
        "opciones": ["Sí, definitivamente", "Sí, dependiendo del servicio", "Probablemente no", "No"],
        "seccion": "Disposición ciudadana",
        "obligatoria": True,
    },
    {
        "texto": "¿Participaría en talleres de educación ambiental o compostaje organizados por el municipio?",
        "tipo": "opcion_multiple",
        "opciones": ["Sí, con mucho gusto", "Tal vez", "Solo si son cortos y cercanos", "No me interesa"],
        "seccion": "Disposición ciudadana",
        "obligatoria": False,
    },
    # SECCIÓN: Opinión sobre el programa
    {
        "texto": "¿Qué tan importante considera que el municipio establezca un programa formal de reciclaje?",
        "tipo": "escala_likert",
        "opciones": ["1 - No es prioridad", "2", "3 - Moderadamente importante", "4", "5 - Muy importante"],
        "seccion": "Opinión sobre el programa",
        "obligatoria": True,
    },
    {
        "texto": "¿Qué obstáculo considera el más importante para reciclar en su casa? (seleccione el principal)",
        "tipo": "opcion_multiple",
        "opciones": [
            "No sé qué se puede reciclar",
            "No hay dónde llevar los materiales",
            "No tengo espacio para separar",
            "No tengo tiempo",
            "No creo que sirva de algo",
            "Ya lo hago sin obstáculos",
        ],
        "seccion": "Opinión sobre el programa",
        "obligatoria": True,
    },
    # SECCIÓN: Comentarios abiertos
    {
        "texto": "¿Tiene algún comentario, sugerencia o queja sobre el servicio de limpieza en su colonia?",
        "tipo": "abierta",
        "opciones": [],
        "seccion": "Comentarios",
        "obligatoria": False,
    },
]

# Preguntas adicionales para riesgos específicos
_PREGUNTAS_RIESGO: dict = {
    "residuos_peligrosos": {
        "texto": "¿Sabe dónde desechar baterías, pilas, aceite de motor o medicamentos vencidos?",
        "tipo": "opcion_multiple",
        "opciones": ["Sí, conozco un punto de acopio", "Sí pero es muy lejos", "No, los tiro con la basura normal", "No sé cómo deshacerme de ellos"],
        "seccion": "Riesgos ambientales",
        "obligatoria": False,
    },
    "tiraderos": {
        "texto": "¿Podría indicar la calle o colonia donde ha observado tiraderos clandestinos?",
        "tipo": "abierta",
        "opciones": [],
        "seccion": "Riesgos ambientales",
        "obligatoria": False,
    },
    "fauna_nociva": {
        "texto": "¿Ha observado ratas, cucarachas u otra fauna nociva cerca de acumulaciones de basura en su colonia?",
        "tipo": "opcion_multiple",
        "opciones": ["Sí, frecuentemente", "Sí, ocasionalmente", "Rara vez", "No"],
        "seccion": "Salud y calidad de vida",
        "obligatoria": False,
    },
}


# ─── Builder ─────────────────────────────────────────────────────────────────

def build_survey(
    municipio: str,
    zm: str,
    riesgos_detectados: Optional[List[str]] = None,
    preguntas_extra: Optional[List[dict]] = None,
) -> SurveyTemplate:
    """
    Construye una SurveyTemplate completa para el municipio dado.

    Args:
        municipio: nombre del municipio
        zm: zona metropolitana
        riesgos_detectados: lista de códigos de riesgo (ej: ['residuos_peligrosos', 'tiraderos'])
        preguntas_extra: preguntas adicionales en formato dict (misma estructura que _PREGUNTAS_BASALES)
    """
    riesgos = riesgos_detectados or []
    preguntas: List[SurveyPregunta] = []

    # 1. Preguntas base
    for p in _PREGUNTAS_BASALES:
        preguntas.append(SurveyPregunta(
            pregunta_id=str(uuid.uuid4())[:8],
            texto=p["texto"],
            tipo=p["tipo"],
            opciones=p.get("opciones", []),
            obligatoria=p.get("obligatoria", True),
            seccion=p.get("seccion", ""),
        ))

    # 2. Preguntas según riesgos detectados
    for riesgo in riesgos:
        if riesgo in _PREGUNTAS_RIESGO:
            p = _PREGUNTAS_RIESGO[riesgo]
            preguntas.append(SurveyPregunta(
                pregunta_id=str(uuid.uuid4())[:8],
                texto=p["texto"],
                tipo=p["tipo"],
                opciones=p.get("opciones", []),
                obligatoria=p.get("obligatoria", False),
                seccion=p.get("seccion", "Riesgos ambientales"),
            ))

    # 3. Preguntas adicionales (custom)
    for p in (preguntas_extra or []):
        preguntas.append(SurveyPregunta(
            pregunta_id=str(uuid.uuid4())[:8],
            texto=p.get("texto", ""),
            tipo=p.get("tipo", "abierta"),
            opciones=p.get("opciones", []),
            obligatoria=p.get("obligatoria", False),
            seccion=p.get("seccion", "Adicional"),
        ))

    return SurveyTemplate(
        titulo=f"Encuesta de Percepción Ciudadana sobre Residuos Sólidos — {municipio}",
        descripcion=(
            f"Esta encuesta es parte del Programa Municipal de Gestión de Residuos Sólidos "
            f"de {municipio}. Los resultados servirán para mejorar el servicio de recolección "
            f"y planificar el programa de reciclaje en su comunidad."
        ),
        municipio=municipio,
        zm=zm,
        riesgos_detectados=riesgos,
        preguntas=preguntas,
    )
