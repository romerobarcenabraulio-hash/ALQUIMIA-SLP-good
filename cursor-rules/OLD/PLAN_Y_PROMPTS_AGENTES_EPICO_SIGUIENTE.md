# Plan e instrucciones — Agentes · Post runtime (épico siguiente)

**Propósito:** ordenar qué hace cada rol **después** de haber cerrado la etapa runtime de la capa social (prompts 23–28 + serial), sin reabrir ese epic salvo hotfix.

**Principio CSA:** máximo **dos frentes activos** simultáneos (típico: deuda técnica Hub/CI + una pista producto elegida). Todo cierre sustantivo **append** en bitácora **`## Restore`** + una línea en `COLA_Y_ROLES_AGENTES.md` tabla estado.

**Numeración:** continúa desde **29** (no repite 1–28). Cada bloque es **independiente**: pegar con `@cursor-rules/ROL.md` correspondiente.

---

## Resumen de fases (CSA)

| Fase | Prompts | Cuándo iniciar |
|------|---------|----------------|
| **A · Cierre deuda GOV / CI / evidencia** | 29 → 32 | **Siempre primera** si en `BITACORA_*` sigue “FASE GOV parcial” o CI no verificado en remoto |
| **B · Pista producto (elegir solo UNA)** | 33 ó 34 ó 35 | **Solo** tras Fase A sin bloqueadores críticos — CSA anota en COLA cuál rama (B1/B2/B3) |
| **C · Ritmo** | 36 | Continuo semanal mientras haya multi‑agente |

---

## Fase A — Deuda y verificación

### 29 · CSA · Inventario ejecutable desde BITACORA + GOV

`@cursor-rules/planner.rtf`  
(Adjuntar RTF o: *Actúas como CSA Planner mandato único siguiente.*)

Actúas como CSA: sintetizas **solo** trabajo pendiente ya escrito en repo, no inventas tickets.

---TAREA---

1. Lee el tramo **FASE GOV / Auditoría de cierre** cercano al final de  
   `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/planeacion_ejecucion/BITACORA_AUDITORIA_PLANEACION.md` y extrae **lista numerada** de ítems aún **PENDIENTES** o **PARCIAL** (ZIP Hub, dominio, CI Actions, etc.).
2. Tabla: **Ítem | Estado | Próxima acción única | Rol responsable sugerido**.
3. Una línea decisión: **“Fase A arranca con prompt 30”** o **“Saltar a 32 si solo falta CI sin Hub”** según tu tabla (justificar en 1 línea).
4. Sin pedir código nuevo en este turno.

---

### 30 · Ejecutor · Hub / ZIP / catálogo `disponible_web`

`@cursor-rules/EJECUTOR.md`

Actúas como Ejecutor: código y pruebas reproducibles; alcance sólo evidencia Hub según CSA.

---TAREA---

Objetivo: dejar **trazabilidad verificable** del requisito “ZIP ÁGORA con documentos suficientes” según estado real del catálogo `documentosHub` (u homólogo).

1. Localizar rutas fuente donde se define lista de documentos disponibles (`hubPaqueteZip`, `documentosHub`, exports ZIP).
2. Entregar tabla: **id documento | disponible_web (sí/no) | publicRelPath** (resumido sí/no; máximo 15 filas o “ver grep/código”).
3. Si el criterio de negocio era “≥7 docs” u otro número: ¿se cumple hoy sí/no con evidencia cuenta?
4. Propuesta PR **mínima** si falta marcador o copys engañosos: *solo* etiquetas “En elaboración” vs “descargable” alineadas a datos reales — sin inflar contenido ilegal/regional inventado **para completar cuenta**.
5. Tests: extender Vitest donde existan `hub`/ZIP o dejar checklist manual explícito si no hay test previo (“no expandir infra test en este mismo PR” si CSA lo limitó).

**Gate Auditor:** texto usuario visible en cambios de etiqueta — pedir Prompt 31 si tocás copy público sensible.

---

### 31 · Auditor · Copy público Hub / descargas / expectativas

`@cursor-rules/AUDITOR.md`

Actúas como Auditor: revisión texto y promesas; sin implementar código salvo CSA reabra Prompt 30 con tu lista de bullets.

---TAREA---

Con **capturas** o rutas JSX/TSX indicadas por Ejecutor (Prompt 30) y **staging/prod URL** si existe:

1. Lista **Pass/Fail** (mínimo 6 ítems) sobre: número de docs prometidos vs entregados, disclaimers ÁGORA, ausencia “oficial garantizado ZIP”, errores ambiguos ante catálogo vacío parcial.
2. Si Fail: verbatim ≤120 caracteres + **tipo de cambio permitido** (solo copy vs requiere dato tabla).
3. Sign-off línea única **APROBADO HUB LEGAL UI** / **VETO hasta ___**.

---

### 32 · Ejecutor o CSA evidencia · GitHub Actions / CI verde remoto

`@cursor-rules/EJECUTOR.md`

(Si CSA tiene token browser propio pueden usar mismo prompt con rol CSA manual — preferir Ejecutor con acceso.)

