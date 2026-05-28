# AUTOMATION AND PERSONALIZATION LAYER · Capa de automatización del servicio consultivo

**Estado:** Propuesto · Pendiente de firma del founder
**Fecha:** 27 mayo 2026
**Dependencias:** ADR-0010 firmado, Plataforma 0 spec aceptado, Module Maturity aceptado, Capability Registry v2.0.0
**Construye:** HERMES (pipelines de inferencia), KRONOS (motor de ejecución), KOSMOS (validación), AUDITOR (trazabilidad)

---

## 1 · Propósito

Este documento define cómo Alquimia opera como **consultor automatizado** — no como simulador, no como plantilla, no como hoja de cálculo sofisticada. La distinción importa porque determina si la plataforma escala a 15,000 municipios o si requiere trabajo manual del founder por cada nuevo cliente.

La premisa central es simple: cualquier municipio mexicano que firme contrato con Alquimia debe recibir, desde el primer login, el mismo nivel de servicio automatizado. San Luis Potosí, Querétaro, Mérida o un municipio rural de Oaxaca acceden a las mismas capacidades técnicas. Lo único que cambia son sus datos específicos.

Lo que el sistema hace por cuenta propia es lo que un consultor humano haría si tuviera infinito tiempo: investigar el contexto del cliente desde fuentes públicas, precargar diagnósticos preliminares, generar escenarios, detectar riesgos, vigilar desviaciones, preparar borradores. Lo que requiere humano es lo que requiere juicio político o autoridad institucional: firmar, aprobar, decidir, comunicar oficialmente.

---

## 2 · Principios no negociables

**Mismo servicio para todos.** Capability Registry v2.0.0 define qué módulos están activos por tier comercial. Dentro del mismo tier, dos municipios reciben exactamente la misma maquinaria. No hay "versión premium" del motor de inferencia para clientes grandes.

**Datos confidenciales por tenant.** Lo público se comparte (benchmarks anonimizados, patrones agregados). Lo privado nunca cruza tenants. SLP no ve los datos de Querétaro. El cabildo de un municipio no es accesible para otro municipio bajo ninguna circunstancia.

**Autoinferencia honesta.** Cuando el sistema precarga datos desde fuentes públicas, marca explícitamente esa precarga como "datos preliminares pendientes de validación". Nunca presenta inferencia como dato verificado.

**Trazabilidad total.** Cada cifra inferida lleva fuente, fecha, método. M19 (click-to-source) opera para datos inferidos igual que para datos cargados por el cliente.

**Humano firma decisiones, máquina hace análisis.** El motor produce recomendaciones, no decisiones. El cabildo vota, el síndico firma, el alcalde decide. La plataforma prepara el material para que esa decisión sea informada y rápida.

---

## 3 · Las tres capas del motor automatizado

### 3.1 Capa de inferencia inicial (entry-time inference)

Se ejecuta una vez, cuando un nuevo tenant entra a la plataforma. Su objetivo es que el primer login del cliente sea un primer login con valor — no una pantalla vacía pidiendo cargar datos.

**Disparador:** Founder crea tenant nuevo en Plataforma 0 con campos mínimos (nombre del municipio, estado, clave INEGI).

**Proceso:** HERMES lanza pipeline de inferencia que consulta fuentes públicas y precarga los módulos correspondientes.

**Fuentes públicas consultadas:**

| Fuente | Qué se extrae | Módulos que alimenta |
|---|---|---|
| INEGI Censo 2020 | Población, viviendas, ocupantes promedio, AGEBs | M01, M02, M03C |
| INEGI Encuesta Intercensal | Distribución de edades, nivel educativo, marginación | M02, M02B |
| CONAPO | Población proyectada actual | M01, M02 |
| SEMARNAT | Factores de emisión, NOMs aplicables | M01, M16 |
| Periódico Oficial del Estado | Reglamento de limpia vigente, reformas recientes | M03B, M00B |
| Plataforma Nacional de Transparencia | Presupuesto municipal, organigrama público | M03, M07, M00B |
| Sitios web oficiales municipales | Cabildo, regidores, comisiones, agenda pública | M00B, M02D |
| Prensa local 24 meses | Noticias RSU, posicionamientos políticos, conflictos | M02C, M00B |
| INAFED (Sistema Nacional de Información Municipal) | Datos estructurales del municipio | M00B, M03 |
| DENUE INEGI | Establecimientos por giro (recicladoras, comercios) | M10, M06 |
| CFE | Tarifa industrial aplicable | M09 |
| Banxico | Tipo de cambio, inflación, tasa de referencia | M09, M13 |

