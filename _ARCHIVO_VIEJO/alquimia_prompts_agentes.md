# PROMPTS PARA AGENTES DE ALQUIMIA
## Catálogo ejecutable para Cursor / Claude Code
## 26 mayo 2026

---

## INSTRUCCIONES DE USO

Cada sección es un prompt independiente, autocontenido. Cópialo completo a Cursor o al chat con tu agente. No mezcles prompts en una sola sesión — un prompt por sesión de agente.

Cada prompt requiere que el agente, antes de actuar, lea la `HOJA_DE_RUTA_ALQUIMIA.md` ubicada en `/docs/architecture/`. Si no la encuentra, debe pausar y reportar.

Si un agente termina su tarea y reporta cierre, el founder verifica los criterios binarios antes de marcarlo como completado. Cierre sin verificación humana no cuenta.

---

## PROMPT 1 · KRONOS — Desbloqueo de acceso

```
KRONOS

CONTEXTO ANTES DE ACTUAR
========================
Antes de cualquier acción, lee /docs/architecture/HOJA_DE_RUTA_ALQUIMIA.md
completa. Identifica tu nivel de autonomía: L1 para configuración de 
proveedores externos, L4 para cambios arquitectónicos (no aplicable aquí).

TU MISIÓN
=========
Desbloquear el acceso de usuarios reales a Alquimia. Hoy el endpoint 
/auth/status regresa email_provider=console y sms_provider=console, lo 
que significa que los códigos de verificación se imprimen en logs del 
servidor en lugar de enviarse al usuario. Ningún cliente externo puede 
completar registro.

TAREAS CONCRETAS EN ORDEN
=========================

1. Configurar Resend como proveedor de email transaccional.
   - Crear cuenta en resend.com.
   - Agregar dominio alquimiaplatform.com y verificar registros DNS 
     (MX, TXT-SPF, TXT-DKIM) en el panel del registrador.
   - Generar API key con permiso Full Access.
   - Cargar en Render como variables:
       EMAIL_PROVIDER=resend
       RESEND_API_KEY=re_xxxxx
       EMAIL_FROM=noreply@alquimiaplatform.com
       EMAIL_FROM_NAME=Alquimia

2. Configurar Twilio como proveedor de SMS.
   - Crear cuenta en twilio.com y verificar identidad.
   - Comprar número mexicano +52 (costo 1 USD/mes).
   - Copiar Account SID, Auth Token y número.
   - Cargar en Render como variables:
       SMS_PROVIDER=twilio
       TWILIO_ACCOUNT_SID=ACxxxxx
       TWILIO_AUTH_TOKEN=xxxxx
       TWILIO_FROM_NUMBER=+52xxxxxxxxxx

3. Implementar TOTP con pyotp.
   - Instalar pyotp y qrcode[pil] en requirements.txt.
   - Implementar endpoint POST /auth/totp/setup que genere secret, 
     provisioning URI y QR en base64.
   - Implementar endpoint POST /auth/totp/activate que verifique 
     código contra secret guardado.
   - Variables: TOTP_ISSUER=Alquimia, TOTP_DIGITS=6, TOTP_PERIOD=30.

4. Adaptar el código del backend para que use providers reales.
   - El servicio EmailService lee EMAIL_PROVIDER y envía vía Resend 
     cuando sea "resend".
   - El servicio SmsService lee SMS_PROVIDER y envía vía Twilio 
     cuando sea "twilio".
   - Mantener el modo "console" como fallback para desarrollo local.

5. Verificar flujo end-to-end usando un email externo real (no 
   demo@alquimia.mx). Los once pasos son:
     a. POST /auth/register
     b. Verificar que llega email real
     c. POST /auth/verify-email
     d. POST /auth/onboarding/profile
     e. Verificar que llega SMS real
     f. POST /auth/sms/verify
     g. POST /auth/totp/setup
     h. POST /auth/totp/activate
     i. POST /auth/onboarding/upload-reglamento (opcional)
     j. POST /auth/login
     k. POST /auth/login/totp
   Cada paso debe regresar status 200/201 y next_step coherente.

CRITERIO DE CIERRE BINARIO
==========================
GET /auth/status regresa email_provider=resend, sms_provider=twilio, 
email_ready=true. Un email externo nuevo recibe código en menos de 
30 segundos. Un teléfono mexicano real recibe SMS en menos de 30 
segundos. El JWT obtenido al final del flujo permite GET /simulator 
sin error 401.

LO QUE NO DEBES HACER
=====================
- No tocar el código de los módulos del simulador.
- No modificar el modelo financiero.
- No enviar emails a clientes reales como prueba; usa solo tus 
  propias direcciones para verificación.
- No exponer las API keys en commits ni en logs.

REPORTE DE CIERRE
=================
Cuando cumplas el criterio binario, escribe en /changelog/kronos.md:
  - Timestamp de cada paso del flujo verificado
  - Captura del email recibido (texto, no imagen)
  - Captura del SMS recibido
  - Confirmación de auth/status corregido
```

