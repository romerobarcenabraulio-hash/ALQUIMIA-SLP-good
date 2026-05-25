# Changelog — Wave 2 SUPREME · 22 mayo 2026

## Documentación y arquitectura de agentes

- **supreme.md v2.0** — Identidad multi-ciudad/multi-sector; dimensiones parametrizadas; SLP como referencia externa
- **PROTOCOLO_ECOSISTEMAS_AGENTES.md** — Puente Ecosistema 1 (HERMES/KRONOS/SUPREME/EIDOS) ↔ PIS
- **RESPUESTA_SUPREME_A_EIDOS_2026-05-22.md** — Decisiones S1–S11 cerradas
- **SLP_BASELINE_REFERENCIA.md** — Cifras piloto SLP centralizadas (no en cursor rules genéricos)
- **hermes.md, kronos.md, eidos.md** — Headers v2.0 alineados a plataforma consultoría integral
- **BRIEFING_PLATAFORMA_2026-05.md** — Conteo corregido: 35 módulos + M00
- **CONSTITUCION_ALQUIMIA_CAPITULOS_MODULOS.md** — Conteo journey actualizado

## Producto (EJECUTOR / propagación EIDOS)

- Landing H1: "Plataforma de consultoría integral" (S8)
- Login inline: deprecado fetch `/api/acceso`; flujo `/api/auth/login` + demo-token (S9)
- `/gobierno`: terminología "servicio sectorial" (S6)
- `/privados`: "Debida diligencia ambiental" (S11)
- Glosario eidos.md: cadena de custodia vs trazabilidad (S7)
- eidos.md v2.0: identidad S1, concesión de ruta S10, PROTOCOLO E1↔PIS (S5)
- page.tsx: "Inicio de sesión institucional" (coherencia footers)
- [RESPUESTA_EIDOS_A_SUPREME_2026-05-22.md](RESPUESTA_EIDOS_A_SUPREME_2026-05-22.md) — cierre formal Wave 2

## Integración HERMES ↔ KRONOS

- `buildLogisticsKpiFromStore.ts` + `financeLogisticsCalc.ts`
- M09 CostosProgramaStack: OPEX logístico + `__ALQUIMIA_FINANCE_KPI__`
- M13 ScenariosExportStack: `scenarioStressMultiplier` por brecha/estacionalidad
- Store: `costoCamionMesMxn`, `costoVisitaMxn`, `costoContingenciaTonMxn` editables

## Tests

- `simulatorSurface.test.ts`: 36 ítems journey; cierre en `gate_status`
- Backend KRONOS: 23 tests pytest (evm, gate, material_prices)

## Pendiente Wave 3 (no bloqueante)

- Parametrizar prerequisitos gates en `gate_tracker.py` por municipio
- Decidir persistencia Neon para KPI logístico (opción B) cuando haya cliente con contrato
- Propagación residual copy "simulador RSU" en docs históricos EIDOS (cartas archivadas)
