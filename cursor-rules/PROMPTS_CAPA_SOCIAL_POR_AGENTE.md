# Prompts capa social / demografía — por agente (ALQUIMIA)

Uso en Cursor: en el primer mensaje del chat o subagente, escribe `@cursor-rules/AUDITOR.md` (o el archivo indicado), deja línea en blanco, pega desde **Actúa como…** hasta el final del bloque.  
Convención: la sección **TAREA** es la orden del turno; no la renegocies dentro del mismo mensaje sin nuevo mandato CSA.

---

## Bloque 1 — PR1 (andamio)

### 1 · Auditor (`@cursor-rules/AUDITOR.md`)

@cursor-rules/AUDITOR.md

Actúa como Auditor ALQUIMIA exactamente como define ese archivo (identidad, mandato Línea 3, veto, prohibiciones). No escribas código ni diseño de sistemas UI; sólo seguridad jurídica–editorial del producto. La **TAREA** siguiente es ejecutable dentro de ese marco.

---TAREA---

La nueva «capa social / demografía» es EXCLUSIVAMENTE expositiva y heurística: ayuda a leer fragilidades y heterogeneidad para acompañar la transición; NO sustituye diagnóstico jurídico, NO pronuncia aceptación social, NO predice comportamiento electoral, NO certifica consenso ciudadano.

DEBES ENTREGAR (y nada más):

1. Disclaimer de UI para mostrar antes de KPIs/inferencias sociales — máximo 120 palabras, español México, tono sobrio institucional.
2. Lista «PROHIBIDO en copy público del simulador» (mínimo 6 bullets verificables).
3. Lista «PERMITIDO con calificadores obligatorios» (mínimo 6 bullets, incluyendo frases modelo tipo «supuesto modelo / insumo a planeación y diálogo»).
4. Tres bullets de revisión rápida que Legal aplicará antes de cada merge de textos nuevos.

Prohibiciones en tu respuesta: no cites artículos de ley inventados; no escribas código; no proyectes KPIs estadísticos; no prometas que más datos eliminan conflicto.

---

### 2 · Navigator (`@cursor-rules/NAVIGATOR.md`)

@cursor-rules/NAVIGATOR.md

Actúa como Navigator ALQUIMIA según ese archivo (integridad geo-jurisdiccional, fuente, SRID/jurisdicción según spec del proyecto). No implementes código ni definas lógica de negocio no geo. La **TAREA** siguiente es tu ámbito de veto y redacción de reglas UI territoriales.

---TAREA---

Obligatorio aplicar el spec Navigator del proyecto: competencia municipal y delimitaciones territoriales NO se confunden.

En la capa social/demográfica, TODA visualización o agregación de indicadores DEBE declarar unidad geográfica explícita: (A) CVE municipio INEGI para lectura centrada en el ayuntamiento modelado y (B) Zona Metropolitana oficial solo como MARCO estadístico de aglomeración, NUNCA como sustituto de competencia municipal para sanciones, mandatos o «decisión única», ni fusionadas en un solo panel sin etiquetado paralelo clarísimo.

ENTREGA OBLIGATORIA (solo esto):

1. Texto corto «regla UI» máximo 90 palabras (para banner o pie del módulo).
2. Tres líneas tipo VETO: situaciones donde el equipo debe BLOQUEAR merge hasta corregir (ejemplo: KPI social mezcla ZM + municipio en un mismo número decisorio sin doble vista).
3. Dos frases modelo para etiquetas UI: vista «municipio (CVE)» y vista «ZM (solo referencia estadística)».

Sin mapas nuevos si no están en alcance; sin inventar CVE; sin código.

---

### 3 · Ejecutor (`@cursor-rules/EJECUTOR.md`)

@cursor-rules/EJECUTOR.md

Actúa como Ejecutor ALQUIMIA según ese archivo: implementación con evidencia reproducible, sin redefinir producto ni saltarte veto Auditor/Navigator. Reporta a CSA y cumple límites de la **TAREA**; lo no especificado queda fuera de alcance.

---TAREA---

Alcance FIJO PR1 únicamente («capa social / demografía» — andamiaje):

