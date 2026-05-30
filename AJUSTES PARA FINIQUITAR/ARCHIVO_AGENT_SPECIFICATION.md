# ARCHIVO · Especificación del agente de documentos y detección de gaps

**Estado:** MVP integrado · versión mínima funcional
**Fecha:** 29 mayo 2026
**Dependencias:** ADR-0010, AUTOMATION_AND_PERSONALIZATION_LAYER, LEARNING_AND_FEEDBACK_LAYER, MVP_CLOSURE_V2
**Construye:** KRONOS (backend), HERMES (coordinación con inferencia inicial), AUDITOR (trazabilidad), POLIS (UI de banner y upload)
**Implementación:** MVP_CLOSURE_V2 actual · alcance mínimo embebido

---

## 1 · Propósito

Definir el agente ARCHIVO que vive embebido en la plataforma Alquimia. Su rol único es detectar documentos institucionales que el sistema necesita pero no puede acceder, solicitarlos al cliente con humildad operativa, procesarlos cuando llegan, e integrar la información extraída a los módulos correspondientes con trazabilidad completa.

Corrección founder del MVP: ARCHIVO no queda diferido a Sprint 2. Entra al MVP actual con alcance mínimo: `document_gaps`, `tenant_documents`, banner por módulo, carga segura de archivos, opción "no aplica", estado documental visible y reflejo en ZIP/export. La extracción avanzada, OCR, inbound email, digest automático y uso LLM quedan fuera del MVP salvo que ya existan apagados por feature flag.

ARCHIVO existe porque la realidad documental del gobierno mexicano es que mucha información crítica vive en PDFs escaneados sin OCR, en sitios web inestables, en correos internos, en archiveros físicos. Perplexity puede identificar que el documento existe; ARCHIVO le pide al cliente que lo suba y lo procesa cuando llega.

---

## 2 · Filosofía operativa declarada

ARCHIVO está construido bajo el principio "código sobre LLM." Esto significa: 90% de la funcionalidad usa código clásico, regex, parsing determinístico y reglas explícitas. 10% usa LLM solo donde código no puede resolver la tarea por ambigüedad inherente del lenguaje natural.

Cada componente del agente declara explícitamente si requiere LLM o no, con justificación documentada. Esto previene el patrón común en startups de "agente IA" donde todo se delega a LLM produciendo productos lentos, caros, no determinísticos y difíciles de debuggear.

Bloomberg Terminal, Veeva Vault, Toast — los productos que Alquimia aspira a replicar — usan LLMs casi nada. Usan código clásico, reglas determinísticas y machine learning estadístico tradicional para volúmenes grandes. ARCHIVO sigue ese patrón.

---

## 3 · Arquitectura del agente

### 3.1 Los doce componentes que NO requieren LLM

**Componente 1 · Detector de URLs rotas en respuestas de Perplexity.**
Mecánica: cada vez que Perplexity devuelve una respuesta con campo `citations`, ARCHIVO ejecuta HTTP HEAD request a cada URL. Si retorna 404, 403, 500, o timeout, marca la cita como "fuente inaccesible." Si retorna 200 pero content-type es PDF y file size > 50MB, marca como "probable scan no procesable."
Implementación: TypeScript con axios o native fetch.
Costo operacional: cero LLM, microsegundos por verificación.

**Componente 2 · Detector de menciones de documentos sin URL.**
Mecánica: regex sobre el texto de respuesta de Perplexity con patrones conocidos del léxico gubernamental mexicano. Lista de 30-50 patrones cubre 95% de casos.
Implementación:

```typescript
const DOCUMENT_MENTION_PATTERNS = [
  /reglamento\s+(de|sobre|para)\s+[a-záéíóú\s]+/gi,
  /plan\s+(municipal|estatal)\s+de\s+desarrollo/gi,
  /presupuesto\s+de\s+egresos/gi,
  /cuenta\s+p[úu]blica/gi,
  /padr[óo]n\s+(vehicular|de\s+contribuyentes)/gi,
  /informe\s+(anual|trimestral|de\s+gobierno)/gi,
  /convocatoria\s+(de\s+licitaci[óo]n|p[úu]blica)/gi,
  /acuerdo\s+de\s+cabildo/gi,
  /gaceta\s+(municipal|oficial)/gi,
  /declaratoria\s+de/gi,
  /lineamientos\s+(de|para|sobre)/gi,
  /manual\s+de\s+(organizaci[óo]n|procedimientos)/gi,
  // ... 30-50 patrones totales
]
```

