# ADMIN MASTER TABLE SPEC · Tabla maestra ERP del administrador

**Estado:** Spec operativo · Pendiente de implementación
**Fecha:** 30 mayo 2026
**Ruta:** `/admin/tenants` (pantalla A2 de Plataforma 0)
**Audiencia:** founder en vista administrativa
**Propósito:** una sola pantalla donde operar el día a día con todos los tenants

---

## Filosofía de la tabla

Esta es la pantalla donde el founder vive. No es dashboard de KPIs (ese es A1). No es Plataforma 0 completa (esa son 12 pantallas). Es la tabla operativa tipo ERP donde el founder ve cada cliente con todo su estado, identifica qué requiere acción inmediata, y ejecuta esa acción sin salirse de la tabla.

Tres principios:
- Una fila por tenant. Cero excepciones.
- Toda acción crítica accesible desde la fila o desde drawer expandible. Sin clicks fuera de la tabla para acciones del día a día.
- Performance crítica. Con 100+ tenants no debe trabarse. Virtualización de filas si pasa de 50.

---

## Columnas fijas universales

Estas columnas aparecen para TODOS los tenants sin excepción. Son las que el founder ve siempre. Son 12 columnas.

### Columna 1 · Municipio

**Contenido:** nombre del municipio, estado, clave INEGI debajo en gris.
**Width:** 200 px.
**Sortable:** sí (alfabético).
**Filtrable:** sí (búsqueda por texto).
**Click action:** abre drawer lateral con vista completa del tenant.

Visual:
```
San Luis Potosí Capital
SLP · INEGI 24028
```

### Columna 2 · Etapa y gate

**Contenido:** badge con etapa actual + gate vigente.
**Width:** 120 px.
**Sortable:** sí (por orden de etapa).
**Filtrable:** sí (dropdown: Bienvenida / Validación / Planeación / Ejecución / Suspendido / Cerrado).

Visual con código de color:
```
[Validación] G0
[Planeación] G1
[Ejecución] G2
```

Colores: Validación azul, Planeación amarillo, Ejecución verde sage, Suspendido gris, Cerrado rojo.

### Columna 3 · Usuarios registrados

**Contenido:** número de emails activos del tenant + lista expandible.
**Width:** 140 px.
**Sortable:** sí (por cantidad).

Visual:
```
3 usuarios ▼
```

Click expande mini-lista con foto, nombre, cargo, último login de cada uno. Botón "Invitar nuevo" si founder quiere agregar manualmente.

### Columna 4 · Días en etapa actual

**Contenido:** días transcurridos desde que el tenant entró a la etapa vigente.
**Width:** 100 px.
**Sortable:** sí. Por default ordena descendente.
**Filtrable:** sí (rangos: <7, 7-30, 31-60, 61-90, >90 días).

Visual con código de urgencia:
- Verde si está dentro de tiempo esperado para la etapa
- Amarillo si está en zona de atención
- Rojo si está estancado más de 90 días

### Columna 5 · Avance de validación

**Contenido:** porcentaje de módulos completos + barra de progreso visual.
**Width:** 140 px.
**Sortable:** sí.

Visual:
```
3/10 ███░░░░░░░ 30%
```

Hover muestra qué módulos están completos y cuáles pendientes.

### Columna 6 · Documentos solicitados

**Contenido:** contador agregado de documentos pedidos vs entregados.
**Width:** 120 px.
**Sortable:** sí.

Visual:
```
4 / 12 entregados
```

Hover muestra lista corta de los 3 documentos más críticos pendientes.

### Columna 7 · HERMES corrida

**Contenido:** si la corrida automática de identificación de gaps ya se ejecutó para este municipio.
**Width:** 110 px.

Visual:
- `✓ Hecha · 15 may` (en verde sage) si ya corrió
- `Pendiente` (en amarillo) si está por correr
- `Errores · revisar` (en rojo) si falló

Click abre modal con el log de la corrida y botón "Re-ejecutar" (con audit log).

### Columna 8 · Facturado

**Contenido:** estado del CFDI vigente para el contrato activo.
**Width:** 130 px.
**Filtrable:** sí (Sin facturar / CFDI pendiente / Facturado vigente / Facturado parcial / Cancelado).

