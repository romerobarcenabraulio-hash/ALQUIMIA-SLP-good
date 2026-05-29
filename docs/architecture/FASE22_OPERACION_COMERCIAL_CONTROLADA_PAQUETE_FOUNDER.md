# Fase 22 · Operación comercial controlada y paquete founder

**Estado:** cerrado como paquete founder para demos y pilotos controlados  
**Fecha:** 2026-05-28  
**Decisión recomendada:** usar ALQUIMIA en **staging extendido / piloto controlado**. No vender como producción pública, automatización oficial plena ni NOUS maduro.

## 1 · Lectura ejecutiva

ALQUIMIA puede demostrarse con autoridad como una plataforma que estructura el diagnóstico municipal, separa etapas, precarga datos preliminares, marca fuente/confianza, exige estudios de campo cuando faltan datos locales, genera borradores bloqueables y conserva privacidad por tenant.

La promesa permitida es:

> ALQUIMIA acelera el arranque consultivo con trazabilidad, evidencia y revisión humana obligatoria.

La promesa prohibida es:

> ALQUIMIA ya produce datos oficiales, estudios ejecutados, documentos aprobados o aprendizaje automático maduro.

## 2 · Estado real de la plataforma

| Área | Estado demostrable | Límite que debe decirse |
| --- | --- | --- |
| Plataforma 0 | Administra tenants, gates, capabilities, evidencia y documentos. | Es operación interna; producción pública requiere hardening de auth tenant. |
| Creación de tenant | Permite crear tenant y arrancar inferencia preliminar controlada. | Worker async y conectores públicos reales siguen como P1. |
| Primer login | El cliente entra a `/v` con lectura preliminar, fuentes, confianza y pendientes. | No es UAT founder firmado para release público. |
| `/v` Validación | Ruta principal para diagnóstico y validación. | No debe abrir módulos de planeación/ejecución sin gates. |
| `/p` Planeación | Disponible para tenants en `planning`. | Solo mostrar con tenant preparado o como roadmap. |
| `/e` Ejecución | Módulos avanzados preservados. | No vender como disponible para tenant en diagnóstico. |
| M00B | Antecedentes municipales con fuente/confianza o pendiente. | No inventa datos políticos, cabildo ni concesión. |
| M01 | Línea base con benchmarks, inferencias y brechas de estudio local. | Benchmark no es caracterización local. |
| Field studies | Seis estudios formalizados como requisitos por gate. | ALQUIMIA integra, exige y valida; terceros/municipio ejecutan y pagan. |
| KPIs internacionales | SDG 11.6.1, Wasteaware, GRI 302-1, GRI 303-2 e inclusión informal como contratos. | Sin fuente local quedan como brecha, no como valor municipal. |
| Documentos | Borradores con provenance, ClaimLedger, estados y bloqueos. | No son documentos oficiales ni aprobados por autoridad. |
| Privacidad | Tenant Private Store, Public Knowledge Base y aggregate anónimo separados. | No mostrar benchmarks identificables ni datos privados de otro tenant. |
| NOUS | Storage observacional y opt-in framework. | No hay patrones publicados, recalibración ni aprendizaje robusto. |
| Legacy | Respaldo temporal recomendado 30-60 días. | No vender legacy como arquitectura futura. |

## 3 · Guía founder de demo

### Objetivo de la demo

Demostrar que ALQUIMIA reduce la pantalla en blanco inicial y convierte incertidumbre municipal en un expediente preliminar auditable, sin borrar advertencias ni sustituir decisiones humanas.

### Recorrido de demo probado

| Paso | Pantalla | Mensaje permitido | Evidencia que debe verse |
| --- | --- | --- | --- |
| 1 | Plataforma 0 | “Operamos por tenant, etapa, gates y capabilities.” | Tenant demo, `current_stage`, gates G1-G5 y capabilities. |
| 2 | Crear tenant | “Con municipio, estado y clave INEGI se inicia una precarga preliminar.” | Tenant nuevo en `validation`, tier `diagnostico`. |
| 3 | Primer login | “El cliente entra a `/v`, no a una pantalla vacía.” | Resumen municipal, fuentes, confianza y pendientes. |
| 4 | M00B | “Los antecedentes vienen de fuente pública o quedan pendientes.” | Fuente/fecha/confianza o `missing_source`. |
| 5 | M01 | “Se distingue benchmark, inferencia y estudio local requerido.” | `field_study_required` cuando falta cuarteo u otro estudio. |
| 6 | KPI internacional | “El KPI está definido, pero sin fuente local no se reporta como valor oficial.” | Fórmula, estándar, fuente requerida y gate. |
| 7 | Documento | “La plataforma prepara borradores y bloquea si falta evidencia.” | `blocked_missing_evidence`, revisión humana y ClaimLedger/provenance. |
| 8 | Privacidad | “Los datos privados no cruzan tenants.” | Bloqueo de consulta privada de otro tenant o salida anónima. |
| 9 | NOUS observacional | “NOUS observa correcciones y outcomes; todavía no publica patrones.” | Opt-in, observación no publicada, founder/bias gate diferidos. |
| 10 | Cierre | “Listo para piloto controlado, no release público.” | Lista de P1 y siguiente decisión humana. |

