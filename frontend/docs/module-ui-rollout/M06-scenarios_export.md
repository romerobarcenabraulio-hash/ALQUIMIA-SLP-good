# Ejecutor — M06 `scenarios_export`

## Prompt Ejecutor (una línea)

Ejecutarás íntegramente este archivo como única fuente de alcance; inicia leyendo el prompt canónico del plan "Frontend vs mockups" con `{{RUTA_EJECUTOR_MD}}` = `frontend/docs/module-ui-rollout/M06-scenarios_export.md`.

---

## Referencias MODULE_MAP

- **Row ID:** M06
- **Mockups (no literales; solo intención UX):** MODULO 6.png, MODULO 6 PAG 1.png, MODULO 6.6.png
- **Producto:** Varias pantallas del mockup se mapean aquí a **sub-secciones** (p. ej. tabs locales), no a páginas nuevas.

---

## `module_id` y audiencia

- **`module_id`:** `scenarios_export`
- **Audiencia implementada en este paquete:** **functionary** únicamente (`renderDecisionModule`: rama `switch` final, no `citizen` ni `entrepreneur`).
- **Nota producto** (no cambiar en este ticket salvo bloque *Approved Planner* aparte): el backend expone también `impact_finance` en el journey city_plan; la audiencia funcionario **no** lo ve como paso separado en `AUDIENCE_MODULES`. El impacto y finanzas “duros” del funcionario viven en parte en este bloque (`ImpactoFinanciero` aquí). Si se reexpone `impact_finance` al funcionario, eso va en el documento `frontend/docs/module-ui-rollout/PRODUCT-impact_finance-visibility.md`, no improvisado aquí.

---

## Alcance táctil (objetivo UX)

Reducir scroll infinito del bloque `scenarios_export` mediante **navegación local por tabs** (patrón visual coherente con `FutureGoalsModule`: contenedor `rounded-[10px]`, `border border-[#E8E4DC]`, `bg-white`, botones de pestaña similares).

**Agrupación tab sugerida** (ajustable solo si un comentario JSX de una línea documenta dependencia de datos):

| Tab etiqueta breve sugerida | Componentes dentro (orden interno estable salvo causa documentada) |
|-----------------------------|-------------------------------------------------------------------|
| **Finanzas y salida** | `ImpactoFinanciero`, `ExportarSection`, `ExportadorReporte` |
| **Indicadores y alertas** | `DashboardKPIs`, `AlertasPanel` |
| **Gobernanza y arranque** | `GovernancePanel`, `LaunchChecklist` |

**Reglas UX:** Tabs accesibles (`aria-label` en `<nav>` o equivalente ya usado en el proyecto), primer tab por defecto, estado activo visible; sin cargar grafos externos nuevos más allá de lo que estos componentes ya hacen hoy.

---

## Archivos permitidos (lista cerrada)

Solo estas rutas, desde la raíz del repo **`alquimia-slp/`**:

1. **`frontend/src/components/simulator/ImpactoFinanciero.tsx`**
2. **`frontend/src/components/simulator/ExportarSection.tsx`**
3. **`frontend/src/components/simulator/ExportadorReporte.tsx`**
4. **`frontend/src/components/simulator/DashboardKPIs.tsx`**
5. **`frontend/src/components/simulator/AlertasPanel.tsx`**
6. **`frontend/src/components/simulator/GovernancePanel.tsx`**
7. **`frontend/src/components/simulator/LaunchChecklist.tsx`**

Y **solo una** de las dos opciones siguientes para ensamblar el `case`:

8a. **`frontend/src/app/simulator/renderDecisionModule.tsx`** — únicamente el fragmento bajo **`case 'scenarios_export':`** (imports estáticos del archivo solo si siguen necesarios para este case; preferir mover ensamblado a wrapper si Coordinador acordó PR wrapper).

**O**

8b. **`frontend/src/components/simulator/stacks/ScenariosExportStack.tsx`** (nuevo archivo) **más** el **`case 'scenarios_export'`** en **`frontend/src/app/simulator/renderDecisionModule.tsx`** reducido a `return <ScenariosExportStack />` (imports en `renderDecisionModule` mínimos).