Estados:
- ⚪ **Sin facturar** · cliente sin CFDI emitido todavía
- 🟡 **CFDI pendiente** · cobro recibido, CFDI por emitir (urgente, riesgo SAT)
- 🟢 **Facturado vigente** · CFDI emitido y vigente con el SAT
- 🟠 **Facturado parcial** · varios CFDIs para mismo contrato, pendientes
- 🔴 **Cancelado** · CFDI cancelado con motivo SAT (mostrar motivo en hover)

Hover muestra: número de CFDI, UUID SAT, fecha de emisión, monto neto, IVA, total, método de pago declarado (PUE/PPD), uso del CFDI (G03/P01).

### Columna 9 · Pagado

**Contenido:** estado del cobro vigente independiente de facturación.
**Width:** 130 px.
**Filtrable:** sí (Sin cobrar / Próximo cobro / Pagado completo / Pagado parcial / Vencido / Disputa).

Estados:
- ⚪ **Sin cobrar** · sin intento de cobro todavía
- 🔵 **Próximo cobro** · agendado en los próximos 7 días
- 🟢 **Pagado completo** · cobro exitoso, monto íntegro recibido
- 🟡 **Pagado parcial** · pago en parcialidades activo (PPD), N de M cubiertas
- 🔴 **Vencido** · debió cobrarse, falló o sin movimiento (días vencido en hover)
- ⚫ **Disputa o reembolso** · chargeback de Stripe en curso

Hover muestra: monto cobrado, fecha de cobro, método (Stripe/transferencia/cheque), referencia, saldo pendiente si aplica.

### Columna 10 · Última actividad del cliente

**Contenido:** fecha del último login + acción del cliente en la plataforma.
**Width:** 140 px.
**Sortable:** sí (por recencia).

Visual:
```
Hace 2 días
Subió documento
```

### Columna 11 · Próxima acción del founder

**Contenido:** acción asignada al founder para este tenant.
**Width:** 200 px.
**Filtrable:** sí (mostrar solo "Mi acción pendiente").
**Editable inline:** sí.

Visual:
```
Revisar reglamento
subido 30 may
```

Si está vacío, muestra "—" en gris.

### Columna 12 · Acciones rápidas

**Contenido:** botones de acción inmediata desde la fila.
**Width:** 180 px.

Botones:
- 👁 Ver como (asumir identidad temporal con audit log)
- 📤 Exportar (genera ZIP del estado actual)
- 💬 Mensaje (envía email al primary user)
- ⋮ Más (abre menú con acciones secundarias)

Acciones secundarias en el menú "Más":
- Editar metadatos del tenant
- Re-correr HERMES
- Cambiar gate manualmente (con justificación)
- Suspender tenant
- Cerrar tenant
- Ver audit log

---

## Columnas dinámicas por municipio (lo que pediste)

Cada municipio tiene contexto único. HERMES y Perplexity identifican qué documentos institucionales adicionales son relevantes para ESE municipio específicamente, no aplicables a todos.

Ejemplo: si el municipio tiene río que cruza zona urbana, agrega columna "Manifestación de impacto · Río [Nombre]." Si tiene laguna, agrega "Plan de manejo · Laguna [Nombre]." Si tiene parque industrial, agrega "Convenio con parque industrial." Si tiene Pueblo Mágico, agrega "Programa de turismo sustentable."

**Cómo funciona técnicamente:**

Las columnas dinámicas se materializan como una sub-tabla anidada accesible desde la columna "Documentos solicitados." NO van como columnas planas en la tabla principal porque romperían el layout con 30+ tenants y documentos distintos.

Pero hay una forma de tener ambas vistas: vista compacta (default) y vista expandida (toggle).

**Vista compacta (default):**
Tabla principal con las 11 columnas universales. La columna 6 "Documentos solicitados" muestra agregado.

**Vista expandida (toggle):**
Click en "Documentos" en el toolbar superior. La tabla se reformula mostrando una columna por cada documento universal (9 documentos del Stack Básico Institucional). Los documentos específicos del municipio se acceden desde el drawer del tenant.

