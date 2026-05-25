# TAREA DE ACTIVACIÓN INICIAL — PLATAFORMA ALQUIMIA
## Primera misión conjunta · Wave 1 (paralelo) + Wave 2 (síntesis)

---

## INSTRUCCIÓN GENERAL PARA TODOS LOS AGENTES

Esta es la primera tarea del sistema multi-agente de Alquimia. El objetivo no es producir entregables finales — es que cada agente **mapee su dominio, identifique qué falta, y declare qué construirá primero**.

Cada agente trabaja en su área de forma independiente y simultánea. No esperan entre sí. No se coordinan durante Wave 1. Cada uno produce su output en el formato indicado. SUPREME los lee todos al terminar y produce la síntesis en Wave 2.

```
WAVE 1 — PARALELO (ejecutar simultáneamente):
  → HERMES ejecuta su tarea
  → KRONOS ejecuta su tarea
  → EIDOS ejecuta su tarea

WAVE 2 — SÍNTESIS (después de que los tres terminen):
  → SUPREME lee los tres outputs y produce el plan maestro
```

**Regla universal:** Cada agente ejecuta su Regla Cero PRIMERO. Sin excepciones. Si un recurso no existe, eso es un hallazgo — lo documenta y continúa.

---

## TAREA PARA HERMES
### Dominio: Logística, rutas, flota, geoespacial

**Contexto que debes tener presente:**
La plataforma Alquimia gestiona el flujo físico de materiales reciclables desde 224,000 viviendas en la Zona Metropolitana de SLP hacia 18 centros de acopio y 5 recicladoras. En la fase actual (piloto o escalamiento temprano) la red es significativamente más pequeña — pero la arquitectura debe estar lista para escalar.

**Tu tarea:**

1. Ejecuta tu Regla Cero completa. Produce tu Declaración de Estado del Sistema.

2. Responde con evidencia (no suposiciones) estas preguntas:
   - ¿Qué módulos de logística existen actualmente en la plataforma? ¿Cuáles son funcionales y cuáles son stub vacío?
   - ¿Está integrada la Route Optimization API de Google o solo el Directions API legacy?
   - ¿Existe un pipeline de GPS tracking → Data Backbone → dashboard? ¿Funciona?
   - ¿Las básculas digitales de los centros de acopio tienen integración activa con la plataforma?
   - ¿Existe la matriz O-D (origen-destino) calculada o está pendiente?

3. Identifica y prioriza: las **5 acciones de mayor impacto** que debes ejecutar en las próximas 72 horas para elevar el módulo logístico. Para cada acción especifica:
   - Qué vas a construir o mejorar
   - Por qué tiene prioridad sobre otras
   - Qué KPI mejora y en cuánto (estimado)
   - Si necesitas algo de KRONOS o EIDOS para poder hacerlo

4. Detecta y reporta: ¿hay algo en el sistema de logística que esté activo pero que no debería estarlo? ¿Código legacy, configuraciones de prueba, módulos sin tests?

**Formato de output de HERMES:**
```
## HERMES — DECLARACIÓN DE ESTADO Y PLAN DE 72H

### Estado del sistema (Regla Cero)
[Declaración completa]

### Hallazgos: qué existe
[Lista de módulos con estado: funcional / stub / faltante]

### Hallazgos: qué está roto o incompleto
[Lista con descripción]

### Plan de 72 horas — 5 acciones priorizadas
[Tabla: Acción | Prioridad | KPI impactado | Dependencias]

### Alertas para SUPREME
[Lo que SUPREME necesita saber para la síntesis]
```

---

## TAREA PARA KRONOS
### Dominio: Planeación, presupuesto, gates, riesgos, KPIs

**Contexto que debes tener presente:**
El proyecto Alquimia tiene 5 gates con plazos definidos. El primer gate requiere la aprobación de la reforma reglamentaria por el Cabildo de SLP — sin ese gate, todo lo demás es ficticio. El modelo financiero base proyecta VPN de $756M MXN con TIR positiva y breakeven progresivo por fases.

**Tu tarea:**

1. Ejecuta tu Regla Cero completa. Produce tu Declaración de Estado del Sistema.

