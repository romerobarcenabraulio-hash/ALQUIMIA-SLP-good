# Reportaje de antecedentes municipales — Estándar ALQUIMIA

**Tipo:** Norma editorial + casos piloto verificables  
**Módulo destino:** `antecedentes_municipales` (M01A · Rubro Antecedentes · Cap. 1 Diagnóstico)  
**Fecha:** 23 mayo 2026  
**Principio rector:** Un antecedente sin fuente citada no es antecedente — es anécdota.

---

## 1. Qué es (y qué no es) este reportaje

ALQUIMIA no vende nostalgia municipal. Este reportaje responde una pregunta operativa:

> **¿Qué legado deja el municipio en RSU/aseo — institucional, operativo y político — antes de que el funcionario abra la línea base numérica?**

| Es | No es |
|----|-------|
| Cronología verificable de programas, operadores y reformas | Crónica periodística sin URL |
| Inventario de activos reutilizables (infra, campañas, convenios) | Promesa de que “ya se intentó todo” |
| Lecciones explícitas para teoría de cambio y riesgo político | Dictamen legal ni acto de autoridad |
| Entrada al argumento consultivo (Cap. 1) | Sustituto del PDF reglamentario (M03B) |

**Registro:** técnico-institucional, tono McKinsey/BCG action title, citas numeradas, exhibits de timeline.

---

## 2. Estándar de exigencia (checklist del consultor)

Todo reportaje municipal publicado en plataforma debe cumplir:

### 2.1 Estructura obligatoria (7 bloques)

1. **Síntesis ejecutiva** (≤120 palabras) — 3 hallazgos + 1 riesgo de repetición
2. **Línea de tiempo** — eventos con año, tipo, fuente, tier, confianza
3. **Operadores y esquemas** — quién recogió, concesionó o complementó el servicio
4. **Programas y campañas** — separación, reciclaje, educación, infra puntual
5. **Legado reutilizable** — qué conviene heredar vs cerrar
6. **Vacíos documentales** — qué falta verificar en campo o archivo municipal
7. **Implicaciones para ALQUIMIA** — enlaces a M01, M02C, M03, M04C, M14

### 2.2 Tiers de fuente (Navigator + Auditor)

| Tier | Ejemplos | Uso en timeline |
|------|----------|-----------------|
| **T1** | INEGI, SEMARNAT, DOF, IMPLAN, `.gob.mx` oficial | Evento **confirmado** si hay acto/fecha |
| **T2** | SciELO, Redalyc, BID, CONACyt, universidades | Contexto **académico** — no sustituye acto municipal |
| **T3** | Medios locales, Coparmex, nota de prensa ayuntamiento | **Indicio** — marcar `[VERIFICAR]` hasta acta/PDF |
| **T4** | Redes sociales, blogs, foros | Solo en anexo “rumor político”; nunca KPI |

### 2.3 Confianza por evento

| Score | Significado | UI |
|-------|-------------|-----|
| 0.85–1.00 | Acto publicado o estudio peer con cita clara | Verde |
| 0.60–0.84 | Nota oficial sin PDF consolidado | Ámbar |
| 0.40–0.59 | Medio local, sin documento primario | Ámbar + `[VERIFICAR]` |
| <0.40 | Inferencia o recuerdo oral | No publicar en timeline principal |

### 2.4 Prohibiciones (Auditor)

- No inventar administraciones, montos ni toneladas no respaldados.
- No usar el caso SLP como default narrativo de otro municipio.
- No confundir **ZM** con **municipio** en antecedentes (competencia y operador difieren).
- No presentar nota de 2025 como “programa exitoso” sin indicador de captura verificable.

---

## 3. Plantilla de evento (schema para backend/UI)

```yaml
evento_id: slp-2008-concesion-red-ambiental
municipio_id: slp
zm_id: SLP
anio: 2008
tipo: concesion | programa | infraestructura | norma | conflicto | campaña
titulo: "Concesión de recolección, transporte y disposición final"
resumen: >
  Tras declarar la Dirección de Ecología y Aseo Público incapacidad operativa,
  el Congreso del Estado autorizó la privatización del servicio; operador referido
  como Red Ambiental (grupo Vigue).
fuentes:
  - url: http://www.scielo.org.mx/scielo.php?pid=S0188-45572012000100009
    tier: T2
    tipo: academico
    confianza: 0.88
operador: Red Ambiental
estado_programa: vigente | concluido | fallido | desconocido
leccion: >
  El giro concesional concentra cobertura y disposición pero externaliza
  accountability política; cualquier programa de separación depende de cláusulas
  contractuales y no solo de reglamento.
implicacion_modulo: [esquema_concesion, mapeo_actores, riesgos_modelo]
verificado_consultor: false
```