Cuando hay match, ARCHIVO clasifica el documento por su patrón y lo registra como "gap detectado." Cero LLM.

**Componente 3 · Identificador de tipo de archivo por filename.**
Mecánica: regex sobre el nombre del archivo subido por el cliente. Si contiene "reglamento" + año cuatro dígitos, es reglamento. Si contiene "plan" + "desarrollo", es PMD. Si contiene "presupuesto" + año, es presupuesto de egresos.
Implementación: función puramente sintáctica.
Confiabilidad: 85-90% (suficiente para sugerir clasificación; usuario puede corregir).

**Componente 4 · Routing de email entrante al tenant correcto.**
Mecánica: cuando Postmark Inbound recibe email a `documentos@alquimiaplatform.com`, busca el dominio del remitente en la base de datos de usuarios. Match exacto del email contra tabla `users` retorna el `tenant_id` asociado.
Implementación: SQL query simple.
Caso edge: si dos personas del mismo municipio envían documentos, ambos enrutados al mismo tenant. Esto es deseable, no bug.

**Componente 5 · Validación de seguridad de archivos.**
Mecánica triple:
- Whitelist de mime types: PDF, DOCX, XLSX, JPG, PNG, HEIC. Cualquier otro rechazado.
- Scan antivirus: ClamAV local o VirusTotal API ($0.001 por scan).
- Tamaño máximo: 25 MB por archivo, 5 archivos por email.
Si falla cualquiera de las tres, ARCHIVO responde al email con motivo específico del rechazo. Cero archivos descartados silenciosamente.

**Componente 6 · Extractor de texto de PDF nativo.**
Mecánica: pdfplumber detecta si el PDF tiene capa de texto. Si sí, extrae directamente. Cero OCR necesario, cero LLM.
Velocidad: 2-5 segundos por documento de 30 páginas.
Confiabilidad: 99% en PDFs digitales.

**Componente 7 · OCR de PDF escaneado e imágenes.**
Mecánica: Tesseract OCR local (gratis) para escaneados de calidad razonable. Google Cloud Vision API ($1.50 por 1000 páginas) como fallback para escaneados de mala calidad o documentos rotados.
Velocidad: 5-15 segundos por página con Tesseract, 1-2 segundos con Cloud Vision.
Output: texto plano determinístico. Cero LLM.

**Componente 8 · Extractor de tablas de Excel.**
Mecánica: pandas o openpyxl. Lectura nativa de XLSX, conversión a JSON estructurado.
Confiabilidad: 100% en archivos no corruptos.

**Componente 9 · Detector de campos específicos en documentos estructurados.**
Mecánica: regex sobre texto extraído para patrones predecibles de documentos gubernamentales mexicanos.
Ejemplos:

```typescript
// Artículos de reglamento
const ARTICULO_REGEX = /Art[íi]culo\s+(\d+)[\.\-\s]+(.+?)(?=Art[íi]culo|\Z)/gs

// Montos en pesos mexicanos
const MONTO_REGEX = /\$\s?([\d,]+(?:\.\d{2})?)\s*(MXN|pesos|mxn)?/gi

// Fechas en formato mexicano
const FECHA_REGEX = /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/gi

// Cifras de población
const POBLACION_REGEX = /poblaci[óo]n\s+(?:de\s+)?([\d,]+)\s*(habitantes|personas)?/gi
```

La estructura legal y administrativa mexicana es predecible. Cero LLM para 90% de las extracciones.

**Componente 10 · Asignador de documento al módulo correcto.**
Mecánica: mapeo determinístico basado en tipo de documento detectado.

```typescript
const DOCUMENT_TO_MODULE_MAP = {
  reglamento_limpia: 'M03B',
  reglamento_organico: 'M03',
  plan_desarrollo: 'M00B',
  presupuesto_egresos: 'M09',
  organigrama: 'M07',
  padron_vehicular: 'M06',
  cuenta_publica: 'M09',
  informe_gobierno: 'M00B',
  convocatoria_licitacion: 'M11',
  acuerdo_cabildo: 'M15',
  gaceta_municipal: 'M03B',
}
```

Cero LLM, cero ambigüedad.