- Introduce soporte conceptual en UI/API de tipos estado: declaración obligatoria de `geo_scope: 'municipio_cve' | 'zm_estadistica'` por bloque que muestre dato sociodemográfico; campos placeholder `dato: 'disponible'|'proxy'|'manual_usuario'|'no_disponible'` y `fuente_declarada: string`; sin gráficas complejas ni integración INEGI en este PR si no hay contrato de backend listo — solo estados vacíos y copy que encaje disclaimer entregado por Auditor.
- `ModuleEditorialBrief`/shell existente si aplica, o panel colgante acordado con producto, con `data-testid` estables prefijados `social-context-`.
- Prohibido en PR1: mapas, predicciones, rankings absolutos de «aceptación», fetch ambiguo que mezcle unidades geográficas, persistencia Zustand hasta cerrar contrato de serialización con Auditor+Navigator.

ENTREGA OBLIGATORIA:

1. Lista de archivos a tocar (rutas).
2. Propuesta de `module_id` o bloque de pantalla y `data-testid` (tabla).
3. Esquema TypeScript propuesto (interfaces, sin lógica de negocio densa).
4. Tests Vitest mínimos: render + estado vacío + presencia disclaimer (mock texto).

Si falta texto legal final del Auditor: usa constante `PLACEHOLDER_COPY_AUDIT_PENDING` visible solo en desar o flag, no texto definitivo público inventado por ti.

---

## Bloque 2 — PR2 (cualitativo + bitácora)

### 4 · Auditor (`@cursor-rules/AUDITOR.md`)

@cursor-rules/AUDITOR.md

Actúa como Auditor ALQUIMIA según ese archivo. La **TAREA** es asurance de copy y marco de riesgos; no código ni diseño de pantalla.

---TAREA---

Contexto: PR1 ya fija disclaimer y separación municipio CVE vs ZM estadística.

TAREA: Definir la «matriz de riesgos sociales típicos» SOLO como banderas cualitativas (no ranking absoluto ni probabilidad certificada).

ENTREGA OBLIGATORIA:

1. Tabla: nombre_del_riesgo | descripción en 1 línea | qué señal o proxy admite el producto (sin inventar datos) | qué NO puede afirmar el UI.
2. Máximo 8 riesgos; incluir oposición a tarifas, desconfianza institucional, conflictos por rutas/infra, inequidad de servicio percibida, informalidad en separación.
3. Texto puente (≤80 palabras) que conecte esta matriz con el disclaimer de capa social sin duplicarlo.
4. 4 bullets «cierre de merge»: qué frases bloquean lanzamiento si aparecen en copy.

Sin código; sin mapas; sin citar leyes por artículo sin texto en contexto.

---

### 5 · Aesthete-1 (`@cursor-rules/AESTHETE-1.md`)

@cursor-rules/AESTHETE-1.md

Actúa como Aesthete-1 ALQUIMIA según ese archivo (jerarquía editorial, WCAG 2.2 AA como piso, rigor accesible). No sustituyas veto legal del Auditor ni decisiones de Navigator. La **TAREA** es producto/UX verbal; Ejecutor implementará después.

---TAREA---

Eres diseño de producto bajo mandato institucional. Objetivo PR2: panel «Contexto social / aceptación» con fichas por tema y bitácora visible de supuestos (inferido vs fuente).

ENTREGA OBLIGATORIA:

1. Lista de 5–7 fichas (título + 1 línea propósito) alineadas a la matriz del Auditor; cada ficha con estado UI: dato_disponible | proxy | no_disponible.
2. Wireframe verbal (máx. 18 líneas): orden vertical, qué va arriba (brief ModuleEditorialBrief), dónde está la bitácora, cómo el usuario añade una entrada manual (campo texto + etiqueta fuente opcional).
3. Tabla `data-testid` propuestos: `social-risk-card-*`, `social-assumptions-log`, `social-assumption-row-*`.
4. Una decisión explícita: ¿la bitácora persiste en localStorage en este PR o sólo en sesión? (una oración justificada).

Prohibido: gráficos nuevos; mapas; integración INEGI automática en este PR.

---

### 6 · Ejecutor (`@cursor-rules/EJECUTOR.md`)

@cursor-rules/EJECUTOR.md

Actúa como Ejecutor ALQUIMIA según ese archivo. Alcance sólo lo definido en **TAREA**; evidencia en tests.

---TAREA---

Asume PR1 mergeado y textos de prompts 4–5 aprobados (o PLACEHOLDER claramente marcado).

ALCANCE FIJO PR2:

- Renderizar matriz/fichas de riesgos como contenido estático versionado (JSON/TS en repo) editable por contenido, sin API.
- Bitácora de supuestos: componente append-only según decisión de producto (localStorage o sesión); cada fila: texto, origen opcional, timestamp local, bandera `manual`.
- ENLACES a fuentes solo si Auditor entregó URL estable; si no, etiqueta «pendiente de fuente» sin link falso.
- Persistencia: si elige localStorage, clave con prefijo `alquimia.social.`, migración no destructiva.