2. Responde con evidencia estas preguntas:
   - ¿En qué gate estamos? ¿Cuál es el estado real (cruzado / en proceso / en riesgo)?
   - ¿Existe un EVM engine activo calculando PV, EV, AC, CPI, SPI en tiempo real? ¿O solo hay un Excel manual?
   - ¿El modelo financiero (Modelo_BASED) está cargado en la plataforma o vive solo en archivo estático?
   - ¿Existe un registro de riesgos activo y actualizado, o es un documento estático?
   - ¿Hay un dashboard de KPIs funcionando o solo reportes manuales?
   - ¿Los datos de HERMES (tonelaje, costo logístico) están llegando al módulo de planeación?

3. Identifica y prioriza: las **5 acciones de mayor impacto** que debes ejecutar en las próximas 72 horas. Para cada una:
   - Qué módulo de planeación vas a construir o activar
   - Por qué tiene prioridad sobre otras
   - Qué gate o KPI protege
   - Si necesitas datos de HERMES o correcciones de EIDOS para poder hacerlo

4. Calcula (con los datos disponibles actualmente, sean pocos o muchos):
   - El CPI y SPI actuales del proyecto — aunque sea con estimaciones preliminares, documenta el supuesto
   - El estado de riesgo R01 y R02 (los de score 9): ¿hay avance en su mitigación?

**Formato de output de KRONOS:**
```
## KRONOS — DECLARACIÓN DE ESTADO Y PLAN DE 72H

### Estado del sistema (Regla Cero)
[Declaración completa incluyendo estado de gate y EVM]

### Hallazgos: qué existe en planeación
[Lista de módulos con estado]

### Hallazgos: qué falta o está desconectado
[Lista con impacto en el proyecto]

### EVM preliminar (con datos disponibles)
[CPI / SPI / Estado de gate / Riesgos activos]

### Plan de 72 horas — 5 acciones priorizadas
[Tabla: Acción | Gate protegido | Prioridad | Dependencias]

### Alertas para SUPREME
[Lo que SUPREME necesita saber]
```

---

## TAREA PARA EIDOS
### Dominio: Coherencia textual, terminología, estética documental

**Contexto que debes tener presente:**
La plataforma Alquimia tiene documentación proveniente de múltiples fuentes: documentos legales (Capítulo SLP), modelos financieros (Modelo_BASED), operativos (bitácoras, manuales), y ahora cursor rules de 4 agentes. Es probable que haya inconsistencias terminológicas, texto repetido y diferencias de tono entre ellos — no por descuido sino porque crecieron en paralelo.

**Tu tarea:**

1. Ejecuta tu Regla Cero completa. Produce tu Declaración de Estado Textual.

2. Audita específicamente estos documentos en este orden:
   - Los 4 cursor rules de agentes (hermes.md, kronos.md, supreme.md, eidos.md)
   - El documento de requisitos técnicos generado (Alquimia_Agentes_Requisitos_Tecnicos.md)
   - Cualquier documento de proyecto accesible (Capítulo SLP, bitácora, manuales)

3. Produce el **Glosario Canónico v1**: la lista definitiva de términos que el sistema debe usar, con sus variantes prohibidas. Basado en lo que encuentres, no en suposiciones.

4. Reporta las **inconsistencias detectadas**, clasificadas por severidad:
   - Críticas: afectan la comprensión o crean contradicciones de fondo
   - Importantes: afectan la credibilidad o la coherencia del sistema
   - Menores: afectan el pulido y la profesionalidad

5. Identifica: ¿hay texto en los cursor rules de los agentes que se contradiga entre sí? ¿Un agente dice que puede hacer algo que otro agente también dice que puede hacer? ¿Las secciones equivalentes tienen estructura paralela?

**Formato de output de EIDOS:**
```
## EIDOS — DECLARACIÓN DE ESTADO TEXTUAL Y AUDITORÍA

### Estado del sistema textual (Regla Cero)
[Declaración de estado con inventario]

### Glosario Canónico v1
[Tabla: Término canónico | Variantes prohibidas | Fuente de autoridad]

### Inconsistencias detectadas
#### Críticas:
[Lista con ubicación exacta: archivo + sección]
#### Importantes:
[Lista]
#### Menores:
[Lista]

### Audit de cursor rules — coherencia entre agentes
[Hallazgos de traslapes, contradicciones o estructuras no paralelas]

### Correcciones que EIDOS ejecutará en las próximas 72h
[Lista de archivos y cambios propuestos]

### Alertas para SUPREME
[Lo que requiere decisión de SUPREME antes de que EIDOS actúe]
```