---

## 4. Reportaje piloto — San Luis Potosí (capital)

**`municipio_id`:** `slp` · **ZM:** SLP · **Instrumento en línea:** Reglamento de Aseo Público ([`manifest.json`](../frontend/public/reglamentos/manifest.json))  
**Elaborado:** research Serper/Web + fuentes académicas · **No sustituye** archivo histórico del ayuntamiento.

### 4.1 Síntesis ejecutiva

San Luis Potosí capital lleva **cuatro décadas** de respuestas predominantemente **operativas** (más camiones, rutas, concesión) a un problema estructural de cobertura y disposición. El hito definitorio es la **concesión del aseo a Red Ambiental** (post-2008), que concentra recolección y disposición final pero **no resolvió** la baja captura de valor: fuentes recientes citan **menos del 10%** de RSU reciclado adecuadamente pese a campañas y centros de acopio. Para ALQUIMIA, el antecedente clave no es “falta de voluntad”, sino **desalineación histórica**: infraestructura de recolección sin modelo de separación contractualizado ni cadena de valor municipal.

**Riesgo de repetición:** lanzar separación en origen sin renegociar incentivos del operador concesionado y sin métrica de captura auditada.

### 4.2 Línea de tiempo (eventos documentados)

| Año | Evento | Tipo | Conf. | Fuente principal |
|-----|--------|------|-------|------------------|
| 1970s | Inicio de debate por insuficiencia de recolección; respuesta habitual = más flota | contexto | 0.75 | SciELO/Redalyc T2 |
| 1989–1991 | Reconocimiento oficial de camioneteros/carretoneros (cobertura informal) | operador_complementario | 0.85 | SciELO T2 |
| 1997–2000 | Trámites relleno Santa Rita | infraestructura | 0.70 | SciELO T2 `[VERIFICAR acto]` |
| 2004–2006 | Más rutas; retiro de contenedores en vía pública → descontrol ciudadano | operación | 0.82 | SciELO T2 |
| 2006–2009 | Dirección Ecología y Aseo Público declara incapacidad; propone subrogar servicio | institucional | 0.88 | SciELO T2 |
| 2008 | Congreso estatal aprueba privatización recolección/transporte/disposición; **Red Ambiental** | concesión | 0.88 | SciELO T2 |
| 2010s–2020s | Modernización Peñasco → relleno sanitario; reconocimientos nacionales (Escoba de Platino, etc.) | infra + relato | 0.55 | Nota prensa T3 `[VERIFICAR]` |
| 2024 | Ampliación flota (32 camiones, 96 rutas); contenedores soterrados piloto | programa | 0.60 | Futuro San Luis T3 |
| 2025 | CIPRES / equipos nuevos; ~1,200 t/día bajo relato oficial | infra | 0.55 | Noticieros SLP T3 |
| 2025 | SEGAM: >2,000 t/día ZM; **<10% reciclaje adecuado** | indicador | 0.50 | Pulso SLP T3 `[VERIFICAR cifra primaria]` |

### 4.3 Operadores y esquemas

| Actor | Rol | Periodo | Notas |
|-------|-----|---------|-------|
| Dirección Ecología y Aseo Público | Operador municipal histórico | hasta ~2009 | Declaró incapacidad operativa |
| Camioneteros / carretoneros | Recolección informal complementaria | desde ~1990 | Cobertura en calles sin ruta formal |
| **Red Ambiental** (grupo Vigue) | Concesionario recolección + disposición | desde ~2008 | Referenciado en prensa reciente como operador vigente |
| SEGAM / Gestión Ecológica municipal | Política ambiental y relato de programas | actual | No equivale a operador de ruta |

**Implicación M11:** cualquier esquema ALQUIMIA debe mapear **cláusulas de separación** sobre contrato concesional existente, no asumir gobierno directo.

### 4.4 Programas y campañas (reciclaje / separación)

