"""
Repositorio de reglamentos de limpia — NIVEL MUNICIPAL.

Principio rector: Una ZM no es un municipio.
La autoridad legal, política, presupuestal y contractual
vive municipio por municipio.

Municipios cubiertos:
  ZM SLP  (4): slp, sol, csp, vip
  ZM QRO  (4): qro, cor, mar, hui
  ZM MTY  (9): mty, spg, snl, gua, apo, sca, gar, esc, jua
  ZM GDL  (3): gdl, zap, tla
  Total:   20 municipios individuales

En producción: PostgreSQL con migraciones Alembic.
Ahora: dict en memoria seedeado con datos reales disponibles y
       datos honestos "No disponible" donde no existe información.
"""
from __future__ import annotations

from copy import deepcopy
from typing import Dict, List, Optional

from app.legal.schemas import (
    ArticuloMatriz, CategoriaArticulo, Criticidad,
    EstadoArticulo, Reglamento,
)

# ─── Artículos canónicos ──────────────────────────────────────────────────────

_CANONICAL: list[dict] = [
    {"numero": "Art. 1",  "titulo": "Objeto y ámbito de aplicación",         "categoria": CategoriaArticulo.separacion_origen,        "criticidad": Criticidad.alta},
    {"numero": "Art. 2",  "titulo": "Separación en la fuente",                "categoria": CategoriaArticulo.separacion_origen,        "criticidad": Criticidad.alta},
    {"numero": "Art. 3",  "titulo": "Recolección diferenciada",               "categoria": CategoriaArticulo.recoleccion_diferenciada, "criticidad": Criticidad.alta},
    {"numero": "Art. 4",  "titulo": "Centros de Acopio y Reciclaje (CAs)",    "categoria": CategoriaArticulo.recoleccion_diferenciada, "criticidad": Criticidad.alta},
    {"numero": "Art. 5",  "titulo": "Manejo de orgánicos y compostaje",       "categoria": CategoriaArticulo.disposicion_final,        "criticidad": Criticidad.alta},
    {"numero": "Art. 6",  "titulo": "Figura jurídica del reciclador de base", "categoria": CategoriaArticulo.pepenadores,              "criticidad": Criticidad.alta},
    {"numero": "Art. 7",  "titulo": "Tarifas diferenciadas por servicio",     "categoria": CategoriaArticulo.financiamiento,           "criticidad": Criticidad.alta},
    {"numero": "Art. 8",  "titulo": "Inversión y financiamiento",             "categoria": CategoriaArticulo.financiamiento,           "criticidad": Criticidad.media},
    {"numero": "Art. 9",  "titulo": "Participación ciudadana",                "categoria": CategoriaArticulo.participacion,            "criticidad": Criticidad.media},
    {"numero": "Art. 10", "titulo": "Monitoreo y transparencia",              "categoria": CategoriaArticulo.transparencia,            "criticidad": Criticidad.media},
    {"numero": "Art. 11", "titulo": "Sanciones ejecutables",                  "categoria": CategoriaArticulo.sanciones,                "criticidad": Criticidad.alta},
    {"numero": "Art. 12", "titulo": "Convenios intermunicipales",             "categoria": CategoriaArticulo.convenios,                "criticidad": Criticidad.baja},
]

