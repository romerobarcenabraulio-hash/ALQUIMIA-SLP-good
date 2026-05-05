"""
Schemas del endpoint /generate/plan — separados del router para
permitir importación en tests sin depender de auth.py (passlib).
"""
from __future__ import annotations

from pydantic import BaseModel
from typing import Optional

from app.schemas.simulate import ScenarioInput


class GeneratePlanRequest(BaseModel):
    municipio:             str
    zm:                    str
    scenario:              ScenarioInput
    kpis:                  Optional[dict] = None
    resultados_completos:  Optional[dict] = None   # output auditado del motor frontend
    municipios_activos:    Optional[list] = None   # lista de municipio_ids activos
    # Fase 2.5: snapshot de trazabilidad de datos enviado por el frontend
    # Contiene provenance de cada KPI usado en el cálculo + advertencias + score
    data_provenance:       Optional[dict] = None
    # Fase 5: MarketSummary serializado proveniente de POST /market/place
    # Si se provee, AGORA lo recibe en ScenarioBundle.inputs_usuario["market_summary"]
    # y sus warnings se propagan a ScenarioBundle.warnings.
    market_summary:        Optional[dict] = None
    # Fase 6: MacroImpactSummary serializado proveniente de POST /macros/impact
    # para que AGORA documente grandes fuentes, trazabilidad y advertencias.
    macro_impact_summary:  Optional[dict] = None
    # Fase 7: ReasoningGraph serializado proveniente de POST /reasoning/graph.
    reasoning_graph:       Optional[dict] = None
    # Fase 8: expansion nacional municipio por municipio.
    municipio_profiles:    Optional[list[dict]] = None
    coverage_statuses:     Optional[list[dict]] = None
    legal_sources:         Optional[list[dict]] = None
    # Fase 9: bitacora/resumen operativo de campo.
    operations_summary:    Optional[dict] = None