ENTREGA OBLIGATORIA:

1. Lista de archivos nuevos/modificados.
2. Tests Vitest: render fichas + añadir fila bitácora + persistencia (mock storage si aplica).
3. NOTAS de qué queda explícitamente fuera (PR3 INEGI, PR4 KPI agregados).

Si conflicto con Navigator (mezcla unidades): no renderizar KPI numérico; solo estado vacío + texto de etiqueta de ámbito.

---

## Bloque 3 — PR3 (INEG/CVE lectura)

### 7 · Auditor (`@cursor-rules/AUDITOR.md`)

@cursor-rules/AUDITOR.md

Actúa como Auditor ALQUIMIA según ese archivo. **TAREA** = marco de uso de fuentes oficiales en solo lectura.

---TAREA---

Contexto: PR1–PR2 ya tienen disclaimer, geo_scope, matriz cualitativa y bitácora.

TAREA: Marco de lectura EXCLUSIVAMENTE informativa para indicadores que eventualmente vengan de INEGI/CONEVAL u otra fuente estadística oficial referenciable por URL o documento publicado.

ENTREGA OBLIGATORIA:

1. Texto de pie o modal corto («Lectura de fuentes oficiales») máximo 100 palabras: vigencia no garantizada, revisión periódica responsabilidad del municipio, cifra no es mandato de política pública.
2. Checklist de merge antes de exponer un número: debe existir label con unidad geográfica exacta que coincida con la jerarquía del dato; si no coincide con municipio CVE activo, el UI muestra advertencia explícita, no oculta.
3. Lista «prohibido»: tratar descarga INEGI como certificación de cumplimiento normativo, o como sustituto de estudios de impacto social obligatorios cuando aplique ley sectorial.
4. Formato sugerido para cada indicador expuesto: nombre | fuente_corta | unidad_geo declarada | vintage (año/actualización) | incertidumbre o «agregado regional».

Sin código; sin prometer actualización en tiempo real; sin citar leyes por artículo sin texto aportado.

---

### 8 · Navigator (`@cursor-rules/NAVIGATOR.md`)

@cursor-rules/NAVIGATOR.md

Actúa como Navigator ALQUIMIA según ese archivo. **TAREA** = concordancia geográfica de tabulados; sin implementación.

---TAREA---

Un indicador INEGI/CONEVAL solo es presentable si la geografía del tabulado es CONSISTENTE con la lectura declarada (municipio CVE vs entidad vs ZM vs AGEB, etc.).

ENTREGA OBLIGATORIA:

1. Tabla de decisión en texto: si `geo_scope` del simulador es `municipio_cve` y el tabulado es estatal o metropolitano, ¿qué debe mostrar el UI? (una frase por fila: mínimo 4 filas ejemplar).
2. Tres reglas VETO para merge: ej. «mostrar cifra estatal etiquetada como municipal»; «agregar ZM y municipio en un mismo KPI con un solo número»; «omitir vintage o unidad geográfica».
3. Texto modelo para badge de cobertura en UI (máx. 2 líneas): «Ámbito: … · Corte: …».

Sin proponer SRID ni capas nuevas; sin fusionar jurisdicciones; sin código.

---

### 9 · Ejecutor (`@cursor-rules/EJECUTOR.md`)

@cursor-rules/EJECUTOR.md

Actúa como Ejecutor ALQUIMIA según ese archivo. **TAREA** = PR3 solo lectura con contrato de datos claro.

---TAREA---

PR3 SOLO: exponer UN subconjunto de indicadores sociodemográficos desde dataset estático versionado en repo (JSON generado por pipeline fuera de alcance) O fetch HTTP read-only a endpoint acordado; ambos con misma interfaz.

REQUISITOS FIJO:

- Interface TypeScript `OfficialStatSlice { indicatorId, label, value, unit, geoLevel, geoCode?, geoLabel, vintageLabel, sourceId, sourceUrl?, caveat?: string }`.
- Si el dataset no tiene fila para el municipio CVE activo pero sí para entidad/ZM: mostrar estado `disponible_otro_ambito` con texto Auditor + advertencia Navigator (no mezclar números sin etiqueta).
- Badges obligatorios en tarjeta: sourceId, vintageLabel, geoLabel; link externo opcional si sourceUrl válido.
- Caché: `stale-while-revalidate` en memoria o archivo estático con hash en nombre; sin escritura de decisiones del usuario sobre estos números.
- Feature flag opcional `NEXT_PUBLIC_SOCIAL_STATS_SOURCE=static|remote` con fallback estático.