---

## PROMPT 2 · OCCAM — Eliminación de módulos sobrantes

```
OCCAM

CONTEXTO ANTES DE ACTUAR
========================
Lee /docs/architecture/HOJA_DE_RUTA_ALQUIMIA.md completa. Tu nivel 
de autonomía es L2 para desactivación por configuración (modificas 
Capability Registry); requieres L4 para borrar código (no autorizado 
sin gate humano del founder).

TU MISIÓN
=========
La plataforma tiene módulos agregados durante meses de construcción 
no siempre alineados con los tres etapas (Validación, Planeación, 
Ejecución). Tu trabajo es identificar cuáles módulos NO mapean a 
estándar internacional declarado, NO contribuyen a la decisión del 
Cabildo, NO son requeridos por contrato comercial, y desactivarlos 
en el Capability Registry sin borrar código.

TAREAS CONCRETAS EN ORDEN
=========================

1. Inventario completo. Listar los 40+ módulos visibles en producción 
   (modo Validar + modo Implementar). Para cada uno registrar:
     - Identificador (M01, M02, etc.)
     - Etapa donde aparece (Validación / Planeación / Ejecución)
     - Capítulo (Diagnóstico / Planificación / Modelo / Control)
     - Estándar internacional que mapea (GRI, SASB, ISO, PMI, etc.)
     - Pregunta del cliente que responde
     - Si está vacío o tiene contenido real
     - Si es citado por otros módulos

2. Aplicar filtro de relevancia. Un módulo se queda activo si cumple 
   AL MENOS dos de los cuatro criterios siguientes:
     - Mapea a un estándar internacional citable.
     - Es prerrequisito para un Gate G1-G5.
     - Es citado por otros módulos como fuente.
     - Aporta cifra que cambia la decisión del Cabildo.

   Un módulo que no cumple ninguno de los cuatro: desactivar.
   Un módulo que cumple uno: marcar como "Revisar con founder".

3. Para cada módulo desactivado, escribir justificación de 1-3 
   renglones en /docs/audit/occam_desactivations.md indicando:
     - Identificador
     - Razón de desactivación
     - Qué se pierde si se elimina
     - Qué módulo lo reemplaza si aplica

4. Modificar Capability Registry para que los módulos identificados 
   queden con estado capability_disabled por defecto en todos los 
   tenants. No tocar el código fuente.

5. Verificar que después de desactivar, ningún módulo activo cite 
   uno desactivado como dependencia. Si lo hace, ajustar la cita o 
   mover la capability a la cola de "Revisar con founder".

CRITERIO DE CIERRE BINARIO
==========================
Lista publicada de módulos activos (entre 25 y 35) y desactivados 
(entre 5 y 15) con justificación por cada uno. Capability Registry 
actualizado. Ningún módulo activo tiene dependencia rota.

LO QUE NO DEBES HACER
=====================
- No borrar código fuente.
- No fusionar módulos sin gate humano (eso es OCCAM nivel L4).
- No desactivar M00, M01, M03B, M11, M13, M14, M15, M16, M17, M18, 
  M20, M21B sin gate humano (son módulos pilar de los tres capítulos 
  principales).
- No tocar los módulos del Capítulo 4 Control sin gate humano (toda 
  la fase de ejecución depende de ellos).

REPORTE DE CIERRE
=================
Publicar en /changelog/occam.md con la lista final y la justificación 
por módulo desactivado.
```

