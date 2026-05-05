"""
DataRegistry — orquestador de adapters para Fase 2.

Responsabilidades:
  1. Mantener lista de adapters registrados.
  2. Para una ZM dada, ejecutar todos los adapters en paralelo.
  3. Por cada KPI, seleccionar el valor con mayor confianza (tipo más alto).
  4. Si ningún adapter primario provee un KPI → FallbackAdapter.
  5. Construir SnapshotDatos con advertencias consolidadas.
  6. NUNCA retornar tipo=oficial si la fuente no fue verificada en esta sesión.

Jerarquía de tipo (mayor = mejor):
  oficial > certificado > estimado > manual > no_disponible

El registry NO modifica los valores ni el tipo reportado por cada adapter.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.data.adapters.banxico  import BanxicoAdapter
from app.data.adapters.fallback import FallbackAdapter
from app.data.adapters.inegi    import InegiAdapter
from app.data.adapters.semarnat import SemarnatAdapter
from app.data.adapters.smn      import SmnAdapter
from app.data.adapters.base     import BaseAdapter
from app.data.schemas import (
    AdvertenciaKPI, FuenteStatus, FuenteTipo, KPIConProvenance, SnapshotDatos,
)

# Orden de preferencia de tipos (mayor índice = mayor prioridad)
_TIPO_PRIORIDAD: Dict[FuenteTipo, int] = {
    FuenteTipo.no_disponible: 0,
    FuenteTipo.manual:        1,
    FuenteTipo.estimado:      2,
    FuenteTipo.certificado:   3,
    FuenteTipo.oficial:       4,
}

# Score de datos: suma de confianzas * 20 (máx ~100)
_MIN_CONFIANZA_SIN_BLOQUEO = 0.60


def _score_datos(kpis: List[KPIConProvenance]) -> int:
    """Score 0-100 basado en confianza promedio de los KPIs con valor."""
    con_valor = [k for k in kpis if k.valor is not None]
    if not con_valor:
        return 0
    promedio = sum(k.provenance.confianza for k in con_valor) / len(con_valor)
    return round(promedio * 100)


def _bloquea_agora(kpis: List[KPIConProvenance]) -> bool:
    """
    Bloquea ÁGORA si algún KPI crítico tiene tipo=no_disponible o confianza < 0.60.
    KPIs críticos: poblacion_total, gen_percapita_kg_dia.
    """
    criticos = {"poblacion_total", "gen_percapita_kg_dia"}
    for k in kpis:
        if k.kpi_id not in criticos:
            continue
        if k.provenance.tipo == FuenteTipo.no_disponible:
            return True
        if k.provenance.confianza < _MIN_CONFIANZA_SIN_BLOQUEO:
            return True
    return False


class DataRegistry:
    """
    Singleton que orquesta todos los adapters de datos.
    Uso: await DataRegistry.instance().snapshot(zm)
    """

    _instance: Optional["DataRegistry"] = None

    def __init__(self) -> None:
        self._adapters: List[BaseAdapter] = [
            BanxicoAdapter(),
            InegiAdapter(),
            SemarnatAdapter(),
            SmnAdapter(),
        ]
        self._fallback = FallbackAdapter()

    @classmethod
    def instance(cls) -> "DataRegistry":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def adapters(self) -> List[BaseAdapter]:
        return list(self._adapters)

    def fuentes_status(self) -> List[FuenteStatus]:
        return [a.status() for a in self._adapters]

    async def snapshot(self, zm: str) -> SnapshotDatos:
        """
        Ejecuta todos los adapters en paralelo y construye un SnapshotDatos.
        Siempre retorna — nunca lanza.
        """
        # Ejecutar adapters primarios en paralelo
        results = await asyncio.gather(
            *[adapter.fetch(zm) for adapter in self._adapters],
            return_exceptions=True,
        )

        # Consolidar: por kpi_id, quedarse con el de mayor prioridad
        best: Dict[str, KPIConProvenance] = {}
        for result in results:
            if isinstance(result, Exception):
                continue  # El adapter debió haber capturado esto — pero por si acaso
            for kpi in result:
                existing = best.get(kpi.kpi_id)
                if existing is None:
                    best[kpi.kpi_id] = kpi
                else:
                    prio_new = _TIPO_PRIORIDAD.get(kpi.provenance.tipo, 0)
                    prio_old = _TIPO_PRIORIDAD.get(existing.provenance.tipo, 0)
                    if prio_new > prio_old or (
                        prio_new == prio_old
                        and kpi.provenance.confianza > existing.provenance.confianza
                    ):
                        best[kpi.kpi_id] = kpi

        # Completar con fallback para KPIs no cubiertos o con no_disponible
        fallback_kpis = await self._fallback.fetch(zm)
        for kpi in fallback_kpis:
            existing = best.get(kpi.kpi_id)
            if existing is None or existing.provenance.tipo == FuenteTipo.no_disponible:
                best[kpi.kpi_id] = kpi

        kpis_final = list(best.values())

        # Construir advertencias consolidadas
        criticos = {"poblacion_total", "gen_percapita_kg_dia"}
        advertencias: List[AdvertenciaKPI] = []
        for kpi in kpis_final:
            prov = kpi.provenance
            if prov.advertencia:
                advertencias.append(AdvertenciaKPI(
                    kpi_id=kpi.kpi_id,
                    kpi_label=kpi.kpi_label,
                    tipo=prov.tipo,
                    advertencia=prov.advertencia,
                    bloquea_agora=(
                        kpi.kpi_id in criticos
                        and prov.tipo == FuenteTipo.no_disponible
                    ),
                ))

        return SnapshotDatos(
            zm=zm.upper(),
            timestamp=datetime.now(timezone.utc).isoformat(),
            kpis=kpis_final,
            advertencias=advertencias,
            score_datos=_score_datos(kpis_final),
            bloquea_agora=_bloquea_agora(kpis_final),
        )
