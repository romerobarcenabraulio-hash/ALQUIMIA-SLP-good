# INSTITUTIONAL RIGOR AND VISUAL NARRATIVE · Auditoría de cumplimiento, diagramas operativos y sistema de citado

**Estado:** Propuesto · Pendiente de firma del founder
**Fecha:** 29 mayo 2026
**Dependencias:** Los nueve documentos anteriores
**Construye:** AUDITOR (expandido), POLIS (UI de diagramas y citas), KRONOS (verificación pre-export), MARCOS (estándares)

---

## 1 · Propósito

Cerrar tres gaps de credibilidad institucional que separan a Alquimia de "consultora seria con respaldo verificable" versus "plantilla con buena narrativa."

Frente uno · Auditoría sistémica de cumplimiento. Verificación pre-export de que cada documento generado efectivamente cumple los estándares que declara.

Frente dos · Diagramas operativos en módulos y documentos. Conversión de "página con datos" a "narrativa visual con datos."

Frente tres · Sistema de citado bibliográfico. Cada cifra con cita verificable a su fuente, en formato profesional reconocido.

---

## 2 · Frente uno · Auditoría de cumplimiento expandida

### 2.1 Extensión del rol de AUDITOR

AUDITOR ya existe en el catálogo de agentes con rol de trazabilidad interna. Esta sección expande su responsabilidad a verificación de cumplimiento pre-export.

**Filosofía:** ningún documento formal sale de Alquimia hacia el cliente declarando cumplimiento de estándar X sin que AUDITOR haya verificado que el cumplimiento es real, no nominal.

### 2.2 Schema de tabla `standards_compliance_check`

```sql
CREATE TABLE standards_compliance_check (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  document_export_id UUID REFERENCES tenant_documents(id),
  module_id VARCHAR(10),
  standard_code VARCHAR(50) NOT NULL,
  standard_version VARCHAR(20),
  required_fields JSONB NOT NULL,
  fields_present JSONB NOT NULL,
  fields_missing JSONB,
  citations_verified JSONB,
  citations_missing JSONB,
  compliance_percentage NUMERIC(5,2),
  block_export BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  checked_by_version VARCHAR(20)
);
```

### 2.3 Reglas de bloqueo de export

```typescript
const COMPLIANCE_THRESHOLDS = {
  block_export_below_pct: 80,
  warn_export_below_pct: 95,
  optimal_export_above_pct: 95,
}

function shouldBlockExport(check: ComplianceCheck): boolean {
  if (check.compliance_percentage < 80) return true
  if (check.citations_missing.length > 0 && check.standard_code.startsWith('GRI')) return true
  if (check.fields_missing.some(f => f.criticality === 'mandatory')) return true
  return false
}
```

Si un cliente intenta exportar un expediente Cabildo declarando cumplimiento de GRI 306-1 pero falta el campo de generación per cápita validada, AUDITOR bloquea con mensaje:

> "Este documento declara cumplimiento de GRI 306-1 pero le faltan los siguientes campos:
> - Generación de residuos por tipo (campo obligatorio del estándar)
> - Composición de residuos validada (campo obligatorio)
>
> Opciones disponibles:
> 1. Completar los campos antes de exportar
> 2. Exportar declarando "Cumplimiento parcial de GRI 306-1" con nota explícita
> 3. Exportar sin declarar GRI 306-1
>
> No es posible exportar declarando cumplimiento completo con campos faltantes."

### 2.4 Verificación de campos requeridos por estándar

Cada estándar relevante tiene su tabla de campos requeridos. Ejemplos:

**GRI 306-1 (Residuos generados):**
- Composición por tipo de residuo (obligatorio)
- Generación total en toneladas por periodo (obligatorio)
- Metodología de medición (obligatorio)
- Citas a fuentes verificables (obligatorio)

**GRI 306-2 (Gestión de impactos significativos):**
- Acciones tomadas para prevenir generación (obligatorio)
- Acciones tomadas para gestionar impactos (obligatorio)
- Datos de desempeño en periodo (obligatorio)