### Rutas estables para demo

- Plataforma 0: usar tenant demo o crear uno sin datos privados reales del prospecto.
- Cliente: usar `/v` para un tenant `validation`.
- Documentos: mostrar un borrador bloqueado cuando falta evidencia crítica.
- KPIs: mostrar definición/fuente requerida antes de hablar de valores.
- NOUS: mostrarlo solo como registro observacional y opt-in, nunca como recomendador maduro.

### Rutas o módulos que conviene evitar

- `/p` o `/e` con tenant que no haya pasado gates.
- Módulos de ejecución como si estuvieran disponibles en diagnóstico.
- Analytics cross-tenant identificable.
- Documentos con lenguaje de “aprobado”, “dictamen” o “listo para firma”.
- Field studies como si ya estuvieran incluidos o ejecutados por ALQUIMIA.
- Legacy como experiencia futura principal.

## 4 · Narrativa comercial permitida

Frases permitidas:

- “ALQUIMIA prepara una primera lectura municipal trazable; no la presenta como oficial.”
- “Cada dato inferido debe traer fuente, fecha, método, confianza o quedar pendiente.”
- “Si falta un estudio local, la plataforma lo marca como brecha crítica o recomendada.”
- “Los estudios de campo los ejecuta el municipio o un tercero; ALQUIMIA los exige, valida e integra.”
- “Los documentos son borradores para revisión humana y pueden quedar bloqueados si falta evidencia.”
- “Los gates y cambios de etapa son manuales.”
- “NOUS hoy observa correcciones y outcomes; el aprendizaje maduro queda diferido.”
- “La privacidad por tenant es parte del diseño: no se copian datos privados entre municipios.”

## 5 · Claims prohibidos

No decir:

- “Los datos inferidos son oficiales.”
- “El benchmark nacional es la caracterización local del municipio.”
- “ALQUIMIA ejecuta los estudios de campo incluidos en el precio.”
- “El documento está aprobado por Cabildo o jurídico.”
- “La plataforma sustituye al secretario, jurídico, Cabildo, consultor o founder.”
- “Todas las fuentes públicas estarán disponibles en todos los municipios.”
- “NOUS ya aprende patrones robustos y predice resultados.”
- “Podemos publicar benchmarks cross-tenant identificables.”
- “La inferencia siempre tarda menos de 15 minutos.”
- “Producción pública ya está lista sin UAT founder, auth hardening y conectores reales.”

## 6 · Matriz prometer / no prometer

| Tema | Prometer | No prometer |
| --- | --- | --- |
| Automatización | Precarga preliminar, estados parciales y dependencias trazables. | Decisiones, firmas, gates, comunicaciones o etapas automáticas. |
| Inferencias | Fuente, método, fecha, confianza y validación humana pendiente. | Exactitud oficial, disponibilidad universal o cobertura política completa. |
| Estudios de campo | Requisitos, schemas, evidencia esperada, costo/rango, gate y criticidad. | Ejecución incluida, cifra local inventada o sustitución de laboratorio/consultor. |
| Documentos | Borradores versionados con provenance y bloqueo honesto. | Dictámenes finales, acuerdos oficiales o exports “ok” con evidencia faltante. |
| KPIs internacionales | Definición, fórmula, estándar, fuente requerida y módulo destino. | Valores locales sin estudio, cumplimiento multilateral o elegibilidad financiera automática. |
| NOUS | Storage observacional, opt-in, auditoría y gates futuros. | Aprendizaje maduro, predicción, publicación de patrones o recalibración automática. |
| Privacidad | Aislamiento tenant, aggregate anónimo con opt-in y N mínimo. | Comparación identificable municipio contra municipio o reuso privado entre tenants. |
| Tiempos de precarga | Objetivo operativo cuando existan fuentes y worker. | SLA universal antes de cerrar P1 de worker async/conectores reales. |
| Fuentes públicas | Fallback pendiente cuando falla una fuente. | Scraping exhaustivo o disponibilidad homogénea nacional. |
| Recomendaciones | Acciones humanas con fuente, confianza y trade-offs. | Mandatos políticos o decisiones automáticas. |

