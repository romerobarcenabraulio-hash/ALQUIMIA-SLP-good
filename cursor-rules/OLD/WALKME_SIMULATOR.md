# Walk-me ALQUIMIA · Simulador (briefings por sección)

## Qué es esto

No es sólo una lista de clics de QA: es el **mapa editorial** del simulador. **En cada sección hay (o debe haber) un briefing**: de qué estamos hablando, qué pregunta se resuelve, con qué datos y **qué no implica** (límites legales y de modelo).

- **En la interfaz**, ese briefing vivo corresponde al **`ModuleEditorialBrief`** dentro de **`DecisionModuleShell`** (`data-testid` patrón `module-editorial-brief-{module_id}`) más el **`DecisionHeader`**: texto fijo al hacer scroll sobre el trabajo del módulo.
- **En este archivo**, reunimos los **guiones briefing** por `module_id` y por bloques que no son módulos del journey (`#propuestas-simulador`, zona RSU, vivienda), para que un agente o redactor pueda **regenerarlos** cuando cambien rutas, copys o controles sin inventar contenido huérfano del código.

## Briefings por módulo (funcionario, `DecisionModule`)

Cada fila resume **el tema del módulo** (no sustituye al JSON del journey; puede enriquecerse desde `frontend/src/app/simulator/page.tsx` → `FUNCTIONARY_MODULE_LABELS`).

| `module_id` | De qué hablamos en esta sección (briefing) | Recuerda siempre |
|-------------|--------------------------------------------|-------------------|
| `city_baseline` | Resumen ejecutivo del **problema municipal** antes de instrumentos: costo de no separar, salud, derrama, supuestos del escenario. | Municipio ≠ ZM para competencia; KPIs son **estimación de modelo**. |
| `municipial_context` | Qué permite el **marco jurídico municipal** y qué requiere otro ámbito; diagnóstico **expositivo**, no dictamen de autoridad competente. | Validar fuente municipal antes de sancionar o citar oficialidad. |
| `future_goals` | **Metas** traducidas a tiempo: horizonte, captura, calendario, dependencias y brechas de capacidad. | No es cronograma aprobado ni promesa de cabildo. |
| `infrastructure_operations` | **Dónde y cuándo** entra infraestructura; capacidad, rutas, PER, flujo material ligado al territorio modelado. | Geometría operativa no sustituye capas oficiales sin contrato Navigator. |
| `inspeccion_predios` | **Educación, visita, evidencia e inspección** como secuencia administrativa; sin presentar sanciones firmes desde el simulador. | Bitácora interna de flujo, no resolución sancionatoria. |
| `scenarios_export` | **Comparación de escenarios**, sensibilidad, exportables; salida **no oficial** hasta validación competente. | Monte Carlo / KPIs con advertencias de validación pendiente. |
| `source_traceability` | **Qué número sustenta qué afirmación**: matriz de fuentes, fórmulas y acción correctiva. | Cerrar trazabilidad antes de uso público formal. |

Regeneración: al cambiar `label`, `decision`, `evidence` o `next_action` en código, actualizar la columna “De qué hablamos” aquí o en el prompt del agente.

## Briefings de bloques fuera del `portalJourney`

| Ancla | De qué hablamos | Dónde se ve |
|-------|-----------------|-------------|
| `#propuestas-simulador` | **Congelar hasta tres instantáneas** del escenario para comparar; “Activar” = sliders viven ese estado; “menor costo modelo” = lectura técnica interna (CAPEX anualizado + OPEX), no recomendación institucional. | `PropuestasSimulatorBar` |
| `rsu-zona-unica` | **Una sola narrativa RSU**: generación, composición de referencia, jerarquía PET/HDPE dentro de plásticos vs total, horizonte, captura global única, precios/mermas y disposición. | `FuncionariosViviendaRsuModel` |
| `vivienda-accordion-shell` | **Hechos INEGI** vs **supuestos operativos** (condominio, ocupantes, derivados); sin inventar clase de vivienda municipal si no viene tabulado. | Mismo componente |

## Prompt corto para quien escribe o regenere walk-mes / briefings

Pega junto al diff o lista de ficheros tocados (`SimulatorPage.tsx`, `DecisionModuleShell.tsx`, `ModuleEditorialBrief.tsx`, `FUNCIONARIO_*`, disclaimers):

- Mantén **un párrafo briefing por sección**: tema, entrada de datos del usuario y **límite jurídico o de modelo**.
- Obliga `{module_id}`, `data-testid` cuando existan, y **`last_verified_git_sha`** o fecha si es revisión manual.
- Prohibido inventar controles o URLs no presentes en el código revisado.

## Sesión rápida de verificación (opcional)

1. `/simulator` → audiencia funcionario → municipio catálogo INEGI → sin segundo panel metropolitano duplicado.
2. `#propuestas-simulador` → disclaimers → guardar/activar A/B/C.
3. Por cada **módulo** del journey: ¿el strip sticky muestra briefing coherente con la tabla anterior al hacer scroll largo?
4. `rsu-zona-unica` + `captura-global-summary` únicos; `vivienda-accordion-shell` con tres bloques.
5. Hard refresh conserva tres slots persistidos (`alquimia-simulator` v2).

## Artefactos de evidencia

- Captura donde se vean **briefing visible** + panel de trabajo del mismo módulo.
- Opcional: recorte de `localStorage` parcializado (solo `audience`, `propuestaSlots`) para auditoría.
