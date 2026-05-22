# BRIEF CLC → CSA

## Solicitud de planificación y coordinación: Sistema de Adendos Reglamentarios Multi-ciudad

**De:** CLC (Chief Legal Counsel & Compliance)  
**Para:** CSA (Chief Strategic Architect — Orquestador)  
**Tipo de comunicación:** `PROPOSE` + `INFORM`  
**Prioridad:** Alta  
**Fecha:** 2026-05-05  
**trace:** CLC-BRIEF-CSA-001

---

## 1. SITUACIÓN ACTUAL (INFORM)

El CLC ha completado la primera capa de trabajo normativo del programa de separación en cinco fracciones para vivienda y condominios en la Zona Metropolitana de SLP, con vocación de escalamiento a múltiples ciudades de México.

### Lo que ya existe en el repo

```
SLP /DOCS/ADENDOS/
  00_INDICE_ADENDOS.md
  00_GLOSARIO.md
  01_ADENDO_DEFINICIONES_ART4.md
  02_ADENDO_ESQUEMAS_CONDOMINIO_ART20BIS.md
  03_ADENDO_OBLIGACIONES_HABITANTES_ART21.md
  04_ADENDO_OBLIGACIONES_ADMIN_ART21BIS.md
  05_ADENDO_SANCIONES_ART37BIS.md
  06_ADENDO_TRANSITORIOS.md
  07_LINEAMIENTO_TECNICO_RSU01.md
  MULTI_CIUDAD/TABLA_COMPARATIVA.md
  REGLAMENTOS_BASE/              ← carpeta vacía esperando PDFs
```

**Contenido:** 6 adendos redactados + 1 lineamiento técnico operativo + glosario universal + tabla multi-ciudad + instrucciones. Todo con formato de dos capas:

- Capa A: `📄 ESTADO ACTUAL` — placeholder para texto del reglamento vigente de cada ciudad
- Capa B: `✏️ ADENDO PROPUESTO` — texto listo, adaptable por número de artículo

**Fuente primaria consultada:** `SLP /DOCS/PDFS para entregar/00001_CAPITULO SAN LUIS POTOSÍ.pdf` (73 páginas, leído íntegramente).

---

## 2. LA IDEA COMPLETA (PROPOSE — para que el CSA la entienda y planifique)

### Qué es el sistema de adendos

Un **sistema de reforma normativa escalable** que permite a ALQUIMIA:

1. **Mostrar en pantalla**, artículo por artículo, el contraste entre:
  - Arriba (ventana pequeña): el texto actual del reglamento municipal vigente
  - Abajo: el texto del adendo propuesto que se incorporaría
2. **Adaptarse a cualquier ciudad** simplemente cambiando el número del artículo donde se inserta cada adendo. El texto de fondo (la "ciencia") es idéntico en todas las ciudades.
3. **Escalar a nivel nacional** usando los mismos 6 adendos + lineamiento técnico como plantilla modular para cualquier municipio de México con marco normativo compatible.

### Los 6 adendos (ya redactados por CLC)


| #   | Adendo                        | Artículo SLP   | Propósito                                                                 |
| --- | ----------------------------- | -------------- | ------------------------------------------------------------------------- |
| 1   | Definiciones                  | Art. 4         | Crea los sujetos jurídicos (condominio, administración, 5 fracciones)     |
| 2   | Esquemas condominio           | Art. 20 Bis    | Define Modelo A (centro de acopio) y Modelo B (recolección programada)    |
| 3   | Obligaciones habitantes       | Art. 21        | Ata al colono a la obligación de separar                                  |
| 4   | Obligaciones administraciones | Art. 21 Bis    | Ata al operador condominial como responsable formal                       |
| 5   | Sanciones (escalera multas)   | Art. 37 Bis    | 3 niveles: Aviso → Advertencia → Multa (4/8/12 UMAs)                      |
| 6   | Transitorios                  | Decreto        | Implementación gradual: periodo educativo 180 días primero                |
| —   | Lineamiento Técnico RSU-01    | Doc. ejecutivo | Especificaciones de 5 fracciones, contenedores, frecuencias, trazabilidad |


