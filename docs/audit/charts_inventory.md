# Inventario de gráficas · QHC simulador (LOGOS)

**Fecha:** 2026-05-25  
**Fuente:** `frontend/src/data/chartBriefCatalog.ts` · `chartId` / `data-chart-id` en JSX del simulador  
**Referencia editorial:** `docs/style/editorial_pattern_canonico.md`

## Resumen

| Métrica | Valor |
|---------|-------|
| Entradas en catálogo | 65 |
| `chartId` cableados en JSX (CI) | 51 + 5 nuevos M13 en `ImpactoFinanciero.tsx` |
| Módulo con más gráficas | M03 (12) · M10/M05 (15) · M13 (9) |

## Leyenda de columnas

- **Tipo:** forma visual principal (línea, barra, tornado, donut, waterfall, área, matriz, mapa, Gantt, rejilla).
- **QHC actual:** campo `como_se_calcula` del catálogo (tono editorial financiero post-pulido LOGOS).
- **Cifras clave:** magnitudes que el usuario ve en el panel o KPI strip.

## Catálogo completo

| chart_id | Módulo | Tipo | Cifras clave | QHC (Qué — extracto) |
|---|---|---|---|---|
| `volumen-rsu` | M01 | KPI + barras | t/día capturable · ingreso anual MXN | Cientos de toneladas al día y decenas de millones al año: ahí empieza la derrama del programa… |
| `trayectoria-captura` | M01 | línea | % captura por año | La curva en S modela arranque lento y masa crítica en años 3–4… |
| `composicion-rsu` | M01 | donut | % por fracción · orgánicos ~52% | Más plástico y menos orgánico suben ingreso por kg… |
| `impactos-acumulados` | M01 | área | tCO₂e acumuladas | Toneladas desviadas traducidas en CO₂e comparables con metas climáticas… |
| `diagnostico-juridico` | M02 | KPI / tabla | % cobertura · vacíos LGPGIR | ¿Qué obligación del LGPGIR queda sin regla local operable?… |
| `cobertura-normativa` | M02 | arco | meta 85% | 85% sobre artículos clave LGPGIR… |
| `m02-cobertura-normativa` | M02 | barra | % por municipio | Cada barra conserva jurisdicción propia en vista ZM… |
| `gantt-maestro` | M03 | Gantt | semanas · CAPEX por fase | Semanas en rojo: ruta crítica… |
| `m03-gantt-master` | M03 | Gantt resumen | 7 líneas · semanas totales | Siete líneas antes de abrir T01–T15… |
| `m03-gantt-detail` | M03 | Gantt detalle | t_o / t_m / t_p | Si T09 (permisos) come el año 1… |
| `pert-ruta-critica` | M03 | red PERT | holgura LS − ES | Holgura cero: ahí se concentra supervisión… |
| `m03-pert-summary` | M03 | flujo | G1–G5 | ¿Qué bloquea qué antes del detalle técnico?… |
| `m03-pert-full` | M03 | grafo | T01–T15 | Nodos verdes = ruta crítica… |
| `m03-critical-table` | M03 | tabla | impacto +1 semana | Checklist con dueño antes de sesión… |
| `m03-raci` | M03 | matriz | R · A · C · I | Un solo Aprobador por fila… |
| `m03-bottlenecks` | M03 | matriz riesgo | P × I | Retraso en permisos modelado con mitigación… |
| `m03-map` | M03 | mapa | piloto · expansión | ¿Dónde encender el programa primero?… |
| `m03-progression` | M03 | líneas múltiples | empleos · CO₂e · derrama | Efecto de masa crítica años 3–5… |
| `m03-gates` | M03 | checklist | G1–G5 | Gates políticos vs tareas G01–G14… |
| `score-riesgo-total` | M05D / M14 | KPI | R_total 0–100 | 40% del score es riesgo político… |
| `precio-materiales` | M05 | barra | MXN/t · PET+HDPE ~65–70% ingreso | −20% PET ≈ −15% ingreso total… |
| `riesgo-mercado` | M05 | indicador | tasa colocación | Volumen sin comprador confirmado… |
| `m05-risk-matrix` | M10 | matriz 5×5 | 12 riesgos | ¿Dónde se concentran los rojos?… |
| `m05-actors` | M10 | barra | IPC por segmento | Captura años 1–2 y aceptación ciudadana… |
| `m05-donut` | M10 | donut | % por dimensión | Político 40%, mercado 30%… |
| `m05-drivers` | M10 | barra horizontal | impacto relativo | ¿Qué variable más reduce probabilidad?… |
| `m05-prob-dist` | M10 | histograma | 500 corridas · P10/P50/P90 | Percentiles obligatorios — no un solo número… |
| `m05-buyers` | M10 | tabla | estatus contractual | Sin offtaker nombrado, ingreso es proyección… |
| `m05-price-bands` | M10 | bandas | P10/P50/P90 MXN/t | Upside/downside antes de fijar tarifa… |
| `m05-tornado` | M10 | tornado | Δ ingreso ±20–30% | Palancas con concesionario — ingreso por materiales… |
| `m05-revenue` | M10 | distribución | P10/P50/P90 ingreso | Rango de derrama anual… |
| `m05-mitigation` | M10 | matriz | dueño · plazo · residual | Financiadores exigen acción con dueño… |
| `m05-trends` | M10 | lectura T1–T6 | presión regulatoria | Anticipación trimestral… |
| `m05-conditions` | M10 | checklist | 10 condiciones | ¿Viable sin prerequisitos abiertos?… |
| `mapa-centros-acopio` | M06 | mapa | radio influencia | CA >2 km reduce participación… |
| `m06-phase-deploy` | M06 | barra por fase | CAs · capacidad · cobertura | CAPEX alineado a captura real… |
| `m06-center-table` | M06 | tabla | score sitio | Score <60% raramente obtiene permiso… |
| `logistica-estacionalidad` | M08 | línea estacional | dic +15% · ene +12% | Picos dic–ene vs promedio anual… |
| `m08-seasonality` | M08 | línea vs capacidad | meses en rojo | RSU mensual vs capacidad instalada… |
| `m08-residential-routes` | M08 | tabla | 0.15 km/hogar | Piloto casa a casa antes de VRP… |
| `m08-routes` | M08 | mapa | rutas por fracción | Cobertura real vs brechas… |
| `m08-trucks` | M08 | barra | unidades por material | Flota en temporada alta… |
| `dictamen-captura-5v3` | M04 dictamen | comparativo | 5 vs 3 fracciones | Decisión normativa en pesos… |
| `dictamen-benchmarks` | M04 dictamen | tabla | benchmarks internacionales | Lecciones SNAGA, Bogotá, CDMX… |
| `criterios-aptitud` | M07 | score | ponderación 20/30/25/15/10 | Uso de suelo incompatible invalida predio… |
| `resumen-ejecutivo` | M13 | tabla | TIR · VPN · payback | Tres escenarios — no solo optimista… |
| `social-risk-matrix` | M02B | matriz cualitativa | severidad | Tres riesgos sociales críticos previos… |
| `costo-omision-acumulado` | M04 | área dual | contrafactual vs programa | Omisión en pesos para Cabildo… |
| `social-aceptacion-actores` | M02B | barra | % por actor · IPC | Años 1–2 y comunicación… |
| `doble-materialidad-grid` | M11 | matriz 2×2 | ESRS E5 | Priorización ESG / deuda verde… |
| `m09-source-matrix` | M09 | tabla | monto · fuente · fórmula | Trazabilidad CAPEX/OPEX… |
| `costos-capex-fases` | M09 | barra | F1–F6 M MXN | Desembolso por fases… |
| `escenarios-waterfall` | M13 | waterfall | componentes VPN | De dónde nace el valor neto… |
| `escenarios-tir` | M13 | barra horizontal | 4 escenarios TIR | Multiplicadores del caso central… |
| `escenarios-vpn` | M13 | área | CAPEX acumulado F1–F5 | Calendario de desembolso… |
| `m13-waterfall-valor` | M13 | waterfall | VPN · TIR · WACC | ¿Crea valor con supuestos actuales?… |
| `m13-monte-carlo-tir` | M13 | histograma | 2 000 · P10/P50/P90 TIR | Monte Carlo — método Los Álamos aplicado al RSU… |
| `m13-tornado-vpn` | M13 | tornado | rango VPN ±20% OAT | WACC y captura año 1 encabezan ranking… |
| `m13-cashflow` | M13 | línea múltiple | 3 trayectorias | ¿Refinanciamiento temprano?… |
| `m13-rejilla-stress` | M13 | rejilla 2×2 | A–D · TIR/VPN | **Estándar canónico** — choques coordinados… |
| `m13-monte-carlo-vpn` | M13 | histograma | 2 000 · P10/P50/P90 VPN | Percentiles del VPN en pesos de hoy… |
| `esquema-ingresos-municipio` | M12 | donut | % operativo vs fiscal | Cláusulas de concesión en flujo… |
| `esquema-derrama-sector` | M12 | barra | derrama por cadena | Impacto regional… |
| `m07-staff-composition` | M07 | barra | plazas por rol | Contratación verificable… |
| `inspeccion-completitud` | M07 | donut | % checklist PER | Parcial no cuenta para firma… |

## Gráficas M13 — prioridad de pulido

| chart_id | Ángulo LOGOS | Notas |
|----------|--------------|-------|
| `m13-rejilla-stress` | Implicación / rejilla | Patrón canónico EIDOS (combinaciones volumen × precio) |
| `m13-tornado-vpn` | Contraste + cifra | Reemplaza copy genérico de documentación |
| `m13-monte-carlo-tir` | Método | 2 000 corridas · percentiles TIR |
| `escenarios-tir` | — | Bloque maestro TIR múltiples encima del panel (UI, no catálogo) |

## Mantenimiento

- Regenerar catálogo editorial: `node frontend/scripts/logos-chart-briefs.mjs`
- CI: `editorialInventory.test.ts` exige que todo `chartId` en JSX tenga entrada en `CHART_BRIEF_CATALOG`
