# Fase 8 · Auditoría visual Minto/McKinsey

**Fecha:** 2026-05-28  
**Estado:** Cerrado con evidencia visual focalizada  
**Alcance ejecutado:** auditoría previa, corrección de módulos prioritarios visibles, auditoría posterior con screenshots desktop/mobile, revisión de shells `/v`, `/p`, `/e`, y pruebas frontend.

## 1. Principio aplicado

La página debe leerse como reporte ejecutivo interactivo:

1. Conclusión ejecutiva primero.
2. Cifra o hallazgo protagonista después.
3. Evidencia mínima inmediatamente visible.
4. Detalle secundario en tabla, línea o lista limpia.
5. Sin cajas decorativas, fondos de color o cards anidadas en los módulos corregidos.

El color se usa en texto para estados, cifras y riesgo; no como contenedor decorativo.

## 2. Auditoría previa

| Módulo / superficie | Clasificación previa | Causa |
|---|---:|---|
| M00 · Guía de lectura | Parcial | Tiene estructura editorial, pero conserva ribbon y bloques de metodología visibles antes de algunos contenidos. |
| M00B · Antecedentes municipales | Antiguo/distractor | Perfil tenant aparecía como caja dentro del módulo, con subcajas y sin tesis editorial dominante. |
| M02 · Diagnóstico social y autoridad | Parcial | Ya usa `Conclusion` y `KpiAnchorGrid`, pero mantenía tabs con fondo, vacíos en cajas y detalle de impacto en filas con fondos. |
| M02C · Mapeo de actores | Antiguo/distractor | La lista de actores estaba en cards de fondo gris; cifra mínima no tenía presencia protagonista. |
| M02D / M07 · Autoridad y organigrama | Antiguo/distractor | Roles, turnos y horarios aparecían como tres columnas encajadas en un panel bordeado. |
| M03/M07 relacionados | Parcial | Preservan funcionalidad; no se tocaron para evitar reescritura funcional fuera de prioridad visual. |
| Plataforma `/v`, `/p`, `/e` shell | Parcial | Routing existe; shell sobrio. El pulido profundo por módulo se valida mediante los componentes compartidos corregidos. |

## 3. Correcciones aplicadas

| Archivo | Cambio |
|---|---|
| `frontend/src/components/simulator/TenantProfilePanels.tsx` | Recompuso antecedentes, actores y organigrama con tesis centrada, cifra protagonista, grids limpios y evidencia por líneas. Eliminó fondos y cajas anidadas en los paneles tenant. |
| `frontend/src/components/simulator/SocialDemographicContextPanel.tsx` | Recompuso encabezado M02 centrado, quitó fondo de tabs, cambió estados vacíos y alcance diferido a líneas tipográficas, y convirtió la estructura del Estudio de Impacto Social en tabla limpia sin fondos. |
| `frontend/src/components/simulator/TenantProfilePanels.test.tsx` | Agregó prueba visual/semántica para modo operación, 15 actores, pendientes explícitos y no oficialidad sin fuente. |

## 4. Auditoría posterior

Evidencia visual generada por `scripts/phase8_visual_capture.cjs`:

| Evidencia | Archivo |
|---|---|
| M00B desktop | `docs/architecture/phase8_visual_evidence/desktop-simulator-m00b.png` |
| M00B mobile | `docs/architecture/phase8_visual_evidence/mobile-simulator-m00b.png` |
| `/v` desktop | `docs/architecture/phase8_visual_evidence/desktop-v-shell.png` |
| `/p` desktop | `docs/architecture/phase8_visual_evidence/desktop-p-shell.png` |
| `/e` desktop | `docs/architecture/phase8_visual_evidence/desktop-e-shell.png` |
| `/v` mobile | `docs/architecture/phase8_visual_evidence/mobile-v-shell.png` |
| `/p` mobile | `docs/architecture/phase8_visual_evidence/mobile-p-shell.png` |
| `/e` mobile | `docs/architecture/phase8_visual_evidence/mobile-e-shell.png` |

- M00B muestra ahora: `EXPEDIENTE MUNICIPAL`, tesis centrada de operación por tenant, estado `Carga inicial`, provenance `pendiente_verificacion`, y texto explícito `Nada estimado se presenta como oficial`.
- M00B muestra pendientes honestos para presidente, sesión ordinaria, reglamento, concesión, proceso electoral, síndicos, regidores y comisiones cuando el endpoint no entrega perfil poblado.
- M02/M02C/M02D usan los paneles corregidos: cifra de actores `15/15` cuando hay perfil SLP, y pendiente explícito cuando no hay datos.
- No se detectan fondos decorativos nuevos en los módulos corregidos.
- No se agregaron features ni cambios de cálculo.
- `/v`, `/p` y `/e` cargan en navegador local con mocks de `tenant_state` para aislar QA visual del backend.

## 5. Evidencia técnica

Comandos ejecutados:

```bash
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run src/components/simulator/TenantProfilePanels.test.tsx src/lib/tenantMunicipalProfile.test.ts src/lib/platformRouting.test.ts src/app/simulator/simulatorSurface.test.ts
npm run build
node scripts/phase8_visual_capture.cjs
```

Resultado observado:

- Typecheck: pass.
- Vitest enfocado: 4 archivos pass, 16 tests pass.
- Build: pass con acceso de red para descargar fuentes de `next/font`.
- Capturas: 8 PNG generados en `docs/architecture/phase8_visual_evidence/`.

## 6. Limitaciones

- Las capturas `/v`, `/p`, `/e` usan mocks locales de `tenant_state` y capabilities para QA visual; no sustituyen las pruebas funcionales de Fase 7.
- No se hizo rediseño exhaustivo de todos los módulos legacy; se corrigieron los módulos prioritarios más visibles y transversales sin tocar cálculos.

## 7. Estado

**Cerrado.**  
Fase 8 queda cerrada como auditoría y pulido editorial visual focalizado. El cierre final de release y aceptación humana corresponde a Fase 7/SUPREME, no a esta fase visual.
