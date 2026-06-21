# USER PROFILE SPEC · Vista del funcionario sobre sí mismo

**Estado:** Spec operativo · Pendiente de implementación
**Fecha:** 30 mayo 2026
**Ruta:** `/perfil` (accesible desde dropdown del UserButton en header)
**Audiencia:** todo funcionario público con cuenta activa (institucional o validada manualmente)

---

## Por qué este componente faltaba

Construimos la vista del producto (módulos M00 a M21), la vista del programa (etapas, gates, contratos), la vista administrativa del founder (Plataforma 0). Faltó la vista personal del cliente: SUS facturas, SU avance, SUS pendientes, SU equipo.

Es el componente que humaniza la plataforma. Sin él, el funcionario opera la herramienta pero no se siente acompañado. Es la diferencia entre un dashboard frío y una plataforma que reconoce al usuario como persona con historial propio.

---

## Estructura general de la pantalla `/perfil`

Header del perfil con foto opcional, nombre, cargo, municipio. Tabs horizontales para navegar entre secciones. Layout responsive para desktop y mobile.

Las 7 secciones del perfil son:

1. **Mi perfil personal**
2. **Mi etapa y avance**
3. **Mis pendientes**
4. **Mis exportaciones**
5. **Mis facturas y contratos**
6. **Mi equipo del municipio**
7. **Mis preferencias**

---

## Sección 1 · Mi perfil personal

**Campos visibles y editables por el usuario:**
- Foto de perfil (opcional, upload jpg/png hasta 2 MB)
- Nombre completo (editable)
- Cargo en el ayuntamiento (dropdown editable)
- Email institucional (NO editable, requiere proceso formal con founder)
- Teléfono de contacto (opcional, editable)

**Campos visibles solo informativos:**
- Municipio asignado
- Tipo de acceso (primary user / collaborator / observer)
- Fecha de registro en Alquimia
- Último login (con dispositivo)

**Sección de seguridad:**
- Status de TOTP (activado / desactivado, botón para activar)
- Backup codes generados (botón "Generar nuevos códigos" con confirmación)
- Sesiones activas con dispositivos (botón "Cerrar todas las sesiones")
- Cambio de email (proceso formal, requiere validación de founder)

---

## Sección 2 · Mi etapa y avance

**Bloque grande superior · La etapa actual del municipio:**
- Card con badge grande mostrando etapa: Validación / Planeación / Ejecución
- Tier comercial vigente: Diagnóstico / Implementación / Operación
- Días en la etapa actual
- Gate actual (G0 a G5) con su descripción
- Próximo gate con qué requiere para cerrar

**Stepper visual del recorrido completo:**
- Línea horizontal con 10 puntos representando los módulos M00 a M15
- Puntos verdes (completos), azul (actual), gris (bloqueados)
- Click en cualquier punto lleva al módulo correspondiente

**Barra de progreso de validación:**
- Porcentaje visual: "N% del diagnóstico validado"
- Desglose por categoría de dato: investigados, calculados, aportados por cliente
- Comparativa anónima opcional: "Tu avance está en el percentil X versus otros municipios en tu etapa"

**Sección de hitos cumplidos:**
- Lista cronológica de hitos completados con fecha
- Ejemplo: "M00B completado · 15 mayo", "Primera exportación de ZIP · 22 mayo", "G1 firmado · 1 junio"

---

## Sección 3 · Mis pendientes

**Tres columnas o tabs según preferencia visual del PM:**

**Columna A · Documentos pendientes (de ARCHIVO):**
- Lista de documentos que el sistema necesita
- Cada uno con: nombre, módulo donde aplica, fecha de solicitud, días pendiente
- Botón directo "Subir" por cada documento
- Botón "Marcar como no aplica" con confirmación

**Columna B · Cifras pendientes de validación:**
- Lista de DataPoints con sello "Calculado" o "Investigado" que el cliente puede confirmar o ajustar
- Cada uno con: nombre del campo, valor actual, módulo donde vive, sello de origen
- Botón "Confirmar" / "Ajustar" / "Reemplazar con mi documento"

**Columna C · Acciones del usuario requeridas:**
- Próximas sesiones de Cabildo donde el programa está en agenda
- Reuniones programadas con Comité de Seguimiento
- Firmas pendientes (contratos en Mifiel sin firmar)
- Facturas pendientes de pago próximas a vencer

---

## Sección 4 · Mis exportaciones

**Lista cronológica de todos los ZIPs exportados:**
- Fecha y hora de cada export
- Tipo de documento exportado (Expediente Diagnóstico / Resumen Ejecutivo / Plan Maestro / Reporte ESG)
- Versión del documento al momento del export
- Contraseña del ZIP (oculta, click para mostrar / regenerar / reenviar por email)
- Botón "Descargar de nuevo" (mientras el link esté vigente, 7 días)

**Contador del mes:**
- "Has exportado N de 3 documentos este mes (preliminary)"
- "Sin límite después de firmar contrato"

**Botón "Exportar nuevo":**
- Modal con selector del tipo de documento a generar
- Opciones disponibles según etapa actual del municipio

