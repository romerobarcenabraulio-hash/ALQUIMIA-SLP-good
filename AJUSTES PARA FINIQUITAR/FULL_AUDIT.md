# FULL AUDIT · Auditoría pies a cabeza del estado del sistema

**Estado:** Verdad operativa al 30 de mayo 2026
**Propósito:** Documentar honestamente qué tiene, qué le falta, qué hay que ajustar versus la nueva filosofía de cero invención
**Uso:** Founder y PM consultan antes de cualquier sprint para evitar duplicar trabajo o construir cosas que ya existen

---

## Sección 1 · Autenticación

| Componente | Estado | Notas |
|---|---|---|
| Clerk magic link funcional | ✅ Operativo | Cuenta `demo@alquimiaplatform.com` ingresa correctamente |
| TOTP nativo de Clerk | ✅ Disponible | Activable desde perfil del usuario |
| Backup codes para recuperación | ✅ Disponible | El usuario los genera al activar TOTP |
| Twilio SMS legacy | ⚠️ Comentado | Código presente pero inactivo, eliminar a 30 días |
| Filtro institucional automático .gob.mx | ❌ NO existe | Pendiente del MVP_CLOSURE_V2 Prompt 2 |
| Pantalla `/pendiente-validacion` para gmail | ❌ NO existe | Pendiente del MVP_CLOSURE_V2 Prompt 2 |
| Role founder con privilegios especiales | ⚠️ Parcial | Usuario existe en Clerk con metadata, pero middleware no diferencia rutas todavía |
| Switcher admin/cliente en header | ❌ NO existe | Pendiente del SPRINT_POST_AUTH Bloque 1 |

**Ajuste requerido versus nueva filosofía:** ninguno. La capa de auth funciona independiente de la filosofía de datos.

---

## Sección 2 · Página pública (landing)

| Componente | Estado | Notas |
|---|---|---|
| Página `/` raíz | ⚠️ Parcial | Existe pero con copy viejo, no la narrativa nueva |
| Narrativa "súmate al cambio" | ❌ NO implementada | Pendiente del MVP_CLOSURE_V2 Prompt 3 |
| Posicionamiento de plataforma de política pública | ❌ NO implementado | Pendiente |
| Cuña en vivienda en condominio | ❌ NO implementada | Pendiente |
| CTA "Solicitar acceso para mi municipio" | ❌ NO existe | Pendiente |
| Página `/metodologia` | ❌ NO existe | Pendiente del MVP_CLOSURE_V2 Prompt 3 |
| Página `/contact` o `/comenzar` | ❌ NO existe | Pendiente |
| Cero menciones a "demo" en copy público | ❌ NO ajustado | Pendiente |

**Ajuste requerido versus nueva filosofía:** El copy de la landing debe reflejar la filosofía cero invención. Frase para el hero o sección de metodología:

> "Alquimia organiza el diagnóstico de tu municipio con documentos verificables. Cero cifras inventadas. Cada dato citado a su fuente institucional."

---

## Sección 3 · Módulos de Validación (/v)

### 3.1 Estado actual de cada módulo

| Módulo | Estructura | Datos hardcoded | Sección de upload | Criterio de completitud |
|---|---|---|---|---|
| M00 (Cómo leer) | ⚠️ Existe con copy viejo | N/A | N/A | ❌ No definido |
| M00B (Antecedentes) | ⚠️ Estructura parcial | ⚠️ Algunas cifras de SLP hardcoded | ❌ NO existe | ❌ No definido |
| M01 (Diagnóstico) | ✅ Existe con secciones | ⚠️ Cifras SLP hardcoded | ❌ NO existe | ❌ No definido |
| M02 (Mapa social) | ⚠️ Estructura básica | ⚠️ Datos SLP hardcoded | ❌ NO existe | ❌ No definido |
| M03 (Capacidad institucional) | ⚠️ Estructura básica | ⚠️ Datos SLP hardcoded | ❌ NO existe | ❌ No definido |
| M03B (Reforma reglamentaria) | ✅ Existe con propuesta | ⚠️ Datos SLP | ❌ NO existe | ❌ No definido |
| M03B Justificación técnica | ❌ NO restituida | N/A | N/A | Pendiente del SPRINT_POST_AUTH Bloque 3 |
| M04 (Costo de no actuar) | ✅ Existe | ⚠️ Cifras SLP hardcoded | ❌ NO existe | ❌ No definido |
| M13 (Escenarios financieros) | ✅ Existe | ⚠️ Cifras SLP hardcoded | ❌ NO existe | ❌ No definido |
| M14 (Riesgos) | ⚠️ Estructura básica | ⚠️ Datos SLP hardcoded | ❌ NO existe | ❌ No definido |
| M15 (Borrador expediente) | ❌ No existe completo | N/A | N/A | ❌ No definido |