ENTREGA OBLIGATORIA:

1. Archivos y carpeta de datos (`/public/data/` o `/src/data/socialStats/`).
2. Componente puro de tarjeta + tests Vitest: render correcto, caso mismatch geo, caso sin dato.
3. Bloque explícito «fuera de PR3»: edición de valores, gráficos interactivos pesados, escritura backend.

No añadas PR4 (KPI agregados avanzados) ni bitácora nueva; reutiliza espacio de capa social existente.

---

## Bloque 4 — PR4 (cuantitativo ligero)

### 10 · Auditor (`@cursor-rules/AUDITOR.md`)

@cursor-rules/AUDITOR.md

Actúa como Auditor ALQUIMIA según ese archivo. **TAREA** = reglas de lenguaje y presentación numérica agregada.

---TAREA---

Contexto: PR3 ya expone cortes oficiales con badges de vintage y ámbito geo.

TAREA: Reglas para KPIs CUANTITATIVOS agregados o derivados (promedios, tasas, comparaciones) que la UI puede mostrar sin equipararlos a dictámenes.

ENTREGA OBLIGATORIA:

1. Definición en una frase de «KPI agregado permitido» vs «inferencia prohibida en copy».
2. Plantilla obligatoria de pie de cada visualización numérica (máx. 45 palabras): debe incluir unidad, ámbito geográfico exacto, año/corte, y límites de interpretación.
3. Tabla de 5 errores típicos de redacción a veto (ej. «el municipio está en el percentil X» sin muestra, «marginalización baja = menor riesgo social»).
4. Criterio único: ¿cuándo se debe mostrar intervalo/incertidumbre o «dato grueso» en lugar de decimal falso?

Sin código; sin prometer certidumbre estadística; no citar leyes por artículo sin texto aportado.

---

### 11 · Navigator (`@cursor-rules/NAVIGATOR.md`)

@cursor-rules/NAVIGATOR.md

Actúa como Navigator ALQUIMIA según ese archivo. **TAREA** = coherencia territorial al comparar o agregar series.

---TAREA---

PR4 agrega o compara números entre capas o periodos.

ENTREGA OBLIGATORIA:

1. Reglas explícitas: cuándo se PROHÍBE comparar dos series (municipio vs ZM, diferente vintage, diferente definición de variable).
2. Texto tipo advertencia UI (máx. 3 variantes de 1–2 líneas) si el usuario intenta ver comparación no homogénea — sin bloquear lectura, pero sin ocultar el sesgo.
3. Lista corta de agregaciones PERMITIDAS cuando `geo_scope` es `zm_estadistica` frente a cuando es `municipio_cve` (tabla 2×2 mínimo).
4. Una regla VETO de merge: «comparación lado a lado con un solo subtítulo que sugiera equivalencia territorial».

Sin mapas nuevos; sin fusionar CVE; sin código.

---

### 12 · Ejecutor (`@cursor-rules/EJECUTOR.md`)

@cursor-rules/EJECUTOR.md

Actúa como Ejecutor ALQUIMIA según ese archivo. **TAREA** = visualización cuantitativa ligera sobre PR3.

---TAREA---

PR4 SOLO: capa de visualización cuantitativa LIGERA sobre los datos ya admitidos en PR3 (y/o derivados permitidos por Auditor).

ALCANCE FIJO:

- Componentes: tabla densa y/o gráficos mínimos (barras o líneas simples) con librería ya usada en el proyecto; sin 3D; sin mapas coropléticos en este PR.
- Toda serie debe llevar metadata visible o en tooltip accesible: `geoLevel`, `vintageLabel`, `sourceId` copiados del modelo PR3.
- Derivados: sólo si están en lista blanca entregada por Auditor (ej. ratio dos series homogéneas misma geo y mismo año); si falta lista, NO calcules derivados — mostrar «no disponible».
- Performance: límites máx. 12 series en pantalla; virtualización si tabla >20 filas.
- Tests Vitest: un caso homogéneo válido; un caso comparación bloqueada con bandera de advertencia; snapshot accesible del pie obligatorio.

FUERA DE PR4: ML, scoring de «vulnerabilidad social», export PDF definitivo, persistencia de preferencias de gráfico en backend.

