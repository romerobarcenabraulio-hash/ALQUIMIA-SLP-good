# Informe ambiental-financiero · BIOS

**Audiencia:** Cabildo · Inversionista · PMO ambiental
**Fecha:** 2026-05-25
**Periodo CO₂e:** 2026-escenario
**Modelo:** Modelo_BASED.xlsx

## Pregunta de decisión

¿El beneficio ambiental proyectado (CO₂e evitadas) y el retorno financiero (VPN/TIR) justifican la inversión en valorización RSU?

## Resumen ejecutivo

- **CO₂e evitadas (escenario anual referencia):** 220,717.34 t
- **CO₂e acumuladas horizonte 10 años:** 3,563,373.98 t
- **VPN (MXN):** $931,814,311.81
- **TIR:** 120.45%
- **Payback simple:** 1.7 meses

> **QHC · Resumen ambiental-financiero**
> - **Qué:** Consolida emisiones evitadas del escenario y métricas de retorno (VPN, TIR, payback).
> - **Cómo:** Compare CO₂e con metas municipales de descarbonización; TIR vs. WACC declarado (20.0%).
> - **Cuidado:** CO₂e usa factores LCA (Ecoinvent/IPCC); no es inventario GEI certificado. TIR >50% requiere revisión AURUM/BIOS antes de presentar a Cabildo.

## CO₂e por fracción

| Fracción | Toneladas | CO₂e (t) | Factor | Fuente |
|----------|-----------|----------|--------|--------|
| aluminio | 9,246.96 | 83,222.64 | 9.0 | Ecoinvent (2023) |
| organicos_compost | 118,889.53 | 59,444.76 | 0.5 | IPCC (2021) |
| papel_carton | 51,171.17 | 46,054.05 | 0.9 | Ecoinvent (2023) |
| pet | 18,772.03 | 28,158.04 | 1.5 | Ecoinvent (2023) |
| vidrio | 12,792.79 | 3,837.84 | 0.3 | Ecoinvent (2023) |

> **QHC · CO₂e por fracción**
> - **Qué:** Desglose de emisiones evitadas por material valorizado según factores LCA ISO 14040.
> - **Cómo:** Aluminio y PET suelen concentrar CO₂e por factor de producción virgen evitada.
> - **Cuidado:** Tonelaje de fallback Modelo_BASED si no hay báscula operativa — ver notas al pie.

### Notas de proveniencia
- No hay tonelaje operativo registrado — Fase 0-1 sin báscula conectada.
- Fallback: volúmenes anuales del escenario Modelo_BASED (ZM SLP, horizonte año 3).

## Sensibilidad VPN (tornado)

| Variable | Δ% | VPN (MXN) | Δ VPN % |
|----------|-----|-----------|---------|
| precio_materiales | -30 | $592,820,359 | -36.4 |
| precio_materiales | +0 | $931,814,312 | +0.0 |
| precio_materiales | +30 | $1,270,808,264 | +36.4 |
| participacion_ciudadana | -20 | $709,054,406 | -23.9 |
| participacion_ciudadana | +0 | $931,814,312 | +0.0 |
| participacion_ciudadana | +20 | $1,009,480,673 | +8.3 |
| combustible_logistica | -50 | $939,904,467 | +0.9 |
| combustible_logistica | +0 | $931,814,312 | +0.0 |
| combustible_logistica | +50 | $923,724,156 | -0.9 |
| wacc | -20 | $1,143,988,716 | +22.8 |
| wacc | +0 | $931,814,312 | +0.0 |
| wacc | +20 | $766,554,053 | -17.7 |

> **QHC · Análisis de sensibilidad**
> - **Qué:** Muestra cómo varía el valor presente neto (VPN) ante cambios en precios, captura, combustible y WACC.
> - **Cómo:** Variable con mayor Δ VPN % es el driver de riesgo prioritario para negociación con concesionario.
> - **Cuidado:** Escenarios ±30% son ilustrativos; no sustituyen contrato de compra-venta de materiales.

*Proyección BIOS · Modelo_BASED.xlsx · No sustituye auditoría ambiental ni dictamen financiero.*