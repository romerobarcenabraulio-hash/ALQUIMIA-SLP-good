"""Seed data Fase 6.

Los registros usan cargos/instituciones y estado de verificacion; no nombres
de funcionarios cuando no hay fuente cargada en el expediente.
"""
from __future__ import annotations

from copy import deepcopy


def _source(label: str, status: str = "pendiente_verificacion") -> dict:
    return {"label": label, "status": status, "fecha": "2026-05-28"}


def _pending(label: str) -> dict:
    return {"valor": None, "estado": "pendiente_verificacion", "fuente": _source(label)}


def _actor(idx: int, nombre: str, tipo: str, influencia: str, postura: str) -> dict:
    return {
        "actor_id": f"slp-a{idx:02d}",
        "nombre": nombre,
        "tipo_actor": tipo,
        "influencia": influencia,
        "postura": postura,
        "evidencia_fuente": "Pendiente de verificacion documental municipal",
        "fuente": _source("Expediente municipal SLP Fase 6"),
        "fecha_actualizacion": "2026-05-28",
    }


SLP_PROFILE = {
    "antecedentes": {
        "presidente_municipal": _pending("Sitio oficial Ayuntamiento de San Luis Potosi"),
        "cabildo": {
            "estado": "carga_inicial",
            "fuente": _source("Actas/directorio de Cabildo pendiente de carga"),
            "sindicos": [
                {"cargo": "Sindicatura 1", "nombre": None, "estado": "pendiente_verificacion", "fuente": _source("Directorio Cabildo SLP")},
                {"cargo": "Sindicatura 2", "nombre": None, "estado": "pendiente_verificacion", "fuente": _source("Directorio Cabildo SLP")},
            ],
            "regidores": [
                {"cargo": f"Regiduria {i}", "nombre": None, "estado": "pendiente_verificacion", "fuente": _source("Directorio Cabildo SLP")}
                for i in range(1, 16)
            ],
            "comisiones_permanentes": [
                {"nombre": "Comision de Ecologia/Medio Ambiente", "estado": "pendiente_verificacion", "fuente": _source("Reglamento interior Cabildo SLP")},
                {"nombre": "Comision de Servicios Municipales", "estado": "pendiente_verificacion", "fuente": _source("Reglamento interior Cabildo SLP")},
                {"nombre": "Comision de Hacienda", "estado": "pendiente_verificacion", "fuente": _source("Reglamento interior Cabildo SLP")},
            ],
        },
        "sesion_ordinaria": _pending("Calendario oficial de sesiones de Cabildo SLP"),
        "estructura_administrativa": {
            "estado": "carga_inicial",
            "fuente": _source("Organigrama municipal SLP pendiente de cotejo"),
            "areas": ["Servicios Municipales", "Ecologia/Medio Ambiente", "Tesoreria", "Secretaria General"],
        },
        "reglamento_de_limpia": {
            "estado": "pendiente_verificacion",
            "titulo": "Reglamento de limpia / gestion de residuos aplicable",
            "fuente": _source("Archivo municipal / gaceta pendiente"),
        },
        "concesion_actual": _pending("Contrato/convenio vigente de recoleccion o disposicion"),
        "programas_previos": {
            "estado": "carga_inicial",
            "fuente": _source("Notas y comunicados municipales pendientes de cotejo"),
            "items": ["Campanas de separacion y reciclaje por verificar", "Operativos de limpieza por verificar"],
        },
        "prensa_24_meses": {
            "estado": "carga_inicial",
            "fuente": _source("Hemeroteca municipal/medios locales pendiente"),
            "items": [],
        },
        "proximo_proceso_electoral": _pending("Calendario electoral oficial aplicable"),
    },
    "mapa_social": {
        "actores": [
            _actor(1, "Presidencia municipal", "gobierno_municipal", "alta", "por_verificar"),
            _actor(2, "Secretaria General", "gobierno_municipal", "alta", "por_verificar"),
            _actor(3, "Direccion de Servicios Municipales", "operador_publico", "alta", "por_verificar"),
            _actor(4, "Direccion de Ecologia / Medio Ambiente", "gobierno_municipal", "media", "por_verificar"),
            _actor(5, "Tesoreria municipal", "finanzas_publicas", "alta", "por_verificar"),
            _actor(6, "Sindicaturas", "cabildo", "alta", "por_verificar"),
            _actor(7, "Comision de Servicios Municipales", "cabildo", "alta", "por_verificar"),
            _actor(8, "Comision de Ecologia / Medio Ambiente", "cabildo", "media", "por_verificar"),
            _actor(9, "Operador o concesionario vigente", "operador", "alta", "por_verificar"),
            _actor(10, "Personal de recoleccion", "trabajadores", "media", "por_verificar"),
            _actor(11, "Pepenadores / recicladores de base", "sector_social", "media", "por_verificar"),
            _actor(12, "Juntas vecinales y liderazgos de colonia", "ciudadania", "media", "por_verificar"),
            _actor(13, "Administradores de condominios y privadas", "macrogenerador_residencial", "media", "por_verificar"),
            _actor(14, "Camara empresarial local", "sector_privado", "media", "por_verificar"),
            _actor(15, "Universidades / sociedad civil ambiental", "academia_sociedad_civil", "baja", "por_verificar"),
        ],
        "updated_at": "2026-05-28",
        "municipio_scope": "slp-capital",
        "zm_scope_copied": False,
    },
    "organigrama_servicio": {
        "direcciones_relevantes": [
            {"nombre": "Servicios Municipales", "titular": None, "estado": "pendiente_verificacion", "fuente": _source("Directorio SLP")},
            {"nombre": "Ecologia / Medio Ambiente", "titular": None, "estado": "pendiente_verificacion", "fuente": _source("Directorio SLP")},
            {"nombre": "Tesoreria", "titular": None, "estado": "pendiente_verificacion", "fuente": _source("Directorio SLP")},
        ],
        "roles_operativos": [
            {"rol": "Coordinacion RSU", "responsabilidad": "Coordinar programa de separacion y reportes", "relacion_rsu": "gobernanza", "estado": "pendiente_verificacion"},
            {"rol": "Supervision de rutas", "responsabilidad": "Verificar cobertura y bitacora", "relacion_rsu": "recoleccion", "estado": "pendiente_verificacion"},
            {"rol": "Inspeccion", "responsabilidad": "Seguimiento de cumplimiento", "relacion_rsu": "enforcement", "estado": "pendiente_verificacion"},
        ],
        "turnos": [
            {"nombre": "Matutino", "horario": "06:00-14:00", "estado": "pendiente_verificacion"},
            {"nombre": "Vespertino", "horario": "14:00-22:00", "estado": "pendiente_verificacion"},
        ],
        "horarios": [
            {"actividad": "Recoleccion domiciliaria", "horario": "Pendiente carga de datos del municipio", "estado": "pendiente_verificacion"},
            {"actividad": "Barrido / limpieza", "horario": "Pendiente carga de datos del municipio", "estado": "pendiente_verificacion"},
        ],
        "responsabilidades": ["recoleccion", "barrido", "transferencia/disposicion", "atencion ciudadana"],
        "relacion_con_rsu": "Servicio municipal relacionado con limpieza, recoleccion y valorizacion de residuos.",
    },
    "provenance_status": "pendiente_verificacion",
}


