# MVP CLOSURE · Secuencia corregida antes de ejecución

Estado: corregido por auditoria producto.
Decision: MVP Closure listo para ejecutar solo bajo esta secuencia corregida.

Este archivo sustituye la version anterior de cierre MVP. Su objetivo no es
implementar producto en este momento, sino dejar una secuencia ejecutable que
cierre una demo institucional sin romper la doctrina vigente de ALQUIMIA.

## Doctrina obligatoria para cualquier agente ejecutor

1. ALQUIMIA es multi-ciudad, no SLP-first.
2. SLP puede existir como fixture o caso de prueba, pero no como ciudad privilegiada.
3. Toda ciudad soportada debe generar el mismo indice documental y el mismo numero de documentos.
4. El contenido cambia por investigacion, cotejo, fuente, metodo, confianza, diagnostico y brechas.
5. Una ciudad con brechas conserva el paquete completo; las brechas se muestran como brechas criticas.
6. Benchmark no es estudio local.
7. Inferencia no es dato validado.
8. Estimacion no es verdad oficial.
9. Municipio, zona metropolitana, estado y nacional no son intercambiables.
10. Los nombres internos de agentes no aparecen en superficies cliente-facing.
11. Crear usuario y crear tenant/municipio oficial son procesos separados.
12. Gates, decisiones politicas y creacion oficial de tenants son humanos.
13. No se declara MVP cerrado sin pruebas en navegador, build/test/typecheck disponibles y evidencia visual.

## Archivos base obligatorios antes de ejecutar

Todo agente debe leer antes de tocar producto:

- `AJUSTES PARA FINIQUITAR/ADR-0010_stage_based_platform_separation.md`
- `AJUSTES PARA FINIQUITAR/PLATAFORMA_0_BACKOFFICE_SPEC.md`
- `AJUSTES PARA FINIQUITAR/MODULE_MATURITY_AND_PERSONALIZATION.md`
- `AJUSTES PARA FINIQUITAR/ROADMAP_MIGRACION_3_PLATAFORMAS.md`
- `AJUSTES PARA FINIQUITAR/AUTOMATION_AND_PERSONALIZATION_LAYER.md`
- `AJUSTES PARA FINIQUITAR/LEARNING_AND_FEEDBACK_LAYER.md`
- `AJUSTES PARA FINIQUITAR/FIELD_STUDIES_AND_MISSING_KPIS.md`

## 0. Auditoria critica de la version anterior

| Prompt anterior | Riesgo | Contradiccion detectada | Correccion requerida | Estado |
| --- | --- | --- | --- | --- |
| Prompt 1 · Cleanup | Limpiar antes de entender el contrato puede borrar rutas utiles o fixtures necesarios. | El cierre empezaba con eliminacion de codigo sin auditar el estado real contra la doctrina multi-ciudad. | Iniciar con auditoria de baseline, rutas, comandos, fixtures y contrato documental; no limpiar por intuicion. | PARTIAL |
| Prompt 2 · Clerk | Auth real era correcto, pero mezclaba creacion de usuario con acceso demo y podia confundirse con tenant oficial. | La doctrina separa usuario, tenant, Plataforma 0 y gates humanos. | Probar `/sign-up`, login, TOTP si aplica y redireccion; mantener creacion oficial de municipio como gate founder/admin. | PARTIAL |
| Prompt 3 · Landing/Pitch | Riesgo de marketing inflado y claims no sustentados. | Frases tipo "aprobado, implementado y operado" pueden leerse como promesa de resultado o validacion oficial. | Convertir landing en entrada institucional sobria, con demo clara, sin certificacion, ahorro garantizado ni nombres internos de agentes. | FAIL |
| Prompt 4 · Titulos + research | Riesgo alto de convertir busqueda externa en verdad municipal. | La version anterior permitia "aceptar como dato" resultados de Perplexity/research. | Toda investigacion externa debe registrar fuente, fecha, metodo y confianza; si no basta, queda como inferencia o brecha critica; requiere revision humana. | FAIL |
| Prompt 5 · Demo access | Riesgo de MVP SLP-first. | Declaraba SLP como tenant precargado con datos reales y ejemplo unico. | Demo con al menos tres perfiles de ciudad: datos completos, datos parciales y brechas criticas; SLP solo como fixture no privilegiado. | FAIL |
| Criterios de cierre | Riesgo de cerrar sin evidencia visual ni multi-ciudad. | No exigia mismo indice documental por ciudad, pruebas navegador ni busqueda de nombres internos cliente-facing. | Agregar QA visual, pruebas browser, consola, build/test/typecheck, paquetes documentales homogeneos y auditoria de nombres internos. | FAIL |