---

## PROMPT 3 · HERMES — Antecedentes municipales investigados

```
HERMES

CONTEXTO ANTES DE ACTUAR
========================
Lee /docs/architecture/HOJA_DE_RUTA_ALQUIMIA.md completa. Tu nivel de 
autonomía es L2 para integraciones de datos externos; L5 (founder) 
para cualquier publicación al cliente.

TU MISIÓN
=========
El módulo M00B "Antecedentes municipales RSU" debe responder la 
pregunta "¿Qué intentó el municipio antes de este programa?" con 
investigación real del municipio cliente. Hoy aparece como módulo 
existente pero sin contenido vivo. Tu trabajo es construir el 
pipeline automatizado que investiga al municipio cuando se da de 
alta como tenant.

TAREAS CONCRETAS EN ORDEN
=========================

1. Diseñar el schema de antecedentes municipales. Mínimo diez campos:
   - Nombre y población oficial del municipio (INEGI 2020).
   - Composición del Cabildo actual (presidente, síndicos, regidores).
   - Periodo de la administración en turno.
   - Reglamento de limpia vigente (versión, fecha de publicación, 
     número de Periódico Oficial).
   - Concesión o empresa operadora del servicio actual.
   - Programa o plan de desarrollo municipal vigente.
   - Antecedentes de programas RSU previos (2010-presente).
   - Eventos de prensa relevantes de los últimos 24 meses.
   - Indicadores SEMARNAT por estado para el servicio.
   - Próximo proceso electoral relevante.

2. Construir pipeline de ingesta que para un municipio nuevo 
   ejecute automáticamente:
   - Búsqueda Google con queries específicas:
       "[Municipio] reglamento de limpia"
       "[Municipio] residuos sólidos urbanos"
       "[Municipio] cabildo programa basura"
       "[Municipio] concesionario limpieza"
   - Consulta a INEGI Marco Geoestadístico para datos demográficos.
   - Consulta a SEMARNAT para indicadores estatales.
   - Búsqueda en sitios oficiales del estado del Periódico Oficial 
     para identificar el reglamento vigente.

3. Implementar deduplicación y verificación. Cada dato pasa por 
   validación: si la fuente no es oficial (sitios .gob.mx, INEGI, 
   SEMARNAT, prensa reconocida), se marca como "Pendiente verificación 
   con cliente".

4. Conectar el pipeline al trigger de signup. Cuando un cliente 
   selecciona estado + municipio durante el registro, el pipeline 
   se ejecuta y precarga M00B antes de que el cliente ingrese al 
   simulador.

5. Documentar el catálogo de fuentes en /docs/integrations/
   external_data_sources.md indicando: endpoint, frecuencia de 
   actualización, cobertura, qué módulos consumen.

CRITERIO DE CIERRE BINARIO
==========================
Dado tres municipios mexicanos cualesquiera (Monterrey NL, San Luis 
Potosí SLP, Guanajuato Capital GTO), M00B muestra para cada uno al 
menos diez datos verificables con fuente trazable. Tiempo de 
precarga al signup: menor a 60 segundos.

LO QUE NO DEBES HACER
=====================
- No inventar datos cuando la búsqueda no devuelva resultados; 
  marcar como "Pendiente verificación".
- No publicar contenido sobre personas identificables (regidores, 
  funcionarios) sin que el dato venga de fuente oficial pública.
- No tocar los módulos del Capítulo Control.
- No exponer información que no sea públicamente accesible.

REPORTE DE CIERRE
=================
Publicar en /changelog/hermes.md con:
  - Schema final de antecedentes
  - Catálogo de fuentes integradas
  - Captura de pantalla de M00B precargado para los tres municipios 
    de prueba
  - Tiempo medido de precarga
```