_TEXTOS_PROPUESTOS = {
    "Art. 1":  "El presente reglamento regula la separación, recolección, transferencia, tratamiento y disposición final de los RSU generados en el municipio.",
    "Art. 2":  "Los generadores domiciliarios clasificarán sus residuos en orgánicos y materiales valorizables conforme a NOM-161-SEMARNAT-2011.",
    "Art. 3":  "El servicio de recolección operará con rutas diferenciadas por fracción en días y horarios del programa operativo anual.",
    "Art. 4":  (
        "El Ayuntamiento establecerá el registro y permisos de Centros de Acopio y puntos de recepción autorizados; "
        "queda prohibido concentrar RSU en predios sin autorización municipal. Los predios donde se acumulen RSU "
        "sin permiso se presumirán acopio no autorizado o microrvertedero; la autoridad ordenará saneamiento, "
        "retiro de residuos y aplicará multas y medidas administrativas conforme al tarifario. "
        "Las personas morales y grandes generadores deberán presentar declaración anual de corrientes de residuos "
        "y volúmenes estimados, en plazos y formatos homologados al trámite de registro de Centro de Acopio."
    ),
    "Art. 5":  "La fracción orgánica se destinará prioritariamente a compostaje o biogás. Se prohíbe su disposición en relleno cuando exista capacidad instalada.",
    "Art. 6":  "Se reconoce al reciclador de base como prestador de servicio ambiental. El municipio promoverá su incorporación a cooperativas formales.",
    "Art. 7":  "La Tesorería establecerá tarifas diferenciadas por estrato, volumen y nivel de separación. Ingresos al Fondo Municipal de Circularidad.",
    "Art. 8":  "El Presupuesto Municipal contemplará partida para inversión RSU. Se autorizan mecanismos de APP para CAs.",
    "Art. 9":  "El Comité Ciudadano de Residuos co-supervisará el programa y emitirá recomendaciones trimestrales al Cabildo.",
    "Art. 10": "El municipio publicará semestralmente: toneladas captadas, tasa desvío, ingresos y empleos. Datos interoperables con ALQUIMIA.",
    "Art. 11": (
        "Incumplimiento de separación en generadores comerciales e industriales: multa de 5 a 50 UMAs; "
        "reincidencia: suspensión de licencias de funcionamiento. "
        "Titulares de predios que mantengan basura o RSU acumulados sin autorización, o que operen equiparablemente "
        "a Centro de Acopio sin permiso, serán sancionados con multa, orden de limpieza y costos de retiro; "
        "en caso de daño ambiental manifiesto se aplicarán medidas adicionales previstas en la normativa municipal aplicable."
    ),
    "Art. 12": "El municipio podrá suscribir convenios de coordinación intermunicipal para infraestructura compartida de tratamiento RSU.",
}


def _article(
    idx: int,
    estado: EstadoArticulo,
    texto_actual: Optional[str] = None,
) -> ArticuloMatriz:
    c = _CANONICAL[idx]
    return ArticuloMatriz(
        numero=c["numero"],
        titulo=c["titulo"],
        categoria=c["categoria"],
        criticidad=c["criticidad"],
        estado=estado,
        texto_actual=texto_actual,
        texto_propuesto=_TEXTOS_PROPUESTOS[c["numero"]],
    )


def _todos_ausentes(fuente: str = "No disponible") -> list[ArticuloMatriz]:
    """Municipio sin reglamento propio verificable — todos los artículos ausentes."""
    return [_article(i, EstadoArticulo.ausente) for i in range(12)]


# ─── ZM SLP — 4 municipios ────────────────────────────────────────────────────

def _build_slp() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """
    San Luis Potosí (municipio capital). 912K hab.
    Reglamento 2018 — parcialmente desarrollado.
    Arts. 1/2/3 presentes pero obsoletos. Sin CAs, orgánicos, reciclador, tarifas diferenciadas.
    """
    reg = Reglamento(
        municipio_id="slp", zm="SLP",
        nombre="Reglamento de Limpia y Gestión Integral de Residuos Sólidos de San Luis Potosí",
        version="2018-A", fecha_publicacion="2018-03-15",
        fuente="POE", url="https://ordenjuridico.gob.mx/municipalslp/limpia2018.pdf",
        verificado=False, requiere_revision_juridica=True,
    )
    arts = [
        _article(0,  EstadoArticulo.presente_adecuado, "El Reglamento regula el servicio de limpia en el municipio de SLP."),
        _article(1,  EstadoArticulo.presente_obsoleto, "Los habitantes depositarán residuos en contenedores municipales."),
        _article(2,  EstadoArticulo.presente_obsoleto, "La recolección se realizará en los turnos que determine la Dirección de Servicios Primarios."),
        _article(3,  EstadoArticulo.ausente),
        _article(4,  EstadoArticulo.ausente),
        _article(5,  EstadoArticulo.ausente),
        _article(6,  EstadoArticulo.ausente),
        _article(7,  EstadoArticulo.presente_obsoleto, "El Presupuesto Municipal destinará recursos al servicio de limpia conforme a disponibilidad."),
        _article(8,  EstadoArticulo.presente_obsoleto, "Se promoverá la participación de la comunidad en campañas de limpieza."),
        _article(9,  EstadoArticulo.ausente),
        _article(10, EstadoArticulo.presente_obsoleto, "Infracciones sancionadas conforme al Bando de Policía y Buen Gobierno."),
        _article(11, EstadoArticulo.ausente),
    ]
    return reg, arts


