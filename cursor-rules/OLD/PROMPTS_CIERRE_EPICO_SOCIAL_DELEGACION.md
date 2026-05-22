# Prompts · Cierre y delegación (post prompts 1–15, datos INEGI en Excel fuentes)

Cómo usarlo: abre chat o agente dedicado → `@…` del rol → «Actúa como…» → `---TAREA---`. No mezcles dos roles en un mismo mensaje salvo donde se indica.

---

## 16 · CSA / Orquestación (prioridad del epic)

`@cursor-rules/planner.rtf`

(Si Cursor no indexa bien el `.rtf`, adjunta el archivo o pega este bloque igual.)

Actúas como CSA / Planner de ciclo único ALQUIMIA: ordenas merges sin reabrir alcance de la capa social; no escribes código; produces una sola tabla de estado que el equipo ejecuta.

---TAREA---

Contexto: los mandatos Auditor/Navigator/Ejecutor/Aesthete 1–15 ya fueron ejecutados como conversación/diseño; INEGI se considera cargado desde el libro maestro **`fuentes de calculo/`** (matriz human-auditable).

ENTREGA OBLIGATORIA (una tabla + conclusiones cortas):

1. Columnas: PR (PR1…PR5) | Estado REAL en repo (no hecho / WIP / mergeado main) | Evidencia (ruta archivo o PR #) | Bloqueadores | Siguiente acción única (nombre rol: Ejecutor, Auditor…).
2. Checklist sí/no cerrado antes de llamar epic «fin»: placeholders legales en prod, etiquetas CVE vs ZM, tests CI, smoke manual documentado (referencia Prompt 21).
3. Orden ejecutable últimas 72h si falta trabajo: máximo 5 bullets ordenados.
4. Si todo está mergeado: una línea «EPIC CLOSED» y qué playbook activar (Prompt 22).

Sin opiniones sobre diseño nuevo fuera del epic.

---

## 17 · Ejecutor · Trazabilidad Excel → código versionado

@cursor-rules/EJECUTOR.md

Actúa como Ejecutor ALQUIMIA según ese archivo; evidencia con archivos concretos y tests donde aplique.

---TAREA---

Objetivo: que **todo número sociodemográfico** que muestre la capa social tenga línea recta hasta fila/documento en **`fuentes de calculo/`** (Excel u homólogo maestro), sin segundas «verdades inventadas».

ENTREGA OBLIGATORIA:

1. Auditoría rápida del repo: lista de ficheros donde hoy aparecen valores INEGI/sociodemográficos (rutas reales tras `grep`/lectura).
2. Propuesta de **ubicación única** de snapshot versionado (`frontend/src/data/…json` y/o barrel TS) incluyendo campos obligatorios: `indicatorId`, `value`, `unit`, `geoLevel`, `geoLabel`, `vintageLabel`, `sourceSpreadsheetTab` o `excelRowHint`, `lastExtractedGitShaOpcional`.
3. Procedimiento **human-in-the-loop** (5–10 pasos) desde «hoja cambió» hasta PR: quién corrige Audit, quién abre MR.
4. Si falta automatización: script `node`/Python **opcional** en PR sólo si es seguro sin credenciales; si no, documentar export manual CSV desde Excel como alternativa válida PR1-operativa.

Lista explícita de OUT OF SCOPE en este ticket (para no fugarse).

Tests: al menos uno que falle si un indicador público pierde campo `geoLevel` o `vintageLabel` en fixture.

---

## 18 · Auditor · Gate textual pre-release

@cursor-rules/AUDITOR.md

Actúa como Auditor ALQUIMIA; no código; veto explícito con frases.

---TAREA---

Contexto: cierre epic capa social; datos INEGI vía Excel maestro; UI ya implementada o en PR final.

REVISIÓN OBLIGATORIA contra **strings visibles usuario** simulador (funcionario ciudadano donde aplique):

1. Lista de **VETO MERGE**: mínimo 5 patrones texto (regex literal o ejemplo) prohibidos incluyendo electoral, «consenso garantizado», cifras estatal presentadas como municipal sin advertencia simultánea, etc.
2. Lista **APROBACIÓN CONDICIONADA**: disclaimers ubicados antes de KPIs/export.
3. **Sign-off formato**: «LISTO RELEASE SOCIAL LAYER» o «BLOQUEADO: ___» en una línea tras revisión declarada sobre commit hash o etiqueta proporcionada por Ejecutor (si no tienes hash pide uno).

Sin citar artículos de ley sin texto pegado por el equipo.

---

## 19 · Navigator · Gate territorial (strings + datos estáticos)

@cursor-rules/NAVIGATOR.md

Actúa como Navigator ALQUIMIA según ese archivo y `cursor-rules/NAVIGATOR.md`; no implementas fix; entregas informe veto/inform para Ejecutor.

---TAREA---

Auditoría declarada sobre **implementación efectiva**:

1. Revisión de JSON/TS de indicadores sociodemográficos (rutas que te indique CSA o encuentres con búsqueda): ¿`geoLevel` coincide con copy visible? ¿mezcla incompatible?
2. Tres ejemplos concretos (válidos) de cómo se etiqueta bien municipio CVE vs referencia estadística metropolitana.
3. Tres contraejemplos (prohibidos) que si aparecen ⇒ `VETO` hasta corrección Ejecutor.
4. Frase modelo si se necesita segunda línea de advertencia al export (PR5).

Sin mapas nuevos si no están en alcance merged.

---

## 20 · Aesthete-1 · Gate jerárquía y export legible

@cursor-rules/AESTHETE-1.md

Actúa como Aesthete-1 ALQUIMIA según ese archivo; no legal sustituto de Auditor ni geo de Navigator.

---TAREA---

Enfoque: **ModuleEditorialBrief**, panel social, previews export (Markdown) y rutas WCAG AA.

ENTREGA OBLIGATORIA:

1. Máximo 15 bullets **mejoras de severidad alta/media** ordenadas si las pantallas están accesibles; si perfecto, «sin hallazgos altos» y solo 5 micropulidos opcionales.
2. Landmark/heading order esperado para capa social (esquema h1/h2 textual).
3. Texto modelo **sr-only** si hace falta para copiar/export anunciado lectores pantalla.

Si no hay screenshots: base en rutas archivo TSX proporcionadas por CSA.

---

## 21 · Ejecutor · Smoke manual versionado (`SMOKE_SOCIAL_LAYER.md`)

@cursor-rules/EJECUTOR.md

Actúa como Ejecutor ALQUIMIA según ese archivo; entregable es documentación + opcionalmente prueba automatizada ligera si ya hay Playwright/Vitest app.

---TAREA---

Crear o actualizar en repo **`cursor-rules/SMOKE_SOCIAL_LAYER.md`** (o `frontend/docs/` si preferís convención del monorepo; indica decisión una línea) con Script **≤15 pasos**:

- Audiencias mínimas: funcionario; uno paso ciudadano sólo si la capa se muestra ahí con flag OFF/ON declarado por Producto (si no ⇒ «N/A audiencia ciudadano»).
- Pasos: baseline INEGI, toggles CVE vs modo estadístico (si existe), disclaimers legibles sin scroll en viewport desktop, fichas/bitácora/export copiar portapapeles (si existe), hard refresh preserva estado permitido conforme specs PR2/PR5.
- Última columna esperada resultado **pass/fail** para humano ejecutor QA cada release menor.

Opcional segunda PR: caso Vitest/App router que navegue sólo rutas públicas estable sin CI headful pesado si no hay infra lista.

Lista archivos tocados PR.

---

## 22 · Duo mantenimiento (Auditor texto + Ejecutor procedimiento)

Dos mensajes SECUENCIALES después de merges finales confirmados CSA.

### 22A · Auditor

@cursor-rules/AUDITOR.md

Actúa como Auditor ALQUIMIA según ese archivo.

---TAREA---

Redacta **plantilla changelog legal–editorial** (≤250 palabras) para pegar cuando el Excel cambie cubriendo disclaimer revalidación datos, fecha extracto responsable revisión ciudadana institucional, referencia libro maestro. Sin pasos git.

### 22B · Ejecutor

@cursor-rules/EJECUTOR.md

Actúas como Ejecutor ALQUIMIA después de tener 22A.

---TAREA---

Añadir sección **`fuentes de calculo/README.md`** o nuevo `CHANGELOG_FUENTES_SOCIAL.md` con:

- Semver o fecha tabla extracto correlacionada código.
- Comando o pasos reproducibles regenerate JSON.
- Quién debe abrir MR (OWNER rol explícito sugerencia: mismo pair Auditor+Ejecutor cada trimestre mínimo).

Tests de regresión ajustados si formato JSON cambió.

**Materializado:** `fuentes de calculo/CHANGELOG_FUENTES_SOCIAL.md` (tabla + comandos + MR; incluye plantilla 22A). README de la carpeta y `SOURCE_TRACE.md` enlazan aquí.

---

### Orden de delegación práctico

1. CSA **16** (mapa estado)  
2. En paralelo posible Navigator **19** si ya hay rutas código + Ejecutor **17** borrador pipeline  
3. Auditor **18** cuando hay build preview / hash estable  
4. Aesthete **20**  
5. Ejecutor **21** smoke doc  
6. Tras MAIN verde Auditor **22A** luego Ejecutor **22B**

---

## Nota

Si algunos prompts 1–15 **nunca** se materializaron en PR: CSA en **16** debe marcar estado «no mergeado» y el orden se recorta PR1 onwards sin saltar Auditor/Navigator checkpoints.