---

## PROMPT 4 · HERMES — Difusión de encuesta por SMS

```
HERMES (segundo prompt, ejecutar después de KRONOS Sprint uno)

CONTEXTO ANTES DE ACTUAR
========================
Lee /docs/architecture/HOJA_DE_RUTA_ALQUIMIA.md completa. Sección 4.7 
"Encuesta ciudadana por SMS" es invariable; no la modifiques. Tu 
nivel de autonomía es L2 para integración técnica; L5 (founder) para 
envío real a ciudadanos.

TU MISIÓN
=========
El módulo M02B "Encuesta de aceptación ciudadana" requiere mecanismo 
de difusión por SMS bajo respaldo declarado del municipio, voluntario, 
no obligatorio. Tu trabajo es implementar el flujo completo de 
difusión y captura de respuestas.

TAREAS CONCRETAS EN ORDEN
=========================

1. Diseñar el texto del SMS que va al ciudadano. Especificaciones:
   - Máximo 160 caracteres.
   - Saludo + identificación del municipio que respalda.
   - Declaración explícita de voluntariedad.
   - Link corto a la encuesta web.
   - Frase de Ley General de Protección de Datos Personales.
   
   Texto modelo aprobado:
   "[Municipio] te invita a una encuesta voluntaria sobre residuos. 
   Tu respuesta cuenta. Responde en [link corto]. 5 minutos. Datos 
   protegidos LGPDPPSO."

2. Implementar la encuesta web. Máximo cinco preguntas. Mobile-first. 
   Cada pregunta de opción múltiple con máximo cinco opciones. 
   Tiempo estimado de respuesta: menor a tres minutos.

3. Implementar el flujo de consentimiento del municipio:
   - El cliente municipal carga el padrón de teléfonos a encuestar 
     (CSV con columna phone).
   - El municipio firma autorización digital declarando que el 
     padrón se obtuvo conforme a normativa local.
   - El sistema retiene la autorización antes de cualquier envío.
   - Sin autorización firmada, no hay envío.

4. Implementar el orquestador de envíos:
   - Twilio batch con rate limit para no saturar la red móvil 
     mexicana (máximo 100 SMS/minuto).
   - Logs de envío por número (fecha, status, código de error si 
     aplica).
   - Reintentos automáticos en caso de falla temporal.

5. Implementar la captura de respuestas:
   - Endpoint público (no requiere login) para responder la encuesta.
   - Validación de que el link viene del SMS enviado (token único).
   - Una respuesta por número de teléfono.
   - Datos anonimizados en almacenamiento (hash del número).

6. Implementar el dashboard de resultados en M02B:
   - Tasa de respuesta.
   - Distribución de respuestas por pregunta.
   - IPC ciudadano calculado (Índice de Preparación Ciudadana).
   - Exportable a CSV firmado.

CRITERIO DE CIERRE BINARIO
==========================
Un envío de prueba a 10 teléfonos reales (autorizados por el founder 
para prueba) entrega los SMS con texto correcto en menos de 5 minutos. 
El link funciona en mobile. La encuesta se completa en menos de 3 
minutos. Las respuestas aparecen en el dashboard de M02B.

LO QUE NO DEBES HACER
=====================
- No enviar SMS a teléfonos sin consentimiento documentado del 
  municipio.
- No incluir el texto "obligatorio" en el SMS.
- No capturar datos personales identificables del ciudadano 
  (nombre, dirección) en la encuesta.
- No vender, ceder ni compartir el padrón con terceros bajo ninguna 
  circunstancia.
- No enviar más de un SMS por número en una misma campaña.

REPORTE DE CIERRE
=================
Publicar en /changelog/hermes_sms.md con:
  - Texto final aprobado del SMS
  - Captura de la encuesta web mobile
  - Log del envío de prueba
  - Captura del dashboard de M02B con respuestas reales de prueba
```