ENTREGA: lista de archivos, componentes nuevos, dependencias nuevas (si las hay) con justificación de una línea.

---

## Bloque 5 — PR5 (export / handoff planeación)

### 13 · Auditor (`@cursor-rules/AUDITOR.md`)

@cursor-rules/AUDITOR.md

Actúa como Auditor ALQUIMIA según ese archivo. **TAREA** = marco legal–editorial de exportables.

---TAREA---

Contexto: capa social-demográfica con PR1–PR4 integrados.

TAREA: Marco para «salida para planeación» (texto estructurado o PDF/export ligero que alimente backlog interno municipal): qué sí resume el simulador y qué queda explícitamente fuera.

ENTREGA OBLIGATORIA:

1. Estructura fija del resumen exportable en secciones (mínimo 6, máximo 10) con nombre de sección + qué lleva dentro en 1 línea cada una (incluye: disclaimers vigentes, unidad geo activa, riesgos sociales marcados, supuestos de bitácora, indicadores PR3/P4 si existen).
2. Párrafo de cubierta/portada (≤90 palabras) que el export debe incluir tal cual.
3. Lista veto (6 bullets): frases prohibidas en cuerpo de export (orden de obra, garantía consenso, predicción electoral, homologación INEGI = mandato jurídico, etc.).
4. Checklist rápido pre-envío institucional (5 ítems) que Auditor firma revisión antes de usar en sala pública.

Sin código; sin inventar formato legal de acta municipal.

---

### 14 · Aesthete-1 (`@cursor-rules/AESTHETE-1.md`)

@cursor-rules/AESTHETE-1.md

Actúa como Aesthete-1 ALQUIMIA según ese archivo. **TAREA** = flujo de handoff y accesibilidad del preview; veto estético–accesible.

---TAREA---

Eres producto institucional bajo mandato estético y accesible. Objetivo PR5: cerrar la capa social con un artefacto de handoff reproducible sin CRM propio si no existe.

ENTREGA OBLIGATORIA:

1. Definición de «elemento backlog» mínimo: título | origen_capa (ej. riesgo, supuesto, indicador, alerta_geo) | severidad_interna sólo texto (bajo/medio/alto) sin semáforo de democracia | responsable_propuesto_opcional vacío | enlace_interno_anchor (module_id/testid opcional).
2. Flujo UI en 12 líneas: desde qué pantalla el usuario genera resumen/export, qué previsualiza, qué formato (Markdown/HTML/PDF opcional sólo uno en PR5).
3. Regla UX: ¿se permite bulk export todo el historial bitácora? (sí/no + una línea razón).
4. Requisitos a11y de la previsualización: contraste AA mínimo, lectura ordenada headings, tabla exportable reconocible por lector de pantalla (resumen cualitativo, no tabla infinita).

No pedir nuevas integraciones Jira/email salvo stub de «copiar al portapapeles».

---

### 15 · Ejecutor (`@cursor-rules/EJECUTOR.md`)

@cursor-rules/EJECUTOR.md

Actúa como Ejecutor ALQUIMIA según ese archivo. **TAREA** = implementación PR5 con evidencia en tests y seguridad básica.

---TAREA---

PR5 SOLO:

- Implementar PREVIEW estático del resumen según estructura del Auditor (Markdown render seguro server/client según práctica proyecto) más acción COPIAR A PORTAPELES y/o DOWNLOAD .md (preferir Markdown en PR5; PDF opcional solo si libs ya están).
- Concatenar con bloques ya existentes: disclaimer actual + geo_scope seleccionado + snapshot de fichas matriz cualitativa (estados) + hasta N últimos ítems de bitácora (N acotado configurable const 20) + metadatos de indicadores si PR3 cargó algo.
- A11y: región vivible con landmark, botones accesibles, foco después de copiar (anuncio opcional polite).
- Feature flag opcional para ocultar export en ambientes ciudadano si producto así lo marca.
- Tests Vitest: generación texto no vacío, sanitización Markdown (no ejecutar scripts), copiar mock opcional navigator.clipboard.

FUERA PR5: envío email, webhooks, backend persistido, diseño de plantilla Word oficial.

ENTREGA: rutas archivos, constante N, dependencia markdown si se añade, notas de seguridad (escape).

---

## Nota Planner (opcional, sin prompt de implementación)

Para orden de merges y riesgos de alcance, el CSA puede invocar `@cursor-rules/planner.rtf` (o documento Planner vigente) en un turno aparte; no sustituye a Auditor, Navigator ni Ejecutor en los PRs anteriores.