Layout de vista expandida:
```
| Municipio | Etapa | Reglamento | PMD | Acta Cabildo | Manual Org | Concesión RSU | NOM-083 Cumplido | Cuarteo NMX-AA-015 | Cuenta Pública | Calif Crediticia | + docs específicos ▼ |
| SLP       | V·G0  | ✅         | ✅  | ⏳            | ❌          | N/A           | ⚠️                | ❌                  | ✅              | ✅ HR Rating BB+ | 3 docs específicos    |
```

Sellos visuales en cada celda:
- ✅ Entregado y validado (verde)
- ⏳ Entregado, pendiente de validación de founder (amarillo)
- ❌ Pendiente de cliente (gris)
- ⚠️ Entregado pero con observaciones (naranja)
- 🔒 No aplica al municipio (gris claro tachado)
- 🤖 Identificado por Perplexity, esperando upload del founder (azul)

### Tu workflow específico: alimentar PDFs manualmente desde antes

Esto es importante porque mencionaste explícitamente "manualmente ir alimentando los PDFs, eso es obligatorio."

**Cómo funciona el upload manual del founder:**

Click en cualquier celda con estado ❌ o 🤖 abre modal de upload directo:

```
┌─────────────────────────────────────────────────────┐
│ Subir documento · [Reglamento de Limpia]            │
│ Municipio: San Luis Potosí Capital                  │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │  📎 Arrastra el PDF o haz click             │     │
│ │     Tamaño máximo: 50 MB                    │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ Fuente del documento:                               │
│ ( ) Lo aporté yo desde investigación previa         │
│ ( ) Lo aportó el cliente por email                  │
│ ( ) Identificado vía Perplexity y descargado        │
│                                                     │
│ Notas internas (no visibles al cliente):            │
│ [_____________________________________________]     │
│                                                     │
│ [Cancelar]              [Subir y procesar] →        │
└─────────────────────────────────────────────────────┘
```

Después del upload, ARCHIVO procesa automáticamente:
- OCR si el PDF es escaneado
- Extracción de texto si es nativo
- Identificación de cifras citables
- Sugerencia de integración a módulos específicos

El founder revisa la sugerencia antes de que la cifra se integre al tenant. Esto preserva la filosofía cero invención: aun el upload del founder pasa por validación.

---

## Filtros del toolbar superior

```
┌─────────────────────────────────────────────────────────────────────┐
│  Buscar [____________]  Etapa [▼]  Pago [▼]  Acción [▼]  Vista [▼] │
│  📋 Mis pendientes  🔴 Urgentes  ⏰ Vencidos  ★ Favoritos          │
└─────────────────────────────────────────────────────────────────────┘
```

Filtros rápidos preconfigurados:
- **Mis pendientes:** tenants donde la columna 10 ("Próxima acción del founder") no está vacía
- **Urgentes:** días en etapa > 60 + acción pendiente del founder
- **Vencidos:** pagos vencidos O documentos solicitados hace >30 días sin entregar
- **Favoritos:** tenants marcados con estrella por el founder

Búsqueda por texto: busca en municipio, estado, clave INEGI, nombres de usuarios, notas internas.

---

## Drawer expandible del tenant

Click en el nombre del municipio o en la fila completa abre drawer lateral con vista detallada. NO navega a otra pantalla; queda overlay encima de la tabla.

**Contenido del drawer (7 sub-pestañas):**

**Sub-pestaña 1 · Resumen.**
Datos básicos del tenant, todos los campos universales en vista detallada, foto del municipio si aplica.

**Sub-pestaña 2 · Documentos.**
Lista completa de documentos universales + específicos del municipio. Cada uno con su estado, fecha de upload si aplica, link a preview del PDF, botón de re-subir, botón de marcar como no aplica.

**Sub-pestaña 3 · Usuarios.**
Lista expandida de usuarios del tenant. Foto, nombre, cargo, email, fecha de registro, último login, role. Botón "Invitar nuevo." Para cada usuario: botón "Asumir identidad temporal con audit log."

**Sub-pestaña 4 · Avance por módulo.**
Lista de M00 a M15 con su status, fecha de completitud, cifras integradas, sellos visibles. Click en módulo abre vista de las cifras de ese módulo con sus citas.

**Sub-pestaña 5 · Comercial.**
Contratos firmados con Mifiel, CFDIs emitidos con Facturapi, próximos cobros, historial de pagos. Botones para gestionar manualmente cada elemento.