**ISO 14001:2015 §6.1.3 (Requisitos legales):**
- Identificación de requisitos legales aplicables (obligatorio)
- Acceso documentado a esos requisitos (obligatorio)
- Evaluación de cumplimiento (obligatorio)

**NMX-AA-015-1985 (Cuarteo):**
- Metodología aplicada documentada (obligatorio)
- Personal certificado (recomendado)
- Mínimo 50 kg de muestra (obligatorio)
- Evidencia fotográfica (recomendado)

**CSRD ESRS 1:2023 (Doble materialidad):**
- Identificación de stakeholders consultados (obligatorio)
- Proceso de evaluación de materialidad (obligatorio)
- Matriz de materialidad documentada (obligatorio)
- Justificación de temas materiales declarados (obligatorio)

Estos checklists se mantienen en `/lib/standards_compliance_rules.ts`. MARCOS los actualiza cuando los estándares cambian de versión.

### 2.5 Pantalla nueva en Plataforma 0 · A12 Cumplimiento

Sexta pantalla del panel administrativo (las anteriores cinco quedan según el documento del panel administrativo).

Tabla con columnas:
- Tenant
- Documento más reciente exportado
- Fecha export
- Estándares declarados
- Porcentaje de cumplimiento agregado
- Bloqueos activos
- Acciones pendientes

Filtros por estado de cumplimiento. Alertas automáticas cuando un tenant exporta con cumplimiento <95%.

### 2.6 Auditoría trimestral profunda

Cada trimestre, AUDITOR ejecuta auditoría profunda muestreando 10% de documentos exportados en los últimos 90 días. Para cada documento muestreado:
- Verificar manualmente (con apoyo de LLM solo donde código no resuelva) que cada cifra tiene cita
- Verificar que cada estándar declarado tiene todos sus campos requeridos
- Verificar que las citas resuelven a fuentes reales accesibles
- Producir reporte de hallazgos

Si tasa de error >5%, founder recibe alerta P1 y revisa proceso operativo.

---

## 3 · Frente dos · Diagramas operativos en módulos y documentos

### 3.1 Árbol de decisión para identificar tipo de diagrama por módulo

Antes de implementar un diagrama, tu PM (o cualquier desarrollador) responde tres preguntas sobre el módulo:

**Pregunta 1 · ¿Este módulo muestra un proceso, flujo o transformación?**
- Si sí → considera diagrama de flujo o diagrama de proceso.
- Si no → pasa a pregunta 2.

**Pregunta 2 · ¿Este módulo muestra una decisión con ramas o múltiples opciones?**
- Si sí → considera árbol de decisión o diagrama de ramificación.
- Si no → pasa a pregunta 3.

**Pregunta 3 · ¿Este módulo muestra estado actual vs estado deseado o comparación temporal?**
- Si sí → considera comparativo antes/después o gráfica de evolución.
- Si no → no requiere diagrama; texto y datos son suficientes.

### 3.2 Mapeo específico de diagramas para módulos pilar

**M01 · Diagnóstico de residuos sólidos** (responde sí a pregunta 1)
- Diagrama de flujo de residuos desde generación hasta disposición con tonelajes por nodo
- Diagrama Sankey de composición de residuos
- Tipo: diagrama dinámico con datos del tenant

**M04 · Costo de no actuar** (responde sí a pregunta 2 y 3)
- Árbol de decisión "¿Qué pasa si actúas vs no actúas?"
- Línea del tiempo acumulativo de costo año por año
- Tipo: diagrama estático parametrizable con cifras del tenant

**M13 · Escenarios financieros** (responde sí a pregunta 3)
- Comparativo de los tres escenarios (Ambicioso, Moderado, Conservador) en gráfica unificada
- Curva de TIR contra horizonte temporal
- Tipo: diagrama dinámico con cálculos del tenant