## 1. Cambios obligatorios aplicados a la secuencia

- Se elimina el criterio "SLP como ejemplo unico" y se reemplaza por demo multi-ciudad.
- Se exige mismo indice documental y mismo numero de documentos para toda ciudad soportada.
- Se separa creacion de cuenta de usuario de creacion oficial de tenant/municipio.
- Se agrega subfase obligatoria de QA visual y aprovechamiento de pantalla.
- Se prohibe presentar research externo como dato validado automaticamente.
- Se prohibe mostrar nombres internos de agentes en cliente-facing.
- Se restringe la landing a entrada institucional sobria, no pitch comercial inflado.
- Se agrega cierre binario con pruebas en navegador, consola y comandos disponibles.

---

# Secuencia MVP Closure corregida

## Prompt 0 · Auditoria de baseline MVP y contrato multi-ciudad

### Objetivo

Auditar el estado real del repo antes de implementar. Identificar rutas, comandos,
fixtures, contrato documental y riesgos contra la doctrina vigente.

### Acciones

1. Leer los siete archivos base obligatorios.
2. Revisar rutas principales del producto:
   - `/`
   - `/sign-in`
   - `/sign-up`
   - `/v`
   - `/p`
   - `/e`
   - `/admin` si existe.
3. Inspeccionar:
   - `package.json`
   - frontend/backend package files si existen
   - configuracion de auth
   - fixtures o datos demo
   - generacion/export de documentos
   - rutas de tenant/state/gates
   - textos cliente-facing.
4. Identificar si existe contrato documental comun por ciudad.
5. Identificar comandos reales de:
   - build
   - test
   - lint
   - typecheck.

### No implementar

- No limpiar codigo todavia.
- No instalar Clerk todavia.
- No crear landing todavia.
- No tocar datos demo todavia.
- No crear tenants oficiales automaticamente.

### Cierre binario

PASS solo si queda documentado:

- rutas reales;
- comandos disponibles;
- estado de auth;
- estado de demo;
- estado de generacion documental;
- brechas multi-ciudad;
- apariciones cliente-facing de nombres internos;
- riesgos antes de editar.

Si no hay evidencia, estado FAIL.

---

## Prompt 1 · Auth real y separacion usuario vs tenant

### Objetivo

Hacer que la creacion de cuenta de usuario funcione de verdad sin convertirla en
alta automatica de municipio oficial.

### Reglas

Crear usuario y crear tenant/municipio oficial son procesos distintos.

#### A. Crear cuenta de usuario

- `/sign-up` debe permitir crear cuenta real con email/password si el proveedor de auth esta configurado.
- La cuenta debe poder iniciar sesion en `/sign-in`.
- Si Clerk u otro proveedor con TOTP esta activo, TOTP debe poder configurarse y probarse.
- Despues de login, el usuario debe redirigir a la experiencia correcta:
  - demo/onboarding si no tiene tenant oficial;
  - plataforma asignada si tiene tenant y etapa;
  - no debe entrar a Plataforma 0 si no es admin/founder.

#### B. Crear tenant/municipio

- Crear municipio oficial requiere gate humano founder/admin.
- Si Plataforma 0 completa no existe, no inventar self-service oficial.
- Una cuenta nueva puede entrar a modo onboarding/demo.
- Una cuenta nueva no puede crear municipio oficial ni datos oficiales sin revision humana.

### No implementar