### 3.2 Ajuste requerido versus nueva filosofía

Esto es lo más impactante del audit. Bajo la filosofía nueva, TODOS los módulos requieren refactor:

**Refactor uno · Eliminar cifras hardcoded de SLP.** Cada módulo tiene actualmente cifras del piloto SLP embebidas en el código. Esto debe migrar a tabla `tenant_data` que se llena conforme el cliente sube documentos. SLP como tenant real tiene sus propios datos en la tabla; otros tenants entran vacíos.

**Refactor dos · Agregar sección de upload por módulo.** Cada módulo necesita componente `<DocumentUploadSection>` que muestra qué documentos faltan y permite upload directo desde el módulo. Si Perplexity identificó documentos específicos, aparecen como solicitudes nombradas.

**Refactor tres · Definir criterio de completitud por módulo.** Cada módulo tiene su definición explícita de "está completo cuando..." Esto activa el desbloqueo del siguiente.

**Refactor cuatro · Eliminar gráficas con datos hardcoded.** Cualquier Recharts o componente visual que renderiza datos hardcoded debe pasar a estado vacío hasta que haya datos del tenant.

Estimación de esfuerzo del refactor: cuatro a seis semanas de trabajo distribuido. Esto se prioriza después del SPRINT_POST_AUTH actual.

---

## Sección 4 · Sistema de progresión bloqueada

| Componente | Estado | Notas |
|---|---|---|
| Schema `module_completion_status` en DB | ❌ NO existe | Tabla nueva requerida |
| Lógica de desbloqueo automático | ❌ NO existe | Sidebar debe leer status |
| Sidebar con candados por módulo | ❌ NO existe | UI requiere ajuste |
| Banner de "M00B completo · M01 desbloqueado" | ❌ NO existe | Notificaciones de progreso |
| Pantalla de cierre de Validación cuando M15 completo | ❌ NO existe | Pantalla final con CTA conversación |

**Estimación:** dos a tres semanas de trabajo.

---

## Sección 5 · ARCHIVO bajo nueva filosofía

| Componente | Estado | Notas |
|---|---|---|
| Detector de URLs rotas en Perplexity | ❌ NO existe | Componente código clásico |
| Detector de menciones de documentos | ❌ NO existe | Regex de patrones gubernamentales |
| Sección de upload por módulo | ❌ NO existe | UI bajo cada módulo |
| Procesamiento OCR de PDFs | ❌ NO existe | Tesseract local o Cloud Vision |
| Extracción de texto de PDFs nativos | ❌ NO existe | pdfplumber |
| Integración Postmark Inbound | ❌ NO existe | Servicio externo a configurar |
| Email `documentos@alquimiaplatform.com` | ❌ NO existe | Requiere DNS + Postmark |
| Digest semanal lunes 09:00 | ❌ NO existe | Cron job a construir |
| Tabla `document_gaps` | ❌ NO existe | Schema documentado pero no creado |
| Tabla `tenant_documents` | ❌ NO existe | Schema documentado pero no creado |
| Tabla `document_extractions` | ❌ NO existe | Schema documentado pero no creado |

**Estimación:** cinco a siete semanas de trabajo completo. Crítico para que la filosofía nueva funcione.

---

## Sección 6 · Datos del tenant

| Componente | Estado | Notas |
|---|---|---|
| Tabla `tenants` básica | ⚠️ Existe parcial | Con datos de SLP hardcoded |
| Tabla `tenant_data` separada | ❌ NO existe | Schema nuevo requerido |
| Tabla `tenant_state` con gates | ❌ NO existe | Schema documentado |
| Tabla `tenant_payer_history` | ❌ NO existe | Schema documentado |
| Sandbox Municipio Demo | ❌ NO existe (vacío) | Pendiente, AHORA sin datos por filosofía nueva |
| Pipeline HERMES de inferencia | ❌ NO existe | Bajo filosofía nueva, HERMES solo identifica gaps, no infiere |
| Endpoint `/api/tenants/[id]/data` | ❌ NO existe | API a construir |
| Hook `useTenantData()` en frontend | ❌ NO existe | Componente a construir |

---

