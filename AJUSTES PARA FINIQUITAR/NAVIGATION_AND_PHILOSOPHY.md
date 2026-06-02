# NAVIGATION AND PHILOSOPHY · La experiencia Alquimia orgánica e institucional

**Estado:** Reemplaza decisiones previas sobre precarga de cifras
**Fecha:** 30 mayo 2026
**Filosofía:** Cero invención, organicidad por progresión bloqueada, documentación real del usuario

---

## 1 · Los cinco principios filosóficos

### Principio uno · Cero datos ficticios, calculados o inferidos

La plataforma NUNCA muestra cifras inventadas, calculadas mediante benchmarks externos, o inferidas con probabilidad. Toda cifra visible en cualquier módulo proviene exclusivamente de un documento que el usuario subió, una fuente que el usuario validó, o una respuesta de Perplexity con cita verificable a fuente primaria.

Cuando no hay dato, el campo aparece vacío con instrucción explícita de qué documento se requiere para llenarlo. Cero placeholder con número hipotético. Cero cifra con asterisco. Cero "valor estimado."

### Principio dos · Progresión bloqueada por completitud

El usuario NO navega libremente entre módulos. Los módulos se desbloquean secuencialmente conforme el usuario completa los requerimientos del módulo anterior. Esto NO es restricción artificial; es coherencia institucional. No puedes diagnosticar (M01) sin haber documentado antecedentes (M00B). No puedes proponer reforma (M03B) sin haber leído el reglamento vigente.

Cada módulo tiene su "definición de completo" que el usuario ve desde el inicio. Cuando cumple los requisitos, el siguiente módulo se desbloquea automáticamente.

### Principio tres · Perplexity identifica gaps, el usuario los llena

Cuando Perplexity encuentra que existe un documento institucional pero no puede acceder al contenido (PDF gubernamental detrás de login, escaneado de mala calidad, sitio caído), Perplexity reporta la existencia del documento al sistema. ARCHIVO toma el caso y genera campo vacío en el módulo correspondiente con instrucción: "Identificamos que existe [nombre del documento]. Para completar este módulo súbelo aquí."

El usuario sube o marca "no aplica." No hay tercera opción de "el sistema lo infiere."

### Principio cuatro · Cada cifra tiene cita verificable

Después de que el usuario sube documento y ARCHIVO extrae información, cada cifra integrada al módulo lleva cita literal con número de página del documento fuente. Si la cifra no se puede citar literalmente del documento, no se integra al módulo. El usuario decide si la cifra es válida o requiere ajuste manual.

### Principio cinco · La marca de agua refleja completitud institucional, no validación

El watermark cambia de "diagnóstico en construcción · % validado" a "diagnóstico en construcción · [N] de [M] módulos completos." Esto refleja la realidad: el documento está incompleto institucionalmente, no que existen cifras pendientes de validar.

---

## 2 · Navegación paso a paso de la plataforma

### 2.1 Estado inicial al primer login

Usuario entra a `/v` después de magic link Clerk. Lo que ve:

**Header.** "ALQUIMIA · [Nombre del Municipio]" en serif. Watermark al fondo: "Diagnóstico en construcción · 0 de 10 módulos completos · [fecha]."

**Sidebar izquierdo.** Lista de 10 módulos de Validación. M00 desbloqueado (azul). M00B desbloqueado (azul). M01 a M15 con candado discreto (gris). Cada candado con tooltip: "Disponible al completar [módulo anterior]."

**Centro de pantalla.** Pantalla de bienvenida personalizada al municipio. Tres bloques:

> Bienvenido a Alquimia, [Nombre].
>
> Esta plataforma organiza el diagnóstico de gestión de residuos sólidos de [Municipio] basado en documentos institucionales verificables. No genera cifras hipotéticas. Cada dato proviene de fuentes que tu equipo o tu municipio aporta.
>
> Tu primer paso es leer la guía de navegación (M00) y luego completar antecedentes (M00B). Conforme avances, los siguientes módulos se desbloquean.