**Sub-pestaña 6 · Notas y comunicación.**
Notas internas del founder sobre el tenant (no visibles al cliente). Historial de emails enviados al cliente. Conversaciones registradas. Próximos compromisos.

**Sub-pestaña 7 · Audit log.**
Registro completo de todo lo ocurrido en el tenant: logins de usuarios, uploads de documentos, exportaciones, identidades asumidas por el founder, cambios de etapa, modificaciones manuales.

---

## Workflows operativos comunes

Tres flujos que el founder ejecutará varias veces al día:

**Flujo A · Subir documento que recibí por email del cliente.**
1. Encontrar el tenant en la tabla (búsqueda o filtro).
2. Click en celda del documento correspondiente (columna dinámica).
3. Modal de upload aparece.
4. Drag-drop del PDF.
5. Selecciona "Lo aportó el cliente por email."
6. Click "Subir y procesar."
7. ARCHIVO procesa. Founder ve sugerencia de integración.
8. Aprueba o ajusta.
9. Cierra modal. Vuelve a tabla.

Tiempo total: 60-90 segundos por documento.

**Flujo B · Revisar urgentes del día.**
1. Click en filtro rápido "Urgentes" o "Mis pendientes."
2. Tabla se filtra a tenants con acción pendiente del founder.
3. Por cada tenant: click en fila, drawer abre, revisa pendiente, ejecuta acción.
4. Cierra drawer, pasa al siguiente.

Tiempo total: 10-15 minutos diarios para 5-10 tenants activos.

**Flujo C · Demo a prospecto sin contratar todavía.**
1. Click en acción rápida "Ver como" del Municipio Demo o cliente que autorizó demo.
2. Sistema entra en modo "Asumir identidad temporal."
3. Banner amber permanente: "Vista demo · Municipio Demo · Salir."
4. Founder navega como si fuera ese cliente.
5. Click en "Salir" regresa a tabla A2.

Tiempo total: tiempo que dure la demo (30-45 minutos típicamente).

---

## Performance y escalabilidad

Con 5 tenants: tabla render instantánea, sin optimizaciones requeridas.

Con 50 tenants: virtualización de filas con `react-window` o `tanstack-table virtualization`. Solo renderizar las filas visibles en viewport.

Con 500 tenants: paginación server-side. Default 25 filas por página, configurable. Búsqueda y filtros ejecutados en backend con índices PostgreSQL.

Con 5,000+ tenants: este es el target de mediano plazo. Requiere reorganización: vistas guardadas por el founder, dashboard con drill-down, filtros pre-computados. Sprint 10+.

---

## Integración con resto del sistema

**Lectura desde:**
- Tabla `tenants` (datos básicos)
- Tabla `tenant_state` (etapa y gate)
- Tabla `users` con filter `tenant_id` (usuarios registrados)
- Tabla `tenant_data` (cifras integradas)
- Tabla `document_gaps` (documentos solicitados)
- Tabla `tenant_documents` (documentos subidos)
- Tabla `payments_log` + Stripe API (estado de pago)
- Tabla `audit_log` (última actividad)
- Tabla `founder_actions` (próximas acciones del founder)

**Escritura a:**
- Tabla `tenant_documents` (uploads del founder)
- Tabla `audit_log` (cada acción del founder queda registrada)
- Tabla `founder_notes` (notas internas no visibles al cliente)
- Tabla `founder_actions` (cuando founder ajusta su próxima acción)

**APIs externas:**
- Mifiel (estado de firma de contratos)
- Facturapi (estado de CFDIs)
- Stripe (estado de cobros)
- Perplexity (identificación de gaps documentales)

---

## Exportación de la tabla completa

Botón en toolbar: "Exportar tabla a Excel."

Genera archivo `.xlsx` con todas las columnas universales + columnas específicas como hojas adicionales por tenant. Útil para reportes a inversionistas, juntas de gobierno corporativo, o backup local.

---

## Estados visuales especiales

**Tenant nuevo (recién registrado):**
- Fila con borde izquierdo azul
- Badge "NUEVO" en columna Municipio
- Toda la columna HERMES en amarillo "Pendiente"

**Tenant en riesgo de churn:**
- Fila con tinte rojo suave de fondo
- Disparador: días en etapa > 90 + cero actividad cliente últimos 30 días + pago vencido