**Componente 11 · Generador de digest semanal.**
Mecánica: plantilla de email con variables interpoladas. Mismo template cada lunes a las 9:00 hora SLP. Datos consultados de la base: gaps pendientes del tenant, gaps marcados "no aplica" excluidos, porcentaje de progreso calculado del ratio cifras validadas / total.

Template:

```
Asunto: Documentos pendientes para tu diagnóstico de [Municipio] · Semana del [fecha]

Hola [Nombre],

Esta semana tu diagnóstico subió de [N1]% a [N2]% validado.

Identificamos [N] documentos que podrían enriquecerlo. Si los tienes,
responde a este email adjuntándolos. Procesamos PDF, Word, Excel, JPG, PNG.

Documentos pendientes:
[Loop de N gaps con descripción, fuente original, módulo donde aplica]

Si alguno no aplica, responde con "[número] no aplica" y dejamos de pedirlo.
```

Cero LLM. Plantilla con variables.

**Componente 12 · Aplicación de límites operacionales.**
Mecánica: lógica de negocio en base de datos.

```typescript
const TENANT_LIMITS = {
  documentos_procesados_por_mes_preliminary: 50,
  documentos_procesados_por_LLM_preliminary: 10,
  documentos_almacenados_total: 200,
  digest_emails_max_por_mes: 4,
}
```

Cuando se alcanza un límite, ARCHIVO almacena el documento pero no lo procesa con LLM hasta que el cliente firme contrato. Cero LLM en esta lógica.

### 3.2 Los componentes que SÍ requieren LLM

**Componente LLM-1 · Extractor de información NO estructurada de documentos.**

Justificación: cuando un reglamento dice "queda prohibido depositar residuos en la vía pública en horarios distintos a los establecidos por el órgano municipal correspondiente," entender que esto representa "obligación de separación temporal con sanciones implícitas" requiere comprensión del lenguaje legal. Regex no puede capturar esto. Es ambiguo por diseño del texto legal.

Implementación: después de Componente 9 (regex sobre estructura), las secciones que regex no clasificó se envían a Claude con prompt específico:

```
Eres un asistente que extrae obligaciones legales de reglamentos municipales
de residuos sólidos urbanos en México.

Documento: [Texto extraído del reglamento]
Sección: [Artículo X]
Tarea: identifica si esta sección establece:
  - Obligación de separación de residuos (sí/no)
  - Sanción por incumplimiento (sí/no, monto si aplica)
  - Incentivos por cumplimiento (sí/no, tipo si aplica)
  - Autoridad responsable de aplicar (cuál)

Responde ÚNICAMENTE con cita LITERAL del documento + clasificación.
NO infieras información no presente en el texto.

Formato:
{
  "obligacion_separacion": { "presente": bool, "cita_literal": "..." },
  "sancion": { "presente": bool, "monto": "...", "cita_literal": "..." },
  ...
}
```

Regla inviolable: si Claude no puede producir cita literal del documento que respalde su clasificación, la clasificación es rechazada. Sin cita literal, no se acepta como extracción válida. Esto previene alucinaciones que entran al expediente del cliente.

Costo estimado: $0.05-0.15 USD por documento procesado con LLM. Cap automático: máximo 10 documentos procesados con LLM por tenant en estado preliminary.

**Componente LLM-2 · Detector de menciones implícitas en respuestas de Perplexity.**

Justificación: regex captura patrones explícitos. Cuando Perplexity dice "el municipio publica reportes anuales pero no encontré el más reciente," eso es mención implícita de documento. Detectarla requiere comprensión semántica.

Implementación: pasada secundaria sobre respuestas de Perplexity que el detector regex no clasificó. Prompt corto a Claude o Gemini Flash:

```
Texto de Perplexity: [respuesta]
Tarea: identifica documentos institucionales mexicanos mencionados pero no
linkeados. Responde con lista JSON. Si no hay menciones, responde array vacío.

Ejemplos válidos:
  - "reporte anual de gestión de residuos"
  - "informe de la auditoría municipal"
  - "padrón actualizado de contribuyentes"

NO inventes documentos. Solo extrae menciones literales del texto.
```

Costo estimado: $0.01-0.03 USD por respuesta procesada. Total mensual: $10-30 USD.

**Componente LLM-3 · Generador de digest cuando el contexto es complejo.**

Justificación marginal: la plantilla determinística funciona 90% de los casos. El 10% restante son tenants con 12+ documentos pendientes con contexto heterogéneo donde un email genérico se vería robotizado.