---

## PROMPT 5 · BIOS — Verificación de trazabilidad de cifras

```
BIOS

CONTEXTO ANTES DE ACTUAR
========================
Lee /docs/architecture/HOJA_DE_RUTA_ALQUIMIA.md completa. Sección 4.1 
"Datos verificables" y sección 4.8 "Trazabilidad obligatoria" son tus 
referencias técnicas. Tu nivel de autonomía es L3 para reconciliación 
de cifras; L4 (founder) para cambios estructurales del modelo.

TU MISIÓN
=========
Auditar la trazabilidad de cifras en todos los módulos activos. 
Identificar qué cifras tienen fuente declarada y qué cifras flotan 
sin sustento. Reportar el mapa completo de trazabilidad para que el 
founder verifique antes de presentar a clientes reales.

TAREAS CONCRETAS EN ORDEN
=========================

1. Inventario de cifras. Para cada módulo activo, identificar todas 
   las cifras mostradas al usuario. Esperado: entre 200 y 400 
   cifras a lo largo de los 25-35 módulos activos.

2. Para cada cifra, registrar en /docs/audit/cifras_trazabilidad.md:
     - Módulo donde aparece
     - Etiqueta de la cifra
     - Valor actual
     - Fuente declarada (si la tiene)
     - Fecha de la fuente
     - Cifra dependiente o calculada (sí/no)
     - Fórmula aplicada si es calculada
     - Módulos que dependen de esta cifra

3. Identificar inconsistencias. Casos a buscar:
     - Cifras con valor distinto en módulos diferentes que deberían 
       coincidir (ej: CAPEX en M09 vs M13).
     - Cifras sin fuente declarada.
     - Cifras con fuente que ya no es vigente (más de 24 meses sin 
       actualizar).
     - Cifras hard-coded en el código que deberían venir del 
       Modelo_BASED o del Company Profile.

4. Resolver inconsistencias en orden de criticidad:
     - Crítica: cifras que aparecen en el expediente para Cabildo 
       (M15) y no concuerdan con su módulo fuente.
     - Alta: cifras del Capítulo Modelo (TIR, VPN, CAPEX, OPEX) 
       con inconsistencia entre módulos.
     - Media: cifras de impacto ambiental (CO2e, toneladas evitadas) 
       sin fuente declarada.
     - Baja: cifras informativas sin impacto en decisiones.

5. Implementar trazabilidad click-to-source en M19. Cuando el usuario 
   haga click en cualquier cifra, se abre M19 mostrando: fuente 
   original, fecha, fórmula si aplica, módulos dependientes.

CRITERIO DE CIERRE BINARIO
==========================
Inventario de cifras publicado con al menos 200 cifras registradas. 
Cero cifras con valor inconsistente entre módulos. Click-to-source 
funcional en al menos los módulos pilar (M01, M04, M13, M14, M15, 
M20). Todas las cifras críticas tienen fuente declarada con fecha.

LO QUE NO DEBES HACER
=====================
- No modificar el valor de una cifra sin gate humano del founder.
- No inventar fuentes para cifras que no las tienen; marcarlas como 
  "Sin fuente declarada, requiere verificación".
- No tocar fórmulas del modelo financiero (eso es AURUM).
- No exponer cifras a clientes reales sin que pasen tu auditoría.

REPORTE DE CIERRE
=================
Publicar en /changelog/bios.md con:
  - /docs/audit/cifras_trazabilidad.md con inventario completo
  - Lista de inconsistencias detectadas y resueltas
  - Lista de cifras sin fuente que el founder debe decidir
```

---

## PROMPT 6 · AURUM — Módulo de infraestructura de contenedores

