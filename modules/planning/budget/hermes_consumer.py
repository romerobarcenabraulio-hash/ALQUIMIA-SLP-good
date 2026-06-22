"""Consumidor del feed diario HERMES (daily_summary)."""
from __future__ import annotations

import json
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

from modules.planning.budget.schemas import HermesDailyFeed, _d


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def hermes_daily_summary_dir() -> Path:
    return repo_root() / "data" / "logistics" / "daily_summary"


def _parse_daily_summary(payload: dict) -> HermesDailyFeed:
    tonelaje_map = payload.get("tonelaje_por_fraccion") or {}
    ton_total = sum(_d(v) for v in tonelaje_map.values())
    incidentes = tuple(payload.get("incidentes") or [])
    return HermesDailyFeed(
        date=str(payload.get("date", "")),
        municipio_id=str(payload.get("municipio_id", "")),
        costo_logistico=_d(payload.get("costo_logistico", "0")),
        km_totales=_d(payload.get("km_totales", "0")),
        tonelaje_total=ton_total,
        merma_logistica_pct=_d(payload.get("merma_logistica_pct", "0")),
        fuente=str(payload.get("fuente", "hermes_daily_summary")),
        incidentes=incidentes,
    )


def load_hermes_feed(path: Path) -> HermesDailyFeed | None:
    if not path.is_file():
        return None
    payload = json.loads(path.read_text(encoding="utf-8"))
    return _parse_daily_summary(payload)


def consume_hermes_feeds(
    municipio_id: str | None = None,
    *,
    lookback_days: int = 60,
    fecha_hasta: date | None = None,
) -> tuple[list[HermesDailyFeed], list[str]]:
    """
    Lee feeds HERMES publicados en data/logistics/daily_summary/.

    Retorna feeds válidos (más recientes primero) y advertencias si faltan días.
    """
    end = fecha_hasta or date.today()
    feeds: list[HermesDailyFeed] = []
    warnings: list[str] = []
    summary_dir = hermes_daily_summary_dir()

    for offset in range(lookback_days):
        d = end - timedelta(days=offset)
        path = summary_dir / f"{d.isoformat()}.json"
        feed = load_hermes_feed(path)
        if feed is None:
            continue
        if municipio_id and feed.municipio_id != municipio_id:
            continue
        feeds.append(feed)

    if not feeds:
        warnings.append(
            f"Sin feeds HERMES en {summary_dir} — pipeline opera con estructura vacía/sintética"
        )
        return [], warnings

    feeds.sort(key=lambda f: f.date, reverse=True)

    # Alerta si el feed más reciente tiene más de 3 días (parada obligatoria AURUM)
    try:
        latest = date.fromisoformat(feeds[0].date)
        gap = (end - latest).days
        if gap > 3:
            warnings.append(
                f"HERMES sin publicar por {gap} días (último: {feeds[0].date}) — AC del EVM desactualizado"
            )
    except ValueError:
        warnings.append(f"Fecha inválida en feed HERMES: {feeds[0].date}")

    return feeds, warnings


def aggregate_hermes_logistics(feeds: list[HermesDailyFeed]) -> dict[str, Decimal]:
    if not feeds:
        return {
            "costo_logistico_total": Decimal("0"),
            "tonelaje_total": Decimal("0"),
            "km_totales": Decimal("0"),
            "merma_promedio_pct": Decimal("0"),
            "dias": Decimal("0"),
        }

    costo = sum((f.costo_logistico for f in feeds), Decimal("0"))
    ton = sum((f.tonelaje_total for f in feeds), Decimal("0"))
    km = sum((f.km_totales for f in feeds), Decimal("0"))
    merma_avg = sum((f.merma_logistica_pct for f in feeds), Decimal("0")) / _d(len(feeds))

    return {
        "costo_logistico_total": costo,
        "tonelaje_total": ton,
        "km_totales": km,
        "merma_promedio_pct": merma_avg,
        "dias": _d(len(feeds)),
    }
