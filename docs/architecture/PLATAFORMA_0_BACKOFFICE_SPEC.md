# PLATAFORMA 0 · BACKOFFICE DE ADMINISTRACIÓN — Especificación funcional

**Estado:** Firmado · Aprobado para Fase 1 MVP bajo ADR-0010
**Fecha:** 27 mayo 2026
**Dependencias:** ADR-0010 firmado
**Construye:** KRONOS (backend) + POLIS (frontend) + FORGE (módulos administrativos)

---

## 1 · Propósito

Plataforma interna y privada de Alquimia para administrar el portafolio completo de tenants municipales, autorizar transiciones de gate, gestionar capabilities activas por tenant, monitorear el motor comercial, y operar el moat de datos cross-tenant que Alquimia construye con cada cliente.

Esta plataforma **no es visible al cliente municipal**. Es la consola del founder y del equipo interno de Alquimia. Análoga al Bloomberg Terminal Admin Console, al Veeva Vault Admin, al Toast Headquarters Console.

---

## 2 · Usuarios y roles

| Rol | Acceso | Cuándo aplica |
|---|---|---|
| Founder | Total a todo (L5) | Hoy |
| Director de Operaciones | Lectura A1-A4, A6, A7; edición A9 (L4) | Cuando se contrate |
| Director Comercial | Lectura A1; edición A8, A9 (L4) | Cuando se contrate |
| Equipo de Soporte | Lectura A1; edición A9 (L3) | Cuando se contrate |
| Agente AI (KOSMOS, BIOS, AUDITOR) | Lectura limitada por aprobación (L0-L3) | Hoy con permisos restringidos |

Los clientes municipales **no tienen acceso bajo ninguna circunstancia**. La autenticación de Plataforma 0 es completamente separada de la autenticación de las plataformas-cliente.

---

## 3 · Autenticación

- Doble factor obligatorio: Resend (email) + TOTP (Google Authenticator).
- IP allowlisting configurable por cuenta.
- Sesión de duración máxima 8 horas, renovación con TOTP.
- Logs de cada acción en `/admin/audit_log/` con timestamp, usuario, IP, acción, tenant afectado.
- Backups del audit log cada 24 horas a almacenamiento de solo lectura.

---

## 4 · Módulos del backoffice

### A1 · Dashboard de portafolio

Vista de inicio del founder. Una fila por tenant activo. Columnas:

| Columna | Contenido | Cálculo |
|---|---|---|
| Municipio | Nombre y estado | Lectura de `tenant.municipio` |
| Etapa | Validación, Planeación, Ejecución, Expansion | Lectura de `tenant.current_stage` |
| Días en etapa | Entero | `now - tenant.fecha_cambio_stage` |
| MRR | Pesos mexicanos mensuales | Suma de capabilities activas × precio |
| Próximo gate | G1, G2, G3, G4, G5 | Siguiente gate no cerrado |
| Días hasta próxima acción | Entero positivo o negativo | Comparado contra plazos contractuales |
| Riesgo | Verde, amarillo, rojo | Reglas: ver §4.1.1 |
| Última actividad | Timestamp | Última escritura del cliente |

#### 4.1.1 Reglas de cálculo de riesgo del tenant

- **Verde:** actividad en últimos 14 días, gates al día, pagos al corriente, sin tickets críticos abiertos.
- **Amarillo:** alguno de los siguientes: actividad 15-30 días, gate retrasado < 30 días, pago próximo, ticket abierto > 5 días.
- **Rojo:** alguno de los siguientes: sin actividad > 30 días, gate retrasado > 30 días, pago en mora, ticket crítico abierto, change de administración municipal próximo sin transición preparada.

### A2 · Gestión de tenants

CRUD completo de tenants. Cada tenant tiene un expediente con seis secciones:

#### 4.2.1 Datos del municipio
- Nombre completo y oficial.
- Estado y región.
- Clave INEGI (formato XX_NNN).
- Población según INEGI 2020.
- Población actualizada según última estimación CONAPO.
- Presupuesto municipal anual declarado en Ley de Egresos del estado.
- Superficie en km².
- División territorial (número de delegaciones, colonias, AGEBs).
- Servicios donde Alquimia opera o podría operar (RSU, Agua, Energía).