**Output esperado:**

Al terminar el pipeline (estimado 5-15 minutos por municipio según volumen de fuentes), el tenant tiene precargados:

- M00B con presidente municipal, periodo, partido, integración del cabildo, reglamento vigente.
- M01 con población actualizada, viviendas, generación per cápita estimada según promedio nacional y composición típica de residuos para el tamaño de municipio.
- M02 con demografía completa, distribución por edades, nivel educativo, índice de marginación.
- M02C con primer mapeo preliminar de 15 actores clave: cargos públicos relevantes, presencia de cámaras empresariales, ONGs ambientales locales identificadas en prensa, prensa local con cobertura RSU.
- M03 con presupuesto municipal según última Ley de Egresos del estado.
- M03B con reglamento de limpia vigente cargado, identificación preliminar de los tres artículos faltantes mediante análisis comparativo contra reglamentos modelo.
- M04 con costo de la omisión estimado según factores SEMARNAT y población.
- M06 con identificación preliminar de potenciales sitios para centros de acopio usando DENUE.
- M07 con organigrama público de la dirección de servicios públicos según transparencia municipal.
- M09 con CAPEX y OPEX estimados según benchmarks anonimizados de municipios comparables.
- M10 con recicladoras locales identificadas vía DENUE y precios de mercado promedio.

**Marcado de confianza:** cada cifra precargada lleva uno de tres estados:
- `verified` — dato oficial verificado contra fuente primaria (raro en esta capa).
- `inferred_high_confidence` — dato extraído directamente de fuente oficial (INEGI, Periódico Oficial). Marcado verde.
- `inferred_medium_confidence` — dato extrapolado de benchmarks o cálculos sobre fuentes oficiales. Marcado amarillo.
- `inferred_low_confidence` — dato estimado por similitud con municipios comparables. Marcado naranja, requiere validación humana antes de usarse en expediente formal.

**Tiempo de ejecución máximo:** 15 minutos. Si excede, el pipeline guarda lo que tenga y marca el resto como pendiente. El cliente puede entrar a la plataforma con datos parciales y el pipeline continúa en background.

**Lo que NO infiere la capa inicial:**

- Cifras del concesionario actual (información comercial confidencial del municipio).
- Posturas políticas internas del cabildo (requiere conversación con el cliente).
- Datos operativos reales (toneladas recolectadas, rutas actuales). Estos solo los tiene el municipio.
- Cualquier dato que requiera consentimiento explícito del cliente para ser cargado.

### 3.2 Capa de operación continua (runtime automation)

Una vez el tenant está poblado, el motor opera continuamente. No espera instrucción humana para correr.

**Triggers automáticos:**

| Evento | Acción del motor | Frecuencia |
|---|---|---|
| Cliente carga datos nuevos en cualquier módulo | Recalcula módulos dependientes según `produces_data_for` del Capability Registry | Inmediato |
| Cifra cargada por cliente difiere >20% de inferida | Marca discrepancia, sugiere revisión | Inmediato |
| KPI operativo se desvía del comprometido en Cabildo | Genera alerta WhatsApp al rol responsable | Diaria |
| Próximo gate G1-G5 está a menos de 30 días | Prepara borrador de expediente, lista evidencia faltante | Diaria |
| Nuevo dato disponible en fuente pública relevante | Actualiza dato precargado, notifica al cliente del cambio | Semanal |
| Cabildo del municipio cliente sesiona | Prepara resumen ejecutivo de cifras relevantes para esa sesión | Día previo |
| Cierra mes operativo | Genera borrador de reporte mensual GRI 306 | Día 1 del mes siguiente |
| Patrón cross-tenant emerge | Notifica al founder en Plataforma 0 para evaluar si compartirlo como insight con clientes | Semanal |

**Motor de recomendación por módulo:**

