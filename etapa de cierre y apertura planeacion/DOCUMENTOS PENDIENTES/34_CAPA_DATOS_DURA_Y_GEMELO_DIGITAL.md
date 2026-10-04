# 34 · CAPA DE DATOS DURA (INGESTIÓN 24/7) + GEMELO DIGITAL
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork) — solución + crítico honesto
**Propósito:** Ser "ligera competencia de Palantir" en datos y situational awareness, sin que el alcance se coma el sprint. Dos capacidades, ambas con semilla en el repo, ambas staged con honestidad de costo.

---

## 1. CAPA DE DATOS DURA — ingestión continua de fichas técnicas

**Semilla existente:** `app/web_scraper` (ScraperJob, ScrapedDocument, ScraperLog) + `RegulatorySource`, `BibliographyEntry`, `PriceSeries`. NO partimos de cero.

**Solución (motor de ingestión continua):**
```
FUENTES (prioridad: oficial > scraping) → DESCARGA (jobs programados/continuos)
  → PARSEO (datasheets PDF → extracción por visión/estructura)
  → NORMALIZACIÓN (a un catálogo de equipo verificado)
  → DEDUP + VERSIÓN + PROCEDENCIA + estado de certificación
  → CATÁLOGO consultable por el gemelo digital y los módulos
```

**Reglas duras (la rigurosidad que pediste):**
- **Fuente oficial primero** (catálogos/APIs de fabricantes, organismos de certificación). El scraping 24/7 es complemento, no método principal — más confiable y legal.
- **Respeto a ToS/robots.txt** (línea legal doc 21). Nada de extracción que viole términos.
- **Cada ficha con procedencia + versión + fecha + certificación.** Una datasheet sin fuente no entra como dato duro.
- **Costo:** el parseo masivo (visión/LLM) cuesta → diferido (costo-cero); el FRAMEWORK se construye ahora, se siembra con pocas fuentes, escala con presupuesto.
→ **ALQ-84**. Conecta con equipo/maquinaria (ALQ-70) y registro de fuentes (ALQ-82).

---

## 2. GEMELO DIGITAL / RENDER DE OPERACIONES (tu ejemplo del constructor)

Territorio Palantir-adjacent (situational awareness). **Staged con honestidad:**

### Fase 1 — Vista de operaciones (CONSTRUIBLE YA, 80% del valor)
- Los activos (ej. 3 retros + 2 excavadoras) ubicados en **mapa/plano por sus coordenadas**; estado alimentado por el **residente** + KPIs (eficiencia, avance, mantenimiento ALQ-70).
- 2D / esquemático. Reusa `geo`, `logistics` (rutas/eventos/KPIs), equipo.
- Responde "¿qué está pasando y cómo van las cosas?" con datos reales y procedencia.
→ **ALQ-85**.

### Fase 2 — Render avanzado desde dron + visión (R&D, DESPUÉS, con presupuesto)
- **Video de dron → visión por computadora → estimación automática de estado → render tipo "Clash of Clans".**
- Crítica honesta: esto es lo CARO y difícil (CV sobre video, 3D, tiempo real). Alto riesgo de comerse el sprint.
- **Se gana tras probar la Fase 1.** Marcado R&D, gated por valor + presupuesto. No se promete primero.
→ **ALQ-86 (R&D, gated)**.

---

## 3. CAPTURA DE BAJA FRICCIÓN ("no hacerle la vida imposible al cliente")
Principio de oro vuelto arquitectura: **pedir al humano el mínimo; enriquecer el resto desde la web + sus propios artefactos** (fotos, video de dron, docs que ya tiene, specs del catálogo de equipo). Progressive profiling (doc 33 §4). Mientras más capturamos pasivamente, menos le pesa al cliente.
→ **ALQ-87**.

---

## 4. CÓMO ESTO NOS HACE "LIGERA COMPETENCIA DE PALANTIR"
- Palantir: fusión de datos + situational awareness para grandes, caro, con sus ingenieros.
- Alquimia (ligero): catálogo de equipo verificado + vista de operaciones + procedencia, **para una PyME/constructor, accesible y auto-servido.** No igualamos su profundidad; ganamos en acceso + auto-construcción + red. La Fase 2 (dron/CV) es lo que, cuando llegue, nos pone visualmente a su nivel para casos concretos.

---

## 5. DISCIPLINA (anti-dispersión — crítico aquí)
Esta es el área MÁS propensa a comerse el sprint (scraping + CV + 3D). Orden:
1. **Ahora/Hito 1-2:** framework de ingestión (ALQ-84) + vista de operaciones Fase 1 (ALQ-85) + captura de baja fricción (ALQ-87). Reusa lo existente, costo bajo.
2. **Hito 3+/R&D:** dron→CV→3D (ALQ-86), solo tras probar valor y con presupuesto.
No construir la Fase 2 vistosa antes que la Fase 1 útil.

---

## 6. NUEVOS ISSUES
- **ALQ-84** Motor de ingestión continua (fuentes oficiales + scraping) → catálogo de equipo verificado con procedencia.
- **ALQ-85** Vista de operaciones / situational awareness (Fase 1, 2D, sobre geo+logistics+equipo).
- **ALQ-86** (R&D, gated) Dron-video → visión por computadora → render avanzado del gemelo digital.
- **ALQ-87** Captura de baja fricción (enriquecer desde web + artefactos; pedir el mínimo al humano).

---

*34 · Capa de Datos Dura + Gemelo Digital · Alquimia Supermind · 17 jun 2026*