def basic_profile(city: str, tenant_id: str) -> dict:
    return {
        "antecedentes": {
            "presidente_municipal": _pending(f"Directorio oficial {city} pendiente"),
            "cabildo": {"estado": "pendiente_verificacion", "sindicos": [], "regidores": [], "comisiones_permanentes": [], "fuente": _source(f"Cabildo {city} pendiente")},
            "sesion_ordinaria": _pending(f"Calendario Cabildo {city} pendiente"),
            "estructura_administrativa": {"estado": "pendiente_verificacion", "areas": [], "fuente": _source(f"Organigrama {city} pendiente")},
            "reglamento_de_limpia": _pending(f"Reglamento de limpia {city} pendiente"),
            "concesion_actual": _pending(f"Concesion/operacion {city} pendiente"),
            "programas_previos": {"estado": "pendiente_verificacion", "items": [], "fuente": _source(f"Programas previos {city} pendiente")},
            "prensa_24_meses": {"estado": "pendiente_verificacion", "items": [], "fuente": _source(f"Prensa 24 meses {city} pendiente")},
            "proximo_proceso_electoral": _pending(f"Calendario electoral {city} pendiente"),
        },
        "mapa_social": {"actores": [], "updated_at": "2026-05-28", "municipio_scope": tenant_id, "zm_scope_copied": False},
        "organigrama_servicio": {"direcciones_relevantes": [], "roles_operativos": [], "turnos": [], "horarios": [], "responsabilidades": [], "relacion_con_rsu": "Pendiente carga de datos del municipio"},
        "provenance_status": "pendiente_verificacion",
    }


TENANT_PROFILE_SEEDS = {
    "slp-capital": deepcopy(SLP_PROFILE),
    "monterrey": basic_profile("Monterrey", "monterrey"),
    "guanajuato-capital": basic_profile("Guanajuato Capital", "guanajuato-capital"),
}