| Módulo | Qué recomienda automáticamente |
|---|---|
| M01 | Escenario óptimo (Ambicioso/Moderado/Conservador/Pesimista) según horizonte declarado y perfil del municipio |
| M02C | Estrategia de acercamiento por actor según influencia y postura inferida |
| M03B | Texto exacto de los tres artículos faltantes basado en benchmarks de reglamentos exitosos |
| M04 | Argumento financiero más fuerte según composición del Cabildo |
| M05 | Cronograma óptimo según restricciones del calendario electoral local |
| M06 | Ubicación óptima de centros de acopio mediante análisis geoespacial de DENUE + demografía |
| M08 | Diseño de rutas según mapa del municipio y zonas atendidas |
| M13 | Escenario financiero con mayor TIR defendible |
| M14 | Riesgos prioritarios con mitigaciones específicas |
| M17 | Detección automática de desviación proyectado vs real |
| M18 | Temas materiales relevantes según operación del cliente |
| M21 | Riesgos materializados, gates próximos, decisiones pendientes |

**Las recomendaciones siempre incluyen:**
- Recomendación específica (no "considera optimizar rutas" sino "ruta R-3 puede reducirse 18% reorganizando los puntos 12 y 17").
- Justificación con fuente.
- Trade-offs explícitos.
- Botón para que el humano acepte, rechace o ajuste.

### 3.3 Capa de generación de documentos (document automation)

Esta capa es la que más se siente como consultor real. Cuando llega el momento de producir un documento formal, el motor lo genera y el humano edita.

**Documentos auto-generables:**

| Documento | Trigger | Edita |
|---|---|---|
| Borrador de expediente Cabildo | Cliente solicita o gate G1 está próximo | Founder + cliente revisan, ajustan, aprueban |
| Reglamento reformado (3 artículos faltantes) | Cliente solicita al cerrar M03B | Jurídico del municipio aprueba |
| Acuerdo de Cabildo | Cliente solicita al cerrar M15 | Secretario del Ayuntamiento valida |
| Adenda de concesión | Gate G2 próximo | Jurídico municipal + concesionario |
| Reporte mensual ESG | Día 1 de cada mes | Cliente valida cifras |
| Reporte anual GRI 306 | Anual | Cliente valida, opcional auditoría externa |
| Reporte de doble materialidad (M18) | Anual o cuando se solicita ante banca multilateral | Cliente + opcional auditor externo |
| Oficios estándar de notificación | Trigger según gate específico | Cliente firma |
| Convocatorias de sesión de comisión | Día previo a sesión | Secretario técnico ajusta agenda |
| Minutas de sesión | Post-sesión, basado en grabación o transcripción | Secretario técnico valida |
| Comunicados de prensa | Cliente solicita al cerrar hito relevante | Comunicación social municipal aprueba |
| Convocatoria ciudadana al programa | Inicio de oleada territorial | Cliente valida idioma y canales |

**Cada documento auto-generado:**

- Usa los datos reales del tenant.
- Cita estándares aplicables (GRI, ISO, PMI, CSRD) según `standards_map.json` del MARCOS.
- Marca explícitamente las secciones que requieren validación humana.
- Permite versionado y rastro de cambios.
- Se guarda en A6 (Documentación generada) de Plataforma 0.

---

## 4 · Arquitectura técnica de la automatización

### 4.1 Stack de pipelines

- **HERMES** orquesta los pipelines de inferencia inicial. Usa Inngest (ya en stack según ADR-0003) para ejecución asíncrona con retry y observabilidad.
- **KRONOS** ejecuta los triggers de runtime automation y la generación de documentos. Listener de eventos de la base de datos (cambios en `tenant_state`, en módulos, en gates) dispara acciones.
- **KOSMOS** valida que cada inferencia respeta el schema declarado en Capability Registry. Rechaza inferencias que violan tipos o rangos.
- **AUDITOR** mantiene trazabilidad de cada inferencia. Para cada cifra inferida, registra: fuente, fecha de extracción, método, nivel de confianza.

### 4.2 Datos públicos versus datos del tenant

Dos almacenes separados con políticas distintas:

**Public Knowledge Base.** Datos extraídos de fuentes públicas, normalizados, indexados por municipio. Refresh periódico (semanal para datos volátiles como prensa, mensual para datos institucionales como organigrama, anual para datos estructurales como reglamentos). Accesible para inferencia de cualquier tenant.

**Tenant Private Store.** Datos cargados por el cliente o derivados de operación real. Encriptados en reposo y en tránsito. Acceso restringido al tenant propietario, al founder vía Plataforma 0, y a procesos automáticos del motor para ese tenant específico. Nunca cruza tenants sin consentimiento explícito y anonimización previa.

### 4.3 El data moat operativo

Plataforma 0 puede ejecutar análisis cross-tenant sobre datos anonimizados. Esto es lo que construye la ventaja competitiva irreplicable:

- Cuando un patrón emerge en tres o más municipios, el motor lo identifica.
- El founder evalúa si ese patrón debe convertirse en insight ofrecido a otros clientes.
- Si se convierte, entra como recomendación automática en módulos relevantes con fraseo del tipo "Según análisis de N municipios comparables, X tiende a Y. Considera ajustar Z."
- Nunca se exponen datos identificables de tenants origen.

Esto es el equivalente Mexicano de lo que Veeva construyó para farmacéuticas. Después del cliente número diez, la calidad de las recomendaciones que recibe el cliente once es desproporcionadamente mejor que la que recibiría con cualquier consultora tradicional, porque la consultora tradicional no tiene patrones agregados de operación real.

---

## 5 · El primer login del cliente nuevo

Esta es la experiencia operativa que define si Alquimia se siente como consultor automatizado o como software empresarial vacío.

**Día 1, hora 0.** Founder firma contrato con municipio nuevo.

**Día 1, hora 0+5 minutos.** Founder crea tenant en Plataforma 0 con tres campos: nombre del municipio, estado, clave INEGI.

**Día 1, hora 0+5 minutos.** HERMES dispara pipeline de inferencia inicial. Founder recibe email "Inferencia inicial en curso, completará en 15 minutos."

**Día 1, hora 0+20 minutos.** Pipeline completa. Founder recibe email "Inferencia inicial completada. 73 cifras precargadas con confianza alta, 31 con confianza media, 14 pendientes de validación humana. El cliente puede acceder."

**Día 1, hora 0+25 minutos.** Founder envía credenciales al cliente con un breve mensaje de bienvenida.

**Día 1, hora variable.** Cliente accede por primera vez. Lo que ve:

- M00 con guía de lectura personalizada al nombre del municipio.
- M00B con su presidente municipal nombrado, partido, periodo, cabildo con regidores identificados, reglamento de limpia vigente cargado. Sello "Inferido desde fuentes públicas, requiere validación".
- M01 con cifras de población actuales, generación per cápita estimada, gráficas vivas con escenarios. Sello "Precargado, ajustable".
- M02 con demografía completa y mapa preliminar de actores. Sello en M02C "15 actores identificados, requiere refinamiento con conocimiento local".
- M03B con análisis preliminar de los tres artículos faltantes. Sello "Análisis comparativo, requiere validación jurídica".
- M04 con costo de la omisión cuantificado.
- M13 con escenarios financieros precargados.

**El cliente no ve módulos vacíos.** El cliente ve un diagnóstico preliminar del programa RSU de su municipio en menos de 30 minutos desde la firma del contrato. Esto es lo que diferencia consultor automatizado de software empresarial.

**Lo que el cliente hace en sus primeras horas:**

- Valida y ajusta lo precargado. La plataforma marca cada validación.
- Carga lo confidencial (cifras del concesionario actual, datos operativos reales).
- Sube documentos específicos (contratos de concesión vigentes, planes municipales).

**Lo que el motor hace mientras el cliente trabaja:**

- Recalcula automáticamente módulos dependientes cuando hay cambios.
- Sugiere ajustes cuando detecta inconsistencias.
- Prepara borrador del expediente Cabildo si el cliente declara intención de ir a Cabildo en menos de 60 días.

---

## 6 · Casos de uso operativos

### 6.1 Querétaro firma contrato