CTA único: "Comenzar con M00."

### 2.2 M00 · Cómo leer este diagnóstico

**Propósito:** orientar al usuario sobre cómo opera la plataforma. Cero datos del municipio. Solo metodología.

**Contenido:**
- Explicación de las tres etapas (Validación, Planeación, Ejecución)
- Filosofía cero invención
- Cómo subir documentos
- Cómo funcionan los sellos de confianza
- Cómo exportar a ZIP cuando se completa

**Criterio de completitud:** el usuario hace click en "He leído la guía, continuar." Cero requisito de subir nada.

**Transición al siguiente:** M00B se desbloquea automáticamente.

### 2.3 M00B · Antecedentes del municipio

**Propósito:** documentar el contexto institucional, político y administrativo del municipio cliente.

**Estructura interna del módulo:** seis secciones que se completan en orden interno.

**Sección uno · Datos del municipio.**
Campos requeridos: nombre, estado, clave INEGI, población actual, superficie, número de localidades.
Fuente: el usuario captura desde su conocimiento o sube documento oficial INEGI.
Cero precarga.

**Sección dos · Composición política del Cabildo.**
Campos requeridos: nombre del presidente municipal, partido, periodo, integración del cabildo (regidores con sus partidos), comisiones permanentes que tocan RSU.
Fuente: el usuario sube el acta de instalación del Ayuntamiento (publicada en Periódico Oficial del Estado) o captura manualmente.
Si Perplexity identifica que existe el acta pero no puede acceder: ARCHIVO genera campo vacío con instrucción "Sube el acta de instalación del Ayuntamiento de [año]."

**Sección tres · Estructura administrativa.**
Campos requeridos: organigrama de la Dirección de Servicios Públicos, nombre del director actual, número de personal operativo, turnos.
Fuente: el usuario sube manual de organización o capturas manualmente.

**Sección cuatro · Marco normativo vigente.**
Campos requeridos: reglamento de limpia vigente, fecha de última reforma, plan municipal de desarrollo, convenios intermunicipales si aplica.
Fuente: el usuario sube cada documento. ARCHIVO los procesa para extracción posterior.

**Sección cinco · Servicio operativo actual.**
Campos requeridos: existencia o no de concesión, nombre del concesionario si aplica, vigencia, fecha de inicio.
Fuente: el usuario sube el título de concesión o captura manualmente.

**Sección seis · Programas previos y posicionamiento mediático.**
Campos opcionales: programas anteriores de RSU, cobertura de prensa últimos 24 meses, posicionamientos políticos públicos.
Fuente: el usuario aporta o ARCHIVO sugiere artículos identificados por Perplexity.

**Criterio de completitud de M00B:** las secciones uno a cinco completas (sección seis es opcional). Cada sección con al menos un dato o documento. Sistema marca el módulo como completo.

**Transición al siguiente:** M01 se desbloquea automáticamente. Banner en pantalla: "M00B completo. M01 Diagnóstico de residuos sólidos ya está disponible."

### 2.4 M01 · Diagnóstico de residuos sólidos

**Propósito:** establecer la línea base de generación, composición, recolección y disposición de RSU del municipio.

**Estructura interna:** cuatro secciones.

**Sección uno · Generación de RSU.**
Campos requeridos: generación total diaria, generación per cápita, variación estacional si aplica.
Fuente: estudio de cuarteo (NMX-AA-015-1985) que el usuario sube, o reportes operativos del concesionario.
Si no existe estudio: ARCHIVO genera nota explícita "Para completar este módulo, se requiere estudio de cuarteo según NMX-AA-015-1985. Costo aproximado de mercado: $80,000-250,000 MXN. Lo gestiona laboratorio certificado."

**Sección dos · Composición.**
Campos requeridos: porcentaje por fracción (orgánicos, papel/cartón, plásticos, vidrio, metales, otros).
Fuente: el mismo estudio de cuarteo aplicado a esta sección.