```
AURUM

CONTEXTO ANTES DE ACTUAR
========================
Lee /docs/architecture/HOJA_DE_RUTA_ALQUIMIA.md completa. M06 
"Infraestructura — dimensionamiento de centros de acopio" ya existe 
en producción dentro del Capítulo Planificación. Tu trabajo NO es 
construir M06 desde cero; es complementarlo con cálculo de 
contenedores per cápita y mapa de edificios via Google Places.

Tu nivel de autonomía es L3 para cálculos financieros; L4 (founder) 
para cambios al modelo base del programa.

TU MISIÓN
=========
M06 actualmente dimensiona centros de acopio. Falta la capa de 
contenedores distribuidos en territorio: cuántos contenedores por 
fracción se necesitan para condominios elegibles, en qué edificios 
colocarlos, cuánto cuesta el CAPEX correspondiente.

TAREAS CONCRETAS EN ORDEN
=========================

1. Implementar cálculo de contenedores per cápita siguiendo mejores 
   prácticas internacionales documentadas (sistema dual alemán, 
   modelo sueco, Países Bajos):
     - Densidad: 1 contenedor por fracción cada 80-120 habitantes.
     - Tamaños disponibles: 240L plástico ($2,000-3,500 MXN), 
       1100L metálico ($8,000-15,000 MXN), semi-subterráneo 
       ($80,000-150,000 MXN instalado).
     - Vida útil: 8-12 años.
     - Mantenimiento: 12-15% del valor de reposición anual.

2. Integrar Google Places API para identificación de edificios 
   elegibles:
     - place_type: apartment_building, condominium.
     - Bounding box: límites del municipio cliente.
     - Salida: lista de edificios con nombre, dirección, lat/lng, 
       estimación de unidades.

3. Complementar con INEGI Marco Geoestadístico para validar densidad 
   poblacional por colonia y identificar zonas donde Google Places 
   tenga cobertura insuficiente.

4. Implementar UI dentro de M06 que muestre:
     - Mapa georreferenciado de edificios elegibles.
     - Tabla de inversión por nivel (básico/intermedio/premium).
     - CAPEX total per cápita visible.
     - Reconciliación con el CAPEX general del programa.

5. Validar con BIOS que el CAPEX del programa en M13 incluye la 
   inversión en contenedores como componente identificable. Si no, 
   coordinar la actualización del modelo.

CRITERIO DE CIERRE BINARIO
==========================
M06 muestra para SLP capital: mapa georreferenciado con al menos 
500 edificios elegibles identificados, cálculo de contenedores 
totales por fracción, CAPEX total con tres niveles, reconciliación 
con M13 sin inconsistencia detectada por BIOS.

LO QUE NO DEBES HACER
=====================
- No modificar el modelo financiero del programa (TIR base, VPN, 
  payback) sin gate humano.
- No declarar el CAPEX de contenedores como obligatorio para todos 
  los municipios; algunos pueden tener infraestructura previa.
- No invocar Google Places sin caché (cuota costosa).
- No exponer datos de edificios a terceros sin consentimiento 
  municipal.

REPORTE DE CIERRE
=================
Publicar en /changelog/aurum.md con:
  - Captura del mapa georreferenciado de SLP
  - Tabla de cálculo de contenedores
  - Reconciliación con CAPEX general
  - Metodología documentada en /docs/methodology/infraestructura.md
```

---

## PROMPT 7 · ATLAS — Materiales de venta

