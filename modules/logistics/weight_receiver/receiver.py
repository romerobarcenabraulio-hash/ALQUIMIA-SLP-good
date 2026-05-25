"""Receptor de eventos de peso/tonelaje por fracción."""
from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime
from typing import Iterable

from modules.logistics.schemas import WeightEvent

FRACCIONES_DEFAULT = ("organicos", "inorganicos", "vidrio", "metal", "papel")


def validate_weight_event(event: WeightEvent) -> list[str]:
    errors: list[str] = []
    if event.toneladas < 0:
        errors.append("toneladas no puede ser negativo")
    if event.toneladas > 500:
        errors.append("toneladas fuera de rango operativo (>500 t/día)")
    if not event.fraccion.strip():
        errors.append("fraccion requerida")
    if event.pureza_pct is not None and not (0 <= event.pureza_pct <= 100):
        errors.append("pureza_pct debe estar entre 0 y 100")
    return errors


def ingest_weight_events(events: Iterable[WeightEvent]) -> tuple[list[WeightEvent], list[str]]:
    accepted: list[WeightEvent] = []
    rejections: list[str] = []
    for ev in events:
        errs = validate_weight_event(ev)
        if errs:
            rejections.append(f"{ev.fraccion}@{ev.municipio_id}: {'; '.join(errs)}")
            continue
        accepted.append(ev)
    return accepted, rejections


def aggregate_tonelaje(events: Iterable[WeightEvent]) -> dict[str, float]:
    totals: dict[str, float] = defaultdict(float)
    for ev in events:
        totals[ev.fraccion] += ev.toneladas
    return dict(totals)


def aggregate_pureza(events: Iterable[WeightEvent]) -> dict[str, float]:
    weighted: dict[str, tuple[float, float]] = defaultdict(lambda: (0.0, 0.0))
    for ev in events:
        if ev.pureza_pct is None or ev.toneladas <= 0:
            continue
        prev_t, prev_p = weighted[ev.fraccion]
        weighted[ev.fraccion] = (prev_t + ev.toneladas, prev_p + ev.pureza_pct * ev.toneladas)
    return {
        frac: round(p / t, 2) if t > 0 else 0.0
        for frac, (t, p) in weighted.items()
    }


def synthetic_weight_events(
    municipio_id: str,
    *,
    fecha: date | None = None,
    ton_total: float = 0.0,
) -> list[WeightEvent]:
    """Fase 0-1: eventos vacíos o distribución mínima cuando no hay báscula."""
    plan_date = fecha or date.today()
    if ton_total <= 0:
        return [
            WeightEvent(
                municipio_id=municipio_id,
                fecha=plan_date,
                fraccion=f,
                toneladas=0.0,
                pureza_pct=None,
                source="synthetic_zero",
                recorded_at=datetime.utcnow(),
            )
            for f in FRACCIONES_DEFAULT
        ]
    shares = [0.35, 0.30, 0.10, 0.12, 0.13]
    purezas = [72.0, 68.0, 85.0, 80.0, 78.0]
    return [
        WeightEvent(
            municipio_id=municipio_id,
            fecha=plan_date,
            fraccion=FRACCIONES_DEFAULT[i],
            toneladas=round(ton_total * shares[i], 3),
            pureza_pct=purezas[i],
            source="synthetic_distributed",
            recorded_at=datetime.utcnow(),
        )
        for i in range(len(FRACCIONES_DEFAULT))
    ]
