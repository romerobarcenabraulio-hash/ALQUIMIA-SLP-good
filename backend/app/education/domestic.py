"""Calculadora domestica trazable para educacion ciudadana."""
from __future__ import annotations

from app.education.schemas import (
    CalculationAnnexItem,
    DataSource,
    DomesticEducationResult,
    EducationStatus,
    HouseholdEducationRequest,
    HouseholdRecommendation,
    PropertyType,
    WasteSeparationCategory,
)


DEFAULT_GENERATION_SOURCE = DataSource(
    source_id="semarnat-dbgir-generacion-percapita-mx",
    name="Generacion per capita de RSU en Mexico",
    organization="SEMARNAT DBGIR",
    source_type="referencia_oficial_contextual",
    unit="kg/persona/dia",
    confidence=0.72,
    explanation=(
        "Referencia nacional usada como punto de partida ciudadano; debe ajustarse "
        "cuando exista dato municipal medido."
    ),
)

DEFAULT_GENERATION_KG_PERSON_DAY = 0.94

COMPOSITION = {
    "organico": {
        "label": "Organicos",
        "share": 0.45,
        "examples": ["restos de comida", "cascaras", "residuos de jardin"],
        "why": "Separarlos reduce malos olores y permite compostaje o tratamiento.",
    },
    "papel_carton": {
        "label": "Papel y carton",
        "share": 0.20,
        "examples": ["cajas", "hojas", "empaques limpios"],
        "why": "Cuando llega seco y limpio conserva mas valor para reciclaje.",
    },
    "plastico_metal": {
        "label": "Plasticos y metales",
        "share": 0.20,
        "examples": ["botellas", "latas", "envases limpios"],
        "why": "Separarlos evita que se mezclen con restos de comida y mejora su aprovechamiento.",
    },
    "vidrio": {
        "label": "Vidrio",
        "share": 0.05,
        "examples": ["frascos", "botellas de vidrio"],
        "why": "Separarlo reduce riesgos de corte y facilita acopio seguro.",
    },
    "no_valorizable": {
        "label": "No valorizable domestico",
        "share": 0.10,
        "examples": ["servilletas sucias", "envolturas contaminadas", "polvo de barrido"],
        "why": "Identificarlo ayuda a no contaminar los materiales que si pueden recuperarse.",
    },
}

PROPERTY_GUIDANCE: dict[PropertyType, HouseholdRecommendation] = {
    PropertyType.casa: HouseholdRecommendation(
        property_type=PropertyType.casa,
        title="Casa: separacion simple cerca de cocina y patio",
        what_to_separate=["organicos", "reciclables limpios", "no valorizable domestico"],
        where_to_place=[
            "Bote pequeno con tapa para organicos en cocina.",
            "Costal o caja seca para papel, carton, plasticos, metales y vidrio.",
            "Bote separado para lo que no se puede recuperar.",
        ],
        why="La casa suele tener mas espacio para separar desde el origen sin complicar la rutina.",
        not_legal_obligation="Es una recomendacion educativa; cualquier regla formal requiere revision municipal competente.",
    ),
    PropertyType.edificio: HouseholdRecommendation(
        property_type=PropertyType.edificio,
        title="Edificio: separacion compacta y punto comun claro",
        what_to_separate=["organicos cerrados", "reciclables limpios", "vidrio separado si hay espacio"],
        where_to_place=[
            "Contenedor ventilado o cerrado por piso para organicos.",
            "Punto comun seco y senalizado para reciclables.",
            "Franja horaria de bajada para evitar bolsas mezcladas.",
        ],
        why="En edificios importa que el sistema sea pequeno, visible y facil de repetir.",
        not_legal_obligation="Es una guia ciudadana para organizar el edificio; no crea cobros ni procedimientos.",
    ),
    PropertyType.condominio: HouseholdRecommendation(
        property_type=PropertyType.condominio,
        title="Condominio: acuerdos vecinales y area comun de acopio",
        what_to_separate=["organicos", "reciclables por material", "no valorizable domestico"],
        where_to_place=[
            "Isla de separacion en area comun con responsables por turno.",
            "Contenedor cerrado para organicos y calendario de retiro.",
            "Espacio seco para carton y envases limpios.",
        ],
        why="El condominio necesita reglas de convivencia claras y contenedores faciles de mantener.",
        not_legal_obligation="Es una recomendacion de organizacion vecinal para facilitar la separacion.",
    ),
    PropertyType.residencial: HouseholdRecommendation(
        property_type=PropertyType.residencial,
        title="Residencial: separacion por vivienda y acopio programado",
        what_to_separate=["organicos", "reciclables secos", "voluminosos domesticos no regulados"],
        where_to_place=[
            "Botes por vivienda para organicos y reciclables secos.",
            "Punto de acopio temporal para carton y envases limpios.",
            "Calendario vecinal para materiales voluminosos domesticos no regulados.",
        ],
        why="Un residencial puede coordinar volumen suficiente para rutas o acopios mas ordenados.",
        not_legal_obligation="Es orientacion educativa; cualquier regla formal requiere base municipal validada.",
    ),
}