**Sección tres · Recolección actual.**
Campos requeridos: tipo de servicio (público o concesionado), cobertura territorial, frecuencia por zona, número de vehículos, rutas activas.
Fuente: el usuario sube documentación operativa del servicio actual.

**Sección cuatro · Disposición final.**
Campos requeridos: relleno sanitario activo, ubicación, vida útil remanente, cumplimiento NOM-083-SEMARNAT-2003.
Fuente: el usuario sube título de operación del relleno sanitario.

**Criterio de completitud de M01:** las cuatro secciones con al menos un documento o conjunto de datos cada una.

**Transición al siguiente:** M02 se desbloquea.

### 2.5 Navegación de M02 a M15

Cada módulo sigue el mismo patrón: estructura interna por secciones, requerimientos de documento explícitos por sección, criterio de completitud claro, transición al siguiente módulo cuando se completa.

| Módulo | Documentos requeridos típicos |
|---|---|
| M02 · Mapa social y de decisión | Listado de actores municipales, padrón de organizaciones civiles, mapeo de cámaras empresariales |
| M03 · Capacidad institucional | Presupuesto de egresos, manual de organización, padrón de personal |
| M03B · Reforma reglamentaria | Reglamento vigente (ya subido en M00B), análisis comparativo con reglamentos modelo |
| M04 · Costo de no actuar | Estudios de impacto ambiental local, datos de salud pública municipal si están disponibles |
| M13 · Escenarios financieros | Cuenta pública del municipio, dictámenes de calificadoras crediticias |
| M14 · Riesgos | Estudios de auditoría previa, ASF si aplica |
| M15 · Borrador de expediente | Compilado automático de M00 a M14 cuando todos están completos |

### 2.6 Una vez M15 completo · Cierre de la Validación

Cuando M15 está completo, el usuario ve banner verde grande:

> Has completado la Validación. Tu expediente para Cabildo está listo para revisión final con el equipo Alquimia. Agenda conversación para validar y avanzar a Planeación.

CTA primario: "Agendar conversación con Alquimia." Esto envía email al founder con el caso del cliente listo para venta.

CTA secundario: "Descargar expediente preliminar (ZIP)." El cliente recibe ZIP con todos los documentos del expediente más los PDFs generados de cada módulo, todo con marca de agua "Diagnóstico en construcción · 10 de 10 módulos completos."

### 2.7 Planeación y Ejecución (Plataformas 2 y 3)

Solo se desbloquean después de firmar contrato Tier Implementación (G1 cerrado). Esto NO depende del progreso del usuario; depende de decisión comercial y firma de contrato con Mifiel.

Cuando Plataforma 2 se desbloquea, sigue mismo patrón: progresión bloqueada, módulo a módulo, documentos requeridos por sección, transiciones automáticas.

---

## 3 · Stack de documentos por módulo

Esta es la lista exhaustiva de documentos que el sistema solicita al cliente. ARCHIVO los reconoce, los procesa, los integra al módulo correspondiente.

### 3.1 Documentos básicos institucionales (M00B)

1. Acta de instalación del Ayuntamiento
2. Manual de organización del Ayuntamiento
3. Manual de organización de la Dirección de Servicios Públicos
4. Reglamento de limpia o aseo público vigente
5. Plan Municipal de Desarrollo del periodo actual
6. Reglamento orgánico del Ayuntamiento
7. Título de concesión RSU vigente (si aplica)
8. Convenios intermunicipales relacionados (si aplican)
9. Bando de policía y buen gobierno

### 3.2 Documentos técnicos (M01)

1. Estudio de cuarteo NMX-AA-015-1985 (si existe)
2. Reportes operativos mensuales del servicio de recolección
3. Bitácoras de operación del relleno sanitario
4. Manifestaciones de impacto ambiental del relleno
5. Título de operación del relleno (NOM-083)
6. Inventario de vehículos de recolección
7. Mapas de rutas de recolección actuales