**Tenant VIP (acordado con founder):**
- Estrella amarilla al lado del nombre
- Prioridad de notificación al founder cuando hay actividad

---

## What else · Lo que pediste implícitamente que añada

Esta es la parte de tu pregunta "what else." Aquí está lo que no mencionaste pero vas a necesitar:

### Necesitas columna de "Días sin actividad del cliente"

Diferente a "Días en etapa actual." Mide cuántos días desde el último login del cliente. Indicador temprano de churn.

### Necesitas columna de "Origen del lead"

Cómo llegó este tenant. Opciones: cold outreach del founder, referido por otro cliente, prensa, búsqueda orgánica, evento, partner. Crítico para tu estrategia comercial.

### Necesitas columna de "Probabilidad de conversión"

Para tenants en etapa Bienvenida o Validación que aún no han firmado contrato. Tu estimación subjetiva 1-5 estrellas. Te ayuda a priorizar a quién dedicar tiempo.

### Necesitas columna de "Métricas de uso"

Pequeño sparkline horizontal mostrando actividad del cliente las últimas 4 semanas. Picos vs valles. Si hay tendencia a bajar, alerta.

### Necesitas columna de "Documentos generados (exports)"

Cuántos ZIPs ha generado el cliente. Indicador fuerte de uso real vs solo exploración.

### Necesitas columna oculta de "Notas internas resumidas"

No siempre visible para no saturar. Toggle desde toolbar. Cuando se activa, agrega columna ancha con las últimas 2-3 notas internas del founder sobre cada tenant.

### Necesitas vista "Línea de tiempo" alternativa

Toggle en toolbar entre vista tabla y vista cronológica. La cronológica muestra eventos del día/semana ordenados por fecha (uploads, logins, exports, pagos) en lugar de por tenant. Útil para auditar lo que pasó hoy en todo el portafolio.

### Necesitas columna de "Siguiente cobro programado"

Diferente a "Estado de pago." Esta muestra fecha del próximo cobro programado independiente de si está al corriente. Te permite saber con anticipación cuándo el sistema intentará cobrar.

### Necesitas columna de "Cumplimiento de SLA del founder"

Auto-medida. Si te comprometiste a responder en X tiempo y tardaste más, queda registrado. Te obliga a tomar consciencia de tu propia capacidad.

### Necesitas integración con calendario

Las próximas acciones del founder (columna 10) se sincronizan con Google Calendar o iCal. Cuando agendas reunión con un cliente desde la tabla, se crea evento en tu calendario automáticamente.

### Necesitas alertas configurables

Tipo IFTTT mini: "Si pago vencido > 14 días → notifícame por email." "Si documento no entregado > 21 días → notifícame por WhatsApp cuando lo configures." Configurables por el founder desde toolbar.

### Necesitas vista mobile mínima

Cuando estás en junta de Cabildo o reunión, abrir la tabla en celular. Vista responsive con columnas críticas únicamente: Municipio, Etapa, Próxima acción, Acción rápida. El resto colapsado.

---

## Sistema fiscal mexicano integrado · Facturado y Pagado separados

Las columnas 8 y 9 reflejan dos ciclos paralelos pero independientes que la operación fiscal en México requiere distinguir. Esta sección detalla cómo se sostienen.

### Matriz de los cuatro estados combinados

| Facturado | Pagado | Significado | Acción del founder |
|---|---|---|---|
| 🟢 Sí | 🟢 Sí | Ciclo cerrado | Nada, todo bien |
| 🟢 Sí | 🔴 No | Cuenta por cobrar | Cobranza activa |
| 🟡 No | 🟢 Sí | ⚠️ Riesgo SAT | Emitir CFDI urgente, antes de fin de mes |
| ⚪ No | ⚪ No | Lead o propuesta sin cerrar | Push comercial |

La combinación crítica es la tercera. En México, si recibes cobro y no emites CFDI dentro del mes, te expones a multa del SAT por omisión de comprobante fiscal. Por eso esa celda lleva indicador visual rojo y alerta automática del sistema al founder.

### Workflow operativo automatizado

