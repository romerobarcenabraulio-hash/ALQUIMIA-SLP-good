# Changelog · AUDITOR · Exactitud de estándares internacionales

**Fecha:** 2026-05-27  
**Nivel:** L0 (auditoría) → correcciones aplicadas en `standards_map.json` **v1.0.1** (MARCOS)  
**Entregable principal:** [`docs/audit/standards_accuracy.md`](../docs/audit/standards_accuracy.md)

## Resolución (post-auditoría)

Todos los hallazgos **CRÍTICOS** y **MODERADOS** del informe fueron corregidos en `main`: mapa canónico v1.0.1, `standards_rationale.md`, UI (informe, M18 badge, expediente, portal) y test de regresión M01.

---

## Resumen ejecutivo (10 líneas · founder / SUPREME)

1. Se auditaron **38 módulos de producto** (37 en `standards_map.json` + **M01B** ausente del mapa pero vivo en hoja de ruta).
2. **102 citas** en el mapa canónico; **84 conformes**, **8 CRÍTICAS**, **14 MODERADAS**, **6 MENORES**.
3. El bloque más grave es **GRI 306:2020 mal numerado en M01**: se usa **306-2** como si fuera disposición/destino; en la versión 2020 eso es **306-5** (disposición) y **306-4** (desvío).
4. **SASB IF-WM-150a.x** está sistemáticamente mal interpretado: **150a.1 = TRI tóxico**, **150a.2 = acciones correctivas en relleno**, no toneladas ni % reciclado (**M01, M06, M08, M10**).
5. **M06** cita **IF-WM-000.A** (clientes) donde debía ser **IF-WM-000.C** (instalaciones).
6. **M08B** cita **ISO 26000 §6.8** como cadena de valor; la cláusula oficial es desarrollo comunitario.
7. **M02C** incluye **GRI 2-30** (negociación colectiva) en mapeo de actores — no aplica al módulo.
8. **M18**: **CSRD ESRS 1:2023** y **EFRAG IG 1** son correctos para doble materialidad; citar **«GRI 3 doble materialidad»** es **MODERADO** (GRI 3 = impact materiality / temas materiales, no DMA europea completa).
9. Hallazgo **satélite**: informe municipal usa **GRI 306-2** para «residuos desviados»; debe ser **306-4** (fuera del mapa, mismo riesgo ante cliente ESG).
10. **Cierre binario de tabla:** cumplido; **no hay CRÍTICO sin fix propuesto** — MARCOS puede corregir mapa y textos en paralelo; POLIS no bloqueado por hallazgos MENOR/MODERADO.

---

## Errores CRÍTICOS — lista priorizada

| Prioridad | Módulo | Estándar | Acción MARCOS |
|-----------|--------|----------|---------------|
| P1 | M01 | GRI 306-2 | Reasignar disposición → **306-5**, desvío → **306-4**; reservar **306-2** para gestión de impactos. |
| P1 | M01 | SASB IF-WM-150a.1 | Reemplazar por **IF-WM-000.D** y/o **GRI 306-5**; eliminar narrativa «peso a vertedero» bajo 150a.1. |
| P1 | M08, M10 | SASB IF-WM-150a.2 | Cambiar a **IF-WM-420a.3** (material reciclado) o métrica 420a.4 según KPI. |
| P2 | M06 | SASB IF-WM-000.A | Corregir código a **IF-WM-000.C**. |
| P2 | M08B | ISO 26000 §6.8 | Corregir cláusula y título (§6.8 ≠ cadena de valor). |
| P2 | M02C | GRI 2-30 | Eliminar del módulo de actores. |
| P2 | Informe PDF/UI | GRI 306-2 en desvío | Cambiar etiqueta a **GRI 306-4** (`informe/[municipio_id]/page.tsx`). |

---

## Contenido publicado

El informe completo con tabla fila a fila, matriz M01/M18 y referencias oficiales está en:

**[`docs/audit/standards_accuracy.md`](../docs/audit/standards_accuracy.md)**

---

## Notas operativas

- Hoja de ruta leída desde `alquimia_hoja_de_ruta.md` (la ruta `docs/architecture/HOJA_DE_RUTA_ALQUIMIA.md` no existe en el repositorio).
- No se modificó `standards_map.json`, código ni copy de módulos en esta pasada.
- Tras corrección MARCOS: re-ejecutar AUDITOR sobre diff del mapa antes de presentación a cliente con equipo ESG.