```
ATLAS

CONTEXTO ANTES DE ACTUAR
========================
Lee /docs/architecture/HOJA_DE_RUTA_ALQUIMIA.md completa. Tu nivel 
de autonomía es L1 para texto editorial; L5 (founder) para precio 
final, contrato firmable, envío a prospectos reales.

TU MISIÓN
=========
Producir el paquete comercial mínimo para que el founder pueda 
abordar municipios prospectos. Tres entregables: pitch ejecutivo de 
tres páginas, propuesta económica con tres tiers, contrato modelo 
revisable por abogado especialista.

TAREAS CONCRETAS EN ORDEN
=========================

1. Pitch ejecutivo de tres páginas. Estructura obligatoria:
   - Página uno: el problema en cifras del municipio (línea base 
     INEGI + estimación de costo de la omisión).
   - Página dos: lo que Alquimia hace y cómo (las tres etapas 
     Validación, Planeación, Ejecución con timeline real de 18 a 
     30 meses).
   - Página tres: por qué Alquimia y no consultora tradicional 
     (operación continua, estándares CSRD/GRI/PMI, plataforma viva).
   Aplicar disciplina editorial Pyramid Principle. Sin cajas 
   alrededor de texto.

2. Propuesta económica con tres tiers:
   - Tier Diagnóstico: solo etapa Validación. Pago único $400-600k 
     MXN. Entrega expediente para Cabildo en 8-12 semanas. Sin 
     compromiso de operación.
   - Tier Implementación: Validación + Planeación. Pago $700-900k 
     MXN inicial + $30-40k mensuales durante Planeación (6-8 meses). 
     Termina cuando G2 cierre.
   - Tier Operación Completa: las tres etapas + 36 meses de 
     ejecución supervisada. Pago $700-900k MXN inicial + $50-70k 
     mensuales durante 42 meses totales.
   
   Tabla comparativa de qué incluye cada tier. Tier recomendado: 
   Operación Completa porque es donde Alquimia entrega el valor 
   diferencial.

3. Contrato modelo. Estructura obligatoria:
   - Cláusula primera: objeto y alcance (qué tier contrata).
   - Cláusula segunda: plazo y entregables por hito (mapeo a gates 
     G1-G5).
   - Cláusula tercera: contraprestación y forma de pago.
   - Cláusula cuarta: obligaciones del municipio (carga de 
     reglamento, consentimiento para encuestas, designación de 
     responsables).
   - Cláusula quinta: obligaciones de Alquimia (entregables, 
     plazos, soporte).
   - Cláusula sexta: confidencialidad y datos personales (LGPDPPSO).
   - Cláusula séptima: propiedad intelectual (Alquimia retiene su 
     metodología; el municipio recibe licencia de uso de los 
     documentos producidos).
   - Cláusula octava: rescisión y consecuencias.
   - Cláusula novena: jurisdicción y resolución de controversias.
   
   El contrato es BORRADOR para revisión por abogado especialista, 
   no documento firmable sin revisión legal.

4. Pasar el paquete por filtro de coherencia editorial: cero 
   palabras prohibidas, voz activa, frases cortas, Pyramid Principle.

CRITERIO DE CIERRE BINARIO
==========================
Tres documentos publicados en /docs/sales/. El founder puede llevar 
el pitch a una primera reunión con un prospecto municipal sin 
modificaciones. La propuesta económica tiene cifras coherentes con 
el modelo financiero interno. El contrato pasa revisión inicial de 
abogado especialista en derecho administrativo municipal.

LO QUE NO DEBES HACER
=====================
- No publicar nombres de prospectos en los documentos sin gate 
  humano.
- No inventar testimoniales ni casos de éxito.
- No declarar TIR específica del programa para el prospecto en el 
  pitch (cada municipio tiene su modelo); declarar rangos de 
  referencia.
- No declarar plazos imposibles (Cabildo en 4 semanas, escalamiento 
  completo en 12 meses); usar los plazos reales del Gantt operativo 
  (18-30 meses).

REPORTE DE CIERRE
=================
Publicar en /changelog/atlas.md con los tres documentos en versión 
final lista para uso comercial.
```

---

## PROMPT 8 · SUPREME — Ritual de cierre semanal