**Opcional Coordinador-only** (solo si SHARED ya estableció helpers): usar cabeceras reutilizables desde `moduleSectionChrome.tsx` solo si ese archivo aparece ya en lista permitida SHARED; si no existe aún **no crear** nuevo helper compartido en este ejecutor sin extender SHARED.

---

## Archivos y acciones prohibidas

- Cualquier ruta **no listada** arriba (incluye `DecisionModuleShell.tsx`, `page.tsx`, `audienceModules.ts`, `simulatorStore`, backend, otros `case` del `switch`).
- Nuevas dependencias **npm**.
- Nuevas rutas **Next.js** o páginas nuevas.
- KPIs, montos, porcentajes o geografía **nuevos** no respaldados por datos ya mostrados en esos componentes / store.
- Copy que **mezcle** alcance municipal con ZM en textos de decisión formal; ver **`cursor-rules/NAVIGATOR.md`**.
- Eliminar o renombrar **`data-testid`** existentes sin reemplazo equivalente en el mismo flujo.
- Cambiar contratos de API, tipos en `frontend/src/types` o forma de `DecisionModule` salvo error de compilación demostrable y acotado a imports del case.

---

## Pasos ordenados (quirúrgicos)

1. Leer este documento completo y luego **cada** archivo permitido (7 hojas + router o stack).
2. Inspeccionar implementación actual de tabs en **`frontend/src/components/simulator/FutureGoalsModule.tsx`** para **clases y patrón** de botones (no copiar lógica de `armed`/dynamic innecesaria).
3. Implementar tabs **dentro de un solo componente contenedor** preferiblemente:
   - **Opción A (recomendada si Coordinador prioriza diffs pequeños en router):** nuevo `ScenariosExportStack.tsx` que importa los 7 componentes y renderiza tabs; `renderDecisionModule` solo devuelve `<ScenariosExportStack />`.
   - **Opción B:** mismo JSX con tabs **inline** solo dentro `case 'scenarios_export'` en `renderDecisionModule.tsx` sin archivo nuevo (más riesgo de conflicto Git con otros ejecutores del mismo `switch`).
4. Asegurar que **todos** los siete componentes siguen montados en el árbol cuando el usuario navega tabs (no `lazy` que rompa efectos existentes), salvo que el componente hijo ya use `dynamic` internamente (no modificar eso en este ticket).
5. Revisar accesibilidad mínima: foco visible o `aria-selected` en pestañas según patrón del proyecto.
6. Verificar que **entrepreneur** y **citizen** no queden afectados (no tocar sus ramas del `switch`).

---

## Conflictos paralelos

- **Alto** con cualquier otro PR que edite **`renderDecisionModule.tsx`** en el mismo `case` o en bloque de imports compartido.
- **Mitigación:** PR dedicado `ScenariosExportStack.tsx` + una línea en el `case` reduce superficie de conflicto.

---

## CHECKLIST antes de merge

- [ ] Diff limitado a rutas de **Archivos permitidos**.
- [ ] Row **M06** citado en descripción de PR.
- [ ] Sin dependencias nuevas; sin rutas Next nuevas.
- [ ] Copy territorial revisado si se tocó texto visible (Navigator).
- [ ] Desde `frontend/`: `npm run type-check` — sin errores nuevos.
- [ ] Desde `frontend/`: `npm run lint` — sin errores nuevos en archivos tocados.
- [ ] Desde `frontend/`: `npm run test` — verde (o justificar fallo preexistente con enlace a issue; no introducir fallos nuevos en tests que cubran estos módulos).
- [ ] Prueba manual: audiencia **functionary**, módulo **Escenarios y salida** (_label journey_: según backend), las tres tabs muestran contenido y no hay regresión de scroll crítica en móvil ancho estrecho.

---

## Comandos de verificación (copiar)

```bash
cd frontend && npm run type-check && npm run lint && npm run test
```