**M14 · Riesgos** (responde sí a pregunta 1 y 2)
- Matriz visual probabilidad × impacto estándar PMBOK
- Árbol de decisión de mitigaciones por categoría de riesgo
- Tipo: diagrama dinámico con datos del tenant

**M21 · Tablero de riesgos y gates** (responde sí a pregunta 1)
- Diagrama Gantt visual del programa completo
- Estado de cada gate con flechas de dependencia
- Tipo: diagrama dinámico con estado actual del tenant

### 3.3 Decisión estática vs dinámica

**Diagramas estáticos:** SVG predefinidos con texto fijo. Aplican cuando el contenido visual no cambia entre tenants. Ejemplos: árbol de decisión "actuar vs no actuar," matriz general de riesgos PMBOK.

**Diagramas dinámicos:** componentes React con D3.js o Recharts que reciben datos del tenant y renderizan visualmente. Aplican cuando cifras específicas del cliente alimentan la visualización.

Para Sprint 2, construir solo estáticos parametrizables. Sprint 3 agrega dinámicos según uso real medido.

### 3.4 Integración con generador de PDF/ZIP

Cuando ARCHIVO o cualquier agente exporta un PDF formal:
1. Identifica los módulos incluidos en el documento.
2. Consulta tabla `module_diagrams_map` para cada uno.
3. Para diagramas estáticos: inserta SVG predefinido en el lugar correspondiente.
4. Para diagramas dinámicos: renderiza con datos del tenant y convierte a PNG/SVG embebido.
5. Cada diagrama lleva pie de figura: "Figura N · [Descripción] · Generado por Alquimia · Fuente: datos del tenant validados al [fecha]."

### 3.5 Briefs de diseño para tu PM

En lugar de SVG embebido, los siguientes briefs te permiten a tu PM construir o instruir construcción:

**Brief 1 · Diagrama M01 flujo de residuos**
- Tipo: diagrama Sankey horizontal
- Origen: "Generación municipal" (tonelaje total)
- Nodos intermedios: cinco fracciones (orgánicos, papel/cartón, plásticos, vidrio, metales) más fracción no valorizable
- Destinos finales: "Centro de acopio," "Relleno sanitario," "Tiradero informal"
- Anchura de flujos proporcional a tonelaje
- Color: tonos sage para flujos hacia valorización, tonos rojizos para flujos hacia disposición incorrecta
- Datos requeridos: tenant.diagnostico_rsu.composicion_residuos, tenant.diagnostico_rsu.destino_actual

**Brief 2 · Diagrama M04 árbol de decisión**
- Tipo: árbol binario con dos ramas principales
- Raíz: "Municipio: [Nombre]"
- Rama izquierda: "No actuar (continuar como hoy)" → consecuencias acumuladas a 10 años en pesos
- Rama derecha: "Implementar programa Alquimia" → consecuencias en pesos evitados, empleos generados, emisiones evitadas
- Sub-ramas: año 1, año 3, año 5, año 10
- Datos requeridos: tenant.costo_omision por escala temporal

**Brief 3 · Diagrama M13 escenarios financieros**
- Tipo: gráfica de líneas con tres curvas
- Eje X: años (0 a 10)
- Eje Y: valor acumulado en MXN
- Tres líneas: Ambicioso, Moderado, Conservador
- Banda de incertidumbre alrededor de cada línea (intervalo de confianza)
- Datos requeridos: tenant.escenarios_financieros.por_escenario

**Brief 4 · Diagrama M14 matriz de riesgos**
- Tipo: cuadrícula 5x5 (probabilidad × impacto)
- Cada riesgo como punto en la cuadrícula con etiqueta
- Color: verde (probabilidad × impacto ≤ 6), amarillo (entre 7 y 14), rojo (≥ 15)
- Tooltip al pasar el cursor: descripción completa del riesgo
- Datos requeridos: tenant.registro_riesgos completo

