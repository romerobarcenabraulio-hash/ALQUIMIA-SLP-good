"""Motor Fase 13.8: comparación de escenarios municipales."""
from __future__ import annotations

from app.scenarios.schemas import (
    ComparadorRequest,
    ComparadorResponse,
    EscenarioInput,
    EscenarioResultado,
)


def _score(escenario: EscenarioInput) -> float:
    score = 20.0
    if escenario.tasa_circularidad_pct >= 10:
        score += 30
    if escenario.brecha_infraestructura_ton_dia == 0:
        score += 20
    if escenario.estado_legal == "gate_activo":
        score += 20
    if escenario.num_centros_acopio > 0:
        score += 10
    return min(100.0, max(0.0, score))


def _blocked(municipio_id: str, blockers: list[str]) -> ComparadorResponse:
    return ComparadorResponse(
        status="blocked",
        blockers=blockers,
        municipio_id=municipio_id,
        escenarios=[],
        escenario_ganador="",
        resumen_comparativo="No fue posible comparar escenarios por bloqueos en los datos de entrada.",
        advertencias=[],
    )


def compare_scenarios(req: ComparadorRequest) -> ComparadorResponse:
    municipio_id = (req.municipio_id or "").strip()
    blockers: list[str] = []
    if not municipio_id:
        blockers.append("municipio_id es obligatorio para comparar escenarios.")
    if len(req.escenarios) < 2:
        blockers.append("Se requieren al menos 2 escenarios para comparar")
    if len(req.escenarios) > 5:
        blockers.append("Máximo 5 escenarios permitidos")
    if blockers:
        return _blocked(municipio_id, blockers)

    advertencias: list[str] = []
    base = req.escenarios[0]
    base_score = _score(base)

    resultados: list[EscenarioResultado] = []
    for escenario in req.escenarios:
        score = _score(escenario)
        if escenario.tasa_circularidad_pct == 0:
            advertencias.append(f"Escenario '{escenario.nombre}' sin recuperación activa")
        resultados.append(
            EscenarioResultado(
                nombre=escenario.nombre,
                score_circularidad=score,
                tasa_circularidad_pct=escenario.tasa_circularidad_pct,
                brecha_ton_dia=escenario.brecha_infraestructura_ton_dia,
                kpi_resumen={
                    "score": f"{score:.1f}",
                    "tasa": f"{escenario.tasa_circularidad_pct:.1f}%",
                    "brecha": f"{escenario.brecha_infraestructura_ton_dia:.1f} t/día",
                    "legal": escenario.estado_legal,
                },
                diferencia_vs_base={
                    "score": score - base_score,
                    "tasa": escenario.tasa_circularidad_pct - base.tasa_circularidad_pct,
                    "brecha": escenario.brecha_infraestructura_ton_dia - base.brecha_infraestructura_ton_dia,
                },
            )
        )

    winner_index = max(range(len(resultados)), key=lambda i: resultados[i].score_circularidad)
    resultados[winner_index].es_ganador = True
    ganador = resultados[winner_index]
    ventaja = ganador.diferencia_vs_base.get("score", 0.0)
    resumen = (
        f"El escenario ganador es '{ganador.nombre}' con score de {ganador.score_circularidad:.1f}/100. "
        f"Su ventaja principal frente al escenario base es de {ventaja:.1f} puntos de score de circularidad."
    )

    return ComparadorResponse(
        status="ready",
        blockers=[],
        municipio_id=municipio_id,
        escenarios=resultados,
        escenario_ganador=ganador.nombre,
        resumen_comparativo=resumen,
        advertencias=advertencias,
    )