CONTAINER_BY_PROPERTY: dict[PropertyType, dict[str, str]] = {
    PropertyType.casa: {
        "organico": "Bote con tapa cerca de cocina.",
        "papel_carton": "Caja o bolsa seca bajo techo.",
        "plastico_metal": "Bolsa transparente o costal limpio.",
        "vidrio": "Caja rigida separada para evitar cortes.",
        "no_valorizable": "Bote separado para salida ordinaria.",
    },
    PropertyType.edificio: {
        "organico": "Contenedor pequeno por piso o cuarto de basura ventilado.",
        "papel_carton": "Punto seco comun con senal clara.",
        "plastico_metal": "Contenedor comun para envases limpios.",
        "vidrio": "Caja rigida en punto comun si existe espacio seguro.",
        "no_valorizable": "Contenedor ordinario separado de reciclables.",
    },
    PropertyType.condominio: {
        "organico": "Contenedor cerrado en isla comun.",
        "papel_carton": "Area seca comun con acomodo plano de carton.",
        "plastico_metal": "Jaula, costal o contenedor comun para envases.",
        "vidrio": "Caja rigida rotulada en area de acopio.",
        "no_valorizable": "Contenedor ordinario lejos del material recuperable.",
    },
    PropertyType.residencial: {
        "organico": "Bote por vivienda y punto vecinal de retiro.",
        "papel_carton": "Acopio seco programado por calle o cluster.",
        "plastico_metal": "Costal o contenedor seco por vivienda.",
        "vidrio": "Punto vecinal seguro, separado de areas de paso.",
        "no_valorizable": "Bote ordinario; no mezclar con reciclables limpios.",
    },
}


def calculate_domestic_education(request: HouseholdEducationRequest) -> DomesticEducationResult:
    source = request.source or DEFAULT_GENERATION_SOURCE
    generation = request.generation_kg_per_person_day

    if request.household_members is None:
        return DomesticEducationResult(
            status=EducationStatus.blocked,
            property_type=request.property_type,
            household_members=None,
            days=request.days,
            total_generation_kg=None,
            source=source,
            confidence=0,
            categories=[],
            recommendation=None,
            result_help_text="No se calcula generacion del hogar sin numero de personas.",
            chart_help_text="La grafica se oculta porque falta un dato critico.",
            calculation_annex=[],
            blockers=["Falta el numero de personas que viven en el hogar."],
            next_action="Captura cuantas personas viven normalmente en el hogar.",
        )

    warnings: list[str] = []
    if generation is None:
        generation = DEFAULT_GENERATION_KG_PERSON_DAY
        warnings.append(
            "Se uso una referencia nacional de generacion per capita; reemplazar por dato municipal medido cuando exista."
        )

    if source.confidence <= 0:
        return DomesticEducationResult(
            status=EducationStatus.blocked,
            property_type=request.property_type,
            household_members=request.household_members,
            days=request.days,
            total_generation_kg=None,
            source=source,
            confidence=0,
            categories=[],
            recommendation=None,
            result_help_text="La fuente de generacion no tiene confianza suficiente para calcular.",
            chart_help_text="La grafica se oculta porque la fuente no es utilizable.",
            calculation_annex=[],
            blockers=["Falta fuente valida con confianza mayor a cero."],
            next_action="Agrega una fuente de generacion kg/persona/dia con unidad y confianza.",
        )

    total = round(request.household_members * generation * request.days, 2)
    containers = CONTAINER_BY_PROPERTY[request.property_type]
    categories = [
        WasteSeparationCategory(
            key=key,
            label=str(meta["label"]),
            examples=list(meta["examples"]),
            container_guidance=containers[key],
            why_it_matters=str(meta["why"]),
            share_pct=float(meta["share"]),
            estimated_kg_period=round(total * float(meta["share"]), 2),
            help_text=(
                "Este peso es una estimacion para orientar separacion en casa; "
                "no mide una bolsa real ni debe usarse para cobros."
            ),
        )
        for key, meta in COMPOSITION.items()
    ]

    annex = [
        CalculationAnnexItem(
            calculation_name="Generacion domestica estimada",
            formula="personas_en_hogar * kg_por_persona_dia * dias",
            inputs={
                "personas_en_hogar": request.household_members,
                "kg_por_persona_dia": generation,
                "dias": request.days,
            },
            result=total,
            unit="kg/periodo",
            source=source,
            explanation=(
                "Estima cuantos kilogramos de RSU domestico genera el hogar en el periodo "
                "seleccionado para dimensionar separacion y contenedores."
            ),
        )
    ]
    annex.extend(
        CalculationAnnexItem(
            calculation_name=f"Estimacion por categoria: {category.label}",
            formula="generacion_total_kg * participacion_categoria",
            inputs={
                "generacion_total_kg": total,
                "participacion_categoria": category.share_pct,
            },
            result=category.estimated_kg_period,
            unit="kg/periodo",
            source=source,
            explanation=(
                "Distribuye la generacion estimada por categoria domestica para explicar "
                "que separar y donde colocarlo."
            ),
        )
        for category in categories
    )

    return DomesticEducationResult(
        status=EducationStatus.warning if warnings else EducationStatus.ready,
        property_type=request.property_type,
        household_members=request.household_members,
        days=request.days,
        total_generation_kg=total,
        source=source,
        confidence=source.confidence,
        categories=categories,
        recommendation=PROPERTY_GUIDANCE[request.property_type],
        result_help_text=(
            "El resultado muestra una estimacion educativa de RSU domestico para organizar separacion; "
            "no incluye residuos peligrosos, especiales o regulados."
        ),
        chart_help_text=(
            "La grafica reparte el total estimado por tipo de material. Sirve para decidir "
            "contenedores y habitos; no debe leerse como medicion exacta."
        ),
        calculation_annex=annex,
        warnings=warnings,
        next_action="Revisar recomendaciones de separacion y ajustar la fuente si existe dato municipal medido.",
    )
