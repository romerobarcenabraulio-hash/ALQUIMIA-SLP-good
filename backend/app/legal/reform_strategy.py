"""
Selector de estrategia de reforma reglamentaria.

Regla de decisión (prioridad descendente):
  D — Decreto urgencia   : brecha_critica ≥ 3 AND agora_bloqueado
  C — Nuevo reglamento   : brecha_total ≥ 8 OR score_legal < 30
  B — Reforma integral   : brecha_total in [3, 7] OR score_legal in [30, 59]
  A — Reforma puntual    : brecha_total ≤ 2 AND score_legal ≥ 60
"""
from __future__ import annotations

from app.legal.schemas import (
    LegalDiagnostic, ReformEstrategia, ReformStrategyOutput,
)

_ESTRATEGIAS: dict[ReformEstrategia, dict] = {
    ReformEstrategia.A: {
        "nombre": "Reforma puntual",
        "descripcion": (
            "El reglamento tiene base sólida. Se requieren ajustes menores en ≤ 2 artículos "
            "para alinearlo con el programa de circularidad. Trámite vía Comisión de Servicios "
            "Públicos del Cabildo."
        ),
        "plazo_meses": 3,
    },
    ReformEstrategia.B: {
        "nombre": "Reforma integral",
        "descripcion": (
            "El reglamento requiere adición o sustitución de 3-7 artículos. "
            "Se recomienda un proceso participativo con ÁGORA-Arquitecto generando los "
            "textos propuestos, presentación en dos sesiones de Cabildo."
        ),
        "plazo_meses": 6,
    },
    ReformEstrategia.C: {
        "nombre": "Nuevo reglamento",
        "descripcion": (
            "La brecha normativa es estructural. El reglamento vigente no puede parcharse; "
            "requiere sustitución completa. ÁGORA-Ghostwriter redacta el borrador completo "
            "en 30 días; proceso formal 10-12 meses."
        ),
        "plazo_meses": 12,
    },
    ReformEstrategia.D: {
        "nombre": "Decreto de urgencia + verificación",
        "descripcion": (
            "La fuente del reglamento no ha sido verificada Y existen ≥ 3 brechas críticas. "
            "Antes de cualquier trámite legislativo es bloqueante resolver la revisión jurídica "
            "de la fuente. El municipio puede expedir un decreto de urgencia para habilitar "
            "operación provisional de CAs mientras se tramita la reforma formal."
        ),
        "plazo_meses": 1,
    },
}


def _articulos_clave(diag: LegalDiagnostic) -> list[str]:
    """Retorna los números de artículos ausentes/conflicto, priorizados por criticidad."""
    from app.legal.schemas import EstadoArticulo, Criticidad
    pendientes = [
        a for a in diag.articulos
        if a.estado in (EstadoArticulo.ausente, EstadoArticulo.conflicto)
    ]
    # Alta primero, luego media, luego baja
    orden = {Criticidad.alta: 0, Criticidad.media: 1, Criticidad.baja: 2}
    pendientes.sort(key=lambda a: orden[a.criticidad])
    return [a.numero for a in pendientes]


def select_strategy(diag: LegalDiagnostic) -> ReformStrategyOutput:
    # Regla D — siempre primero (urgencia bloqueante)
    if diag.brecha_critica >= 3 and diag.agora_bloqueado:
        est = ReformEstrategia.D
    elif diag.brecha_total >= 8 or diag.score_legal < 30:
        est = ReformEstrategia.C
    elif diag.brecha_total >= 3 or diag.score_legal < 60:
        est = ReformEstrategia.B
    else:
        est = ReformEstrategia.A

    meta = _ESTRATEGIAS[est]
    clave = _articulos_clave(diag)

    motivo: str | None = None
    if diag.agora_bloqueado:
        motivo = (
            f"Reglamento '{diag.reglamento_nombre}' (v{diag.reglamento_version}) "
            f"no tiene fuente verificada. ÁGORA no puede generar documentos legales "
            f"hasta que un jurista valide la fuente ({diag.reglamento_fuente})."
        )

    return ReformStrategyOutput(
        estrategia=est,
        nombre=meta["nombre"],
        descripcion=meta["descripcion"],
        plazo_meses=meta["plazo_meses"],
        articulos_clave=clave,
        agora_bloqueado=diag.agora_bloqueado,
        motivo_bloqueo=motivo,
    )