---

## TAREA PARA SUPREME
### Wave 2 — Síntesis (ejecutar solo cuando los 3 anteriores hayan terminado)

**Antes de leer los outputs de Wave 1:**
Ejecuta tu Regla Cero completa. Produce tu Declaración de Estado del Sistema.

**Tu tarea de síntesis:**

1. Lee los tres outputs de HERMES, KRONOS y EIDOS en su totalidad.

2. Identifica **conflictos entre los tres outputs**:
   - ¿HERMES reporta algo que contradice lo que KRONOS tiene en su modelo financiero?
   - ¿EIDOS detectó inconsistencias en los cursor rules que afectan cómo operan HERMES o KRONOS?
   - ¿Hay acciones que dos agentes quieren hacer en el mismo archivo simultáneamente?

3. Produce el **Plan Maestro de las próximas 72 horas** — la secuencia integrada de todas las acciones de todos los agentes, sin conflictos:
   - Qué hace primero HERMES (y si necesita esperar algo de KRONOS o EIDOS)
   - Qué hace primero KRONOS (y si necesita datos de HERMES)
   - Qué hace primero EIDOS (y qué espera aprobación de SUPREME)
   - Qué acciones son verdaderamente paralelas vs. cuáles deben ser secuenciales

4. Produce el **Registro de Estado Inicial del Sistema** — el baseline contra el cual se medirá todo el progreso futuro:
   - Módulos existentes por dominio (logística / planeación / documentación)
   - Módulos faltantes por dominio
   - Inconsistencias abiertas heredadas de Wave 1
   - Gate actual y su estado
   - Semáforo general del sistema: VERDE / AMARILLO / ROJO

5. Identifica: ¿qué agentes embebidos (HERMES-*, KRONOS-*) deben crearse en las próximas 2 semanas para que el sistema opere autónomamente? Prioriza basándote en lo que los tres agentes de Wave 1 reportaron como sus mayores limitaciones.

**Formato de output de SUPREME:**
```
## SUPREME — SÍNTESIS DE WAVE 1 Y PLAN MAESTRO

### Estado del sistema (Regla Cero de SUPREME)
[Declaración completa]

### Conflictos detectados entre agentes
[Si ninguno: "Sin conflictos — proceder según plan individual de cada agente"]
[Si hay: descripción + resolución propuesta]

### Registro de Estado Inicial del Sistema (Baseline)
[Estado por dominio: módulos existentes / faltantes / rotos]
[Gate actual + estado]
[Semáforo general]

### Plan Maestro — 72 horas
[Secuencia integrada con dependencias entre agentes]
[Qué es paralelo vs. qué es secuencial]

### Agentes embebidos a crear (prioridad próximas 2 semanas)
[Lista con justificación basada en hallazgos de Wave 1]

### Próxima activación de SUPREME
[Cuándo y qué necesita leer para la siguiente síntesis]
```

---

## NOTAS DE EJECUCIÓN

### Para el humano que coordina esta tarea:

- Abre 3 instancias de Cursor simultáneamente (o 3 conversaciones paralelas)
- Pega la tarea de HERMES al agente HERMES, la de KRONOS al agente KRONOS, la de EIDOS al agente EIDOS
- Espera a que los tres terminen su output
- Pega los tres outputs completos al agente SUPREME junto con su tarea de Wave 2
- SUPREME produce el plan maestro integrado

### Qué hacer si un agente reporta que no encuentra recursos:

Si la Regla Cero de cualquier agente encuentra que los archivos o módulos esperados no existen, eso **no es un error — es el hallazgo más importante**. Significa que ese módulo debe ser construido desde cero. El agente continúa con su tarea y lo reporta en su sección "Hallazgos: qué falta".

### Tiempo estimado por agente (Wave 1):
- HERMES: 15-25 minutos de procesamiento
- KRONOS: 20-30 minutos de procesamiento
- EIDOS: 10-15 minutos de procesamiento
- SUPREME (Wave 2): 20-30 minutos después de recibir los tres outputs

---

*Tarea de Activación Inicial — Plataforma Alquimia | Versión 1.0*
*Usar en la primera sesión conjunta de los 4 agentes*
*Guardar los outputs de cada agente antes de activar SUPREME*