## Sección 7 · Plataforma 0 administrativa

| Componente | Estado | Notas |
|---|---|---|
| Ruta `/admin/*` con middleware | ❌ NO existe | Pendiente |
| Pantalla A1 · Dashboard portafolio | ❌ NO existe | Pendiente |
| Pantalla A2 · Gestión tenants | ❌ NO existe | Pendiente |
| Pantalla A3 · Stage transitions con evidencia | ❌ NO existe | Pendiente |
| Pantalla A4 · Capability Registry editor | ❌ NO existe | Pendiente |
| Pantalla A5 · Inbox validaciones (dominios gmail) | ❌ NO existe | Pendiente, crítica para flujo |
| Pantalla A6 · Documentación generada | ❌ NO existe | Pendiente |
| Pantalla A7 · Cross-tenant analytics | ❌ NO existe | Sprint 3+ |
| Pantalla A8 · Billing | ❌ NO existe | Sprint 6 con Stripe |
| Pantalla A9 · Soporte y comunicación | ❌ NO existe | Sprint 3 |
| Pantalla A10 · Contratos Mifiel | ❌ NO existe | Sprint 6 |
| Pantalla A11 · NOUS Insights | ❌ NO existe | Mes 4-6 |
| Pantalla A12 · Cumplimiento de estándares | ❌ NO existe | Sprint 5 |

---

## Sección 8 · Diagramas operativos

| Componente | Estado | Notas |
|---|---|---|
| Diagrama M01 · Sankey de flujo de residuos | ❌ NO existe | Brief documentado, código no |
| Diagrama M04 · Árbol de decisión actuar vs no | ❌ NO existe | Brief documentado |
| Diagrama M13 · Comparativo de escenarios | ❌ NO existe | Brief documentado |
| Diagrama M14 · Matriz probabilidad-impacto | ❌ NO existe | Brief documentado |
| Diagrama M21 · Gantt del programa | ❌ NO existe | Brief documentado |
| Sistema de generación dinámica con datos del tenant | ❌ NO existe | Sprint 5 |

**Ajuste versus nueva filosofía:** los diagramas solo se generan cuando hay datos reales del tenant para visualizar. Bajo la filosofía nueva, esto significa que se construyen DESPUÉS de que un cliente real completa módulos con sus datos. Estimación: Sprint 5+.

---

## Sección 9 · Sistema de citado bibliográfico

| Componente | Estado | Notas |
|---|---|---|
| Componente `<Citation />` | ❌ NO existe | A construir |
| Metadata de fuente por DataPoint | ❌ NO existe | Schema a definir |
| Generador de bibliografía al exportar | ❌ NO existe | Sprint 5 |
| Footnote rendering en PDF | ❌ NO existe | Sprint 5 |

**Ajuste versus nueva filosofía:** crítico. Bajo cero invención, cada cifra debe llevar cita. El componente y la metadata son requisitos base, no decoración.

---

## Sección 10 · Generación de documentos exportables

| Componente | Estado | Notas |
|---|---|---|
| Export individual de módulos a PDF | ⚠️ Parcial | Funciona con datos hardcoded de SLP |
| Watermark dinámico con porcentaje | ❌ NO existe | Pendiente |
| ZIP encriptado con contraseña separada | ❌ NO existe | Pendiente del MVP_CLOSURE_V2 Prompt 5 |
| Email con link al ZIP | ❌ NO existe | Pendiente |
| Email separado con contraseña | ❌ NO existe | Pendiente |
| Generador de expediente Cabildo M15 | ❌ NO existe | Pendiente, compila M00-M14 |
| Bibliografía automática al final | ❌ NO existe | Sprint 5 |

**Ajuste versus nueva filosofía:** el watermark cambia de "% validado" a "N de M módulos completos." El expediente Cabildo solo se puede exportar cuando todos los módulos previos están completos, no antes.

---

## Sección 11 · Sistema de pagos y contratos

| Componente | Estado | Notas |
|---|---|---|
| Integración Stripe | ❌ NO existe | Sprint 6 |
| Integración Facturapi (CFDI) | ❌ NO existe | Sprint 6 |
| Integración Mifiel (firma electrónica) | ❌ NO existe | Sprint 6 |
| Modelo de payer variable | ❌ NO existe | Schema documentado, código no |
| Webhook de Stripe a Clerk | ❌ NO existe | Sprint 6 |
| Bypass automático para role founder | ❌ NO existe | Sprint 6 |

**Estimación:** dos a tres semanas de trabajo dedicado.