**Trigger 1 · Firma de contrato Mifiel.**
Cuando cliente firma contrato vía Mifiel webhook, el sistema crea registros en tabla `payment_schedule` con fechas de cobro programadas según términos del contrato (mensual, único, milestone). Cada registro queda como ⚪ "Sin cobrar."

**Trigger 2 · Stripe procesa cobro exitoso.**
Cuando Stripe confirma cobro vía webhook, el sistema marca la fila en columna Pagado como 🟢 "Pagado completo" y dispara automáticamente solicitud a Facturapi para emitir CFDI con los datos del cliente.

**Trigger 3 · Facturapi confirma CFDI emitido.**
Cuando Facturapi confirma emisión exitosa, el sistema marca columna Facturado como 🟢. Envía PDF y XML al email del primary user del tenant. Registra UUID del CFDI vinculado al cobro de Stripe en tabla `invoices_cfdi`.

**Trigger 4 · Pago llega sin CFDI emitido (manual).**
Si el founder registra pago manual por transferencia o cheque, el sistema marca columna Pagado como 🟢 pero columna Facturado queda 🟡 "CFDI pendiente." Alerta automática al founder: "Cobro registrado sin CFDI. Emitir antes de [fecha límite del mes]."

**Trigger 5 · Cobro vencido más de N días.**
Si una fecha programada de cobro pasa sin éxito (Stripe falla 3 intentos o no se registra pago manual), el sistema marca columna Pagado como 🔴 "Vencido" con contador de días. Email automático al cliente y al founder.

### Compliance fiscal mexicano básico que el sistema respeta

**Uno · CFDI 4.0 con uso correcto.**
Toda factura emitida lleva CFDI versión 4.0 con uso según tipo de servicio (G03 Gastos en general para consultoría, P01 Por definir si cliente no especifica). Régimen fiscal del receptor obligatorio.

**Dos · Método de pago PUE vs PPD.**
PUE (Pago en Una sola Exhibición) cuando el cobro se hace al momento de emitir el CFDI. PPD (Pago en Parcialidades o Diferido) cuando el cobro será posterior. Esto cambia la estructura del CFDI y requiere complemento de pagos por cada parcialidad.

**Tres · Retención de ISR 1.25% si aplica.**
Cuando el cliente es persona moral y Alquimia opera como persona física con actividad empresarial, el cliente puede retener 1.25% de ISR. El sistema permite capturar esta retención en el CFDI.

**Cuatro · Cancelación con motivo SAT.**
Si un CFDI se cancela, lleva motivo según catálogo SAT (01 Comprobante emitido con errores con relación, 02 Comprobante emitido con errores sin relación, 03 No se llevó a cabo la operación, 04 Operación nominativa relacionada en factura global). El sistema documenta el motivo y queda en audit log.

**Cinco · Vínculo Mifiel ↔ Stripe ↔ Facturapi.**
Cada CFDI lleva referencia al contrato Mifiel que lo originó y al cobro Stripe (o transferencia manual) que lo respalda. Esto es el soporte documental ante auditoría del SAT. Sin estas tres piezas vinculadas, una auditoría te observa.

### Schema de tablas separadas en DB

```
payment_schedule
  - id (uuid)
  - tenant_id (fk)
  - contract_mifiel_id (fk a mifiel_contracts)
  - due_date (timestamp)
  - amount_mxn (decimal)
  - concept (text)
  - status (enum: pending, attempted, paid, failed, cancelled)
  - created_at, updated_at

payments_log
  - id (uuid)
  - tenant_id (fk)
  - payment_schedule_id (fk, nullable si pago no programado)
  - method (enum: stripe, transferencia, cheque, otro)
  - amount_mxn (decimal)
  - currency (default: MXN)
  - stripe_payment_intent_id (nullable)
  - bank_reference (nullable, para transferencia/cheque)
  - paid_at (timestamp)
  - registered_by (user_id, founder en pagos manuales)
  - notes (text, internas del founder)

invoices_cfdi
  - id (uuid)
  - tenant_id (fk)
  - payment_log_id (fk al cobro que respalda)
  - contract_mifiel_id (fk al contrato origen)
  - cfdi_uuid_sat (string, UUID que da el SAT)
  - cfdi_serie, cfdi_folio
  - facturapi_id (string, id en Facturapi)
  - amount_neto, amount_iva, amount_total (decimals)
  - uso_cfdi (string: G03, P01, etc.)
  - metodo_pago (enum: PUE, PPD)
  - issued_at (timestamp)
  - pdf_url, xml_url (storage)
  - status (enum: vigente, cancelado)

cfdi_cancellations
  - id (uuid)
  - invoice_cfdi_id (fk)
  - motivo_sat (enum: 01, 02, 03, 04)
  - related_uuid (nullable, si motivo es 01 o 04)
  - cancelled_at (timestamp)
  - cancelled_by (user_id, founder)
  - sat_response (json, respuesta del PAC)
```