Implementación condicional: si el tenant tiene ≤5 documentos pendientes, plantilla determinística. Si tiene 6+, pasada a Claude para refinar el orden y el tono.

Costo estimado: $0.10 USD por digest refinado. Cap: máximo 4 digests por mes por tenant.

### 3.3 Resumen de uso de LLM

| Tarea | Componente | Frecuencia | Costo mensual estimado por tenant |
|---|---|---|---|
| Extracción de obligaciones legales | LLM-1 | Por documento procesado (cap 10) | $0.50-1.50 USD |
| Detección de menciones implícitas | LLM-2 | Por respuesta Perplexity (cap 20) | $0.20-0.60 USD |
| Refinamiento de digest complejo | LLM-3 | Si ≥6 docs pendientes (cap 4) | $0-0.40 USD |
| **Total LLM mensual por tenant** | | | **$0.70-2.50 USD** |

Para 50 tenants activos: $35-125 USD/mes en LLM. Manejable, predecible, capeable automáticamente.

Para los mismos 50 tenants, el componente código clásico (los 12 sin LLM) procesa miles de operaciones al mes con costo computacional cercano a cero más el servicio Postmark Inbound ($15/mes).

---

## 4 · Flujo end-to-end del agente

### 4.1 Detección de gap

```
1. Cliente abre módulo M03B (marco legal).
2. Sistema necesita texto del reglamento de limpia del municipio.
3. HERMES (inferencia inicial) intentó extraer del Periódico Oficial pero falló.
4. ARCHIVO toma el caso. Ejecuta:
   - Componente 1: HTTP HEAD a URLs del campo `citations` de Perplexity. Confirmado: URL rota.
   - Componente 2: regex sobre el texto de Perplexity. Detecta mención "reglamento de limpia de [Municipio]."
   - Asignación a tabla `document_gaps` con tenant_id, módulo M03B, tipo "reglamento_limpia", confianza alta.
5. Banner se activa en M03B: "Identificamos que existe un reglamento que no
   pudimos acceder. Súbelo aquí para enriquecer este módulo: [Upload]"
6. Si pasa el lunes sin upload, el gap entra al digest semanal.
```

### 4.2 Upload por la plataforma

```
1. Cliente hace click en el banner de M03B.
2. Modal de upload con drag-and-drop. Acepta PDF, DOCX, etc.
3. Cliente sube archivo. Frontend valida tamaño y mime type básico.
4. Backend ejecuta:
   - Componente 5: validación seguridad (mime, antivirus, tamaño)
   - Si pasa: almacena archivo en S3 con encriptación, registra en tabla
     `tenant_documents` con tenant_id, módulo, tipo detectado.
   - Componente 3: identifica tipo por filename. Sugiere clasificación.
5. Cliente confirma o ajusta la clasificación sugerida.
6. ARCHIVO procesa en background:
   - Componente 6 o 7: extrae texto (PDF nativo u OCR según tipo).
   - Componente 9: regex sobre texto para campos estructurados.
   - Componente 10: asigna al módulo correcto.
   - LLM-1 si aplica: extrae obligaciones legales con citas literales.
7. Sistema integra extracción al módulo M03B:
   - Cifras nuevas con sello "Extraído de [filename] · Por validar"
   - Cliente recibe notificación: "Procesamos tu documento. 3 campos nuevos
     integrados a M03B."
8. Cliente revisa y valida los campos extraídos.
```

### 4.3 Upload por email

```
1. Cliente recibe digest semanal lunes 09:00 hora SLP.
2. Cliente responde al email adjuntando archivos.
3. Postmark Inbound recibe el email en documentos@alquimiaplatform.com.
4. Webhook dispara función de ARCHIVO:
   - Componente 4: identifica tenant por email del remitente.
   - Componente 5: valida cada adjunto.
   - Si pasa: misma lógica que upload por plataforma (pasos 6-7 anteriores).
   - Si falla algún archivo: responde al cliente con explicación específica.
5. ARCHIVO envía email de confirmación en 30 segundos:
   "Recibimos [N] archivos. Procesando. Te avisamos cuando estén integrados."
6. Cuando procesamiento termina (10-30 min según volumen):
   ARCHIVO envía email final: "Listos. Integramos [N] al diagnóstico,
   [M] requieren tu revisión por extracción ambigua."
```