**Brief 5 · Diagrama M21 Gantt del programa**
- Tipo: diagrama Gantt horizontal
- Eje X: 36 meses
- Filas: fases del programa con dependencias visualizadas
- Marcadores de gates G1, G2, G3, G4, G5 como diamantes
- Estado actual (línea vertical "hoy")
- Datos requeridos: tenant.plan_maestro completo

**Brief 6 · Diagrama institucional comparativo (genérico para módulos)**
- Tipo: comparativo antes/después en dos columnas
- Aplicable a cualquier módulo que muestre transformación
- Columna izquierda: estado actual
- Columna derecha: estado proyectado
- Datos requeridos: definidos por módulo específico

### 3.6 Diagramas visibles dentro de la plataforma (no solo en exportes)

Cada módulo en su versión web renderiza los diagramas asignados en posiciones específicas:
- Diagrama principal arriba del fold (después del título)
- Diagramas secundarios distribuidos entre secciones de cifras

Esto convierte cada módulo de "página con datos" a "narrativa visual con datos."

---

## 4 · Frente tres · Sistema de citado bibliográfico

### 4.1 Formato Alquimia · adaptado de Chicago notes-bibliography

Consultoría seria mexicana no usa estrictamente Chicago ni APA. Usa formato propio inspirado en Chicago notes-bibliography porque es el más usado en consultoría técnica y reportes ESG internacionales. Alquimia adopta este formato:

**Nota al pie de página (footnote):**
```
¹ Autor o Institución, "Título de la sección o documento," Nombre del documento padre
si aplica (Ciudad: Editorial, año), página o sección, URL si está disponible,
consultado el [fecha].
```

**Bibliografía al final del documento:**
```
Autor o Institución. "Título de la sección o documento." Nombre del documento padre
si aplica. Ciudad: Editorial, año. URL si está disponible.
```

### 4.2 Casos específicos del contexto mexicano

**Caso 1 · Cita de INEGI**
```
² INEGI, Censo de Población y Vivienda 2020, Datos por municipio, San Luis Potosí
(Aguascalientes: INEGI, 2021), https://www.inegi.org.mx/programas/ccpv/2020/,
consultado el 29 de mayo de 2026.
```

**Caso 2 · Cita de Periódico Oficial estatal**
```
³ Gobierno del Estado de San Luis Potosí, "Reglamento de Limpia del Municipio
de San Luis Potosí," Periódico Oficial del Estado, Edición Extraordinaria,
15 de marzo de 2018, http://periodicooficial.slp.gob.mx/2018/marzo/15-ext,
consultado el 29 de mayo de 2026.
```

**Caso 3 · Cita de estándar internacional**
```
⁴ Global Reporting Initiative, GRI 306: Residuos 2020, Estándar de Reporte
de Sostenibilidad (Ámsterdam: GRI, 2020), Contenido 306-1,
https://www.globalreporting.org/standards/.
```

**Caso 4 · Cita de NOM o NMX**
```
⁵ Secretaría de Comercio y Fomento Industrial, NMX-AA-015-1985: Protección
al ambiente · Contaminación del suelo · Residuos sólidos municipales ·
Muestreo · Método de cuarteo (México: SECOFI, 1985).
```

**Caso 5 · Cita de cálculo derivado de Alquimia**
```
⁶ Alquimia Platform, "Estimación de costo de disposición evitada," metodología
documentada en alquimiaplatform.com/metodologia, basada en datos del tenant
[Municipio] validados al [fecha].
```

### 4.3 Componente <Citation /> reutilizable

```typescript
interface CitationProps {
  source: {
    type: 'inegi' | 'periodico_oficial' | 'gri' | 'iso' | 'nmx' | 'alquimia_derived' | 'other'
    author?: string
    institution: string
    title: string
    parent_document?: string
    city?: string
    publisher?: string
    year: number
    section?: string
    url?: string
    consulted_at?: Date
  }
  position: number  // número de la cita (¹ ² ³ etc.)
}

function Citation({ source, position }: CitationProps) {
  // Renderiza superíndice en línea + entrada al final del documento
}
```