### 3.3 Documentos administrativos (M03)

1. Presupuesto de egresos del año fiscal vigente
2. Cuenta pública del año fiscal anterior
3. Tabuladores de sueldos y salarios
4. Padrón de personal de Servicios Públicos
5. Padrón vehicular municipal
6. Auditorías ASF si aplican

### 3.4 Documentos legales (M03B)

1. Reglamento vigente (ya solicitado en M00B)
2. Reformas previas al reglamento si las hubo
3. Gaceta municipal de los últimos 12 meses
4. Convocatorias de Cabildo de sesiones donde se discutió RSU

### 3.5 Documentos financieros (M13)

1. Cuenta pública últimos tres años
2. Calificación crediticia vigente (Fitch, Moody's, HR Ratings, S&P)
3. Estados financieros municipales
4. Plan anual de inversión
5. Cartera de proyectos de la Dirección de Obras

### 3.6 Documentos opcionales pero recomendados

1. Encuestas previas de aceptación ciudadana
2. Estudios de mercado de materiales valorizables
3. Catálogo de recicladoras locales
4. Censo de pepenadores si existe
5. Programa estatal de gestión integral de residuos

---

## 4 · Cómo ARCHIVO opera bajo esta filosofía

ARCHIVO ya no infiere ni completa con benchmarks. Su rol bajo esta filosofía es:

**Detectar gaps.** Cuando Perplexity menciona un documento que existe pero no está disponible, ARCHIVO crea campo vacío en el módulo correspondiente con instrucción de upload.

**Procesar documentos subidos.** OCR, extracción de texto, identificación de cifras citables literalmente.

**Integrar al módulo.** Cada cifra extraída con su cita literal y página del documento fuente.

**Solicitar lo faltante.** Digest semanal con documentos pendientes. Cero recordatorio de "validar cifras inferidas."

**Marcar como no aplica.** Cuando el usuario responde "no tenemos ese documento" o "no aplica," ARCHIVO ajusta el criterio de completitud del módulo para no requerir ese documento específico.

---

## 5 · Estado de diagramas (verdad honesta)

Hoy NO existen diagramas implementados en la plataforma. Los briefs de cinco diagramas para módulos pilar están documentados en `INSTITUTIONAL_RIGOR_AND_VISUAL_NARRATIVE.md` como especificaciones, pero el código no existe.

Bajo la filosofía nueva, los diagramas se generan SOLO cuando hay datos reales para visualizar. Un Sankey de flujo de residuos sin tonelajes reales del municipio es invento gráfico. Mismo principio que las cifras: cero invención visual.

Los diagramas se construyen en Sprint 5 cuando hay al menos un cliente con módulos completos y datos reales que visualizar. Antes de eso, los módulos muestran tablas, listas, secciones de texto, pero no gráficas inventadas.

---

## 6 · Implicación inmediata para el SPRINT_POST_AUTH

El bloque dos del sprint actual ("Sandbox Municipio Demo precargado") se modifica:

**Antes (cancelado):** Municipio Demo con cifras realistas pero ficticias precargadas.

**Ahora (vigente):** Municipio Demo con estructura completa pero CERO datos. Solo nombre ficticio "Municipio Demo · Estado Demo · INEGI DEMO-001." Todos los módulos accesibles para que el founder navegue la estructura, pero sin datos. Banner explícito: "Este es el sandbox del founder · estructura vacía para demostrar la experiencia de navegación."

El switcher admin/cliente sigue funcionando. La diferencia es que cuando founder navega como Municipio Demo, ve cómo se ven los módulos vacíos esperando documentos, no módulos llenos con datos hipotéticos.

Esta es la experiencia HONESTA que el cliente real tendrá. Demo y realidad son idénticos estructuralmente.

---

*NAVIGATION AND PHILOSOPHY · Alquimia · 30 mayo 2026*