## 7 · Checklist pre-demo

- [ ] Definir si la demo es interna, prospecto, piloto o cierre founder.
- [ ] Confirmar tenant demo correcto y etapa `validation`.
- [ ] Confirmar que `/v` carga.
- [ ] Confirmar que `/p` y `/e` bloquean o redirigen para tenant `validation`.
- [ ] Confirmar que warnings, fuentes y niveles de confianza son visibles.
- [ ] Confirmar que M00B tiene fuente o pendiente explícito.
- [ ] Confirmar que M01 muestra benchmark separado de brecha de estudio local.
- [ ] Tener preparado un ejemplo `field_study_required`.
- [ ] Tener preparado un KPI internacional con fórmula y fuente requerida.
- [ ] Tener preparado un documento en `blocked_missing_evidence`.
- [ ] Tener preparado un ejemplo de privacidad tenant o salida agregada anónima.
- [ ] Tener preparado un ejemplo NOUS observacional sin patrón publicado.
- [ ] Evitar datos privados reales sin autorización.
- [ ] Ajustar claims al estado real: staging extendido / piloto controlado.

## 8 · Guía de datos preliminares

Fórmula verbal:

> “Este dato es preliminar. Tiene fuente o método, nivel de confianza y requiere validación humana antes de usarse como base formal.”

Si el dato es benchmark:

> “Esto es una referencia para orientar preguntas. No sustituye el estudio local.”

Si el dato es inferido:

> “La inferencia ayuda a no empezar en blanco, pero queda marcada para revisión.”

Si el dato no existe:

> “La plataforma no inventa. Lo registra como pendiente y pide evidencia.”

## 9 · Si falla una fuente pública

Mensaje para prospecto:

> “Una fuente pública puede fallar o no existir para cierto municipio. ALQUIMIA guarda el parcial, marca el campo como pendiente y permite integrar evidencia municipal.”

Procedimiento:

1. Mostrar `missing_source`, `pending_source` o `pending_human_validation`.
2. Decir qué fuente se intentó consultar.
3. Explicar si el campo puede capturarse manualmente.
4. No completar con dato de otro municipio.
5. No presentar el campo como oficial.
6. Registrar la falla como riesgo o backlog si bloquea una demo/piloto.

## 10 · Guía de estudios de campo

Principio comercial:

> ALQUIMIA no inventa cifras locales. ALQUIMIA exige, valida e integra estudios que ejecutan terceros o el municipio.

Cómo explicarlo:

- Cuarteo, rutas, censo de pepenadores, infraestructura, jurídico y PSP son estudios de defensibilidad.
- Algunos son críticos para G1 o G2; otros son recomendados u opcionales según caso.
- Si no existe estudio local, el módulo muestra brecha, no verdad municipal.
- El costo, responsable, tiempo y evidencia requerida deben explicarse antes de prometer un resultado.
- Si el prospecto pregunta por tarifa, PSP es requerido si la propuesta depende de pago por servicio.
- M03B sin firma jurídica es análisis preliminar, no dictamen.

## 11 · Guía NOUS observacional vs futuro

Hoy sí existe:

- `inference_corrections`
- `gate_outcomes`
- `projection_deltas`
- `nous_patterns` no publicables
- opt-in/opt-out agregado por tenant
- auditoría de observación

Hoy no existe como capacidad comercial:

- detectores productivos;
- patrones publicados a clientes;
- recalibración automática;
- predicción de éxito;
- benchmark identificable;
- A11 NOUS completo.

Frase correcta:

> “NOUS está en fase observacional: registra señales para aprender con supervisión humana en el futuro.”

Frase prohibida:

> “Nuestro modelo ya predice qué municipios van a tener éxito.”

## 12 · Guía de conversación por prospecto

### Municipio grande

Enfatizar trazabilidad, gates, control de evidencia, privacidad y escalabilidad a planeación/ejecución.

Advertir que conectores reales, worker async, UAT founder y hardening de auth siguen como P1 antes de producción abierta.

### Municipio pequeño o rural

Enfatizar que ALQUIMIA no deja pantalla vacía: muestra pendientes, fuente ausente y próximos pasos.

Advertir que habrá más `missing_source` y que el valor inicial es ordenar incertidumbre, no fingir completitud.

### Municipio con pocas fuentes públicas

Enfatizar captura privada y checklist de evidencias.

Advertir que no se debe prometer diagnóstico completo en primer login; se promete una ruta de completitud.