| Programa / acción | Evidencia | Resultado documentado |
|-------------------|-----------|------------------------|
| Centros de acopio + campañas SEGAM | Pulso SLP 2025 T3 | Recepción PET, cartón, vidrio; **sin % captura municipal auditado** |
| Contenedores soterrados (pilotos en vías señaladas) | Futuro San Luis 2024 T3 | Aceptación ciudadana reportada; **alcance limitado geográficamente** |
| Papeleras públicas (~3,400 unidades) | Futuro San Luis 2024 T3 | Infraestructura de disposición, **no separación en origen** |
| Relato “ejemplo internacional” / Escoba de Platino | Noticieros 2025 T3 | **Riesgo reputacional** si captura real <10% |

### 4.5 Legado reutilizable vs cerrar

| Heredar | Cerrar / no repetir |
|---------|---------------------|
| Cobertura de recolección concesionada (baseline operativo) | Campañas sin métrica de captura por fracción |
| Transición Peñasco → relleno sanitario (activo disposición) | Retirar contenedores sin plan ciudadano (2004–2006) |
| Red informal de recicladores (mapear, no estigmatizar) | Asumir que más flota = más valorización |
| Relación política con Red Ambiental (M02C) | Expediente Cabildo sin análisis contractual |

### 4.6 Vacíos documentales (obligatorio declarar)

- [ ] Contrato de concesión vigente y fecha de renovación — **no en repo ALQUIMIA**
- [ ] Actas de cabildo concesión 2008 — `[VERIFICAR]` archivo municipal
- [ ] Serie histórica toneladas recicladas vs landfilled — SEGAM/INEGI
- [ ] Evaluación externa Escoba de Platino vs indicadores locales
- [ ] Inventario formal de camioneteros (continuidad desde 1990)

### 4.7 Implicaciones ALQUIMIA (enlaces de módulo)

| Módulo | Uso del antecedente |
|--------|---------------------|
| M01 Línea base | Anclar ~2,000+ t/día como orden de magnitud; marcar incertidumbre reciclaje |
| M02C Actores | Red Ambiental + camioneteros + SEGAM como mapa de poder |
| M03B Legal | Reglamento aseo vs realidad concesional |
| M04 Costo omisión | Costo de no capturar valor con operador ya pagado |
| M04C Teoría de cambio | Hipótesis: separación requiere **renegociación concesional**, no solo educación |
| M14 Riesgos | Riesgo político: relato “ciudad modelo” vs datos captura |

---

## 5. Reportaje piloto — Soledad de Graciano Sánchez

**`municipio_id`:** `sol` · **ZM:** SLP · **Reglamento en línea:** 2013 ([`manifest.json`](../frontend/public/reglamentos/manifest.json))

### 5.1 Síntesis ejecutiva

Soledad combina **servicio municipal coordinado** con un ecosistema grande de **recolectores particulares** (>500 referidos en nota 2024). Los antecedentes recientes son programas tácticos (“Soledad limpio”, electrónicos por árbol, créditos para renovación de unidades) con **buena visibilidad política** pero **poca evidencia de impacto en toneladas desviadas**. Para ALQUIMIA, Soledad es caso de **gobernanza dual**: formalizar sin eliminar a los recolectores particulares es condición de viabilidad.

### 5.2 Línea de tiempo (indicios documentados)

| Año | Evento | Tipo | Conf. | Fuente |
|-----|--------|------|-------|--------|
| 2013 | Reglamento de Aseo Público municipal | norma | 0.90 | PDF ALQUIMIA T1 |
| 2024 | Programa créditos renovación vehículos recolectores particulares | programa | 0.55 | La Voz de San Luis T3 |
| 2024 | “Soledad limpio, compromiso de todos” — vigilancia ambiental | programa | 0.55 | La Voz / La Orquesta T3 |
| 2024–2025 | Recolección permanente RAEE (mín. 2 kg) → árbol frutal | campaña | 0.55 | La Voz / Horizonte Tunero T3 |
| 2024 | ~200 kg/mes electrónicos (declaración dirección Ecología) | indicador | 0.45 | La Voz T3 `[VERIFICAR]` |

### 5.3 Lecciones para diseño ALQUIMIA en Soledad

1. **No diseñar rutas formales ignorando ~500 recolectores particulares** — integrar o regular.
2. **Programas simbólicos (árbol por RAEE)** sirven educación pero no cierran modelo financiero — ubicar en M08B, no en M13.
3. **Competencia con capital:** muchas disposiciones pueden remitir a SLP capital — validar jurisdicción antes de sanciones (Navigator).

