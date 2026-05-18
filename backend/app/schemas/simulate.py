from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any

from app.schemas.cost_model import NegotiationScheme

class PreciosMaterial(BaseModel):
    pet:      float = 5.50
    hdpe:     float = 8.50
    papel:    float = 2.50
    vidrio:   float = 2.30
    aluminio: float = 15.10
    organico: float = 0.30  # $300 MXN/ton composta básica (corregido)

class MixCAs(BaseModel):
    P: int = 3
    M: int = 0
    G: int = 0

class ScenarioInput(BaseModel):
    zm_activa:             str   = "SLP"
    municipios_activos:    List[str] = ["slp", "sol", "csp", "vip"]
    horizonte:             int   = Field(3, ge=1, le=5)
    pct_captura_por_año:   List[float] = [20, 45, 70, 90, 100]
    precios:               PreciosMaterial = PreciosMaterial()
    merma_log_pct:         float = Field(10, ge=5, le=25)
    mix_cas:               MixCAs = MixCAs()
    wacc:                  float = Field(20, ge=12, le=30)
    tipo_cambio:           float = 17.10
    precio_carbono_esc:    str   = "voluntario"
    gen_percapita:         float = 0.90
    mes_inicio:            int   = Field(1, ge=1, le=12)
    costo_com_social:      float = 600000
    subsidio_federal:      float = 0
    cap_camion_ton:        float = 12
    distancia_relleno:     float = 25
    # Wave 0: motor financiero trazable
    negociacion:           NegotiationScheme = NegotiationScheme.municipal_directo
    cost_overrides:        Optional[Dict[str, float]] = Field(
        None,
        description="Mapa concepto → monto_usuario para sobreescribir precargados del registry. "
                    "Ej: {'terreno_CA_P': 420000}",
    )

class SimulateResponse(BaseModel):
    pob_activa:            float
    viv_activas:           float
    rsu_total_ton_dia:     float
    ingresos_brutos:       float
    capex_total:           float
    ebitda:                float
    margen_ebitda:         float
    vpn:                   float
    tir:                   float
    tir_equity:            float
    payback_meses:         float
    empleos_directos:      float
    empleos_indirectos:    float
    # CO2e — separación explícita anual vs horizonte (Bug 1 fix)
    co2e_evitadas:         float   # acumulado del horizonte completo (t CO2e)
    co2e_evitadas_anual:   float   # año final del horizonte — KPI para header/gauge
    co2e_evitadas_horizonte: float # alias explícito de co2e_evitadas
    kwh_biogas:            float
    ahorro_salud:          float
    derrama_total:         float
    score_politico:        float
    serie_anual:           List[Dict]
    # Fase 2.5: trazabilidad de las entradas del cálculo
    # data_provenance contiene el SnapshotDatos que se usó para obtener
    # los valores de entrada (población, gen per cápita, tipo de cambio, etc.).
    # None cuando el cálculo se ejecutó offline sin registry.
    data_provenance:       Optional[Any] = None
    # Fase 5: volúmenes capturables por material en Año 1 (t/año)
    # Alimenta el módulo de marketplace para calcular colocación real.
    # None cuando el cálculo se ejecutó offline o la ZM no tiene datos de composición.
    vol_capturable_por_mat_ton_anio: Optional[Dict[str, float]] = None
    # Wave 0: motor financiero trazable
    cost_model:              Optional[Any] = Field(
        None,
        description="CostModelSummary serializado — desglosa CAPEX/OPEX por actor y confianza",
    )
    financial_run_manifest:  Optional[Any] = Field(
        None,
        description="FinancialRunManifest — hash determinista del run para trazabilidad",
    )