- No crear tenant oficial self-service.
- No dar acceso admin a usuarios demo.
- No ocultar errores de auth con mocks que parezcan reales.
- No declarar TOTP probado si el proveedor no esta configurado.

### Cierre binario

PASS solo si hay evidencia navegador de:

- `/sign-up` crea usuario real o documenta bloqueo de proveedor;
- login funciona;
- logout/re-login funciona;
- TOTP funciona si esta configurado;
- usuario sin tenant no crea municipio oficial;
- acceso admin queda bloqueado para no-admin;
- consola sin errores relevantes.

Si Clerk/auth no esta configurado, marcar PARTIAL o FAIL segun impacto y documentar decision founder requerida.

---

## Prompt 2 · Demo multi-ciudad y contrato documental homogeneo

### Objetivo

Eliminar el cierre SLP-first y demostrar que ALQUIMIA opera como plataforma
multi-ciudad con metodologia comun y contenido personalizado por evidencia.

### Perfiles minimos de ciudad

La demo debe permitir probar al menos tres perfiles:

1. Ciudad con datos relativamente completos.
2. Ciudad con datos parciales.
3. Ciudad con brechas criticas.

SLP puede ser uno de los perfiles, pero no puede tener trato privilegiado ni ser
la plantilla unica.

### Contrato documental obligatorio

Todas las ciudades soportadas deben producir:

- mismo indice documental;
- mismo numero de documentos;
- misma secuencia;
- mismos encabezados principales;
- misma ubicacion para fuentes;
- misma ubicacion para brechas criticas;
- misma ubicacion para decisiones humanas;
- misma ubicacion para claims bloqueados.

El contenido puede variar por:

- investigacion disponible;
- fuente;
- fecha;
- metodo;
- confianza;
- datos validados;
- inferencias;
- benchmarks;
- estudios locales;
- KPIs faltantes;
- diagnostico municipal;
- brechas criticas;
- recomendaciones condicionadas.

### Reglas

- Una ciudad con menos datos no produce menos documentos.
- Si falta estudio local, se declara brecha critica.
- Si solo hay benchmark, no se presenta como estudio local.
- Si hay inferencia, debe mostrar fuente, fecha, metodo y confianza.
- Municipio, ZM, estado y nacional deben verse separados.

### No implementar

- No hardcodear copy de SLP como verdad generica.
- No eliminar documentos cuando falten datos.
- No rellenar brechas con narrativa.
- No mostrar datos de una ciudad como comparables identificables de otra.

### Cierre binario

PASS solo si:

- los tres perfiles existen o queda bloqueo explicito;
- cada perfil genera el mismo indice;
- cada perfil genera el mismo numero de documentos;
- las brechas aparecen como brechas criticas;
- SLP no tiene ruta o privilegio especial;
- el paquete/documento generado conserva fuente, metodo, fecha y confianza donde aplica.

---

## Prompt 3 · Entrada publica sobria y demo clara

### Objetivo

Crear o ajustar la entrada publica solo si es necesaria para que el founder pueda
compartir una demo sin claims inflados.

### Reglas de lenguaje

La pagina publica puede decir:

- "ALQUIMIA ordena evidencia, brechas y escenarios para gestion institucional de residuos."
- "La plataforma distingue datos validados, inferencias, benchmarks y brechas criticas."
- "Las decisiones publicas y gates requieren revision humana."
- "La demo muestra funcionamiento metodologico; no certifica resultados oficiales."

La pagina publica no puede decir:

- "ALQUIMIA certifica resultados."
- "Ahorro garantizado."
- "Validado oficialmente."
- "La plataforma aprueba el programa."
- "La IA decide."
- nombres internos de agentes.

### CTA permitidos

- "Explorar demo"
- "Solicitar acceso"
- "Crear cuenta"
- "Revisar metodologia"

### No implementar

- No pitch deck visual.
- No marketing inflado.
- No promesas de certificacion, ahorro, impacto o aprobacion oficial.
- No nombres internos de agentes.
- No convertir `/admin` o Plataforma 0 en experiencia publica.

### Cierre binario

PASS solo si:

- `/` existe o se documenta su alternativa;
- el lenguaje es sobrio e institucional;
- hay acceso claro a demo o sign-up;
- no hay claims no sustentados;
- no hay nombres internos de agentes;
- consola sin errores relevantes en navegador.

---

## Prompt 4 · Titulos, research y evidencia sin convertir busqueda en verdad

### Objetivo

Mejorar titulos y flujo de investigacion sin permitir que resultados externos se
presenten como datos municipales validados.

### Reglas para titulos

- Pueden ser mas humanos, claros e institucionales.
- No deben prometer resultado.
- No deben ocultar brechas.
- No deben mezclar municipio/ZM.

### Reglas para research

Si se conserva un flujo de investigacion externa:

- no aceptar resultados como dato validado automaticamente;
- cada respuesta debe registrar fuente;
- cada respuesta debe registrar fecha de consulta;
- cada respuesta debe registrar metodo de obtencion;
- cada respuesta debe registrar nivel de confianza;
- si la fuente no es oficial o suficiente, marcar inferencia o brecha;
- no crear verdad municipal desde busqueda externa;
- no publicar sin revision humana.

### Acciones de usuario permitidas

Usar etiquetas como:

- "Guardar como inferencia preliminar"
- "Enviar a revision humana"
- "Marcar como brecha critica"
- "Adjuntar fuente"
- "Rechazar como evidencia insuficiente"

No usar:

- "Aceptar como dato"
- "Validar automaticamente"
- "Publicar como oficial"

### No implementar

- No integrar research como fuente oficial automatica.
- No inferir campos sensibles o privados.
- No sustituir estudio local con busqueda.
- No publicar resultados externos sin revision.

### Cierre binario

PASS solo si:

- un resultado de investigacion muestra fuente, fecha, metodo y confianza;
- fuente insuficiente se marca como inferencia o brecha;
- no existe accion cliente-facing que convierta busqueda en dato validado;
- un humano debe validar cualquier claim fuerte;
- no aparecen nombres internos de agentes.

---

## Prompt 5 · Visual QA · Aprovechamiento de pantalla, layout y cero errores visibles

### Objetivo

Verificar que la demo se puede compartir sin errores visuales, pantallas pobres,
texto cortado ni composicion improvisada.

### Viewports obligatorios

- Desktop 1440px.
- Laptop 1280px.
- Tablet.
- Mobile.

### Rutas minimas

- `/`
- `/sign-in`
- `/sign-up`
- `/v`
- `/p`
- `/e`
- `/admin` si existe
- flujo de creacion de cuenta
- flujo demo
- al menos un modulo con brecha critica
- al menos un paquete/documento generado.

### Verificaciones visuales

- No texto arrinconado injustificadamente.
- No cards dentro de cards.
- No secciones importantes comprimidas.
- No overflow horizontal.
- No texto cortado.
- No botones con texto desbordado.
- No espacios muertos que reduzcan claridad.
- No apariencia SaaS generica.
- Jerarquia Minto/McKinsey: conclusion primero, detalle despues.
- Uso sobrio de color en cifras y texto.
- No fondos decorativos innecesarios.
- Screenshots de rutas clave.
- Consola sin errores relevantes.

### No implementar

- No redisenar por gusto.
- No agregar decoracion para llenar espacio.
- No ocultar advertencias para que se vea limpio.
- No sacrificar trazabilidad por estetica.

### Cierre binario

PASS solo si:

- hay screenshots de cada viewport critico;
- no hay overflow horizontal;
- no hay texto cortado;
- no hay botones rotos;
- las brechas criticas son visibles;
- el paquete documental es legible;
- no quedan errores relevantes en consola;
- la UI usa bien la pantalla sin parecer landing generica.

---

## Prompt 6 · Demo final multi-ciudad sin paywall y sin admin publico

### Objetivo

Permitir que el founder comparta una demo funcional, completa y segura, sin
exponer Plataforma 0 ni permitir cambios oficiales.

### Reglas