### 4.4 Digest semanal

```
1. Cron job lunes 09:00 hora SLP (configurable por tenant si zona horaria
   distinta).
2. Para cada tenant en estado preliminary:
   - Query: documents_gaps WHERE tenant_id = X AND status = 'pending'
            AND marked_not_applicable = false
   - Calcular: % cifras validadas vs cifras totales actuales y de hace 7 días.
   - Si primer o segundo digest del tenant: limit 3 documentos.
   - Si tercer digest+: hasta 8 documentos pendientes ordenados por prioridad.
3. Si ≤5 documentos pendientes: usa plantilla determinística (Componente 11).
4. Si ≥6 documentos pendientes: pasa por LLM-3 para refinar tono.
5. Resend envía email al usuario primario del tenant.
6. Se incrementa contador digest_count del tenant.
```

---

## 5 · Las tres correcciones integradas

### 5.1 Cap de inferencia por municipio, no por funcionarios

Una sola corrida de HERMES por municipio. El primer funcionario que se registra dispara la inferencia. Los siguientes registros (sin límite numérico explícito, soft cap de 20) entran al mismo tenant sin disparar HERMES de nuevo.

```typescript
async function handleRegistration(email, municipio, inegi_clave) {
  const existingTenant = await db.tenant.findFirst({ where: { inegi_clave } })

  if (existingTenant) {
    // Tenant ya existe. Solo agregar usuario.
    await db.user.create({
      email,
      tenant_id: existingTenant.id,
      role: 'collaborator',
      joined_at_phase: existingTenant.current_stage
    })

    await sendEmail({
      to: email,
      subject: `Te uniste al equipo de ${municipio} en Alquimia`,
      template: 'collaborator_welcome',
      context: {
        municipio,
        primary_user: existingTenant.primary_user_name,
        team_size: existingTenant.user_count + 1
      }
    })

    // CERO disparos de HERMES adicionales. Cero costo de tokens.
    return { tenant_id: existingTenant.id, action: 'joined_existing' }
  }

  // Es el primer registro del municipio. Crear tenant y disparar HERMES.
  const newTenant = await db.tenant.create({ ... })
  await inngest.send({ name: 'hermes/inference.start', data: { ... } })

  return { tenant_id: newTenant.id, action: 'created_new' }
}
```

Esto preserva el control de costo sin destruir el flujo comercial natural en municipios donde múltiples funcionarios necesitan acceso.

### 5.2 Digest semanal con tres reglas de progresión

**Regla uno · Primeros dos digests son ligeros.**
```typescript
function calculateDigestDocCount(tenant) {
  const digestNumber = tenant.digest_count + 1
  if (digestNumber === 1 || digestNumber === 2) return 3 // Solo top 3
  if (digestNumber <= 4) return 5
  return 8 // Después del cuarto digest, hasta 8 docs
}
```

**Regla dos · Progreso visible en cada digest.**
```typescript
async function buildDigestContext(tenant) {
  const validationToday = await getValidationPercentage(tenant.id, new Date())
  const validationWeekAgo = await getValidationPercentage(
    tenant.id,
    subDays(new Date(), 7)
  )
  return {
    progress_today_pct: validationToday,
    progress_week_ago_pct: validationWeekAgo,
    delta_pct: validationToday - validationWeekAgo,
    message_template: validationToday > validationWeekAgo
      ? "Tu diagnóstico subió de X% a Y%"
      : "Tu diagnóstico está en X%"
  }
}
```

**Regla tres · Opción "marcar como no aplica."**
```typescript
async function processInboundReply(emailBody, tenantId) {
  // Detector de patrones "N no aplica" en el cuerpo del email
  const notApplicableRegex = /(\d+)\s+no\s+aplica/gi
  const matches = [...emailBody.matchAll(notApplicableRegex)]

  for (const match of matches) {
    const docNumber = parseInt(match[1])
    await db.document_gaps.update({
      where: {
        tenant_id: tenantId,
        digest_position: docNumber
      },
      data: {
        marked_not_applicable: true,
        marked_at: new Date()
      }
    })
  }

  // Estos documentos no volverán a aparecer en digests futuros.
}
```

### 5.3 Watermark de progreso, no de limitación

Reemplaza el texto "Diagnóstico inicial · Versión 1" por frame comercial de progreso.