Cada cifra en cada módulo lleva su componente <Citation /> asociado. Cuando el usuario pasa el cursor sobre el superíndice, ve la cita completa en tooltip. Cuando se exporta a PDF, las citas se compilan en orden numérico al pie de cada página y bibliografía completa al final.

### 4.4 Schema de metadata de fuentes por cifra

Cada cifra del módulo necesita metadata de fuente:

```typescript
interface DataPoint {
  field_id: string
  value: number | string
  unit?: string
  confidence: 'verified_official' | 'verified_secondary' | 'inferred_high' | 'inferred_medium' | 'inferred_low'
  source: {
    type: string
    institution: string
    title: string
    url?: string
    consulted_at: Date
  } | null  // null solo si es valor que el usuario capturó manualmente
  derived_from?: string[]  // si es cálculo, IDs de otros DataPoints
  formula?: string  // si es cálculo
}
```

Sin esta metadata, AUDITOR bloquea export. Política: cero cifras flotando sin fuente.

### 4.5 Generador automático de bibliografía

Al exportar PDF o ZIP:
1. Sistema recopila todos los DataPoints usados en el documento.
2. Extrae sus fuentes únicas.
3. Ordena alfabéticamente por institución.
4. Genera sección "Bibliografía" al final del documento.
5. Cada entrada con formato Alquimia adaptado de Chicago.

---

## 5 · Cuenta founder provisional y migración futura

### 5.1 Configuración con `demo@alquimiaplatform.com`

Mientras compras dominio definitivo, cuenta founder vive en `demo@alquimiaplatform.com` con role `founder` en Clerk:

```typescript
// En Clerk dashboard, usuario manual:
{
  email: "demo@alquimiaplatform.com",
  publicMetadata: {
    role: "founder",
    has_admin_access: true,
    has_sandbox_tenant: true,
    sandbox_tenant_id: "municipio-demo-001",
    can_assume_any_tenant_identity: true,
    bypass_payment_gates: true
  }
}
```

Esta cuenta:
- Accede a Plataforma 0 administrativa completa
- Ve cualquier tenant como observer (read-only por default)
- Modifica solo su sandbox personal sin afectar producción
- Para modificar tenant real, "asume identidad temporal" con audit log

### 5.2 Sandbox personal · Municipio Demo

Tenant ficticio precargado en producción con datos realistas pero completamente inventados:

```typescript
{
  tenant_id: "municipio-demo-001",
  municipio: { nombre: "Municipio Demo", estado: "Estado Demo", inegi_clave: "DEMO-001" },
  current_stage: "validation",  // configurable manualmente para demos
  visible_only_to: ["founder", "admin"],  // nunca expuesto a otros usuarios
  data_marked_as_demo: true,  // banner permanente en pantallas
}
```

Cuando demuestras a un prospecto, muestras este tenant. Cero riesgo de mostrar datos reales de SLP o Querétaro.

### 5.3 Migración a dominio definitivo

Cuando compres dominio nuevo (digamos `[nombre-empresa].mx`):

1. Compra dominio en registrador (Cloudflare, GoDaddy, Namecheap).
2. Configura Google Workspace ($6 USD/mes) con el dominio nuevo.
3. Configura registros MX, SPF, DKIM, DMARC apuntando a Google.
4. Espera propagación DNS (1-24 horas).
5. En Clerk dashboard:
   - Crea cuenta nueva: `tu-nombre@[nombre-empresa].mx`
   - Copia publicMetadata desde `demo@alquimiaplatform.com`
   - Asigna role founder a la cuenta nueva
   - Desactiva (no elimines) la cuenta `demo@`
6. Login con cuenta nueva, verifica acceso completo a Plataforma 0.
7. Mantén `demo@alquimiaplatform.com` activa por 90 días como respaldo.

### 5.4 Sobre el nombre comercial