Founder crea tenant. Pipeline corre 12 minutos. Carga:
- Población de Querétaro Capital 2024 (CONAPO).
- Composición del Cabildo según última elección.
- Reglamento de Aseo Público vigente.
- Empresa concesionaria identificada por prensa (Promotora Ambiental S.A. o quien aplique según verificación).
- Estimación de generación per cápita por benchmarks de capitales mexicanas comparables.
- Costo de la omisión estimado en 47M MXN anuales según factores SEMARNAT.

Cliente abre plataforma 30 minutos después de la firma. Ve diagnóstico preliminar de su programa RSU.

### 6.2 Municipio rural pequeño firma contrato

Mismo proceso. Pipeline puede tomar más tiempo porque algunas fuentes (Periódico Oficial estatal, transparencia municipal) son más difíciles de extraer en municipios pequeños. Sistema marca con honestidad qué está poblado y qué no. Cliente ve los módulos relevantes para su tamaño con datos disponibles, y el sistema sugiere qué información debe aportar el cliente para completar.

### 6.3 Cliente activo durante sesión de Cabildo

Día previo a sesión: motor genera borrador de resumen ejecutivo con KPIs relevantes, riesgos materializados ese mes, decisiones pendientes que tocan al programa.

Cliente edita, ajusta, imprime para el secretario del Ayuntamiento. Llega a la sesión con material defendible.

### 6.4 Desviación de KPI detectada

Motor detecta que toneladas valorizadas del mes están 23% por debajo de comprometido en Cabildo. Genera alerta WhatsApp al Director de Servicios Públicos. Genera tarjeta en M17 con análisis de causas probables basado en patrones cross-tenant. Sugiere acciones correctivas. Si la desviación persiste tres meses, genera riesgo formal en M21.

---

## 7 · Lo que NO automatiza el sistema

Por diseño, no por limitación técnica. La distinción importa.

**Decisiones políticas.** Quién vota qué en Cabildo. Cómo se presenta el programa ante el partido en el poder. Negociación con el concesionario actual. El sistema prepara material para esas decisiones; no las toma.

**Negociaciones comerciales.** Términos del contrato con el municipio cliente. Precios de capabilities adicionales. Términos de concesión. Founder negocia, sistema documenta.

**Comunicación oficial firmada.** Oficios firmados, comunicados de prensa publicados, acuerdos formales. El sistema genera borradores, el humano firma.

**Juicio editorial fino.** Los principios editoriales de la Hoja de Ruta (conclusión primero, sin bloques anidados, color tipográfico controlado) son verificados parcialmente por POLIS pero los juicios finos requieren humano.

**Resolución de conflictos.** Si dos cifras de fuentes distintas no coinciden, el sistema marca el conflicto; humano decide cuál usar.

---

## 8 · Criterios binarios de cierre de esta capa

La capa de automatización está cerrada cuando se cumplen las siguientes condiciones operativas:

1. Founder crea tenant nuevo en menos de 60 segundos con tres campos.
2. Pipeline de inferencia inicial completa en menos de 15 minutos para 95% de los municipios mexicanos.
3. Cliente accede por primera vez y ve al menos siete módulos con datos precargados marcados honestamente por nivel de confianza.
4. Motor de runtime automation corre los triggers automáticos sin intervención humana.
5. Generación automática de documentos produce primer borrador funcional del expediente Cabildo en menos de cinco minutos cuando se solicita.
6. Trazabilidad M19 click-to-source opera para datos inferidos igual que para datos cargados.
7. Datos del tenant nunca son visibles para otros tenants en ningún path de código.
8. Plataforma 0 puede ejecutar análisis cross-tenant sobre datos anonimizados.
9. Cero municipios requieren trabajo manual del founder para arrancar más allá de la creación inicial del tenant.

Si cualquiera de estos nueve criterios falla, la capa no está cerrada y la promesa de "consultor automatizado" no se cumple.

---

## 9 · Implementación en el roadmap existente

Esta capa no es un proyecto separado. Se integra con el roadmap del ADR-0010:

- **Fase 1 (Plataforma 0 MVP).** A4 Capability Registry editor preserva los hooks para automatización por módulo.
- **Fase 2 (Backend tenant).** Endpoints `/admin/tenants/:id/inference/start` y `/admin/tenants/:id/inference/status` activos.
- **Fase 4 (Migración SLP).** Pipeline de inferencia inicial se prueba contra SLP cuyos datos reales ya conocemos. Si el pipeline reproduce los datos de SLP con razonable fidelidad, está validado.
- **Fase 6 (Personalización granular).** HERMES construye el pipeline completo para los tres municipios de prueba (SLP, Monterrey, Guanajuato Capital o Querétaro).
- **Fase 7 (Aceptación final).** AUDITOR verifica los nueve criterios de la sección 8.

No agrega semanas al roadmap. Reasigna trabajo dentro de las fases existentes. HERMES, KRONOS y KOSMOS ya tienen carga asignada; esta capa especifica con más detalle qué construyen.

---

## 10 · Gates humanos para esta capa

**Gate founder uno.** Aprobación de las fuentes públicas listadas en sección 3.1. Si alguna fuente es problemática (legal, técnica, política), se retira antes de construir el pipeline.

**Gate founder dos.** Aprobación de los triggers automáticos listados en sección 3.2. Cada trigger es una promesa al cliente; el founder valida que la promesa se puede cumplir.

**Gate founder tres.** Aprobación de los documentos auto-generables de sección 3.3. Esta es la lista de promesas más fuertes; cada documento listado debe estar buildable.

**Gate founder cuatro.** Validación contra SLP. Si el pipeline corre sobre SLP y produce datos razonables comparados con los que ya tenemos cargados manualmente, está aprobado para el segundo cliente.

---

## 11 · Riesgos operativos de esta capa

**Riesgo uno: fuentes públicas cambian formato.** INEGI rediseña su sitio, Periódico Oficial cambia estructura, transparencia municipal modifica formato. Pipelines de scraping son frágiles por naturaleza. Mitigación: monitoreo automático de éxito de extracción por fuente; alerta cuando una fuente comienza a fallar; reemplazo o adaptación rápida del scraper afectado.

**Riesgo dos: inferencia incorrecta presentada como cierta.** Si el sistema infiere "el reglamento vigente es X" pero en realidad fue reformado el mes pasado y la versión actualizada aún no es pública, presenta dato desactualizado. Mitigación: nunca presentar inferencia como verificada; siempre marcar con sello explícito y fecha de extracción.

**Riesgo tres: cliente confía ciegamente en lo inferido.** Cliente firma documento que cita cifra inferida sin haberla validado. Mitigación: documentos formales auto-generados marcan secciones que requieren validación humana antes de firma; sin marca de validación, el documento no puede exportarse como definitivo.

**Riesgo cuatro: motor genera ruido en lugar de señal.** Si el motor produce demasiadas recomendaciones, el cliente las ignora todas. Mitigación: priorización estricta; máximo tres recomendaciones simultáneas por módulo; cada recomendación tiene urgencia declarada.

**Riesgo cinco: data moat se construye más lento que la competencia.** Si Alquimia tarda dos años en tener diez municipios, una competencia bien financiada puede llegar antes. Mitigación: este riesgo se mitiga vendiendo agresivamente los primeros tres contratos en 90 días. No se mitiga con más tecnología.

---

## 12 · Documentos relacionados

- `ADR-0010_stage_based_platform_separation.md` — arquitectura base
- `PLATAFORMA_0_BACKOFFICE_SPEC.md` — backoffice que consume esta capa
- `MODULE_MATURITY_AND_PERSONALIZATION.md` — schemas que esta capa puebla
- `ROADMAP_MIGRACION_3_PLATAFORMAS.md` — fases donde esta capa se implementa
- `HOJA_DE_RUTA_ALQUIMIA.md` — verdad operativa institucional
- `capability_registry.json` — fuente única de qué módulos automatiza esta capa

---

## 13 · Aprobación

```
[ ] Founder: pendiente
[ ] SUPREME architectural review: pendiente
[ ] KOSMOS schema validation: pendiente
[ ] HERMES pipelines feasibility: pendiente
[ ] AUDITOR traceability: pendiente
```

Sin estas cinco firmas, los pipelines de automatización no arrancan.

---

*AUTOMATION AND PERSONALIZATION LAYER · Alquimia · 27 mayo 2026*