```
SUPREME

CONTEXTO ANTES DE ACTUAR
========================
Lee /docs/architecture/HOJA_DE_RUTA_ALQUIMIA.md completa. Tu nivel 
de autonomía es L4 para gobernanza interna del workforce; L5 
(founder) para cualquier decisión que afecte clientes, contratos o 
posicionamiento público.

TU MISIÓN
=========
Mantener disciplina de freeze en el proyecto. Cada lunes a las 8:00 
revisar el avance de la semana anterior, decidir qué cierra esta 
semana, qué se aparca, qué se abre. Producir un solo documento de 
decisión por semana.

PROTOCOLO SEMANAL
==================

PASO 1 · Inventario de cierres pendientes.
Listar para cada agente activo:
  - Tareas que se reportaron como cerradas la semana anterior
  - Tareas que quedaron abiertas
  - Si lo cerrado cumple criterio binario o no

PASO 2 · Verificación de criterios binarios.
Para cada tarea reportada como cerrada, verificar contra el criterio 
binario declarado en su prompt original. Si no cumple, regresarla a 
"abierta" y notificar al agente responsable.

PASO 3 · Decisión sobre lo abierto.
Para cada tarea abierta, decidir:
  - Cierra esta semana (mantiene prioridad)
  - Se aparca a backlog post-MVP
  - Se elimina por irrelevancia
  - Requiere decisión del founder

PASO 4 · Apertura de tareas nuevas.
Máximo tres tareas nuevas por semana. Cada una debe:
  - Pertenecer a uno de los cinco sprints declarados en la hoja de 
    ruta
  - Tener agente responsable identificado
  - Tener criterio binario declarado
  - Tener fecha estimada de cierre

PASO 5 · Producción del documento de decisión.
Archivo: /weekly/SUPREME_decisions_[YYYY-MM-DD].md

Estructura:
  ## Cerrado esta semana (con verificación cumplida)
  ## Reabierto (cierre no cumplió criterio)
  ## Aparcado a backlog post-MVP
  ## Eliminado por irrelevancia
  ## Abierto esta semana (máximo 3)
  ## Pendiente decisión del founder

GATES HUMANOS QUE NO PUEDES SALTAR
===================================
Cualquier tarea que toque:
  - Modificación al manifiesto público
  - Envío de email/SMS a cliente real
  - Firma de contrato
  - Compromiso de plazo a prospecto
  - Eliminación irreversible de datos
  - Modificación al precio comercial
Requiere gate humano del founder ANTES de que cualquier agente actúe.

CRITERIO DE CIERRE BINARIO POR SEMANA
======================================
Cada lunes a las 9:00 hay un archivo /weekly/SUPREME_decisions_
[YYYY-MM-DD].md con las cinco secciones llenas. Ninguna tarea 
abierta sin agente responsable. Ningún criterio binario sin 
verificación documentada.
```

---

## TABLA RESUMEN DE EJECUCIÓN

| Prompt | Agente | Sprint | Bloqueador | Tiempo estimado |
|---|---|---|---|---|
| 1 | KRONOS | 1 | Acceso roto bloquea todo | 2-3 días |
| 2 | OCCAM | 4 | Limpieza antes de venta | 3-5 días |
| 3 | HERMES (Antecedentes) | 2 | Antecedentes vivos para nuevos clientes | 5-7 días |
| 4 | HERMES (SMS) | 3 | Requiere KRONOS Sprint 1 terminado | 5-7 días |
| 5 | BIOS | 2-3 | Trazabilidad antes de exposición a clientes | 5-7 días |
| 6 | AURUM | 2 | M06 complementado con contenedores | 7-10 días |
| 7 | ATLAS | 5 | Materiales para venta | 5-7 días |
| 8 | SUPREME | Continuo | Disciplina semanal | Recurrente lunes |

Orden recomendado de ejecución: 1 → 2 paralelo con 5 → 3 paralelo con 6 → 4 → 7. SUPREME corre todas las semanas.

Cuando todos los prompts cierren con criterio binario verificado, el proyecto sale de modo construcción y entra a modo venta. Ese es el siguiente capítulo y se decide cuando llegue.

*Catálogo de prompts · Alquimia · 26 mayo 2026*
*Para uso de Cursor / Claude Code con workforce AI-first*