Si "Alquimia" está registrada como marca por otra entidad, antes del primer contrato comercial debes resolver:

**Paso uno:** búsqueda en IMPI (Instituto Mexicano de la Propiedad Industrial). Costo: gratis. Tiempo: 30 minutos en marcanet.impi.gob.mx.

**Paso dos:** brainstorming de nombre alternativo. Criterios sugeridos: cinco a doce letras, pronunciable en español e inglés, dominio .mx o .com disponible, no registrado en clase 9 (software) ni clase 42 (servicios tecnológicos) ni clase 35 (servicios de consultoría).

**Paso tres:** verificación de dominio. ¿`[nombre].mx` disponible? ¿`[nombre].com.mx`?

**Paso cuatro:** registro de marca en IMPI. Costo: $3,000-5,000 MXN por clase. Tres clases relevantes: 9 (software), 35 (consultoría), 42 (servicios técnicos). Total: $9,000-15,000 MXN. Más honorarios de abogado: $5,000-15,000 MXN. Tiempo: 6-12 meses para registro completo pero la solicitud te da derecho de uso desde el primer día.

**Paso cinco:** una vez aprobado el nombre nuevo, migración: dominio nuevo, email institucional, ajuste de copy en plataforma, comunicación a stakeholders existentes (si aplica).

Esto es trabajo paralelo de las próximas 2-4 semanas. No bloquea MVP_CLOSURE_V2 pero sí bloquea primer contrato comercial.

---

## 6 · Criterios binarios de cierre

Este frente está cerrado cuando:

1. AUDITOR expandido bloquea exports con cumplimiento <80% de estándares declarados
2. Tabla `standards_compliance_check` poblada para cada export
3. Pantalla A12 (Cumplimiento) operativa en Plataforma 0
4. Auditoría trimestral profunda con muestreo 10% configurada como cron
5. Cinco diagramas críticos implementados para módulos pilar (M01, M04, M13, M14, M21)
6. Componente <Citation /> funcional con tooltips
7. Metadata de fuentes obligatoria en cada DataPoint
8. Generador automático de bibliografía al exportar
9. Cuenta `demo@alquimiaplatform.com` operativa como founder
10. Sandbox personal Municipio Demo precargado y aislado
11. Decisión documentada sobre nombre comercial alternativo

---

## 7 · Cronograma de implementación

Este trabajo NO entra al MVP_CLOSURE_V2. Es Sprint 2 paralelo a ARCHIVO.

| Semana | Trabajo |
|---|---|
| Sprint 2 semana 1 | AUDITOR expandido + tabla compliance + reglas por estándar |
| Sprint 2 semana 2 | Componente Citation + metadata de fuentes + generador bibliografía |
| Sprint 2 semana 3 | Cinco diagramas estáticos para módulos pilar |
| Sprint 2 semana 4 | Pantalla A12 + integración pre-export + auditoría trimestral cron |
| Sprint 2 semana 5 | Testing con SLP + ajustes + migración founder si compras dominio |

Total: 5 semanas paralelas a ARCHIVO.

---

## 8 · Documentos relacionados

- `ADR-0010_stage_based_platform_separation.md`
- `MODULE_MATURITY_AND_PERSONALIZATION.md` — schemas que llevan fuentes
- `AUTOMATION_AND_PERSONALIZATION_LAYER.md` — HERMES marca confianza
- `ARCHIVO_AGENT_SPECIFICATION.md` — extrae citas literales de documentos subidos
- `BILLING_CONTRACTS_LIFECYCLE.md` — qué tipos de export aplican

---

## 9 · Aprobación

```
[ ] Founder
[ ] AUDITOR · ampliación de rol
[ ] MARCOS · reglas de compliance por estándar
[ ] POLIS · componentes Citation y diagramas en módulos
[ ] KRONOS · backend de verificación pre-export
```

---

*INSTITUTIONAL RIGOR AND VISUAL NARRATIVE · Alquimia · 29 mayo 2026*