#### 4.2.2 Composición política actual
- Presidente municipal: nombre, partido, periodo (inicio, fin), foto opcional.
- Síndico procurador o síndicos: nombre, partido, periodo.
- Regidores: lista nominada, partido, tipo (mayoría relativa o representación proporcional), comisiones donde participa.
- Total de regidores: entero calculado, varía por municipio.
- Día y hora de sesión de Cabildo (ej. jueves 09:00).
- Comisiones permanentes del Cabildo con sus integrantes.
- Próximo proceso electoral relevante con fecha.

#### 4.2.3 Estructura administrativa
- Secretario general del Ayuntamiento o equivalente.
- Tesorero municipal.
- Contralor interno municipal.
- Direcciones generales: nombre del titular, área (Servicios Públicos, Ecología y Aseo Público, Obras Públicas, Desarrollo Urbano, Seguridad, Hacienda, Gobierno y Reglamentos).
- Directores o coordinadores subordinados relevantes para el servicio (ejemplo para RSU: Jefe del Departamento de Aseo Público, Jefe del Departamento de Confinamiento, supervisores de turno).
- Personal de apoyo administrativo cercano a las decisiones (secretarios técnicos, asistentes ejecutivos, encargados de logística).

#### 4.2.4 Marco normativo cargado
- Reglamento de limpia o de aseo público vigente con fecha de publicación, número de Periódico Oficial, versión PDF subida.
- Reglamento orgánico de la administración pública municipal.
- Plan Municipal de Desarrollo en vigor.
- Programa Sectorial relacionado con el servicio si existe.
- Convenios intermunicipales o estatales activos.

#### 4.2.5 Servicio operativo actual
- Tipo de operación: concesión, prestación directa, mixta.
- Si concesión: nombre del concesionario, vigencia, monto, alcance.
- Personal operativo del municipio dedicado al servicio.
- Flotilla vehicular: tipos, antigüedad, propiedad (municipio o concesionario).
- Instalaciones físicas: relleno sanitario, centros de transferencia, centros de acopio existentes.
- Cobertura territorial actual (zonas atendidas y no atendidas).
- Frecuencia de recolección por zona.

#### 4.2.6 Relación comercial con Alquimia
- Tier contratado (Diagnóstico, Implementación, Operación Completa).
- Fecha de firma del contrato.
- Pago inicial recibido, fecha.
- Plan de pagos mensuales: monto, día de cobro, método.
- Capabilities activas y su precio asociado.
- Próximo hito de facturación.

### A3 · Stage transition control

Tablero de gates G1 a G5 con evidencia obligatoria por gate. Cada gate tiene:

- Status: `no_iniciado`, `en_revision`, `cerrado`, `fallido`.
- Evidencia obligatoria subida por el founder o por el cliente desde su plataforma. Sin evidencia, el gate no puede cerrarse.
- Decisor humano que aprueba el cierre (siempre el founder bajo el modelo actual).
- Fecha de cierre.

#### Evidencia mínima por gate

**G1 · Validación → Planeación**
- Acta de sesión de Cabildo donde se aprueba el programa.
- Reforma reglamentaria publicada en Periódico Oficial del Estado.
- Acuerdo del Cabildo firmado por presidente y síndico.

**G2 · Planeación → Ejecución**
- Adenda al contrato de concesión firmada por todas las partes.
- Plan operativo aprobado y publicado.
- Presupuesto asignado en partida específica del Ayuntamiento.

**G3 · Ejecución consolidada (mes 3)**
- Reporte mensual GRI 306 del mes 1, 2 y 3 con datos reales.
- Conciliación mensual de presupuesto del mes 3 con CPI y SPI dentro de rangos comprometidos.
- Acta de revisión del Cabildo confirmando avance.

**G4 · Año uno operativo**
- Reporte anual ESG con doble materialidad aplicada (M18).
- Datos reales de 12 meses consecutivos.
- Auditoría externa (opcional pero recomendada).

**G5 · Escalamiento territorial**
- Expansion plan a colonias o delegaciones adicionales no cubiertas en plan original.
- Modelo financiero actualizado.
- Aprobación del Cabildo de la expansión.

Cada gate cerrado dispara automáticamente un cambio de capabilities activas según definido en el Capability Registry. Por ejemplo, G2 cerrado activa capabilities de Plataforma 3 Ejecución para el tenant.

### A4 · Capability Registry editor

Editor visual del archivo canónico `capability_registry.json`. Permite:

- CRUD de módulos.
- Activación o desactivación de capabilities por tenant.
- Configuración de precios mensuales por capability.
- Visualización de dependencias entre módulos (graph view).
- Detección de dependencias rotas (un módulo activo que depende de uno desactivado).

Esta es la herramienta que materializa el modelo Bloomberg de expansion revenue. Cuando el founder vende una capability adicional al cliente (rutas optimizadas, integración con tesorería, conector de quejas ciudadanas), la activación ocurre desde aquí.

### A5 · Standards Map admin

Editor de `standards_map.json` que MARCOS produce. Funciones:

- CRUD de estándares asignados por módulo.
- Verificación de coherencia (no permite citar estándar inexistente o versión incorrecta).
- Vinculación con archivos GRI, ISO, PMI, SASB cargados en repositorio.
- Resolución de findings que AUDITOR identifica.
- Historial de cambios por estándar.

### A6 · Documentación generada

Repositorio centralizado de todo el output formal que Alquimia produce para cada tenant:

- Expedientes Cabildo (uno por tenant en etapa Validación cerrada).
- Reportes mensuales ESG (uno por mes por tenant en Ejecución).
- Adendas contractuales (versiones firmadas).
- Actas y minutas de transiciones de gate.
- Auditorías externas si las hay.
- Borradores en revisión.

Acceso del cliente municipal a su propio expediente: sí. Acceso cross-tenant: solo founder y operaciones internas.

### A7 · Analytics y data moat

Aquí vive la ventaja competitiva acumulativa de Alquimia. Métricas cross-tenant agregadas y anonimizadas:

- Patrones de generación RSU por tipo de municipio (capital, conurbado, rural).
- Tasas de captura por fracción y por etapa del programa.
- Tiempos promedio a G1, G2, G3 por características políticas del municipio.
- Costos reales versus modelo en CAPEX y OPEX.
- Comportamiento ciudadano por demografía (encuestas M02B agregadas).
- Resultados políticos: tasa de éxito de votos de Cabildo, factores correlacionados.
- Riesgos materializados versus riesgos proyectados por categoría.

**Reglas críticas de privacidad:**
- Los datos cross-tenant nunca se muestran a un cliente individual.
- La anonimización es obligatoria antes de cualquier agregación.
- Los reportes agregados nunca exponen datos identificables.
- Consent del tenant para inclusión en analytics agregada es opt-in en el contrato.

Esto es el data moat de Veeva. Cada nuevo municipio que entra mejora la inteligencia que reciben los siguientes. Después de diez municipios, las predicciones de Alquimia son cualitativamente mejores que cualquier modelo teórico de consultora tradicional.

### A8 · Billing y comercial

- Estado de cuenta por tenant con histórico.
- Próxima factura proyectada.
- Pagos recibidos y pendientes.
- Capabilities activas y su contribución al MRR.
- Funnel comercial: prospectos en conversaciones, propuestas enviadas, contratos en negociación.
- Pipeline de expansion: capabilities propuestas a clientes activos.

Conectores futuros: facturación CFDI México, conciliación bancaria, recordatorios de pago automáticos.

### A9 · Soporte y comunicación

- Tickets por tenant (sistema de soporte interno).
- Plantillas de comunicación aprobadas por canal: email Resend, SMS Twilio, WhatsApp Business.
- Bandeja unificada de notificaciones automáticas que la plataforma envía a clientes.
- Calendario de reuniones del founder con clientes activos.
- Historial completo de comunicaciones por tenant.

Esta es la sección donde HERMES opera sus tres workflows de WhatsApp (recordatorios, alertas KPI, resúmenes ejecutivos) bajo gate humano del founder para envíos a clientes reales.

---

## 5 · Vista por tenant

Cuando el founder hace click en un tenant específico desde A1 Dashboard, accede a una vista detallada de seis pestañas:

1. **Resumen ejecutivo.** Etapa actual, MRR, gate próximo, riesgo, última actividad, comunicaciones recientes.
2. **Expediente municipal.** Las seis secciones de A2 navegables y editables.
3. **Gates.** Estado de G1-G5 con evidencia y transiciones disponibles.
4. **Capabilities.** Módulos y add-ons activos, precio de cada uno, botones para activar o desactivar.
5. **Datos y métricas.** Cifras operativas del programa del cliente, comparadas contra modelo y contra benchmarks anonimizados de A7.
6. **Documentos.** Expedientes, reportes, contratos del cliente.