Actúas como Ejecutor: evidencia reproducible estado CI en remoto cuando exista workflows en `.github/workflows/`.

---TAREA---

1. Estado declarado último workflow en repo remoto conocido CSA (nombre repo/branch) si accesIBLE — si **no hay acceso red/agente sandbox**: producir checklist **solo humano ejecutable**: URL patrones típicos `github.com/<org>/<repo>/actions`, qué badge buscar verde último push `main`.
2. Una línea **append lista para pegar Restore**: fecha + resultado **CI GREEN / BLOCKED ACCESS / N/A Sin workflow**.
3. Si workflow falta porque file excluido PAT: reproducir problema documentado BITACORA y sugerir **solo** proceso humano seguridad PAT scope `workflow`.

---

## Fase B — Rama producto (**elegir UNA** antes de lanzar estos)

CSA escribe en `COLA_Y_ROLES_AGENTES.md` una línea explícita, por ejemplo:  
`**Rama épico activo:** B1 ciudadano-social` ó `B2 observabilidad` ó `B3 Playwright smoke`.

Si no hay rama declarada Ejecutores **no** ejecutan 33–35.

---

### B1 · 33 · Aesthete + acuerdo Ejecutor · Capa ciudadana (flag Producto)

`@cursor-rules/AESTHETE-1.md`  
(segundo mensaje paralelo CSA puede cargar Ejecutor con mandato técnico acotado abreviado mismo PR)

**Precondición COLA:** campo `Rama épico activo (Fase B)` = **B1**.

Actúas como Aesthete: narrativa audiencia ciudadana ante capa social; sin veto legal fuerte sin Auditor.

---TAREA---

1. Principios **3 bullets** ciudadano ante sociodemográfica (no técnico, no electoral, tiempo atención <12s disclaimers donde aplique decisión futura CSA).
2. Wireframe textual **solo** comportamiento esperado ante `NEXT_PUBLIC_CITIZEN_UI`/`EXPORT_HIDDEN` combinaciones actuales (referencia `pr5ExportConstants`).
3. Entrega “handoff Ejecutor” máxima 8 bullets implementables **sin** nueva API ciudadana compleja.

**(Ejecutor subsequente mismo PR debe seguir bullets entregados bajo mismo mandato CSA limitado página.)**

---

### B2 · 34 · Ejecutor · Observabilidad mínima capa social cliente

`@cursor-rules/EJECUTOR.md`

**Precondición COLA:** campo **B2**.

Actúas como Ejecutor: instrumentación ligera cliente acotada; sin nueva suscripción SaaS obligatoria.

---TAREA---

1. Definir eventos opcionales `console`-guardados detrás env `NEXT_PUBLIC_DIAG_SOCIAL_LAYER=1` desarrollo sólo ó integración herramienta existente proyecto (verificar antes si ya existe Sentry/logger — no duplicar).
2. Lista archivos táctiques **solo** errores cargar JSON estadístico ó fallo Markdown preview sin filtrado PII.
3. Fuera alcance declarado: servidor backend logs persistentes nueva infra SaaS nueva suscripción financiería.

---

### B3 · 35 · Ejecutor · Scaffold Playwright (smoke navegador)

`@cursor-rules/EJECUTOR.md`

**Precondición COLA:** campo **B3** **y** exista acuerdo repo para almacenar `playwright.config` + job CI con recursos suficientes.

Actúas como Ejecutor: scaffolding reproduucible local primero; CI segundo si CSA autoriza runners.

---TAREA---

1. Inventario: ¿existe playwright en monorepo? Si **no**, PR mínimo `package.json` + `playwright.config.ts` + `.github/workflows/playwright.yml` **opcional** documentado DISABLED hasta runner — **solo** scaffold local `npx playwright test` comando documentado README corto frontend.
2. Un test **solo** happy path público Gateway `/simulator` render sin audiencia hasta gateway visible (sin secretos login).
3. Si CSA bloque runners cloud: producir archivo `SKIP_CI_PLAYWRIGHT.md` justificación seguridad tiempo recursos mantener Vitest superficie prima.

---

## Fase C — Ritmo

### 36 · CSA · Ritual semanal COLA + Restore (15 minutos)

Sin `@` obligatorio; puede ser persona humana.

---TAREA---

Cada viernes línea estado **solo**:

1. Una actualización tabla `COLA_Y_ROLES_AGENTES.md`: **Última sincronización fecha**, foco siguiente semana corto.
2. Append **Restore**: “Semana cerrada sí/no releases; próximo epic activo Rama X”; si **sin movimiento**, escribir **“Ventana estable / sin merges sustantivos”** explícito (evita rumor silencia = OK).

---

## Referencias cruzadas agentes deben tener a mano

| Documento | Uso |
|-----------|-----|
| `cursor-rules/PROMPTS_ETAPA_RUNTIME_ORDEN_SERIAL.md` | Cerró etapa anterior |
| `cursor-rules/SMOKE_SOCIAL_LAYER.md` | QA humano menor release |
| `fuentes de calculo/CHANGELOG_FUENTES_SOCIAL.md` | Cambios datos sociales |

---

**Versión:** 1.0 · plan post-runtime épico siguiente · 2026-05-14
