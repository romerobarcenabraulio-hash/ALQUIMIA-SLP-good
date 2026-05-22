# Orden serial — Runtime y operación (para “echarlo a jalar”)

**Objetivo:** una sola secuencia lineal. No pases al siguiente paso sin **salida obligatoria** del anterior (URL, tabla, o Pass/Fail explícito).

**Documento maestro de tareas detalladas:** [`PROMPTS_ETAPA_RUNTIME_Y_OPERACION.md`](PROMPTS_ETAPA_RUNTIME_Y_OPERACION.md) (secciones **23–28**).

---

## Antes del paso 1 (humano, 2 min)

- [ ] Código con capa social en la rama que van a desplegar (ideal `main` verde CI).
- [ ] Acceso al panel de hosting (p. ej. Vercel) y a variables `NEXT_PUBLIC_*` del proyecto.
- [ ] Navegador Chrome/Edge listo + ventana privada para smokes.

---

## Paso 1 — CSA · checklist pre-deploy

**Pegar en chat agente:** bloque completo de **sección 23** en `PROMPTS_ETAPA_RUNTIME_Y_OPERACION.md` (incluye `@cursor-rules/planner.rtf` + TAREA).

**Salida obligatoria:** tabla ítems + **lista bloqueadores** + **un solo próximo paso** con dueño.

**Gate:** si hay bloqueador crítico (CI rojo, proyecto no vinculado), **no** sigas al paso 2 hasta resolver o documentar excusa en bitácora `Restore`.

---

## Paso 2 — Humano · deploy

- Promover build a **staging** (o producción si política lo dice).
- Anotar **BASE_URL** final (sin barra final, ej. `https://preview-xxx.vercel.app`) y **commit** o **deployment ID**.

**Gate:** `GET BASE_URL/simulator` no debe ser 500 (puede ser 200 u otra respuesta app válida).

---

## Paso 3 — Ejecutor · smoke infra (curl / red)

**Pegar:** sección **24** de `PROMPTS_ETAPA_RUNTIME_Y_OPERACION.md` + en el **mismo mensaje** la línea `BASE_URL: https://...`.

**Salida obligatoria:** tabla `endpoint | esperado | observado`.

---

## Paso 4 (paralelo permitido) — Auditor · texto vivo

**Pegar:** sección **25** + `BASE_URL` + nota si hay login funcionario sí/no.

**Salida obligatoria:** 10 ítems Pass/Fail/N/A.

---

## Paso 5 (paralelo) — Navigator · geo en UI viva

**Pegar:** sección **26** + `BASE_URL`.

**Salida obligatoria:** PASS o texto VETO ≤90 palabras.

---

## Paso 6 (paralelo) — Aesthete · micro visual / a11y

**Pegar:** sección **27** + `BASE_URL`.

**Salida obligatoria:** una línea `SHIPPABLE VISUAL MICRO` o `NO — bullet N`.

---

## Paso 7 — CSA · runbook primera semana (documento vivo)

**Pegar:** sección **28** de `PROMPTS_ETAPA_RUNTIME_Y_OPERACION.md`.

**Salida obligatoria:** bullets runbook revisados contra realidad deployment (staging counts como “primer entorno público interno”). Si algo no aplica → marcar N/A una línea.

---

## Paso 8 — Bitácora `Restore`

**Humano CSA:** append en [`BITACORA_AUDITORIA_PLANEACION.md`](AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/planeacion_ejecucion/BITACORA_AUDITORIA_PLANEACION.md) debajo del último `---` del bloque Restore con:

```
[fecha] CSA/runtime PASO SERIAL completo · BASE_URL=… · commit/deploy=…
Resumen: Infra Ejecutor: … | Auditor legal: PASS/PARCIAL | Navigator: PASS/VETO corto | Aesthete: … | Smoke SMOKE_SOCIAL_LAYER pasos críticos: … 
Para: —
---
```

---

## Paso 9 (cierre puerta) · Verificación orquestadora única

Pegar este bloque **ya con BASE_URL y commit rellenos** cuando quieras “sello formal” antes de nueva fase de producto:

```
@cursor-rules/planner.rtf

Actúa como CSA orquestador ALQUIMIA. Etapa SERIAL runtime completada contra URL real — no expandir alcance.

INPUTS YA CONOCIDOS (relléname si falta alguno antes de ejecutar):
- BASE_URL: <PEGAR>
- Commit/deploy: <PEGAR>

---TAREA CIERRE ÚNICO---

Produce SOLO:

1. Tabla resumen fusionando resultados esperados Pasos 3–7 (Infra | Legal | Navigator | Visual | Runbook sí/no ejecutado paso28).
2. Una línea literal exacta uno de estos dos tipos únicamente:
   SIGUIENTE FASE AUTORIZADA:
   Ó
   SIGUIENTE FASE BLOQUEADA HASTA:

Sin código nuevo ni nuevos tickets salvo línea Bloqueada con referencia puntual Issue/PR abierto.
```

---

## Resumen de referencia rápida

| Orden serial | Prompt en doc principal |
|----------------|--------------------------|
| 1 | Sección **23** CSA |
| 2 | (humano deploy) |
| 3 | Sección **24** Ejecutor |
| 4–6 | Sección **25** Auditor + **26** Navigator + **27** Aesthete (paralelo) |
| 7 | Sección **28** CSA |
| 8 | append Restore manual |
| 9 | este archivo — Paso 9 orquestador |

---

Versión playbook: **1.0 · serial** · alineado a `PROMPTS_ETAPA_RUNTIME_Y_OPERACION.md` versión principal.