---

## 6 · Casos de uso prioritarios

### 6.1 Founder en sprint de venta
Necesita ver: cuántos prospectos activos hay, en qué etapa de conversación están, qué propuestas están firmadas, cuál es el MRR proyectado.

Tablero relevante: A1 Dashboard + A8 Billing.

### 6.2 Founder cerrando G1 de un cliente
Necesita: subir la evidencia (acta de Cabildo, reforma publicada), confirmar la transición, comunicar el cambio al cliente.

Tablero relevante: A3 Stage Transition Control + A9 Comunicación.

### 6.3 Founder activando capability nueva para un cliente activo
Necesita: ver el cliente, identificar la capability, activar, ajustar precio, comunicar.

Tablero relevante: A4 Capability Registry + A2 Tenant + A8 Billing.

### 6.4 Founder atendiendo crisis con un cliente
Necesita: ver toda la historia del cliente, los últimos tickets, los riesgos materializados, las comunicaciones recientes, los próximos compromisos.

Tablero relevante: vista detallada por tenant con las seis pestañas.

### 6.5 Founder buscando patrones cross-tenant
Necesita: ver qué patrones se repiten en los clientes activos, qué predicciones son aplicables al siguiente prospecto, qué riesgos están emergiendo en el portafolio.

Tablero relevante: A7 Analytics.

---

## 7 · MVP versus completo

### 7.1 MVP imprescindible (semanas 2-4 según ADR-0010)

- A1 Dashboard de portafolio (versión simple, sin riesgo calculado automáticamente).
- A2 Gestión de tenants (versiones de las seis secciones de A2 editables).
- A3 Stage transition control (manual, sin automatización de evidencia).
- A4 Capability Registry editor (versión simple, sin graph view).

Esto es lo mínimo para operar el portafolio actual y comenzar a vender bajo la nueva arquitectura.

### 7.2 Diferido al post-MVP

- A5 Standards Map admin (depende de que MARCOS termine).
- A7 Analytics (requiere al menos cinco tenants para tener señal).
- A8 Billing avanzado (versión inicial es planilla externa).
- A9 Soporte avanzado (versión inicial es Slack o WhatsApp directo del founder).

---

## 8 · Stack técnico recomendado

- Backend: mismo Next.js + Prisma actual de Alquimia, ruta `/admin/*`.
- Base de datos: misma instancia PostgreSQL, tabla `tenants` y dependientes.
- Auth: Resend + TOTP, separado del auth de clientes municipales.
- UI: misma stack POLIS actual con design system Alquimia.
- Almacenamiento de archivos: actual (Render + S3-compatible).

No requiere nueva infraestructura. Es código nuevo dentro de la misma aplicación con namespace `/admin/`.

---

## 9 · Gates humanos para construcción

- **Gate founder uno.** Aprobación del scope de MVP en este documento antes de KRONOS y POLIS arrancar.
- **Gate founder dos.** Aprobación del diseño de UI antes de implementación de A1 y A2.
- **Gate founder tres.** Aprobación de seguridad antes de exposición pública del endpoint `/admin/`.
- **Gate founder cuatro.** Aceptación final con el founder usando el MVP en producción durante una semana antes de declararlo cerrado.

---

## 10 · Criterio binario de cierre

El founder puede, desde Plataforma 0:
1. Crear un nuevo tenant con sus seis secciones.
2. Asignar tier comercial inicial.
3. Activar capabilities por defecto del tier.
4. Cerrar el G1 de un tenant con evidencia subida.
5. Ver el dashboard de portafolio con al menos los tres tenants activos.
6. Activar una capability adicional para un tenant existente.

Sin estas seis capacidades operativas, Plataforma 0 no está cerrada.

---

*PLATAFORMA 0 BACKOFFICE SPEC · Alquimia · 27 mayo 2026*

---

## 11 · Firma Fase 0

Documento validado para arranque de Fase 1. La aprobacion cubre scope funcional MVP A1-A4, gates humanos, separacion completa cliente/backoffice y dependencia estricta de ADR-0010.

```
[x] Founder / Usuario soberano: aprobado por instruccion directa · 2026-05-27
[x] SUPREME architectural review: firmado · 2026-05-27
[x] KOSMOS dependency check: compatible con capability_registry.json v2.0.0 · 2026-05-27
```