def _build_sol() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """
    Soledad de Graciano Sánchez. 323K hab.
    No tiene reglamento propio de limpia — opera bajo acuerdo de mancomunidad
    con SLP pero sin instrumento jurídico propio verificado.
    Fuente no disponible: requiere revisión jurídica urgente.
    """
    reg = Reglamento(
        municipio_id="sol", zm="SLP",
        nombre="Sin reglamento propio — mancomunidad con SLP no formalizada",
        version="N/A", fecha_publicacion="—",
        fuente="No disponible", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    return reg, _todos_ausentes()


def _build_csp() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """
    Cerro de San Pedro. 4,278 hab. Micro-municipio.
    Sin reglamento propio de RSU. Aplica supletoriamente ley estatal.
    """
    reg = Reglamento(
        municipio_id="csp", zm="SLP",
        nombre="Sin reglamento municipal — aplica supletoriamente Ley Estatal RSU SLP",
        version="N/A", fecha_publicacion="—",
        fuente="No disponible", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    return reg, _todos_ausentes()


def _build_vip() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """
    Villa de Pozos. 3,422 hab. Micro-municipio.
    Sin reglamento propio de RSU. Aplica supletoriamente ley estatal.
    """
    reg = Reglamento(
        municipio_id="vip", zm="SLP",
        nombre="Sin reglamento municipal — aplica supletoriamente Ley Estatal RSU SLP",
        version="N/A", fecha_publicacion="—",
        fuente="No disponible", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    return reg, _todos_ausentes()


# ─── ZM QRO — 4 municipios ────────────────────────────────────────────────────

def _build_qro() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """
    Querétaro (municipio capital). 1.05M hab.
    Reglamento 2021 — bien desarrollado, verificado.
    Pendiente: Art. 5 (orgánicos sin mandato compostaje), Art. 11 (sanciones sin procedimiento ejecutivo).
    """
    reg = Reglamento(
        municipio_id="qro", zm="QRO",
        nombre="Reglamento de Limpia y Aseo Público del Municipio de Querétaro, Querétaro",
        version="2021-B", fecha_publicacion="2021-06-10",
        fuente="Portal reglamentario municipal", url="https://municipiodequeretaro.gob.mx/reglamento/",
        verificado=True, requiere_revision_juridica=False,
    )
    arts = [
        _article(0,  EstadoArticulo.presente_adecuado, "Reglamento en concordancia con la LGPGIR."),
        _article(1,  EstadoArticulo.presente_adecuado, "Separación obligatoria en orgánicos e inorgánicos."),
        _article(2,  EstadoArticulo.presente_adecuado, "Recolección diferenciada con camiones etiquetados en días alternos."),
        _article(3,  EstadoArticulo.presente_adecuado, "CAs bajo permiso municipal con reporte mensual de volúmenes."),
        _article(4,  EstadoArticulo.ausente),
        _article(5,  EstadoArticulo.presente_obsoleto, "Se reconocerá la labor de pepenadores en el relleno sanitario municipal."),
        _article(6,  EstadoArticulo.presente_obsoleto, "Cuotas del servicio revisadas anualmente sin diferenciación clara."),
        _article(7,  EstadoArticulo.presente_adecuado, "Al menos 5% del gasto de servicios a modernización RSU."),
        _article(8,  EstadoArticulo.presente_adecuado, "Consejo Ciudadano de Medio Ambiente supervisa el programa RSU."),
        _article(9,  EstadoArticulo.presente_adecuado, "IMPLAN publica indicadores RSU en portal de transparencia."),
        _article(10, EstadoArticulo.ausente),
        _article(11, EstadoArticulo.presente_adecuado, "Convenios metropolitanos para manejo regional de RSU autorizados."),
    ]
    return reg, arts


def _build_cor() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """
    Corregidora. 167K hab. Municipio industrial en crecimiento.
    Adoptó parcialmente el marco de Querétaro en 2020, pendiente actualización.
    """
    reg = Reglamento(
        municipio_id="cor", zm="QRO",
        nombre="Reglamento de Servicios Municipales — Capítulo de Limpia — Corregidora",
        version="2020-A", fecha_publicacion="2020-04-01",
        fuente="POE", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    arts = [
        _article(0,  EstadoArticulo.presente_adecuado, "El Capítulo de Limpia regula el servicio en el municipio de Corregidora."),
        _article(1,  EstadoArticulo.presente_obsoleto, "Los habitantes separarán residuos conforme a las indicaciones del servicio de limpia."),
        _article(2,  EstadoArticulo.presente_obsoleto, "Recolección en horarios establecidos por la Dirección de Servicios Públicos."),
        _article(3,  EstadoArticulo.ausente),
        _article(4,  EstadoArticulo.ausente),
        _article(5,  EstadoArticulo.ausente),
        _article(6,  EstadoArticulo.ausente),
        _article(7,  EstadoArticulo.presente_obsoleto, "El Ayuntamiento destinará recursos para el servicio de limpia."),
        _article(8,  EstadoArticulo.presente_obsoleto, "Se fomentará la cultura de la limpieza entre los habitantes."),
        _article(9,  EstadoArticulo.ausente),
        _article(10, EstadoArticulo.ausente),
        _article(11, EstadoArticulo.presente_obsoleto, "Infracciones según el Bando de Policía."),
    ]
    return reg, arts


def _build_mar() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """
    El Marqués. 154K hab. Zona industrial (parques FINSA, SAMSUNG).
    Reglamento mínimo, muy desactualizado — RSU industrial no regulado.
    """
    reg = Reglamento(
        municipio_id="mar", zm="QRO",
        nombre="Reglamento de Limpia Municipal de El Marqués",
        version="2015-A", fecha_publicacion="2015-09-15",
        fuente="POE", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    arts = [
        _article(0,  EstadoArticulo.presente_obsoleto, "El Reglamento regula el servicio de limpia en El Marqués."),
        _article(1,  EstadoArticulo.ausente),
        _article(2,  EstadoArticulo.presente_obsoleto, "Recolección domiciliaria en días asignados."),
        _article(3,  EstadoArticulo.ausente),
        _article(4,  EstadoArticulo.ausente),
        _article(5,  EstadoArticulo.ausente),
        _article(6,  EstadoArticulo.ausente),
        _article(7,  EstadoArticulo.ausente),
        _article(8,  EstadoArticulo.ausente),
        _article(9,  EstadoArticulo.ausente),
        _article(10, EstadoArticulo.ausente),
        _article(11, EstadoArticulo.ausente),
    ]
    return reg, arts


def _build_hui() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """
    Huimilpan. 34K hab. Municipio rural-periurbano.
    Sin reglamento propio de RSU. Servicio mínimo de recolección no diferenciada.
    """
    reg = Reglamento(
        municipio_id="hui", zm="QRO",
        nombre="Sin reglamento propio de RSU — aplica Ley Estatal de Residuos Sólidos QRO",
        version="N/A", fecha_publicacion="—",
        fuente="No disponible", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    return reg, _todos_ausentes()


# ─── ZM MTY — 9 municipios ────────────────────────────────────────────────────

def _build_mty() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """
    Monterrey (municipio central). 1.14M hab.
    Reglamento 2023 — el más desarrollado de la ZM.
    Conflicto jurisdiccional Art. 4: CAs vs SIMEPRODE.
    """
    reg = Reglamento(
        municipio_id="mty", zm="MTY",
        nombre="Reglamento de Limpia Municipal de Monterrey",
        version="2021", fecha_publicacion="Confirmar POE/Gaceta NL",
        fuente="Portal municipal Monterrey", url="https://www.monterrey.gob.mx/pdf/reglamentos/1/Reglamento_de_Limpia_Municipal_de_Monterrey.pdf",
        verificado=False, requiere_revision_juridica=True,
    )
    arts = [
        _article(0,  EstadoArticulo.presente_adecuado, "Reglamento en concordancia con la Ley de Gestión Integral de los Residuos del Estado de NL."),
        _article(1,  EstadoArticulo.presente_adecuado, "Separación obligatoria en tres fracciones: orgánicos, reciclables y no valorizables."),
        _article(2,  EstadoArticulo.presente_adecuado, "Sistema de recolección diferenciada con flota especializada por fracción."),
        _article(3,  EstadoArticulo.conflicto,         "CAs bajo concesión municipal, sin perjuicio de las atribuciones de SIMEPRODE."),
        _article(4,  EstadoArticulo.presente_adecuado, "Programa Municipal de Compostaje con meta del 40% de orgánicos al 2025."),
        _article(5,  EstadoArticulo.presente_adecuado, "Registro Municipal de Recicladores de Base con prestaciones sociales básicas."),
        _article(6,  EstadoArticulo.presente_adecuado, "Tarifas diferenciadas por generación: doméstica, comercial e industrial."),
        _article(7,  EstadoArticulo.presente_adecuado, "Fondo Metropolitano de Residuos financiado con ingresos de materiales valorizados."),
        _article(8,  EstadoArticulo.presente_adecuado, "Consejo Metropolitano de RSU con representación vecinal, empresarial y académica."),
        _article(9,  EstadoArticulo.presente_adecuado, "Tablero público de indicadores RSU actualizado en tiempo real."),
        _article(10, EstadoArticulo.presente_adecuado, "Multas 10-100 UMAs con procedimiento ejecutivo ante Juzgado Cívico Municipal."),
        _article(11, EstadoArticulo.presente_adecuado, "Convenio Marco Metropolitano para infraestructura compartida en 9 municipios del AMM."),
    ]
    return reg, arts


def _build_spg() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """
    San Pedro Garza García. 163K hab. Municipio de alto ingreso — el más avanzado de la ZM MTY.
    Fuente SISTEC corta de limpia localizada como candidato; pendiente cotejo POE/gaceta y armonización con
    reglamentos ambientales/zonificación previamente identificados. No declarar vigencia validada.
    """
    reg = Reglamento(
        municipio_id="spg", zm="MTY",
        nombre="Reglamento de Limpia de San Pedro Garza García — candidato SISTEC",
        version="en_revision", fecha_publicacion="Pendiente cotejo POE/gaceta SPGG",
        fuente="SISTEC NL", url="https://sistec.nl.gob.mx/Transparencia_2015/Archivos/AC-F0108-07-M020011171-01.pdf",
        verificado=False, requiere_revision_juridica=True,
    )
    arts = [
        _article(0,  EstadoArticulo.presente_adecuado, "Reglamento de vanguardia alineado a estándares internacionales GRI."),
        _article(1,  EstadoArticulo.presente_adecuado, "Separación en cinco fracciones: orgánicos, papel, plástico, vidrio, residuos no valorizables."),
        _article(2,  EstadoArticulo.presente_adecuado, "Flota diferenciada con chip de seguimiento GPS y pesaje por ruta."),
        _article(3,  EstadoArticulo.presente_adecuado, "Red de 4 CAs municipales con certificación de pureza semestral."),
        _article(4,  EstadoArticulo.presente_adecuado, "Planta de compostaje municipal con capacidad de 18 t/día."),
        _article(5,  EstadoArticulo.presente_adecuado, "Cooperativa municipal de recicladores con 87 miembros formalizados y IMSS."),
        _article(6,  EstadoArticulo.presente_adecuado, "Tarifa verde diferenciada con descuento al 30% para hogares con separación certificada."),
        _article(7,  EstadoArticulo.presente_adecuado, "Fondo Verde Municipal: 8% del presupuesto de servicios destinado a modernización RSU."),
        _article(8,  EstadoArticulo.presente_adecuado, "Observatorio Ciudadano de Residuos con sesiones públicas mensuales."),
        _article(9,  EstadoArticulo.presente_adecuado, "Dashboard público en tiempo real con métricas por colonia."),
        _article(10, EstadoArticulo.presente_adecuado, "Multas progresivas 20-200 UMAs con recurso ante Tribunal Municipal."),
        _article(11, EstadoArticulo.presente_adecuado, "Convenio bilateral activo con Monterrey para infraestructura compartida de compostaje."),
    ]
    return reg, arts


def _build_snl() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """
    San Nicolás de los Garza. 430K hab.
    Reglamento 2019 — moderado. Separación presente, CAs pendientes, sanciones débiles.
    """
    reg = Reglamento(
        municipio_id="snl", zm="MTY",
        nombre="Reglamento de Limpia y Manejo de Residuos Sólidos de San Nicolás de los Garza",
        version="2019-A", fecha_publicacion="2019-11-20",
        fuente="POE", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    arts = [
        _article(0,  EstadoArticulo.presente_adecuado, "Reglamento regula RSU en San Nicolás."),
        _article(1,  EstadoArticulo.presente_adecuado, "Separación domiciliaria en orgánicos e inorgánicos implementada."),
        _article(2,  EstadoArticulo.presente_adecuado, "Recolección diferenciada en rutas establecidas."),
        _article(3,  EstadoArticulo.ausente),
        _article(4,  EstadoArticulo.ausente),
        _article(5,  EstadoArticulo.presente_obsoleto, "Recolectores informales tolerados en relleno."),
        _article(6,  EstadoArticulo.presente_obsoleto, "Tarifas anuales sin diferenciación por separación."),
        _article(7,  EstadoArticulo.presente_adecuado, "Partida presupuestal específica para servicios de limpia."),
        _article(8,  EstadoArticulo.presente_obsoleto, "Programa anual de cultura ambiental."),
        _article(9,  EstadoArticulo.ausente),
        _article(10, EstadoArticulo.presente_obsoleto, "Multas menores según Reglamento de Policía."),
        _article(11, EstadoArticulo.presente_obsoleto, "Disposición general sobre coordinación estatal."),
    ]
    return reg, arts


def _build_gua() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """Guadalupe. 686K hab. Mayor municipio periférico MTY. Reglamento básico 2018."""
    reg = Reglamento(
        municipio_id="gua", zm="MTY",
        nombre="Reglamento de Limpia Municipal de Guadalupe, NL",
        version="2018-B", fecha_publicacion="2018-06-01",
        fuente="POE", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    arts = [
        _article(0,  EstadoArticulo.presente_adecuado,  "Reglamento regula limpia en Guadalupe NL."),
        _article(1,  EstadoArticulo.presente_obsoleto,  "Separación básica en dos contenedores."),
        _article(2,  EstadoArticulo.presente_obsoleto,  "Recolección en días fijos."),
        _article(3,  EstadoArticulo.ausente),
        _article(4,  EstadoArticulo.ausente),
        _article(5,  EstadoArticulo.ausente),
        _article(6,  EstadoArticulo.ausente),
        _article(7,  EstadoArticulo.presente_obsoleto,  "Presupuesto de servicios públicos."),
        _article(8,  EstadoArticulo.presente_obsoleto,  "Participación en campañas estatales."),
        _article(9,  EstadoArticulo.ausente),
        _article(10, EstadoArticulo.presente_obsoleto,  "Sanciones según Bando Municipal."),
        _article(11, EstadoArticulo.ausente),
    ]
    return reg, arts


def _build_apo() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """Apodaca. 643K hab. Zona industrial intensiva. Reglamento 2017 obsoleto."""
    reg = Reglamento(
        municipio_id="apo", zm="MTY",
        nombre="Reglamento de Servicios de Limpia de Apodaca, NL",
        version="2017-A", fecha_publicacion="2017-03-14",
        fuente="POE", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    arts = [
        _article(0,  EstadoArticulo.presente_obsoleto, "Reglamento regula limpia en Apodaca."),
        _article(1,  EstadoArticulo.ausente),
        _article(2,  EstadoArticulo.presente_obsoleto, "Recolección domiciliaria según calendario."),
        _article(3,  EstadoArticulo.ausente),
        _article(4,  EstadoArticulo.ausente),
        _article(5,  EstadoArticulo.ausente),
        _article(6,  EstadoArticulo.ausente),
        _article(7,  EstadoArticulo.presente_obsoleto, "Limpia contemplada en presupuesto."),
        _article(8,  EstadoArticulo.ausente),
        _article(9,  EstadoArticulo.ausente),
        _article(10, EstadoArticulo.ausente),
        _article(11, EstadoArticulo.ausente),
    ]
    return reg, arts


def _build_sca() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """Santa Catarina. 322K hab. Municipio industrial. Reglamento 2020."""
    reg = Reglamento(
        municipio_id="sca", zm="MTY",
        nombre="Reglamento de Gestión de Residuos Sólidos de Santa Catarina, NL",
        version="2020-B", fecha_publicacion="2020-08-12",
        fuente="POE", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    arts = [
        _article(0,  EstadoArticulo.presente_adecuado,  "Reglamento en línea con Ley RSU NL."),
        _article(1,  EstadoArticulo.presente_adecuado,  "Separación en orgánicos e inorgánicos."),
        _article(2,  EstadoArticulo.presente_adecuado,  "Rutas diferenciadas por fracción."),
        _article(3,  EstadoArticulo.ausente),
        _article(4,  EstadoArticulo.ausente),
        _article(5,  EstadoArticulo.presente_obsoleto,  "Reconocimiento informal de pepenadores."),
        _article(6,  EstadoArticulo.presente_obsoleto,  "Tarifa única con revisión anual."),
        _article(7,  EstadoArticulo.presente_adecuado,  "Partida específica RSU."),
        _article(8,  EstadoArticulo.presente_adecuado,  "Comité vecinal de limpia."),
        _article(9,  EstadoArticulo.ausente),
        _article(10, EstadoArticulo.presente_obsoleto,  "Multas según Bando."),
        _article(11, EstadoArticulo.presente_obsoleto,  "Coordinación con SIMEPRODE."),
    ]
    return reg, arts


def _build_gar() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """García. 278K hab. Crecimiento explosivo reciente. Reglamento mínimo 2021."""
    reg = Reglamento(
        municipio_id="gar", zm="MTY",
        nombre="Reglamento de Limpia de García, NL",
        version="2021-A", fecha_publicacion="2021-01-15",
        fuente="POE", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    arts = [
        _article(0,  EstadoArticulo.presente_adecuado,  "Reglamento de nueva creación para García."),
        _article(1,  EstadoArticulo.ausente),
        _article(2,  EstadoArticulo.presente_obsoleto,  "Recolección semanal sin diferenciación."),
        _article(3,  EstadoArticulo.ausente),
        _article(4,  EstadoArticulo.ausente),
        _article(5,  EstadoArticulo.ausente),
        _article(6,  EstadoArticulo.ausente),
        _article(7,  EstadoArticulo.presente_obsoleto,  "Limpia en presupuesto general."),
        _article(8,  EstadoArticulo.ausente),
        _article(9,  EstadoArticulo.ausente),
        _article(10, EstadoArticulo.ausente),
        _article(11, EstadoArticulo.ausente),
    ]
    return reg, arts


def _build_esc() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """General Escobedo. 436K hab. Reglamento 2018 básico, similar a Guadalupe."""
    reg = Reglamento(
        municipio_id="esc", zm="MTY",
        nombre="Reglamento de Servicios de Limpia de General Escobedo, NL",
        version="2018-C", fecha_publicacion="2018-10-05",
        fuente="POE", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    arts = [
        _article(0,  EstadoArticulo.presente_adecuado,  "Reglamento regula limpia en Escobedo."),
        _article(1,  EstadoArticulo.presente_obsoleto,  "Separación básica promovida."),
        _article(2,  EstadoArticulo.presente_obsoleto,  "Recolección en días fijos por colonia."),
        _article(3,  EstadoArticulo.ausente),
        _article(4,  EstadoArticulo.ausente),
        _article(5,  EstadoArticulo.ausente),
        _article(6,  EstadoArticulo.ausente),
        _article(7,  EstadoArticulo.presente_obsoleto,  "Partida presupuestal servicios."),
        _article(8,  EstadoArticulo.presente_obsoleto,  "Comité de colonos para campañas."),
        _article(9,  EstadoArticulo.ausente),
        _article(10, EstadoArticulo.presente_obsoleto,  "Multas según Reglamento de Policía."),
        _article(11, EstadoArticulo.ausente),
    ]
    return reg, arts


def _build_jua() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """Juárez NL. 276K hab. Crecimiento reciente. Sin reglamento dedicado a RSU diferenciado."""
    reg = Reglamento(
        municipio_id="jua", zm="MTY",
        nombre="Sin reglamento propio de RSU diferenciado — aplica Ley Estatal RSU NL",
        version="N/A", fecha_publicacion="—",
        fuente="No disponible", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    return reg, _todos_ausentes()


def _build_gdl() -> tuple[Reglamento, list[ArticuloMatriz]]:
    """Guadalajara — PDF oficial descargado/verificado por checksum; vigencia jurídica queda en revisión competente."""
    reg = Reglamento(
        municipio_id="gdl", zm="GDL",
        nombre="Reglamento de Gestión Integral del Municipio de Guadalajara",
        version="2016-consolidado-portal", fecha_publicacion="2016-07-15 + reformas posteriores por cotejar",
        fuente="Transparencia municipal Guadalajara", url="https://transparencia.guadalajara.gob.mx/sites/default/files/reglamentos/Reg.GestionIntegralMunicipioGuadalajara.pdf",
        verificado=False, requiere_revision_juridica=True,
    )
    return reg, _todos_ausentes()


def _build_zap() -> tuple[Reglamento, list[ArticuloMatriz]]:
    reg = Reglamento(
        municipio_id="zap", zm="GDL",
        nombre="Reglamento de Prevención y Gestión Integral de Residuos del Municipio de Zapopan, Jalisco",
        version="2024-10", fecha_publicacion="2024-10-15",
        fuente="Portal municipal Zapopan", url="https://servicios.zapopan.gob.mx:8000/wwwportal/publicfiles/descargasEnlaces/10-2024/Reglamento%20de%20Prevenci%C3%B3n%20y%20Gesti%C3%B3n%20Integral%20de%20Residuos%20del%20Municipio%20de%20Zapopan%2C%20Jalisco.pdf",
        verificado=False, requiere_revision_juridica=True,
    )
    return reg, _todos_ausentes()


def _build_tla() -> tuple[Reglamento, list[ArticuloMatriz]]:
    reg = Reglamento(
        municipio_id="tla", zm="GDL",
        nombre="Marco municipal de referencia RSU — Tlaquepaque",
        version="referencia", fecha_publicacion="—",
        fuente="placeholder_alquimia", url=None,
        verificado=False, requiere_revision_juridica=True,
    )
    return reg, _todos_ausentes()


# ─── Mapa ZM → municipios ─────────────────────────────────────────────────────

ZM_MUNICIPIOS: dict[str, list[str]] = {
    "SLP": ["slp", "sol", "csp", "vip"],
    "QRO": ["qro", "cor", "mar", "hui"],
    "MTY": ["mty", "spg", "snl", "gua", "apo", "sca", "gar", "esc", "jua"],
    "GDL": ["gdl", "zap", "tla"],
}

MUNICIPIO_NOMBRES: dict[str, str] = {
    # SLP
    "slp": "San Luis Potosí",
    "sol": "Soledad de Graciano Sánchez",
    "csp": "Cerro de San Pedro",
    "vip": "Villa de Pozos",
    # QRO
    "qro": "Querétaro",
    "cor": "Corregidora",
    "mar": "El Marqués",
    "hui": "Huimilpan",
    # MTY
    "mty": "Monterrey",
    "spg": "San Pedro Garza García",
    "snl": "San Nicolás de los Garza",
    "gua": "Guadalupe",
    "apo": "Apodaca",
    "sca": "Santa Catarina",
    "gar": "García",
    "esc": "General Escobedo",
    "jua": "Juárez",
    # GDL (ZM GUADALAJARA)
    "gdl": "Guadalajara",
    "zap": "Zapopan",
    "tla": "San Pedro Tlaquepaque",
}


# ─── Repositorio ──────────────────────────────────────────────────────────────

class ReglamentoRepository:
    def __init__(self) -> None:
        self._reglamentos: Dict[str, Reglamento] = {}
        self._articulos:   Dict[str, List[ArticuloMatriz]] = {}
        self._seed()

    def _seed(self) -> None:
        builders = [
            _build_slp, _build_sol, _build_csp, _build_vip,   # ZM SLP
            _build_qro, _build_cor, _build_mar, _build_hui,   # ZM QRO
            _build_mty, _build_spg, _build_snl, _build_gua,   # ZM MTY (1/2)
            _build_apo, _build_sca, _build_gar, _build_esc, _build_jua,  # MTY (2/2)
            _build_gdl, _build_zap, _build_tla,  # GDL
        ]
        for builder in builders:
            reg, arts = builder()
            self._reglamentos[reg.municipio_id] = reg
            self._articulos[reg.municipio_id]   = arts

    def get_reglamento(self, municipio_id: str) -> Optional[Reglamento]:
        return self._reglamentos.get(municipio_id.lower())

    def get_articulos(self, municipio_id: str) -> List[ArticuloMatriz]:
        return deepcopy(self._articulos.get(municipio_id.lower(), []))

    def get_municipios_by_zm(self, zm: str) -> List[str]:
        return ZM_MUNICIPIOS.get(zm.upper(), [])

    def all_municipios(self) -> List[str]:
        return list(self._reglamentos.keys())

    def get_municipio_nombre(self, municipio_id: str) -> str:
        return MUNICIPIO_NOMBRES.get(municipio_id.lower(), municipio_id.upper())

    def get_zm_for_municipio(self, municipio_id: str) -> Optional[str]:
        reg = self._reglamentos.get(municipio_id.lower())
        return reg.zm if reg else None

    def upsert_reglamento(self, reg: Reglamento) -> None:
        self._reglamentos[reg.municipio_id.lower()] = reg

    def set_verificado(self, municipio_id: str, verificado: bool) -> bool:
        """Actualiza banderas en memoria; no escribe libro de auditoría persistente ni prueba per se.

        Límite actual (2026-Q2): ningún ROW en BD registra quién marcó ``verificado`` ni vínculos a evidencia.
        Hasta migración Alembic + ADR acordados, cualquier uso de PUT /legal/.../verificar debe ir acompañado de
        evidencia institucional externa correlacionada con ``can_enable_sanctions`` y gates del simulador.
        """
        reg = self._reglamentos.get(municipio_id.lower())
        if not reg:
            return False
        reg.verificado                 = verificado
        reg.requiere_revision_juridica = not verificado
        return True


_repo: Optional[ReglamentoRepository] = None


def get_repo() -> ReglamentoRepository:
    global _repo
    if _repo is None:
        _repo = ReglamentoRepository()
    return _repo