---

## 6. Contraste ZM SLP (por qué el reportaje es por municipio)

| Dimensión | SLP capital | Soledad |
|-----------|-------------|---------|
| Esquema dominante | Concesión Red Ambiental | Municipal + recolectores particulares |
| Escala RSU | ~1,200–2,000+ t/día (fuentes mixtas) | Menor; dato línea base pendiente INEGI |
| Antecedente programático | Infra masiva + relato nacional | Programas focalizados + crédito informal |
| Riesgo ALQUIMIA | Contrato concesional | Conflictos formal/informal |

**Regla Navigator:** no usar diagnóstico de capital para decisiones de sanción o cobertura en Soledad, Cerro de San Pedro o Villa de Pozos.

---

## 7. Pipeline research-first (implementación)

Queries Serper plantilla (parametrizar `{municipio}`, `{estado}`):

```
1. "programa reciclaje {municipio} {estado}" site:gob.mx OR site:semarnat.gob.mx
2. "concesión aseo público {municipio}" OR "Red Ambiental" {municipio}
3. "reglamento aseo {municipio}" reforma OR decreto
4. "relleno sanitario" {municipio}
5. "separación origen" {municipio} cabildo
6. "camioneteros" OR "recicladores informales" {municipio}
```

Post-proceso Claude (Haiku): sintetizar **solo** snippets con URL → timeline YAML. Rechazar eventos sin fuente.

Endpoint propuesto: `POST /research/antecedentes/{municipio_id}` (ver plan M01A).

---

## 8. Exhibit para PDF (Doc 01 / Doc 03)

**Exhibit A — Antecedentes RSU {municipio}** (máx. 1 página)

- Mini timeline (5–7 eventos máx., solo confianza ≥0.60)
- Tabla operadores
- 3 lecciones en bullets action title
- Footer: “Insumo técnico ALQUIMIA · no acto de autoridad · {fecha} · {n} fuentes citadas”

---

## 9. Criterios de aceptación del reportaje (Definition of Done)

- [ ] ≥5 eventos en timeline con URL y tier
- [ ] ≥1 vacío documental explícito (honestidad)
- [ ] ≥3 enlaces a módulos downstream
- [ ] Síntesis ≤120 palabras sin adjetivos vacíos (“innovador”, “ líder”)
- [ ] Ningún KPI sin unidad y fuente
- [ ] Revisión EIDOS: glosario (centro de acopio, fracción, valorización)
- [ ] Revisión Auditor: disclaimer no sustitución autoridad

---

## 10. Referencias citadas en este documento

| ID | Fuente | URL |
|----|--------|-----|
| R1 | SciELO — Manejo RSU San Luis Potosí (antropológico) | http://www.scielo.org.mx/scielo.php?pid=S0188-45572012000100009 |
| R2 | Redalyc — mismo estudio (PDF) | https://www.redalyc.org/pdf/417/41723281009.pdf |
| R3 | Pulso SLP — reciclaje <10% | https://pulsoslp.com.mx/slp/san-luis-potosi-lidera-reciclaje-de-vidrio-y-carton/2048492 |
| R4 | Noticieros SLP — CIPRES / Red Ambiental 2025 | https://noticierosslp.com/2025/05/13/slp-ejemplo-internacional-en-manejo-de-residuos/ |
| R5 | Futuro San Luis — flota y contenedores 2024 | https://www.futurosanluis.com/2024/11/22/ayuntamiento-de-slp-amplia-flotilla-de-camiones-recolectores-para-mejorar-el-servicio-de-limpia/ |
| R6 | La Voz de San Luis — Soledad recolectores | https://lavozdesanluis.com.mx/alcalde-de-soledad-anuncia-programa-de-apoyo-a-recolectores-particulares-para-la-renovacion-de-sus-unidades |
| R7 | Reglamentos ALQUIMIA | `frontend/public/reglamentos/manifest.json` |

---

## 11. Próximo paso producto

1. Commitear este estándar como **contrato editorial** del módulo M01A.
2. Implementar Fase 1 plan: rubro + stack UI renderizando timeline desde JSON estático (`data/antecedentes/slp.json`, `sol.json`).
3. Fase 2: endpoint research + síntesis automática con mismas reglas de tiers.

---

*ALQUIMIA · Reportaje de antecedentes v1.0 · Exigencia: rigor sin fricción, prestigio sin opacidad.*