### Webhooks que el PM debe construir

```
POST /api/webhooks/mifiel
  → al firmar contrato, crear payment_schedule

POST /api/webhooks/stripe
  → al confirmar cobro, registrar payments_log y disparar Facturapi

POST /api/webhooks/facturapi
  → al confirmar emisión, registrar invoices_cfdi
```

### Alertas automáticas configurables

- **Diaria 09:00:** cobros vencidos más de 7 días, notificar al founder por email
- **Semanal lunes 09:00:** CFDIs pendientes de emitir, lista detallada al founder
- **Mensual día 28:** cierre fiscal del mes, verificar que todos los pagos del mes tengan CFDI emitido el día 1 del mes siguiente o antes
- **Trimestral:** reporte de operaciones para declaración provisional ISR

---

## Cronograma de implementación


**Sprint 2 (semana del 9 al 13 junio):**
- Estructura base de la tabla con columnas 1-6 (Municipio, Etapa, Usuarios, Días, Avance, Documentos)
- Filtros básicos por etapa
- Drawer expandible con sub-pestaña 1 (Resumen)

**Sprint 3 (semana del 16 al 20 junio):**
- Columna 7 (HERMES), columna 10 (Última actividad), columna 11 (Próxima acción founder)
- Filtros rápidos preconfigurados
- Drawer sub-pestañas 2-3 (Documentos, Usuarios)
- Modal de upload manual de PDFs con flujo del founder

**Sprint 4 (semana del 23 al 27 junio):**
- Columna 12 (Acciones rápidas) con "Ver como" y "Mensaje"
- Vista expandida con documentos universales
- Columnas específicas por municipio
- Drawer sub-pestaña 4 (Avance por módulo)

**Sprint 5 (mes 2):**
- Drawer sub-pestañas 6-7 (Notas y audit log)
- Las columnas "What else" priorizadas (origen del lead, probabilidad, métricas de uso)
- Vista línea de tiempo alternativa
- Exportación a Excel

**Sprint 6 (mes 2-3) · Sistema fiscal y comercial:**
- Columnas 8 (Facturado) y 9 (Pagado) con sistema fiscal integrado
- Schema de tablas fiscales: `payment_schedule`, `payments_log`, `invoices_cfdi`, `cfdi_cancellations`
- Tres webhooks operativos: Mifiel, Stripe, Facturapi
- Drawer sub-pestaña 5 (Comercial) con vista completa de contratos y CFDIs
- Alertas configurables fiscales (diaria, semanal, mensual, trimestral)
- Integración con Google Calendar
- Vista mobile responsive
- Performance optimizaciones para 50+ tenants

---

## Criterio binario de cierre del componente

La tabla está completa cuando:

1. Founder ve todos sus tenants en una sola pantalla
2. Cada tenant tiene las 12 columnas universales pobladas correctamente
3. Founder puede subir PDFs manualmente desde la celda del documento
4. ARCHIVO procesa el upload y sugiere integración
5. Founder puede asumir identidad de cualquier tenant con audit log
6. Filtros rápidos funcionan ("Mis pendientes," "Urgentes," "Vencidos")
7. Drawer expandible muestra las 7 sub-pestañas
8. Exportación a Excel funciona
9. Tabla se renderiza en menos de 2 segundos con 50 tenants
10. Audit log registra cada acción del founder en la tabla
11. Columnas Facturado y Pagado reflejan estado correcto desde webhooks Mifiel/Stripe/Facturapi
12. Combinación crítica "Pagado sin facturar" dispara alerta automática antes de fin de mes

---

*ADMIN MASTER TABLE SPEC · Alquimia · 30 mayo 2026*
