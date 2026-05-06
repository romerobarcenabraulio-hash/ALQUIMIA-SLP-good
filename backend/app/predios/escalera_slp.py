"""
Escalera orientativa — SLP capital únicamente (sprint 1).
Artículos [PENDIENTE VERIFICACIÓN CLC] hasta confirmación legal.
"""

from app.predios.schemas import EscaleraSancion, NivelSancion, TipoInfraccionPredia

PENDIENTE_ART = "[PENDIENTE VERIFICACIÓN CLC]"
FUENTE_BASE = "Reglamento de Aseo Público — SLP capital (texto y artículos sujetos a verificación CLC)"
# MXN — referencia INEGI DOF feb 2026 (placeholder operativo). Fuente única sprint Q-016: expuesta vía GET
# /predios/catalogo/sanciones-slp campo `valor_uma_referencia_mxn`; no cambiar sin línea CSA/Auditor.
VALOR_UMA_2026 = 108.57

# Orden: de menor a mayor severidad dentro de cada tipo (se usa la primera fila si no hay sugerido).
ESCALERA_SLP: list[EscaleraSancion] = [
    EscaleraSancion(
        municipio_id="slp",
        articulo_reglamento=PENDIENTE_ART,
        descripcion_infraccion=TipoInfraccionPredia.basura_clandestina,
        nivel=NivelSancion.aviso,
        uma_minimo=0.5,
        uma_maximo=1.0,
        genera_clausura=False,
        fuente_reglamento=FUENTE_BASE,
        verificado_clc=False,
    ),
    EscaleraSancion(
        municipio_id="slp",
        articulo_reglamento=PENDIENTE_ART,
        descripcion_infraccion=TipoInfraccionPredia.basura_clandestina,
        nivel=NivelSancion.advertencia,
        uma_minimo=1.0,
        uma_maximo=3.0,
        genera_clausura=False,
        fuente_reglamento=FUENTE_BASE,
        verificado_clc=False,
    ),
    EscaleraSancion(
        municipio_id="slp",
        articulo_reglamento=PENDIENTE_ART,
        descripcion_infraccion=TipoInfraccionPredia.basura_clandestina,
        nivel=NivelSancion.multa_menor,
        uma_minimo=3.0,
        uma_maximo=10.0,
        genera_clausura=False,
        fuente_reglamento=FUENTE_BASE,
        verificado_clc=False,
    ),
    EscaleraSancion(
        municipio_id="slp",
        articulo_reglamento=PENDIENTE_ART,
        descripcion_infraccion=TipoInfraccionPredia.ca_sin_permiso,
        nivel=NivelSancion.multa_media,
        uma_minimo=10.0,
        uma_maximo=30.0,
        genera_clausura=False,
        fuente_reglamento=f"{FUENTE_BASE}; clausura posible en caso de reincidencia [PENDIENTE CLC]",
        verificado_clc=False,
    ),
    EscaleraSancion(
        municipio_id="slp",
        articulo_reglamento=PENDIENTE_ART,
        descripcion_infraccion=TipoInfraccionPredia.mezcla_residuos_no_autorizada,
        nivel=NivelSancion.aviso,
        uma_minimo=0.5,
        uma_maximo=0.5,
        genera_clausura=False,
        fuente_reglamento=FUENTE_BASE,
        verificado_clc=False,
    ),
    EscaleraSancion(
        municipio_id="slp",
        articulo_reglamento=PENDIENTE_ART,
        descripcion_infraccion=TipoInfraccionPredia.vertedero_no_autorizado,
        nivel=NivelSancion.multa_maxima,
        uma_minimo=30.0,
        uma_maximo=100.0,
        genera_clausura=True,
        fuente_reglamento=FUENTE_BASE,
        verificado_clc=False,
    ),
    EscaleraSancion(
        municipio_id="slp",
        articulo_reglamento=PENDIENTE_ART,
        descripcion_infraccion=TipoInfraccionPredia.otro,
        nivel=NivelSancion.aviso,
        uma_minimo=0.5,
        uma_maximo=0.5,
        genera_clausura=False,
        fuente_reglamento=FUENTE_BASE,
        verificado_clc=False,
    ),
]


def elegir_escalera(
    tipo: TipoInfraccionPredia,
    nivel_sugerido: NivelSancion | None,
) -> EscaleraSancion:
    opciones = [e for e in ESCALERA_SLP if e.descripcion_infraccion == tipo]
    if not opciones:
        raise ValueError(f"Sin escalera para tipo {tipo}")
    if nivel_sugerido is not None:
        for row in opciones:
            if row.nivel == nivel_sugerido:
                return row
    return opciones[0]


EXPEDIENTE_DISCLAIMER_CORTO = (
    "[BORRADOR DE EXPEDIENTE TÉCNICO — no es acto de autoridad hasta firma del funcionario competente]"
)


def texto_disclaimer_completo() -> str:
    return (
        f"{EXPEDIENTE_DISCLAIMER_CORTO} "
        "Los artículos y montos orientativos no sustituyen el instrumento oficial publicado ni dictamen institucional. "
        "Sujeto a verificación jurídica (CLC)."
    )