- El modo demo debe mostrar la plataforma completa sin paywall.
- El modo demo no da acceso a Plataforma 0 admin.
- El modo demo no permite modificar datos oficiales.
- El modo demo permite probar varias ciudades/perfiles.
- El modo demo mantiene mismo indice documental.
- El modo demo muestra brechas criticas cuando falta informacion.
- El modo demo no depende solo de SLP.
- El modo demo no muestra nombres internos de agentes.

### Experiencias minimas

- Perfil con datos completos.
- Perfil con datos parciales.
- Perfil con brechas criticas.
- Paquete/documento generado para cada perfil.
- Modulo con benchmark visible como benchmark.
- Modulo con inferencia visible como inferencia.
- Modulo con brecha critica visible como brecha critica.

### No implementar

- No paywall en demo.
- No admin publico.
- No cambios oficiales desde demo.
- No datos privados de otro tenant.
- No SLP como excepcion.
- No claims oficiales.

### Cierre binario

PASS solo si:

- demo carga sin login o con cuenta demo controlada, segun decision del producto;
- no expone admin;
- perfiles multi-ciudad funcionan;
- cada perfil genera mismo indice y numero de documentos;
- brechas criticas se ven;
- consola sin errores relevantes;
- screenshots incluidos.

---

## Prompt 7 · Cierre MVP con evidencia de navegador, build y claims

### Objetivo

Declarar el MVP cerrado solo si existe evidencia tecnica, visual, documental y
metodologica.

### Comandos

Ejecutar solo comandos disponibles en el repo. No inventar scripts.

Verificar:

- build;
- tests;
- lint;
- typecheck;
- pruebas especificas de auth si existen;
- pruebas de generacion documental si existen;
- busqueda de nombres internos cliente-facing;
- pruebas navegador de rutas clave.

Si un comando no existe, marcar NOT AVAILABLE.
Si falla, registrar salida y causa probable.

### Criterio final corregido

El MVP Closure solo puede cerrar si:

- crear cuenta funciona;
- login funciona;
- TOTP funciona si Clerk/proveedor esta configurado;
- demo funciona;
- varias ciudades/perfiles funcionan bajo mismo indice documental;
- no quedan nombres internos de agentes cliente-facing;
- Visual QA pasa en desktop y mobile;
- no hay errores visibles en consola relevantes;
- build/test/typecheck disponibles pasan;
- todo claim tiene fuente, metodo, fecha, confianza o brecha;
- no se usa SLP como excepcion;
- founder puede compartir demo sin explicar "esto todavia esta roto".

### Decision de cierre

Usar solo:

- `MVP CLOSURE: PASS`
- `MVP CLOSURE: FAIL`

No usar:

- "casi listo";
- "listo con detalles";
- "pendiente menor";
- "suficientemente bueno".

---

# Cosas que NO deben ejecutarse todavia

- No limpiar codigo antes de auditoria de baseline.
- No instalar Clerk ni otro auth provider sin decision de proveedor y variables necesarias.
- No crear tenant/municipio oficial self-service.
- No publicar Plataforma 0 como ruta cliente.
- No crear landing comercial inflada.
- No usar SLP como unico caso demo.
- No tratar research externo como dato validado.
- No sustituir estudio local con benchmark.
- No ocultar brechas criticas.
- No mostrar nombres internos de agentes en cliente-facing.
- No publicar datos cross-tenant identificables.
- No publicar patrones de aprendizaje sin N suficiente, bias check, founder gate y trazabilidad.
- No prometer ahorro, impacto, certificacion o validacion oficial sin evidencia.
- No declarar cierre sin pruebas navegador.
- No hacer reset destructivo ni borrar legacy irreversible.

# Decision final de esta correccion

La version anterior de `MVP_CLOSURE_PROMPT_SEQUENCE.md` no estaba lista para
ejecutarse: era SLP-first, permitia research como dato, exponia nombres internos
en superficies cliente-facing, mezclaba auth con tenant y no exigia QA visual.

Con esta correccion documental, la secuencia MVP Closure queda lista para
ejecucion controlada.

Decision: `MVP Closure listo para ejecutar`.