```typescript
export async function Watermark() {
  const { sessionClaims } = await auth()
  const tenantStatus = sessionClaims?.publicMetadata?.tenantStatus

  if (tenantStatus !== 'preliminary') return null

  const tenantId = sessionClaims?.publicMetadata?.tenantId as string
  const validationPct = await getValidationPercentage(tenantId, new Date())
  const today = new Date().toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 select-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] opacity-20">
        <div className="text-center text-text-tertiary text-xs uppercase tracking-widest font-mono">
          ALQUIMIA · Diagnóstico en construcción · {validationPct}% validado · {today}
        </div>
      </div>
    </div>
  )
}
```

El número de porcentaje crea tensión positiva. Cliente quiere ver el número subir; eso lo motiva a responder digests y a firmar contrato (que dispara validación oficial = porcentaje sube hacia 100).

---

## 6 · Integración con servicios externos

### 6.1 Postmark Inbound

**Costo:** $15 USD/mes plan starter, 10k emails entrantes/mes.

**Configuración:**
1. Cuenta en postmarkapp.com
2. Configurar dominio `alquimiaplatform.com` con registros MX apuntando a Postmark
3. Crear inbound stream con webhook a `/api/archivo/inbound`
4. Variable de entorno `POSTMARK_INBOUND_SECRET` para validar webhooks

**Webhook handler:**

```typescript
// /app/api/archivo/inbound/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { archivoAgent } from '@/lib/agents/archivo'

export async function POST(req: NextRequest) {
  // Validar autenticidad del webhook
  const signature = req.headers.get('x-postmark-signature')
  if (!validateSignature(signature, process.env.POSTMARK_INBOUND_SECRET!)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const payload = await req.json()

  // Postmark entrega el email parseado con atachments en base64
  const { From, Subject, TextBody, Attachments } = payload

  // ARCHIVO toma el caso
  await archivoAgent.handleInboundEmail({
    fromEmail: From,
    subject: Subject,
    body: TextBody,
    attachments: Attachments,
    receivedAt: new Date()
  })

  return NextResponse.json({ status: 'received' })
}
```

### 6.2 Tesseract OCR

**Costo:** cero, librería open source.
**Instalación:** `npm install tesseract.js` o servicio externo cuando carga supere capacidad local.
**Caso de uso:** PDFs escaneados de mediana calidad. Reglamentos antiguos digitalizados, organigramas en JPG, planes municipales.

### 6.3 Google Cloud Vision (fallback)

**Costo:** $1.50 USD por 1000 páginas.
**Cuándo activar:** si Tesseract retorna texto con menos de 100 caracteres en una página de PDF mayor a 1MB, fallback automático a Cloud Vision.
**Variable de entorno:** `GOOGLE_CLOUD_VISION_API_KEY`.

### 6.4 ClamAV o VirusTotal

**Costo:** ClamAV gratis, VirusTotal $0.001 por scan.
**Recomendación inicial:** VirusTotal API por simplicidad y mantenimiento cero. ClamAV local cuando volumen lo justifique (>10k scans/mes).

---

## 7 · Schemas de base de datos

```sql
CREATE TABLE document_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  module_id VARCHAR(10) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  detection_method VARCHAR(50) NOT NULL, -- 'url_broken', 'mention_no_url', 'llm_detected'
  source_text TEXT,
  source_url VARCHAR(500),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'received', 'processed', 'integrated'
  marked_not_applicable BOOLEAN DEFAULT FALSE,
  marked_at TIMESTAMPTZ,
  digest_count INT DEFAULT 0, -- cuántas veces ha aparecido en digest
  fulfilled_by_document_id UUID -- referencia a tenant_documents cuando se llena
);

CREATE TABLE tenant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  uploaded_by_user_id UUID REFERENCES users(id),
  uploaded_via VARCHAR(20) NOT NULL, -- 'platform_upload', 'email_inbound'
  original_filename VARCHAR(500),
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  storage_url VARCHAR(500),
  document_type VARCHAR(100),
  classified_to_module VARCHAR(10),
  upload_status VARCHAR(20), -- 'received', 'validating', 'extracting', 'integrated', 'failed'
  extracted_text TEXT,
  extracted_text_method VARCHAR(20), -- 'native_pdf', 'tesseract', 'cloud_vision'
  llm_processed BOOLEAN DEFAULT FALSE,
  llm_processing_cost_usd NUMERIC(10,4),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE document_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES tenant_documents(id) NOT NULL,
  module_id VARCHAR(10) NOT NULL,
  field_id VARCHAR(100) NOT NULL,
  extracted_value JSONB NOT NULL,
  extraction_method VARCHAR(20), -- 'regex', 'llm', 'manual'
  literal_citation TEXT, -- obligatoria si extraction_method = 'llm'
  validation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'validated', 'rejected'
  validated_by_user_id UUID,
  validated_at TIMESTAMPTZ
);
```