---

## Sección 5 · Mis facturas y contratos

**Subsección 5.1 · Contratos**
- Lista de contratos firmados con Alquimia
- Por cada contrato: tipo (Diagnóstico / Implementación / Operación), fecha de firma, vigencia, monto, modalidad de pago
- Botón "Descargar PDF firmado" (desde Mifiel)
- Status visual: vigente / expirado / renovación próxima

**Subsección 5.2 · Facturas (CFDIs)**
- Lista de CFDIs emitidos por Facturapi
- Por cada uno: número, fecha de emisión, monto, concepto, estado de pago
- Botones "Descargar PDF" y "Descargar XML"
- Filtros por año, por estado, por tipo

**Subsección 5.3 · Próximos cobros**
- Lista de cobros programados según contrato vigente
- Fecha estimada, monto, concepto
- Opción "Programar recordatorio"

**Subsección 5.4 · Historial de pagos**
- Pagos realizados con fecha, monto, método (Stripe o transferencia)
- Comprobantes descargables

---

## Sección 6 · Mi equipo del municipio

**Lista de otros funcionarios del mismo tenant con acceso a la plataforma:**
- Foto, nombre, cargo, email
- Status (activo / inactivo)
- Quién se registró primero (badge "Primary user")
- Última actividad de cada uno

**Si el usuario actual es primary user:**
- Botón "Invitar a otro funcionario del municipio"
- Modal con campos: nombre, cargo, email (debe ser institucional)
- Indicador de cuántos pueden invitar (sin límite, todos al mismo tenant sin disparar HERMES adicional)

**Si el usuario actual es collaborator:**
- Vista de solo lectura del equipo
- Sin botón de invitación
- Aviso: "Para invitar a más funcionarios, contacta a [primary user] o al equipo Alquimia"

---

## Sección 7 · Mis preferencias

**Notificaciones:**
- Digest semanal de pendientes (default: lunes 09:00, configurable)
- Alertas de cifras nuevas integradas (sí / no)
- Alertas urgentes (gates próximos a cerrar, facturas próximas a vencer)
- Canal: solo email / email + WhatsApp (cuando WhatsApp Business esté activo)

**Idioma:**
- Español mexicano (default)
- Futuro: inglés, otros idiomas

**Zona horaria:**
- Default: Ciudad de México
- Override manual si el municipio está en zona distinta

**Tema visual:**
- Claro (default) / Oscuro (opcional)

**Privacidad:**
- Compartir avance anónimo agregado para comparativas (sí / no, default sí)
- Recibir comunicaciones sobre nuevos módulos (sí / no)

---

## Reglas operativas

**Regla uno · Cero acceso a perfiles de otros usuarios.**
Cada usuario ve solo SU perfil. Otros usuarios del mismo tenant aparecen únicamente en la Sección 6 (equipo) con información mínima (nombre, cargo, status). Cero acceso a sus pendientes, facturas, exportaciones.

**Regla dos · Founder ve todo desde Plataforma 0.**
El founder ve los perfiles de cualquier usuario desde la pantalla A2 de Plataforma 0 con modo read-only. Para modificar algo de un perfil ajeno, requiere "asumir identidad temporal" con audit log.

**Regla tres · Edición con audit log.**
Cada edición que el usuario hace a su perfil queda registrada con timestamp y dispositivo. El historial completo es visible en el perfil del usuario y en la Plataforma 0 del founder.

**Regla cuatro · Privacidad de datos personales.**
Cumplimiento con LFPDPPP. El usuario puede solicitar exportación completa de sus datos personales en formato JSON. Puede solicitar eliminación de cuenta con periodo de retención de 30 días para reversibilidad.

**Regla cinco · Backup codes son sensibles.**
Los backup codes se muestran solo una vez al generarse. El usuario debe guardarlos. Si los pierde, debe generar nuevos (invalidando los anteriores automáticamente).

---

## Integración con sistema existente

**Auth (Clerk):**
- Perfil personal lee del `user.publicMetadata` y `user.privateMetadata` de Clerk
- Edición sincroniza con Clerk vía SDK
- TOTP y backup codes usan funcionalidad nativa de Clerk

**Tenant data:**
- Sección 2 (etapa y avance) lee de tabla `tenants` y `tenant_data`
- Sección 3A (pendientes documentales) lee de tabla `document_gaps`
- Sección 3B (cifras pendientes) lee de tabla `tenant_data` filtrando por status

**Billing:**
- Sección 5.1 lee de Mifiel API (contratos firmados)
- Sección 5.2 lee de Facturapi API (CFDIs)
- Sección 5.3 y 5.4 leen de Stripe API + tabla `payments_log` local

**Exportaciones:**
- Sección 4 lee de tabla `exports_log` que registra cada ZIP generado
- Links a archivos vivos en S3 con expiración 7 días

**Equipo del municipio:**
- Sección 6 lee de tabla `users` filtrando por `tenant_id` igual al del usuario actual
- Invitaciones generan registros en tabla `invitations` con token único

---