### Prospecto con concesionario fuerte

Enfatizar separación entre datos públicos, datos privados, contrato vigente, concesión actual y evidencia.

Advertir que cifras privadas del concesionario no se infieren y que cualquier escenario requiere fuente o carga formal.

### Prospecto interesado en banca multilateral

Enfatizar standards/KPIs, provenance y brechas técnicas.

Advertir que ALQUIMIA no garantiza elegibilidad, financiamiento ni cumplimiento; prepara evidencia para revisión.

### Prospecto preguntando por IA o aprendizaje automático

Enfatizar inferencia trazable, revisión humana y NOUS observacional.

Advertir que no hay caja negra, no hay predicción oficial y no hay aprendizaje maduro publicado.

## 13 · Notas de operación comercial

### Cuándo usar nueva arquitectura

- Demo nueva.
- Piloto controlado.
- Discusión de Plataforma 0, tenant_state, gates y primer login.
- Presentación de field studies, KPIs, documentos bloqueables y privacidad.

### Cuándo usar legacy

- Continuidad histórica del piloto SLP.
- Demo comprometida previamente en flujo anterior.
- Respaldo temporal si la nueva ruta está inestable.

Decisión recomendada: mantener legacy 30-60 días, no retirarlo sin firma founder.

### Cuándo decir “staging”

- Siempre que se hable de operación comercial controlada.
- Cuando se mencione inferencia HERMES, conectores, worker async o auth tenant.
- Cuando un prospecto pida producción abierta.

### Cuándo no mostrar un módulo

- Si requiere etapa posterior no habilitada.
- Si el módulo depende de estudio local no cargado y no está preparado para mostrar brecha.
- Si puede parecer dictamen jurídico o documento oficial.
- Si contiene datos privados de otro tenant o comparaciones identificables.

### Cuándo pausar la demo

Pausar si ocurre cualquiera:

- tenant `validation` accede a `/p` o `/e`;
- documento aparece como `ok` con evidencia crítica faltante;
- dato inferido aparece como oficial;
- benchmark se lee como estudio local;
- dato privado de otro tenant queda visible;
- NOUS aparece como patrón publicado o predicción.

## 14 · Riesgos comerciales

| Riesgo | Severidad comercial | Tratamiento |
| --- | --- | --- |
| Sobreprometer producción pública | Alta | Decir staging extendido / piloto controlado. |
| Fuente pública falla | Media/alta | Mostrar pendiente, razón y fallback manual. |
| Estudio local faltante | Alta | Mostrar `field_study_required`; no inventar cifra. |
| Documento parece oficial | Alta | Usar “borrador para revisión” y bloqueo honesto. |
| NOUS se vende como maduro | Alta | Decir observacional, opt-in y futuro supervisado. |
| Prospecto pide benchmark identificable | Alta | Responder con privacidad y aggregate anónimo. |
| Módulo visual no pulido | Media | Clasificar como P2/P3 si no rompe acceso/datos. |
| Legacy confunde narrativa | Media | Presentarlo solo como respaldo temporal. |

## 15 · Gate AUDITOR

AUDITOR confirma para este paquete:

- No se promete oficialidad de inferencias.
- No se presenta benchmark como estudio local.
- No se venden documentos como aprobados por autoridad.
- No se afirma que ALQUIMIA sustituye jurídico, Cabildo, founder o consultor.
- No se promete cobertura universal de fuentes públicas.
- No se promete NOUS maduro.
- No se ocultan P1 de staging extendido.
- Founder puede usar el paquete sin depender del agente, siempre que respete checklist y límites.

## 16 · Evidencia y comandos

Validación documental recomendada:

```bash
python3 -m json.tool docs/architecture/capability_registry.json >/tmp/capability_registry_phase22.json
python3 -m json.tool docs/architecture/standards_map.json >/tmp/standards_map_phase22.json
```

Regresión técnica recomendada antes de demo:

```bash
backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py backend/tests/test_phase15_first_login_uat.py backend/tests/test_phase14_data_moat.py backend/tests/test_phase18_nous_observational.py backend/tests/test_phase19_field_studies_kpis.py
```

Esta Fase 22 no agrega código. Si cualquiera de esas pruebas falla, el paquete sigue siendo útil como guía, pero la demo debe marcarse parcial o pausarse según severidad.

## 17 · Estado final

**Fase 22: cerrada como paquete founder para operación comercial controlada.**

La recomendación final no cambia: **staging extendido / piloto controlado**, con narrativa comercial sobria, límites explícitos, NOUS observacional, estudios de campo como brechas/requisitos y legacy temporal.