---

## 8 · Métricas operacionales de ARCHIVO

ARCHIVO reporta semanalmente al founder en módulo A11 (NOUS Insights) de Plataforma 0:

| Métrica | Cálculo | Target |
|---|---|---|
| Documentos procesados/semana | COUNT de tenant_documents | Tendencia creciente |
| Tasa de integración exitosa | processed / received | >85% |
| % de extracciones por código vs LLM | (regex + manual) / total | >80% |
| Costo total LLM/semana | SUM de llm_processing_cost_usd | <$50/semana inicial |
| Tasa de validación humana de extracciones LLM | validated / extracted | >70% |
| Documentos marcados "no aplica" | COUNT WHERE marked_not_applicable | <30% del total |
| Tiempo promedio procesamiento por documento | AVG(processed_at - uploaded_at) | <15 min |
| Tasa de respuesta a digests | docs_received_in_24h_after_digest / docs_requested | >40% |

Si cualquier métrica sale fuera de rango por dos semanas consecutivas, ARCHIVO genera alerta al founder en A11.

---

## 9 · Integración con otros agentes

| Agente | Relación con ARCHIVO |
|---|---|
| **HERMES** | Cuando inferencia inicial falla en obtener un documento, registra el gap. ARCHIVO toma el caso desde ahí. |
| **KRONOS** | Backend de almacenamiento, encolado de jobs, scheduling de digests. ARCHIVO vive en su infraestructura. |
| **AUDITOR** | Verifica trimestralmente que cada extracción de LLM lleva cita literal del documento. Sin cita, rechaza la extracción. |
| **NOUS** | ARCHIVO contribuye datos a las tres capas de aprendizaje. Capa 1: validaciones del cliente de extracciones del LLM. Capa 2: outcomes según calidad de documentos recibidos. Capa 3: divergencia entre cifras inferidas vs cifras extraídas de documentos reales. |
| **MARCOS** | Cuando ARCHIVO extrae artículos de reglamento, MARCOS verifica si aplican algún estándar internacional (GRI, ISO) que deba citarse. |
| **POLIS** | Diseña el banner de gap en módulos, el modal de upload, la UI de validación de extracciones. |
| **EIDOS** | Verifica que el digest semanal mantiene principios editoriales: conclusión primero, sin bloques anidados, lenguaje claro. |

---

## 10 · Gates humanos del founder

**Gate uno.** Aprobación de las fuentes que ARCHIVO acepta como autoridad documental (Periódico Oficial, ASF, Plataforma Nacional de Transparencia, sitios web municipales). Esta lista define qué se acepta automáticamente vs qué requiere revisión.

**Gate dos.** Aprobación del prompt de LLM-1 (extractor de obligaciones legales) antes de procesar el primer documento real. Cada palabra del prompt importa. Una revisión humana en este punto previene meses de extracciones malas.

**Gate tres.** Revisión semanal del reporte de métricas operacionales. Si LLM cost por tenant sale por arriba de $3 USD, founder decide ajustar caps.

**Gate cuatro.** Antes de activar Componente LLM-3 (refinamiento de digest), founder valida que la plantilla determinística no es suficiente. Solo si genuinamente la plantilla falla en casos complejos, se activa LLM.

---

## 11 · Cronograma de implementación

ARCHIVO no entra al MVP de los cinco prompts. Es trabajo del Sprint 2.

| Sprint | Trabajo |
|---|---|
| MVP (semanas 1-2) | Cinco prompts de MVP_CLOSURE_V2. ARCHIVO no se construye aún. |
| Sprint 2 semana 1 | Componentes 1-5 (detección de gaps, routing, validación seguridad) |
| Sprint 2 semana 2 | Componentes 6-9 (extracción de texto, regex de campos) |
| Sprint 2 semana 3 | Componentes 10-12 + LLM-1 + LLM-2 (asignación, límites, extracción con LLM) |
| Sprint 2 semana 4 | UI banner + modal upload + integración Postmark + digest semanal |
| Sprint 2 semana 5 | Testing con SLP + ajustes + métricas a A11 |