### Las ciudades del programa


| Ciudad          | Estado      | Reglamento base    | Reto                        |
| --------------- | ----------- | ------------------ | --------------------------- |
| San Luis Potosí | Modelo base | Aseo Público 2018  | PDF en línea · extracción artículos (agentes) |
| Querétaro       | Escalar     | Aseo Público 2021  | PDF en línea · mapear artículos               |
| Monterrey       | Escalar     | Limpia municipal   | PDF en línea · adaptar multas                 |
| San Pedro G.G.  | Escalar     | Aseo Público       | PDF en línea · el más avanzado                |
| Soledad de G.S. | Escalar     | Aseo Público 2013  | PDF en línea · mapear artículos               |
| Corregidora     | Escalar     | Servicios 2020     | Mapear artículos            |
| El Marqués      | Escalar     | Limpia 2015        | Sin base sancionatoria      |


### La vista de pantalla que queremos construir

```
┌──────────────────────────────────────────────────────────┐
│  [SELECTOR DE CIUDAD]  [SELECTOR DE ADENDO]              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📄 REGLAMENTO VIGENTE                                   │
│  ─────────────────────────────────────────               │
│  [Texto del artículo actual leído del PDF]               │
│  [Ciudad: San Luis Potosí · Art. 4 · Reg. Aseo 2018]    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ✏️ ADENDO PROPUESTO                                     │
│  ─────────────────────────────────────────               │
│  [Texto del nuevo artículo / reforma]                    │
│  Técnica: Adicionar · Efecto operativo: [...]            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 3. TRABAJO PENDIENTE POR AGENTE (PROPOSE — para que el CSA asigne y programe)

### CLC (ya entregado — en espera de inputs)

- Glosario universal
- 6 adendos redactados
- Lineamiento técnico RSU-01
- Tabla multi-ciudad (con `[📄 VERIFICAR]` por llenar)
- Revisar adendos una vez que el Ejecutor cargue los PDFs de reglamentos
- Validar números de artículo por ciudad cuando el CSA tenga los reglamentos
- **Pendiente de decisión CSA:** transformación de legal gates (de hard 422 a gate blando con `warnings`) — propuesta elaborada en conversación CLC-Usuario

### Ejecutor (trabajo pendiente — necesita instrucción del CSA)

**Tarea 1 — Carga de reglamentos base:**
Descargar los PDFs de los 6 reglamentos municipales y depositarlos en:

```
SLP /DOCS/ADENDOS/REGLAMENTOS_BASE/
```

Prioridad: SLP primero, luego QRO, luego MTY.

**Tarea 2 — Leer los PDFs y mapear artículos:**
Por cada PDF, localizar y anotar el número de artículo de:

1. Definiciones
2. Recolección general
3. Obligaciones de habitantes
4. Infracciones / sanciones
5. ¿Artículo específico de condominios? (sí/no + número)

Reportar al CLC para actualizar la tabla multi-ciudad.

**Tarea 3 — Completar sección `📄 ESTADO ACTUAL` en cada adendo:**
Pegar el texto vigente del artículo correspondiente en cada archivo `.md`.

**Tarea 4 — Transformación de legal gates (requiere ADR antes de ejecutar):**
Modificar estos 4 archivos para convertir gates duros en gates blandos (advisory):

- `backend/app/operations/legal_gate.py`
- `backend/app/operations/violations/`
- `frontend/src/components/simulator/MarcoLegal.tsx`
- `backend/tests/test_fase9_operacion_multas.py`

> **Nota CLC → Auditor:** esta modificación requiere revisión del Auditor antes de que el Ejecutor la toque. Ver propuesta detallada en la conversación CLC-Usuario [2026-05-05].

**Tarea 5 — Componente de vista dividida (UI):**
Construir el componente de pantalla con:

- Selector de ciudad
- Selector de adendo
- Panel superior: texto del reglamento vigente (del PDF cargado)
- Panel inferior: texto del adendo propuesto (de los `.md`)
- Indicador de técnica (Adicionar / Reformar / Nuevo)

### Auditor (revisión requerida antes de avanzar)

**Revisión 1:** propuesta de transformación de legal gates (hard 422 → advisory warnings). El CLC ha propuesto mantener como hard block **solo** el salto de `Notificación` directo a `Sanción Firme` (Art. 14 CPEUM). El Auditor debe validar que el cambio no crea riesgo de compliance o impugnación.

**Revisión 2:** cuando los adendos estén completos con texto real de cada reglamento, el Auditor debe certificar que el contraste (vigente vs. propuesto) es fiel al texto oficial del PDF fuente — sin paráfrasis, sin invenciones.

### Navigator (consulta puntual)

Verificar si la cobertura geográfica del sistema (ZM SLP: municipios de SLP, Soledad de G.S. y Villa de Pozos) está correctamente delimitada en las capas de ALQUIMIA. El lineamiento técnico aplica a la ZM completa, no solo al municipio capital.

---

## 4. DECISIONES QUE NECESITAN AL CSA (PROPOSE — requiere respuesta)


| Decisión                                                                                 | Opciones                                                        | Recomendación CLC                              |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| ¿Transformar legal gates en esta sprint o después?                                       | A) Esta sprint B) Sprint siguiente C) ADR primero               | C — ADR primero, luego Auditor, luego Ejecutor |
| ¿Construir el componente de vista dividida ahora o cuando estén todos los PDFs?          | A) Ahora con placeholders B) Cuando lleguen los primeros 2 PDFs | B — empezar cuando SLP y QRO estén cargados    |
| ¿Prioridad de ciudades para el Ejecutor?                                                 | SLP → QRO → MTY → resto                                         | SLP primero (es el modelo base del capítulo)   |
| ¿Los adendos van solo en `SLP /DOCS/` o también en el módulo de marco legal del sistema? | A) Solo docs B) Integrar al módulo `MarcoLegal.tsx`             | B — pero requiere diseño de Aesthete-1 primero |


---

## 5. RESTRICCIONES QUE EL CSA DEBE RESPETAR AL PLANIFICAR

1. **Todos los archivos de adendos llevan la leyenda `[BORRADOR PARA REVISIÓN LEGAL]`** — el CSA no puede quitarla ni autorizar que el Ejecutor la quite sin ADR firmado por el Usuario.
2. **El texto de los adendos NO puede modificarse** por el Ejecutor al cargar los PDFs — solo puede agregar el texto vigente en la sección `📄 ESTADO ACTUAL`. El texto del adendo propuesto es jurisdicción CLC.
3. **La escalera de multas (4-8-12 UMAs)** requiere verificación contra los topes máximos del Bando de cada municipio antes de cualquier uso oficial. El CLC debe hacer esa verificación cuando lleguen los reglamentos.
4. **Soledad de Graciano Sánchez no tiene reglamento propio** — si el CSA decide incluirla en la primera sprint, requiere un adendo diferente (reglamento nuevo completo, no adición de artículos). Eso es trabajo adicional de CLC.

---

## 6. ENTREGABLES ESPERADOS DEL CSA

1. **Plan de sprint** con tareas asignadas por agente y fechas
2. **ADR** (Architecture Decision Record) sobre transformación de legal gates — antes de que el Ejecutor toque `legal_gate.py`
3. **Priorización** de las 7 ciudades para la carga de PDFs
4. **Diseño** del componente de vista dividida (en coordinación con Aesthete-1)
5. **Confirmación** de que el Navigator tiene correctamente delimitada la ZM SLP en las capas del sistema

---

> **Nota final CLC:** este brief es un `PROPOSE` completo. El CSA tiene jurisdicción para modificar la planificación, reasignar tareas o rechazar componentes con justificación. Lo único que el CSA no puede modificar sin ADR firmado por el Usuario es el texto jurídico de los adendos (jurisdicción CLC) ni las reglas del Auditor (jurisdicción independiente).

**trace:** CLC-BRIEF-CSA-001 · 2026-05-05 · Estado: `PENDIENTE DE RESPUESTA CSA`