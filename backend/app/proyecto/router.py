"""
Router: /api/proyecto

Proyecto Vivo — ciclo completo del municipio como cliente.

Endpoints:
  POST /                                → crear proyecto (post-venta)
  POST /{id}/arrancar                   → activar timer
  GET  /{id}/estado                     → progreso, alertas, semáforo
  POST /{id}/revision                   → nueva revisión (snapshot + regenerar docs)
  POST /{id}/actividad/{act_id}/completar → municipio confirma tarea
  GET  /{id}/ficha-impacto              → resumen ejecutivo para campeón interno
  GET  /{id}/riesgo-politico            → score y mapa de actores
  POST /{id}/actor                      → agregar/actualizar actor al mapa
  POST /{id}/impacto                    → registrar datos reales medidos
  POST /{id}/checkpoint/completar       → municipio calibra supuestos de costo
  GET  /benchmark/{zm}/{rango}          → comparativa anónima ZM
  GET  /                                → lista de proyectos (admin)
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.proyecto.timeline_engine import (
    calcular_progreso,
    evaluar_riesgo_politico,
    generar_ficha_impacto,
    checkpoint_requerido,
)

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Request / Response schemas ────────────────────────────────────────────────

class CrearProyectoRequest(BaseModel):
    municipio_id:    str
    zm:              str
    nombre_cliente:  str
    email_cliente:   Optional[str] = None
    estado_mx:       Optional[str] = None
    negociacion:     str = "municipal_directo"
    horizonte_semanas: int = Field(52, ge=12, le=260)
    campeon_nombre:  Optional[str] = None
    campeon_cargo:   Optional[str] = None
    campeon_email:   Optional[str] = None
    consultor_asignado: Optional[str] = None
    is_showcase:     bool = False


class ArrancarRequest(BaseModel):
    fecha_inicio:   Optional[str] = None   # ISO date string; default = hoy
    fecha_objetivo: Optional[str] = None


class RevisionRequest(BaseModel):
    scenario_json:  dict = Field(default_factory=dict)
    cost_overrides: dict = Field(default_factory=dict)
    nota:           Optional[str] = None


class CompletarActividadRequest(BaseModel):
    nota: Optional[str] = None


class ActorRequest(BaseModel):
    nombre:        str
    cargo:         str
    organizacion:  Optional[str] = None
    tipo:          str = "interno"
    influencia:    str = "media"
    sentimiento:   str = "neutral"
    interes:       str = "medio"
    preocupacion_principal: Optional[str] = None
    tactica_engagement:     Optional[str] = None
    es_campeon:    bool = False
    es_bloqueador: bool = False


class ImpactoRequest(BaseModel):
    periodo:               str  # "2025-M06"
    ton_rsu_generadas:     Optional[float] = None
    ton_rsu_desviadas:     Optional[float] = None
    ton_rsu_disposicion:   Optional[float] = None
    co2e_evitadas_ton:     Optional[float] = None
    ingreso_materiales_mxn: Optional[float] = None
    ahorro_disposicion_mxn: Optional[float] = None
    empleos_generados:     Optional[int] = None
    fuente:                str = "auto_reporte"
    notas:                 Optional[str] = None


class CheckpointItem(BaseModel):
    concepto:      str
    monto_usuario: float
    fuente_usuario: Optional[str] = None


class CheckpointRequest(BaseModel):
    supuestos: List[CheckpointItem]
    completado_por: str


# ── In-memory fallback cuando no hay PostgreSQL ───────────────────────────────
# Garantiza que la API responde aunque la BD no esté conectada en dev/sandbox.

_proyectos_mem: dict = {}
_clientes_mem:  dict = {}


def _mem_crear_proyecto(data: CrearProyectoRequest) -> dict:
    import uuid
    pid = str(uuid.uuid4())
    cid = str(uuid.uuid4())
    _clientes_mem[cid] = {
        "id": cid, "nombre": data.nombre_cliente,
        "email": data.email_cliente, "municipio_id": data.municipio_id,
        "zm": data.zm, "plan": "proyecto_vivo",
    }
    proyecto = {
        "id": pid, "cliente_id": cid,
        "municipio_id": data.municipio_id, "zm": data.zm,
        "nombre": f"Programa de Circularidad — {data.municipio_id}",
        "estado": "draft", "negociacion": data.negociacion,
        "horizonte_semanas": data.horizonte_semanas,
        "campeon_nombre": data.campeon_nombre,
        "is_showcase": data.is_showcase,
        "fecha_inicio": None,
        "actividades": [], "revisiones": [], "alertas": [],
        "actores": [], "impactos": [], "checkpoints": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _proyectos_mem[pid] = proyecto
    return proyecto


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def crear_proyecto(data: CrearProyectoRequest, db=Depends(get_db)):
    """Crea cliente + proyecto. Llamado al cerrar la venta del servicio."""
    if db is None:
        return _mem_crear_proyecto(data)

    try:
        from app.models.proyecto import Cliente, ProyectoMunicipal
        import uuid

        cliente = Cliente(
            id=str(uuid.uuid4()),
            nombre=data.nombre_cliente,
            email=data.email_cliente,
            municipio_id=data.municipio_id,
            zm=data.zm,
            estado_mx=data.estado_mx,
            consultor_asignado=data.consultor_asignado,
        )
        db.add(cliente)
        db.flush()

        proyecto = ProyectoMunicipal(
            id=str(uuid.uuid4()),
            cliente_id=cliente.id,
            municipio_id=data.municipio_id,
            zm=data.zm,
            negociacion=data.negociacion,
            horizonte_semanas=data.horizonte_semanas,
            campeon_nombre=data.campeon_nombre,
            campeon_cargo=data.campeon_cargo,
            campeon_email=data.campeon_email,
            is_showcase=data.is_showcase,
        )
        db.add(proyecto)
        db.commit()
        return {"proyecto_id": proyecto.id, "cliente_id": cliente.id, "estado": "draft"}
    except Exception as exc:
        logger.error("Error creando proyecto: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/{proyecto_id}/arrancar")
async def arrancar_proyecto(proyecto_id: str, data: ArrancarRequest, db=Depends(get_db)):
    """Activa el timer. A partir de aquí el consultor vivo entra en funcionamiento."""
    if db is None:
        p = _proyectos_mem.get(proyecto_id)
        if not p:
            raise HTTPException(404, "Proyecto no encontrado")
        p["estado"] = "activo"
        p["fecha_inicio"] = data.fecha_inicio or datetime.now(timezone.utc).isoformat()
        return {"proyecto_id": proyecto_id, "estado": "activo", "fecha_inicio": p["fecha_inicio"]}

    try:
        from app.models.proyecto import ProyectoMunicipal
        p = db.query(ProyectoMunicipal).filter_by(id=proyecto_id).first()
        if not p:
            raise HTTPException(404, "Proyecto no encontrado")
        p.estado = "activo"
        fecha = (
            datetime.fromisoformat(data.fecha_inicio)
            if data.fecha_inicio
            else datetime.now(timezone.utc)
        )
        p.fecha_inicio = fecha
        if data.fecha_objetivo:
            p.fecha_objetivo = datetime.fromisoformat(data.fecha_objetivo)
        db.commit()

        # Auto-generar actividades desde el Gantt plan
        await _seed_actividades(proyecto_id, p.municipio_id, p.zm, p.horizonte_semanas, db)
        return {"proyecto_id": proyecto_id, "estado": "activo", "fecha_inicio": fecha.isoformat()}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.get("/{proyecto_id}/estado")
async def estado_proyecto(proyecto_id: str, db=Depends(get_db)):
    """Estado completo: progreso, alertas, semáforo, próximas acciones."""
    if db is None:
        p = _proyectos_mem.get(proyecto_id)
        if not p:
            raise HTTPException(404, "Proyecto no encontrado")
        return {
            "proyecto_id": proyecto_id,
            "estado": p["estado"],
            "pct_avance": 0,
            "semaforo": "verde",
            "alertas": [],
            "proxima_accion_municipio": None,
            "proxima_accion_alquimia": "Generar diagnóstico inicial (R0)",
            "message": "BD no disponible — datos en memoria",
        }

    try:
        from app.models.proyecto import ProyectoMunicipal
        p = db.query(ProyectoMunicipal).filter_by(id=proyecto_id).first()
        if not p:
            raise HTTPException(404, "Proyecto no encontrado")

        progreso = calcular_progreso(p)
        riesgo   = evaluar_riesgo_politico(p)

        return {
            "proyecto_id": proyecto_id,
            "municipio_id": p.municipio_id,
            "zm": p.zm,
            "estado": p.estado,
            "negociacion": p.negociacion,
            "semanas_activo": progreso.semanas_activo,
            "semanas_objetivo": progreso.semanas_objetivo,
            "pct_avance": progreso.pct_avance,
            "semanas_retraso_max": progreso.semanas_retraso_max,
            "actividades_total": progreso.actividades_total,
            "actividades_completadas": progreso.actividades_completadas,
            "criticas_pendientes": progreso.actividades_criticas_pendientes,
            "semaforo": progreso.estado_semaforo,
            "proxima_accion_municipio": progreso.proxima_actividad_municipio,
            "proxima_accion_alquimia": progreso.proxima_actividad_alquimia,
            "riesgo_politico": riesgo,
            "checkpoint_pendiente": checkpoint_requerido(p),
            "campeon": {"nombre": p.campeon_nombre, "cargo": p.campeon_cargo, "email": p.campeon_email},
            "alertas": [
                {
                    "tipo": a.tipo,
                    "severidad": a.severidad,
                    "titulo": a.titulo,
                    "descripcion": a.descripcion,
                    "accion": a.accion_sugerida,
                }
                for a in progreso.alertas
            ],
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.post("/{proyecto_id}/revision", status_code=201)
async def nueva_revision(proyecto_id: str, data: RevisionRequest, db=Depends(get_db)):
    """Crea una nueva revisión: snapshot + regenera documentos con datos actuales."""
    if db is None:
        p = _proyectos_mem.get(proyecto_id)
        if not p:
            raise HTTPException(404, "Proyecto no encontrado")
        n = len(p.get("revisiones", [])) + 1
        rev = {"numero": n, "nota": data.nota, "cost_overrides": data.cost_overrides}
        p.setdefault("revisiones", []).append(rev)
        return {"revision": n, "estado": "creada", "message": "BD no disponible — en memoria"}

    try:
        from app.models.proyecto import ProyectoMunicipal, RevisionProyecto
        import uuid

        p = db.query(ProyectoMunicipal).filter_by(id=proyecto_id).first()
        if not p:
            raise HTTPException(404, "Proyecto no encontrado")

        n = len(p.revisiones) if p.revisiones else 0
        rev = RevisionProyecto(
            id=str(uuid.uuid4()),
            proyecto_id=proyecto_id,
            numero=n,
            cost_overrides=data.cost_overrides,
            nota=data.nota,
        )
        db.add(rev)
        db.commit()
        return {"revision_id": rev.id, "numero": n, "estado": "creada"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.post("/{proyecto_id}/actividad/{actividad_id}/completar")
async def completar_actividad(proyecto_id: str, actividad_id: str,
                               data: CompletarActividadRequest, db=Depends(get_db)):
    """Municipio confirma que completó una tarea."""
    if db is None:
        return {"actividad_id": actividad_id, "estado": "completado", "message": "BD no disponible"}

    try:
        from app.models.proyecto import ActividadProyecto
        act = db.query(ActividadProyecto).filter_by(
            id=actividad_id, proyecto_id=proyecto_id,
        ).first()
        if not act:
            raise HTTPException(404, "Actividad no encontrada")
        act.estado = "completado"
        act.nota_completado = data.nota
        act.completado_en = datetime.now(timezone.utc)
        db.commit()
        return {"actividad_id": actividad_id, "estado": "completado"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.get("/{proyecto_id}/ficha-impacto")
async def ficha_impacto(proyecto_id: str, costo_servicio: float = 0.0, db=Depends(get_db)):
    """Ficha de impacto presentation-ready para el campeón interno."""
    if db is None:
        raise HTTPException(503, "BD no disponible — ficha requiere datos persistidos")

    try:
        from app.models.proyecto import ProyectoMunicipal
        p = db.query(ProyectoMunicipal).filter_by(id=proyecto_id).first()
        if not p:
            raise HTTPException(404, "Proyecto no encontrado")
        ficha = generar_ficha_impacto(p, costo_servicio_mxn=costo_servicio)
        return {
            "municipio": ficha.municipio,
            "periodo": ficha.periodo,
            "semanas_activo": ficha.semanas_activo,
            "pct_avance": ficha.pct_avance,
            "north_star": {
                "ton_desviadas": ficha.ton_desviadas,
                "tasa_desvio_pct": ficha.tasa_desvio_pct,
                "co2e_evitadas_ton": ficha.co2e_evitadas,
                "valor_capturado_mxn": ficha.valor_capturado_mxn,
                "empleos_generados": ficha.empleos_generados,
            },
            "roi_pct": ficha.roi_pct,
            "documentos_entregados": ficha.documentos_entregados,
            "vs_benchmark": ficha.vs_benchmark_desvio,
            "logros_cabildo": ficha.logros,
            "proximos_pasos": ficha.proximos_pasos,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.get("/{proyecto_id}/riesgo-politico")
async def riesgo_politico(proyecto_id: str, db=Depends(get_db)):
    """Score de riesgo político + mapa de actores."""
    if db is None:
        return {"score": 0, "nivel": "desconocido", "bloqueadores": [], "campeones": []}
    try:
        from app.models.proyecto import ProyectoMunicipal
        p = db.query(ProyectoMunicipal).filter_by(id=proyecto_id).first()
        if not p:
            raise HTTPException(404, "Proyecto no encontrado")
        return evaluar_riesgo_politico(p)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.post("/{proyecto_id}/actor", status_code=201)
async def agregar_actor(proyecto_id: str, data: ActorRequest, db=Depends(get_db)):
    """Agrega o actualiza un actor en el mapa político."""
    if db is None:
        return {"actor_id": "mem-01", "message": "BD no disponible"}
    try:
        from app.models.proyecto import MapaActor
        import uuid
        actor = MapaActor(
            id=str(uuid.uuid4()),
            proyecto_id=proyecto_id,
            **data.model_dump(),
        )
        db.add(actor)
        db.commit()
        return {"actor_id": actor.id, "nombre": actor.nombre, "riesgo_score": actor.riesgo_score()}
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.post("/{proyecto_id}/impacto", status_code=201)
async def registrar_impacto(proyecto_id: str, data: ImpactoRequest, db=Depends(get_db)):
    """Registra datos reales medidos — alimenta el North Star metric."""
    if db is None:
        return {"message": "BD no disponible — impacto no persistido"}
    try:
        from app.models.proyecto import ImpactoReal
        import uuid

        tasa = None
        if data.ton_rsu_generadas and data.ton_rsu_desviadas:
            tasa = round(data.ton_rsu_desviadas / data.ton_rsu_generadas * 100, 2)

        valor = (data.ingreso_materiales_mxn or 0) + (data.ahorro_disposicion_mxn or 0) or None

        impacto = ImpactoReal(
            id=str(uuid.uuid4()),
            proyecto_id=proyecto_id,
            periodo=data.periodo,
            ton_rsu_generadas=data.ton_rsu_generadas,
            ton_rsu_desviadas=data.ton_rsu_desviadas,
            ton_rsu_disposicion=data.ton_rsu_disposicion,
            tasa_desvio_pct=tasa,
            co2e_evitadas_ton=data.co2e_evitadas_ton,
            ingreso_materiales_mxn=data.ingreso_materiales_mxn,
            ahorro_disposicion_mxn=data.ahorro_disposicion_mxn,
            valor_capturado_mxn=valor,
            empleos_generados=data.empleos_generados,
            fuente=data.fuente,
            notas=data.notas,
        )
        db.add(impacto)
        db.commit()
        return {"impacto_id": impacto.id, "tasa_desvio_pct": tasa, "valor_capturado_mxn": valor}
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.post("/{proyecto_id}/checkpoint/completar")
async def completar_checkpoint(proyecto_id: str, data: CheckpointRequest, db=Depends(get_db)):
    """Municipio calibra supuestos de costo — desbloquea 'defendible'."""
    if db is None:
        return {"completado": True, "message": "BD no disponible"}
    try:
        from app.models.proyecto import CheckpointCostos
        import uuid

        supuestos_dict = {
            s.concepto: {
                "monto_usuario": s.monto_usuario,
                "fuente_usuario": s.fuente_usuario,
                "confirmado": True,
            }
            for s in data.supuestos
        }

        cp = CheckpointCostos(
            id=str(uuid.uuid4()),
            proyecto_id=proyecto_id,
            supuestos=supuestos_dict,
            completado=True,
            completado_por=data.completado_por,
            completado_en=datetime.now(timezone.utc),
            n_supuestos_total=len(data.supuestos),
            n_supuestos_ajustados=sum(
                1 for s in data.supuestos if s.fuente_usuario
            ),
        )
        db.add(cp)
        db.commit()
        return {
            "checkpoint_id": cp.id,
            "completado": True,
            "pct_completado": cp.pct_completado(),
            "ajustados": cp.n_supuestos_ajustados,
        }
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.get("/benchmark/{zm}/{rango}")
async def benchmark_zm(zm: str, rango: str, db=Depends(get_db)):
    """Comparativa anónima — cómo está el municipio vs pares de ZM similar."""
    if db is None:
        return {
            "zm": zm, "rango": rango,
            "tasa_desvio_promedio_pct": 28.5,
            "tasa_desvio_p75_pct": 35.0,
            "tasa_desvio_p25_pct": 18.0,
            "tir_promedio_pct": 19.2,
            "n_municipios": 1,
            "fuente": "seed_demo",
        }
    try:
        from app.models.proyecto import BenchmarkMunicipal
        b = db.query(BenchmarkMunicipal).filter_by(zm=zm, rango_poblacion=rango).first()
        if not b:
            return {"zm": zm, "rango": rango, "n_municipios": 0, "message": "Sin datos para este segmento aún"}
        return {
            "zm": b.zm, "rango": b.rango_poblacion, "periodo": b.periodo,
            "tasa_desvio_promedio_pct": b.tasa_desvio_promedio_pct,
            "tasa_desvio_p75_pct": b.tasa_desvio_p75_pct,
            "tasa_desvio_p25_pct": b.tasa_desvio_p25_pct,
            "tir_promedio_pct": b.tir_promedio_pct,
            "capex_per_capita_mxn": b.capex_per_capita_mxn,
            "n_municipios": b.n_municipios,
        }
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.get("/")
async def listar_proyectos(db=Depends(get_db)):
    """Lista todos los proyectos activos — vista admin ALQUIMIA."""
    if db is None:
        return {"proyectos": list(_proyectos_mem.values()), "total": len(_proyectos_mem)}
    try:
        from app.models.proyecto import ProyectoMunicipal
        proyectos = db.query(ProyectoMunicipal).order_by(ProyectoMunicipal.created_at.desc()).all()
        return {
            "total": len(proyectos),
            "proyectos": [
                {
                    "id": p.id,
                    "municipio_id": p.municipio_id,
                    "zm": p.zm,
                    "estado": p.estado,
                    "semanas_activo": p.semanas_activo(),
                    "pct_avance": p.pct_avance(),
                    "is_showcase": p.is_showcase,
                    "negociacion": p.negociacion,
                }
                for p in proyectos
            ],
        }
    except Exception as exc:
        raise HTTPException(500, str(exc))


# ── Helper: seed actividades desde Gantt al arrancar ─────────────────────────

async def _seed_actividades(proyecto_id: str, municipio: str, zm: str,
                             horizonte: int, db) -> None:
    """Genera las actividades del Gantt como ActividadProyecto en la BD."""
    try:
        from app.planning.builder import build_gantt
        from app.models.proyecto import ActividadProyecto
        import uuid

        g = build_gantt(
            municipio=municipio, zm=zm, scenario_id=proyecto_id,
            capex_total=1_500_000, horizonte_semanas=horizonte,
        )
        for t in g.tasks:
            act = ActividadProyecto(
                id=str(uuid.uuid4()),
                proyecto_id=proyecto_id,
                gantt_task_id=t.task_id,
                nombre=t.nombre,
                descripcion=t.descripcion,
                fase=t.nombre.split(".")[0] if "." in t.nombre else "General",
                ejecutor=_infer_ejecutor(t.responsable),
                semana_inicio=t.inicio_semana,
                duracion_semanas=t.duracion_semanas,
                es_critica=t.es_critica,
                costo_mxn=t.costo_mxn,
                responsable=t.responsable,
            )
            db.add(act)
        db.commit()
        logger.info("Seeded %d actividades para proyecto %s", len(g.tasks), proyecto_id)
    except Exception as exc:
        logger.warning("No se pudieron crear actividades automáticas: %s", exc)


def _infer_ejecutor(responsable: str) -> str:
    """Infiere si la tarea es de ALQUIMIA o del municipio según el responsable."""
    r = (responsable or "").lower()
    if any(w in r for w in ["alquimia", "consultor", "analista", "equipo técnico"]):
        return "alquimia"
    if any(w in r for w in ["municipio", "director", "secretaría", "alcalde", "cabildo", "síndico"]):
        return "municipio"
    return "compartido"