Total: 5 semanas de Sprint 2 después de MVP cerrado.

---

## 12 · Criterios binarios de cierre

ARCHIVO está cerrado cuando:

1. Los 12 componentes sin LLM operativos y verificables individualmente.
2. Los 2 componentes con LLM operativos con cap automático de costo por tenant.
3. Postmark Inbound configurado y procesando emails entrantes.
4. Banner de gap visible en módulos cuando aplica.
5. Modal de upload funcional con validación de seguridad.
6. Digest semanal enviándose automáticamente lunes 09:00.
7. Las tres reglas de progresión del digest funcionando.
8. Watermark mostrando porcentaje de validación calculado dinámicamente.
9. Cap de inferencia HERMES por municipio (no por funcionarios) operativo.
10. Métricas operacionales reportadas a A11 cada semana.
11. AUDITOR confirma que cada extracción LLM lleva cita literal del documento.
12. Cero alucinaciones detectadas en muestreo trimestral.

---

## 13 · Riesgos operativos

**Riesgo uno · OCR falla con escaneados de mala calidad.** Documentos municipales viejos a veces son fotos del fax. Tesseract no los procesa. Fallback a Cloud Vision ayuda pero no resuelve todo. Mitigación: si ambos OCR fallan, ARCHIVO marca el documento como "requiere transcripción manual" y notifica al founder.

**Riesgo dos · Alucinaciones del LLM en documentos ambiguos.** Aunque exigimos cita literal, LLM puede generar citas falsas. Mitigación: validación automática que verifica que la cita literal EXISTA en el texto extraído del documento original. Si no existe match exacto, la extracción es rechazada antes de integrarse.

**Riesgo tres · Cliente sube documentos masivos por error.** 50 PDFs de 30 páginas son $30 USD en costo de LLM. Mitigación: cap automático de 10 documentos procesados con LLM por tenant en preliminary. Documentos 11+ se almacenan pero no se procesan automáticamente.

**Riesgo cuatro · Email entrante mal autenticado.** Alguien podría enviar email pretendiendo ser de un funcionario del tenant. Mitigación: validar que el email del remitente está en la lista de usuarios autorizados del tenant. Si no, responder con email pidiendo registro previo.

**Riesgo cinco · Postmark Inbound caído.** Servicio externo puede fallar. Mitigación: si webhook no responde por 60+ segundos, retry automático tres veces. Si todos fallan, alertar al founder. Mensaje al cliente: "Tu email se entregará a procesamiento manual."

**Riesgo seis · Documentos clasificados al módulo equivocado.** Componente 10 mapea por tipo, pero un "reglamento" puede ser de tránsito, no de limpia. Mitigación: cliente valida clasificación sugerida antes de procesamiento completo.

**Riesgo siete · Digest se vuelve spam para el cliente.** Si después de 8 digests el cliente no responde, ARCHIVO pausa automáticamente y notifica al founder para decisión humana sobre cómo proceder con ese cliente.

---

## 14 · Documentos relacionados

- `ADR-0010_stage_based_platform_separation.md`
- `AUTOMATION_AND_PERSONALIZATION_LAYER.md` — HERMES inferencia inicial
- `LEARNING_AND_FEEDBACK_LAYER.md` — NOUS aprendizaje sistémico
- `MVP_CLOSURE_V2.md` — secuencia ejecutable previa a ARCHIVO
- `BILLING_CONTRACTS_LIFECYCLE.md` — estados del tenant que ARCHIVO consulta
- `FIELD_STUDIES_AND_MISSING_KPIS.md` — estudios que requieren documentos del cliente

---

## 15 · Aprobación

```
[ ] Founder · aprobación de filosofía y alcance
[ ] SUPREME · architectural review
[ ] KOSMOS · schema validation
[ ] KRONOS · technical feasibility (componentes 1-12 y LLM-1, LLM-2)
[ ] AUDITOR · validación de citas literales obligatorias
[ ] POLIS · UI banner + modal upload + digest template
[ ] HERMES · coordinación con inferencia inicial
```

Las siete firmas. Sin ellas, ARCHIVO no opera.

---

*ARCHIVO · Agente de documentos y detección de gaps · Alquimia · 29 mayo 2026*