## Endpoints API requeridos

```
GET  /api/profile                          → perfil personal del usuario
PUT  /api/profile                          → actualizar perfil personal
POST /api/profile/photo                    → subir foto de perfil

GET  /api/profile/etapa                    → datos de etapa y avance del tenant
GET  /api/profile/pendientes               → documentos + cifras + acciones pendientes
GET  /api/profile/exportaciones            → historial de ZIPs exportados
POST /api/profile/exportar                 → generar nuevo ZIP

GET  /api/profile/facturas                 → lista de CFDIs
GET  /api/profile/contratos                → lista de contratos firmados
GET  /api/profile/pagos                    → historial de pagos

GET  /api/profile/equipo                   → otros usuarios del mismo tenant
POST /api/profile/equipo/invitar           → invitar nuevo miembro al tenant

GET  /api/profile/preferencias             → preferencias del usuario
PUT  /api/profile/preferencias             → actualizar preferencias

POST /api/profile/exportar-mis-datos       → exportar JSON completo (LFPDPPP)
POST /api/profile/eliminar-cuenta          → solicitud de eliminación (con 30 días retención)
```

---

## Estados visuales del perfil

**Cliente nuevo (M00 apenas completado):**
- Sección 2 muestra "Comenzando · 1 de 10 módulos completos"
- Sección 3 muestra principalmente documentos pendientes de M00B
- Sección 4 vacía
- Sección 5 vacía o solo contrato Tier Diagnóstico

**Cliente en progreso (Validación a la mitad):**
- Sección 2 muestra "Validación · 5 de 10 módulos · G0"
- Sección 3 robusta con pendientes específicos
- Sección 4 con 1-2 exportaciones preliminares
- Sección 5 con contrato Tier Diagnóstico vigente

**Cliente con Validación completa (G1 cerrado):**
- Sección 2 muestra "Planeación · listo para comenzar · G1 cerrado"
- Sección 3 con nuevos pendientes de Planeación
- Sección 4 con expediente completo descargable
- Sección 5 con contrato Tier Implementación firmado

**Cliente en Ejecución (operación continua):**
- Sección 2 muestra "Ejecución · operación continua · próximo reporte trimestral"
- Sección 3 con reportes trimestrales por preparar
- Sección 4 con reportes ESG mensuales
- Sección 5 con contrato Tier Operación + reportes financieros

---

## Diferencia clave entre perfil del cliente vs founder

| Aspecto | Cliente (`/perfil`) | Founder (Plataforma 0) |
|---|---|---|
| Alcance | Solo SU información | Todos los tenants y usuarios |
| Edición | Solo SUS datos | Cualquier tenant (con audit) |
| Pendientes | Solo SUS pendientes | Cross-tenant agregado |
| Facturas | Solo SUS facturas | Todas las facturas del sistema |
| Equipo | Otros miembros de SU tenant | Todos los usuarios |
| Acceso a otros | Cero | Total (con audit log) |

---

## Cronograma de implementación

**Sprint 2 (semana del 9 al 13 junio):**
- Secciones 1 (perfil personal) y 7 (preferencias). Las dos más simples, sirven de prueba de patrón.

**Sprint 3 (semana del 16 al 20 junio):**
- Secciones 2 (etapa y avance) y 3 (pendientes). Requieren integración con `tenants`, `tenant_data`, `document_gaps`.

**Sprint 4 (semana del 23 al 27 junio):**
- Sección 6 (equipo del municipio). Sistema de invitaciones requiere implementación.

**Sprint 5 (mes 2):**
- Sección 4 (exportaciones) integrada con sistema de generación de PDFs/ZIPs.

**Sprint 6 (mes 2-3):**
- Sección 5 (facturas y contratos) integrada con Mifiel + Facturapi + Stripe. Esto es el último porque requiere los tres servicios externos configurados primero.

---

## Lo que NO entra al spec deliberadamente

- Mensajería interna entre usuarios del mismo tenant (Sprint 7+, si hay demanda real)
- Foro o comunidad de funcionarios de distintos municipios (mes 6+)
- Sistema de logros o gamificación del avance (NO se construye, contradice filosofía institucional)
- Chat con AI dentro del perfil (mes 12+, cuando NOUS esté maduro)

---

## Criterio binario de cierre del componente

El perfil está completo cuando:

1. Usuario nuevo puede ver su perfil después de primer login y completar campos faltantes
2. Usuario en progreso ve su avance correcto del tenant
3. Usuario puede subir documentos pendientes desde la Sección 3 directamente
4. Usuario puede descargar PDFs de sus contratos firmados con Mifiel
5. Usuario puede descargar PDFs y XMLs de sus CFDIs de Facturapi
6. Usuario primary puede invitar nuevos miembros al tenant
7. Usuario puede activar TOTP y generar backup codes
8. Usuario puede solicitar exportación completa de sus datos personales (LFPDPPP)
9. Founder ve los perfiles de otros usuarios desde Plataforma 0 con audit log de su acceso

---

*USER PROFILE SPEC · Alquimia · 30 mayo 2026*
