"""
Modelos SQLAlchemy para el sistema de Proyecto Vivo.

Tablas:
  clientes                 — empresa/municipio que contrató el servicio
  proyectos_municipales    — proyecto activo por municipio
  revisiones_proyecto      — snapshot trazable por iteración (R0, R1, R2…)
  actividades_proyecto     — tareas del Gantt con ejecutor y estado
  alertas_proyecto         — alertas del consultor vivo
  mapa_actores             — stakeholders y sentimiento político
  impacto_real             — North Star: toneladas medidas, valor capturado
  benchmark_municipal      — comparación anónima con pares
  checkpoint_costos        — gate obligatorio antes de status "defendible"
  cotizaciones_municipales — cotización óptima recomendada por municipio
                             (generada por motor de recomendación ALQUIMIA)
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey,
    Integer, String, Text, JSON,
    Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


# ─── Cliente ──────────────────────────────────────────────────────────────────

class Cliente(Base):
    __tablename__ = "clientes"

    id:             Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    nombre:         Mapped[str] = mapped_column(String(200))
    email:          Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    municipio_id:   Mapped[str] = mapped_column(String(50))
    zm:             Mapped[str] = mapped_column(String(20))
    estado_mx:      Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    plan:           Mapped[str] = mapped_column(String(50), default="diagnostico")  # diagnostico | proyecto_vivo | certificacion
    consultor_asignado: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at:     Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    activo:         Mapped[bool] = mapped_column(Boolean, default=True)

    proyectos: Mapped[list["ProyectoMunicipal"]] = relationship(back_populates="cliente")

    def __repr__(self) -> str:
        return f"<Cliente {self.nombre} ({self.municipio_id})>"


# ─── ProyectoMunicipal ────────────────────────────────────────────────────────

class ProyectoMunicipal(Base):
    __tablename__ = "proyectos_municipales"

    id:              Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    cliente_id:      Mapped[str] = mapped_column(String(36), ForeignKey("clientes.id"))
    municipio_id:    Mapped[str] = mapped_column(String(50))
    zm:              Mapped[str] = mapped_column(String(20))
    nombre:          Mapped[str] = mapped_column(String(300), default="Programa de Circularidad Municipal")
    estado:          Mapped[str] = mapped_column(String(30), default="draft")
    # draft | activo | pausado | cerrado | showcase
    negociacion:     Mapped[str] = mapped_column(String(50), default="municipal_directo")
    # municipal_directo | concesion_privada | ppp | fideicomiso
    fecha_inicio:    Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_objetivo:  Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    horizonte_semanas: Mapped[int] = mapped_column(Integer, default=52)
    campeon_nombre:  Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    campeon_cargo:   Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    campeon_email:   Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_showcase:     Mapped[bool] = mapped_column(Boolean, default=False)
    created_at:      Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at:      Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    cliente:      Mapped["Cliente"] = relationship(back_populates="proyectos")
    revisiones:   Mapped[list["RevisionProyecto"]] = relationship(back_populates="proyecto", order_by="RevisionProyecto.numero")
    actividades:  Mapped[list["ActividadProyecto"]] = relationship(back_populates="proyecto")
    alertas:      Mapped[list["AlertaProyecto"]] = relationship(back_populates="proyecto")
    actores:      Mapped[list["MapaActor"]] = relationship(back_populates="proyecto")
    impactos:     Mapped[list["ImpactoReal"]] = relationship(back_populates="proyecto")
    checkpoints:  Mapped[list["CheckpointCostos"]] = relationship(back_populates="proyecto")

    def semanas_activo(self) -> int:
        if not self.fecha_inicio:
            return 0
        delta = datetime.now(timezone.utc) - self.fecha_inicio.replace(tzinfo=timezone.utc)
        return max(0, delta.days // 7)

    def pct_avance(self) -> float:
        if not self.actividades:
            return 0.0
        completadas = sum(1 for a in self.actividades if a.estado == "completado")
        return round(completadas / len(self.actividades) * 100, 1)

    def __repr__(self) -> str:
        return f"<ProyectoMunicipal {self.municipio_id} estado={self.estado}>"


# ─── RevisionProyecto ─────────────────────────────────────────────────────────

class RevisionProyecto(Base):
    """Cada revisión = snapshot completo del estado del proyecto en ese momento."""
    __tablename__ = "revisiones_proyecto"

    id:               Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    proyecto_id:      Mapped[str] = mapped_column(String(36), ForeignKey("proyectos_municipales.id"))
    numero:           Mapped[int] = mapped_column(Integer, default=0)  # R0, R1, R2…
    scenario_id:      Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    snapshot_kpis:    Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    research_findings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    cost_overrides:   Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    simulate_result:  Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # McKinsey: datos medidos vs modelados
    ton_rsu_modeladas: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ton_rsu_medidas:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    nota:             Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    generado_por:     Mapped[str] = mapped_column(String(100), default="sistema")
    created_at:       Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    proyecto: Mapped["ProyectoMunicipal"] = relationship(back_populates="revisiones")

    def __repr__(self) -> str:
        return f"<RevisionProyecto R{self.numero} proyecto={self.proyecto_id}>"


# ─── ActividadProyecto ────────────────────────────────────────────────────────

class ActividadProyecto(Base):
    """Tarea del Gantt vinculada al proyecto. Ejecutor = alquimia | municipio."""
    __tablename__ = "actividades_proyecto"

    id:               Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    proyecto_id:      Mapped[str] = mapped_column(String(36), ForeignKey("proyectos_municipales.id"))
    gantt_task_id:    Mapped[str] = mapped_column(String(50))
    nombre:           Mapped[str] = mapped_column(String(300))
    descripcion:      Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fase:             Mapped[str] = mapped_column(String(100), default="Diseño")
    ejecutor:         Mapped[str] = mapped_column(String(30), default="municipio")
    # alquimia | municipio | compartido
    estado:           Mapped[str] = mapped_column(String(30), default="pendiente")
    # pendiente | en_curso | completado | bloqueado | saltado
    semana_inicio:    Mapped[int] = mapped_column(Integer, default=1)
    duracion_semanas: Mapped[int] = mapped_column(Integer, default=2)
    semana_real_inicio: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    semana_real_fin:  Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    es_critica:       Mapped[bool] = mapped_column(Boolean, default=False)
    costo_mxn:        Mapped[float] = mapped_column(Float, default=0.0)
    responsable:      Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    nota_completado:  Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completado_en:    Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at:       Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    proyecto: Mapped["ProyectoMunicipal"] = relationship(back_populates="actividades")

    def semanas_retraso(self, semana_actual: int) -> int:
        """Cuántas semanas de retraso acumula esta tarea."""
        if self.estado == "completado":
            return 0
        semana_limite = self.semana_inicio + self.duracion_semanas
        return max(0, semana_actual - semana_limite)


# ─── AlertaProyecto ───────────────────────────────────────────────────────────

class AlertaProyecto(Base):
    """Alerta generada por el consultor vivo. Severidad: info | advertencia | critico."""
    __tablename__ = "alertas_proyecto"

    id:          Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    proyecto_id: Mapped[str] = mapped_column(String(36), ForeignKey("proyectos_municipales.id"))
    tipo:        Mapped[str] = mapped_column(String(50))
    # retraso_tarea | riesgo_politico | costo_sin_calibrar | benchmark_negativo | hito_proximo
    severidad:   Mapped[str] = mapped_column(String(20), default="advertencia")
    # info | advertencia | critico
    titulo:      Mapped[str] = mapped_column(String(300))
    descripcion: Mapped[str] = mapped_column(Text)
    accion_sugerida: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resuelta:    Mapped[bool] = mapped_column(Boolean, default=False)
    created_at:  Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    resuelta_en: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    proyecto: Mapped["ProyectoMunicipal"] = relationship(back_populates="alertas")


# ─── MapaActor (McKinsey: 60% del trabajo es político) ───────────────────────

class MapaActor(Base):
    """Stakeholder mapping con sentimiento. Base del riesgo político."""
    __tablename__ = "mapa_actores"

    id:           Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    proyecto_id:  Mapped[str] = mapped_column(String(36), ForeignKey("proyectos_municipales.id"))
    nombre:       Mapped[str] = mapped_column(String(200))
    cargo:        Mapped[str] = mapped_column(String(200))
    organizacion: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    tipo:         Mapped[str] = mapped_column(String(50), default="interno")
    # interno | externo | politico | proveedor | ciudadano | media
    influencia:   Mapped[str] = mapped_column(String(20), default="media")
    # alta | media | baja
    sentimiento:  Mapped[str] = mapped_column(String(20), default="neutral")
    # favorable | neutral | en_contra | desconocido
    interes:      Mapped[str] = mapped_column(String(20), default="medio")
    # alto | medio | bajo
    preocupacion_principal: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tactica_engagement:     Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ultimo_contacto:        Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    es_campeon:   Mapped[bool] = mapped_column(Boolean, default=False)
    es_bloqueador: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at:   Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at:   Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    proyecto: Mapped["ProyectoMunicipal"] = relationship(back_populates="actores")

    def riesgo_score(self) -> int:
        """0-100. Combinación de influencia + sentimiento negativo."""
        influencia_w = {"alta": 3, "media": 2, "baja": 1}.get(self.influencia, 1)
        sentimiento_w = {"en_contra": 3, "desconocido": 1, "neutral": 0, "favorable": -1}.get(self.sentimiento, 0)
        return min(100, max(0, influencia_w * sentimiento_w * 15))


# ─── ImpactoReal (McKinsey: North Star metric) ────────────────────────────────

class ImpactoReal(Base):
    """North Star: toneladas medidas, valor capturado, empleos reales.
    Se registra cuando el municipio pesa sus camiones o reporta resultados.
    """
    __tablename__ = "impacto_real"

    id:              Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    proyecto_id:     Mapped[str] = mapped_column(String(36), ForeignKey("proyectos_municipales.id"))
    periodo:         Mapped[str] = mapped_column(String(20))  # "2025-Q1", "2025-M06"
    # Residuos
    ton_rsu_generadas:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ton_rsu_desviadas:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ton_rsu_disposicion: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tasa_desvio_pct:     Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Ambiental
    co2e_evitadas_ton:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Económico
    ingreso_materiales_mxn: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ahorro_disposicion_mxn: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    valor_capturado_mxn:    Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Social
    empleos_generados:   Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # Metadatos
    fuente:              Mapped[str] = mapped_column(String(100), default="auto_reporte")
    # auto_reporte | pesaje_verificado | auditoria_externa
    verificado:          Mapped[bool] = mapped_column(Boolean, default=False)
    notas:               Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at:          Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    proyecto: Mapped["ProyectoMunicipal"] = relationship(back_populates="impactos")

    def roi_servicio(self, costo_servicio_mxn: float) -> Optional[float]:
        """Retorno sobre inversión en el servicio ALQUIMIA."""
        if not self.valor_capturado_mxn or costo_servicio_mxn <= 0:
            return None
        return round((self.valor_capturado_mxn - costo_servicio_mxn) / costo_servicio_mxn * 100, 1)


# ─── BenchmarkMunicipal ───────────────────────────────────────────────────────

class BenchmarkMunicipal(Base):
    """Comparativa anónima entre municipios similares.
    Alimenta el 'data flywheel' — más clientes = mejores benchmarks.
    """
    __tablename__ = "benchmark_municipal"

    id:              Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    zm:              Mapped[str] = mapped_column(String(20))
    rango_poblacion: Mapped[str] = mapped_column(String(50))
    # "50k-200k" | "200k-500k" | "500k-1M" | "1M+"
    periodo:         Mapped[str] = mapped_column(String(20))
    # Métricas agregadas (anónimas — promedio de municipios en el rango)
    tasa_desvio_promedio_pct:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tasa_desvio_p75_pct:        Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tasa_desvio_p25_pct:        Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tir_promedio_pct:           Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    capex_per_capita_mxn:       Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ingreso_per_ton_mxn:        Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    semanas_a_primera_oleada:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    n_municipios:               Mapped[int] = mapped_column(Integer, default=1)
    created_at:                 Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


# ─── CheckpointCostos (ruido crítico: supuesto ≠ defendible) ─────────────────

class CheckpointCostos(Base):
    """Gate obligatorio antes de elevar documentos a status 'defendible'.
    El municipio debe confirmar o ajustar los 5 supuestos más sensibles.
    """
    __tablename__ = "checkpoint_costos"

    id:            Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    proyecto_id:   Mapped[str] = mapped_column(String(36), ForeignKey("proyectos_municipales.id"))
    revision_id:   Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    supuestos:     Mapped[dict] = mapped_column(JSON, default=dict)
    # {concepto: {precargado: X, usuario: Y, confirmado: bool, fuente_usuario: str}}
    completado:    Mapped[bool] = mapped_column(Boolean, default=False)
    completado_por: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    completado_en:  Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    n_supuestos_total:     Mapped[int] = mapped_column(Integer, default=5)
    n_supuestos_ajustados: Mapped[int] = mapped_column(Integer, default=0)
    created_at:    Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    proyecto: Mapped["ProyectoMunicipal"] = relationship(back_populates="checkpoints")

    def pct_completado(self) -> float:
        confirmados = sum(
            1 for v in self.supuestos.values()
            if isinstance(v, dict) and v.get("confirmado")
        )
        total = max(1, len(self.supuestos))
        return round(confirmados / total * 100, 1)


# ─── CotizacionMunicipal ──────────────────────────────────────────────────────

class CotizacionMunicipal(Base):
    """
    Cotización óptima recomendada para un municipio por el motor ALQUIMIA.

    Cada vez que el sistema (o un agente/consultor) genera una recomendación
    se persiste aquí con su versión. Permite a los agentes:
      - Recuperar la última cotización para un municipio.
      - Comparar revisiones (versión 1 → 2 → 3 con delta de supuestos).
      - Auditar quién la generó y con qué inputs.
      - Alimentar el 'data flywheel': con más municipios cotizados, mejoran
        los benchmarks de la tabla benchmark_municipal.

    Columnas de input: snapshot del estado del simulador al momento de
    generación (municipio, RSU, % captura, precios, horizonte).

    Columnas de output: recomendación (fase, mix CAs, recicladoras),
    resumen financiero, score de viabilidad, JSON completo.
    """
    __tablename__ = "cotizaciones_municipales"

    id:              Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    municipio_id:    Mapped[str] = mapped_column(String(50), index=True)
    zm:              Mapped[str] = mapped_column(String(20))
    municipio_nombre: Mapped[str] = mapped_column(String(200))

    # ── Inputs del municipio ─────────────────────────────────────────────────
    poblacion:               Mapped[float] = mapped_column(Float)
    generacion_rsu_ton_dia:  Mapped[float] = mapped_column(Float)
    pct_captura_meta:        Mapped[float] = mapped_column(Float)   # 0–100
    ton_captura_meta:        Mapped[float] = mapped_column(Float)
    horizonte_anos:          Mapped[int]   = mapped_column(Integer, default=5)
    precios_json:            Mapped[dict]  = mapped_column(JSON, default=dict)
    # {pet, hdpe, papel, vidrio, aluminio, organico}

    # ── Recomendación ────────────────────────────────────────────────────────
    fase_recomendada:        Mapped[int]   = mapped_column(Integer)
    fase_nombre:             Mapped[str]   = mapped_column(String(100))
    mix_cas_json:            Mapped[dict]  = mapped_column(JSON, default=dict)
    # {P: int, M: int, G: int}
    capacidad_ton_dia:       Mapped[float] = mapped_column(Float)
    cobertura_meta_pct:      Mapped[float] = mapped_column(Float)
    recicladoras_json:       Mapped[list]  = mapped_column(JSON, default=list)
    # [{giro, nombre, capexMXN, opexMesMXN, tirPct, paybackMeses, empleos, justificacion}]

    # ── Resumen financiero ───────────────────────────────────────────────────
    capex_total_mxn:         Mapped[float] = mapped_column(Float)
    opex_mes_mxn:            Mapped[float] = mapped_column(Float)
    ebitda_mes_mxn:          Mapped[float] = mapped_column(Float)
    empleos_directos:        Mapped[int]   = mapped_column(Integer)
    co2e_anual_ton:          Mapped[float] = mapped_column(Float, default=0.0)
    tir_estimada_pct:        Mapped[float] = mapped_column(Float)
    payback_meses:           Mapped[int]   = mapped_column(Integer)

    # ── Viabilidad ───────────────────────────────────────────────────────────
    score_viabilidad:        Mapped[int]   = mapped_column(Integer)
    # 0–100; ≥70 viable, 50–69 condicionada, <50 requiere subsidio
    clasificacion_viabilidad: Mapped[str]  = mapped_column(String(30))
    # viable | condicionada | requiere_subsidio

    # ── Metadatos ────────────────────────────────────────────────────────────
    version:                 Mapped[int]   = mapped_column(Integer, default=1)
    generado_por:            Mapped[str]   = mapped_column(String(50), default="sistema")
    # sistema | agente | consultor
    notas:                   Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── JSON completo ────────────────────────────────────────────────────────
    # La cotización completa tal como la generó el motor — trazabilidad total.
    resultado_completo_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at:              Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at:              Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    def es_viable(self) -> bool:
        return self.score_viabilidad >= 70

    def delta_vs_version(self, otra: "CotizacionMunicipal") -> dict[str, float]:
        """Diferencia clave entre dos versiones — útil para reportes de agentes."""
        return {
            "capex_delta_mxn":    self.capex_total_mxn - otra.capex_total_mxn,
            "tir_delta_pct":      self.tir_estimada_pct - otra.tir_estimada_pct,
            "score_delta":        self.score_viabilidad - otra.score_viabilidad,
            "empleos_delta":      float(self.empleos_directos - otra.empleos_directos),
            "fase_cambia":        float(self.fase_recomendada != otra.fase_recomendada),
        }

    def __repr__(self) -> str:
        return (
            f"<CotizacionMunicipal {self.municipio_nombre} "
            f"Fase{self.fase_recomendada} v{self.version} "
            f"score={self.score_viabilidad}>"
        )