---

## Sección 12 · Configuración operativa (acciones del founder)

| Acción | Estado | Bloquea qué |
|---|---|---|
| Comprar Google Workspace ($6/mes) | ❌ Pendiente | Email institucional `founder@dominio.mx` |
| Configurar DNS para dominio actual | ❌ Pendiente | Postmark Inbound |
| Configurar Postmark Inbound ($15/mes) | ❌ Pendiente | ARCHIVO recibir documentos |
| Obtener API key Perplexity | ⚠️ Existe en .env pero sin uso | Detección de gaps por ARCHIVO |
| Crear cuenta Clerk con TOTP | ✅ Hecho | N/A |
| Resolver tema marca registrada | ❌ Pendiente | Primer contrato comercial |
| Búsqueda nombre alternativo IMPI | ❌ Pendiente | Bloqueo de venta seria |
| Compra de dominio nuevo cuando se decida nombre | ❌ Pendiente | Migración de plataforma a dominio nuevo |

---

## Sección 13 · Plan de ajuste secuencial

Bajo la filosofía nueva, el orden de construcción se ajusta:

**Sprint 1 (esta semana, 30 mayo - 5 junio)**
- Cerrar SPRINT_POST_AUTH ajustado: switcher admin/cliente, Municipio Demo VACÍO (no precargado), M03B justificación restituida, revisión visual.
- Definir y publicar nueva filosofía en `/metodologia` (página simple sin diseño elaborado).

**Sprint 2 (semana del 9 al 13 junio)**
- Refactor de módulos pilar para eliminar cifras hardcoded de SLP.
- Construir schema `tenant_data` con su API y hook frontend.
- Construir sección `<DocumentUploadSection>` reutilizable por módulo.
- Definir criterios de completitud por módulo.

**Sprint 3 (semana del 16 al 20 junio)**
- Sistema de progresión bloqueada: schema, lógica de desbloqueo, sidebar con candados.
- Pantalla A5 de Plataforma 0 para inbox de validaciones manuales.
- Configuración Postmark Inbound y email `documentos@dominio.mx`.

**Sprint 4 (semana del 23 al 27 junio)**
- ARCHIVO componentes base: detector de gaps, procesamiento OCR, integración.
- Tablas `document_gaps`, `tenant_documents`, `document_extractions`.
- Digest semanal funcional.

**Sprint 5 (mes 2)**
- Componente Citation con metadata de fuentes.
- Generador de bibliografía automática.
- AUDITOR expandido con compliance checks.
- Pantalla A12 de cumplimiento.
- Primeros diagramas dinámicos con datos reales de SLP que para entonces ya completó módulos.

**Sprint 6 (mes 2-3)**
- Integración Stripe + Facturapi + Mifiel.
- Plataforma 0 completa A1-A10.
- Watermark de progreso institucional.
- ZIP exportable con contraseña separada.

**Mes 4+**
- NOUS agente de aprendizaje (cuando haya 3+ clientes).
- Programa de partners (cuando haya 3 contratos directos firmados).

---

## Sección 14 · Lo que NO entra al roadmap, por filosofía explícita

| Petición | Razón de exclusión |
|---|---|
| Embeber circularidad de México | Cero invención · solo datos del cliente |
| Inferir rutas automáticamente | Requiere datos GPS del cliente concesionario |
| Precargar cifras por benchmarks | Filosofía cero invención |
| Generar gráficas con datos hipotéticos | Cero invención visual |
| Auto-completar módulos | El usuario es quien aporta documentos |
| Sistema "investiga las ciudades" | Perplexity identifica gaps, el usuario los llena |

---

## Sección 15 · Métricas de avance del proyecto

Para los próximos 90 días, las cuatro métricas que importan:

**Métrica uno · Módulos refactorizados a la nueva filosofía.** Hoy: 0 de 23. Target a 90 días: 10 (los de Validación).

**Métrica dos · Documentos institucionales requeridos definidos por módulo.** Hoy: 0. Target a 90 días: 23 módulos con sus listas de documentos requeridos publicadas.

**Métrica tres · Contratos directos firmados.** Hoy: 0. Target a 90 días: 1-3.

**Métrica cuatro · Documentos reales subidos por clientes.** Hoy: 0. Target a 90 días: al menos 30 documentos de SLP o primer cliente nuevo procesados por ARCHIVO.

---

*FULL AUDIT · Alquimia · 30 mayo 2026 · Revisión obligatoria cada lunes*
