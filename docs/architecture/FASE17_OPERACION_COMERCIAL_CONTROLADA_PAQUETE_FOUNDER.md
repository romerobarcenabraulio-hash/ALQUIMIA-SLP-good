# Fase 17 · Operación comercial controlada y paquete founder

**Estado:** cerrado como paquete founder para operación comercial controlada  
**Fecha:** 2026-05-28  
**Decisión recomendada:** usar ALQUIMIA en demos controlados y pilotos en staging; no vender todavía como automatización oficial plena.

## 1 · Lectura ejecutiva

ALQUIMIA puede demostrarse como consultor automatizado en staging: crea un tenant, precarga diagnóstico preliminar, separa datos públicos/privados, muestra fuente/confianza, bloquea documentos sin evidencia y conserva gates humanos.

No debe presentarse como sistema que entrega datos oficiales, dictámenes legales, documentos aprobados, conectores públicos exhaustivos o decisiones automáticas. La promesa comercial permitida es: **ALQUIMIA acelera el diagnóstico municipal con inferencia trazable y revisión humana obligatoria.**

## 2 · Estado real de plataforma

| Área | Estado demostrable | Límite que debe decirse |
| --- | --- | --- |
| Plataforma 0 | Administra tenants, gates, capabilities, evidencia, documentos y analytics internos. | Uso interno; no es portal cliente. |
| `/v` Validación | Funciona como superficie principal para tenants en `validation`. | UAT visual final requiere firma founder. |
| `/p` Planeación | Disponible para tenants en `planning`; tenants `validation` reciben bloqueo. | No avanzar tenant sin gate manual. |
| `/e` Ejecución | Disponible para tenants en `execution`; preserva módulos avanzados. | No mostrar a prospectos de diagnóstico salvo como roadmap. |
| Inferencia inicial | Precarga datos desde Public Knowledge Base controlada y marca pendientes. | Fuentes web/API reales siguen en backlog; no prometer cobertura total. |
| Runtime automation | Recalcula dependencias desde `capability_registry.json` y marca discrepancias >20%. | Recomendación, no decisión. |
| Documentos | Genera borradores con provenance, ClaimLedger, blockers y revisión humana. | Nunca vender como documento oficial aprobado. |
| Data moat | Analytics anónimo interno con opt-in y N mínimo 5 como observación interna. | No mostrar benchmarks identificables, municipios origen ni patrones NOUS publicables. |
| Legacy | Preservado como respaldo temporal. | No retirarlo sin decisión humana explícita. |

## 3 · Guía de demo founder

### Guion de 7 minutos

| Minuto | Pantalla | Mensaje permitido | Evidencia que debe verse |
| --- | --- | --- | --- |
| 0:00-0:45 | Plataforma 0 | “ALQUIMIA opera por tenants, etapas y gates humanos.” | Tenant, `current_stage`, G1-G5 y capabilities. |
| 0:45-1:45 | Creación/tenant demo | “Con datos mínimos se arma un expediente preliminar trazable.” | Municipio, estado, clave INEGI y etapa `validation`. |
| 1:45-2:45 | `/v` M00/M00B | “El cliente no entra a una pantalla vacía; entra a una lectura preliminar.” | Fuente, confianza, `pending_human_validation` o `missing_source`. |
| 2:45-3:45 | M01/M02 | “Los datos son del tenant; cuando falta fuente, se marca pendiente.” | Cifras con fuente/confianza y pendientes explícitos. |
| 3:45-4:45 | M03B/M04/M13 | “Esto es observación técnica, no dictamen oficial.” | Advertencias, cálculo preliminar y provenance. |
| 4:45-5:45 | Documento borrador | “La plataforma prepara borradores y bloquea export si falta evidencia crítica.” | Estado documental, blockers y ClaimLedger/provenance. |
| 5:45-6:30 | Privacidad | “La analítica cross-tenant empieza como observación interna, no como patrón publicado.” | Bloqueo por N insuficiente o observación interna no publicable. |
| 6:30-7:00 | Cierre | “Listo para piloto controlado; no para producción abierta sin UAT founder.” | Siguiente decisión humana. |

### Preparación

1. Usar ambiente local/staging, no producción abierta.
2. Confirmar backend y frontend vivos.
3. Usar tenant demo o crear uno nuevo con datos mínimos:
   - `nombre`
   - `estado_mx`
   - `municipio_id`
   - `inegi_clave`
   - `current_stage = validation`
   - `tier_comercial = diagnostico`
4. Abrir Plataforma 0 y mostrar que el tenant existe con gates G1-G5.
5. Confirmar que el tenant entra a `/v` y no a `/p` ni `/e`.

### Recorrido recomendado

1. **Plataforma 0.** Mostrar tenant, etapa, gates, capabilities y evidencia.
2. **Creación de tenant nuevo.** Explicar que HERMES crea un expediente preliminar parcial-tolerante.
3. **Primer login `/v`.** Mostrar M00 y el resumen de primer login: fuente, confianza, validación humana pendiente.
4. **M00B/M01.** Mostrar antecedentes y línea base con `inferred_high_confidence`, `inferred_medium_confidence` o `missing_source`.
5. **M02/M02C.** Mostrar que actores/demografía son del tenant; si faltan datos, quedan pendientes.
6. **M03B/M04/M13.** Mostrar lectura legal/financiera como preliminar, no oficial.
7. **Runtime.** Ajustar un dato privado de demo y mostrar recalculo/discrepancia >20%.
8. **Document automation.** Generar un borrador y mostrar que queda bloqueado si falta evidencia crítica.
9. **Privacidad.** Mostrar que analytics cross-tenant exige opt-in, N mínimo 5 y salida anónima, pero NOUS publicable queda diferido.
10. **Cierre.** Decir: “Esto está listo para piloto controlado; producción abierta requiere UAT founder y conectores reales.”

### Rutas estables y rutas a evitar

| Tipo | Usar en demo | Evitar en demo |
| --- | --- | --- |
| Administración | Plataforma 0 con tenant demo preparado. | Crear tenants reales con datos privados de prospectos sin autorización. |
| Cliente validation | `/v` con tenant `validation`. | `/p` o `/e` como si el tenant ya hubiera pasado gates. |
| Planeación/ejecución | Mostrar solo como roadmap o con tenant demo de etapa correspondiente. | Presentar módulos avanzados como disponibles para diagnóstico inicial. |
| Documentos | Borrador bloqueado y borrador revisable. | Exportar o nombrar un borrador como “oficial”, “aprobado” o “listo para firma”. |
| Analytics | Observación anónima interna con N mínimo. | Comparar municipio contra municipio, revelar origen del patrón o decir que NOUS ya aprende robustamente. |
| Legacy | Solo respaldo histórico o continuidad SLP. | Vender legacy como experiencia principal futura. |

## 4 · Narrativa comercial permitida

Frases permitidas:

- “ALQUIMIA prepara un diagnóstico preliminar trazable para que el equipo municipal no empiece desde cero.”
- “Cada dato inferido muestra fuente, fecha, método, confianza y estado de validación humana.”
- “La plataforma genera borradores para revisión; no firma ni aprueba documentos.”
- “Los gates y cambios de etapa son manuales desde Plataforma 0.”
- “Si una fuente falla, el sistema guarda parcial y muestra pendiente con razón.”
- “Los datos privados de un municipio no cruzan a otro; la analítica agregada inicia como observación anónima interna, con opt-in y N mínimo.”
- “La recomendación es accionable, pero la decisión la toma el humano.”

## 5 · Claims prohibidos

No decir:

- “Los datos ya son oficiales.”
- “ALQUIMIA sustituye al jurídico, secretario, Cabildo o founder.”
- “El sistema aprueba documentos automáticamente.”
- “Tenemos cobertura pública completa para cualquier municipio.”
- “La inferencia tarda siempre menos de 15 minutos.”
- “Los benchmarks dicen qué hizo SLP y por eso Querétaro debe hacer lo mismo.”
- “El documento generado está listo para firma.”
- “La transición de etapa ocurre automáticamente al cerrar gate.”
- “La plataforma ya puede operar producción abierta sin UAT founder.”
- “NOUS ya aprende robustamente y publica patrones a clientes.”
- “Nuestro modelo predice qué va a pasar.”

## 6 · Matriz prometer / no prometer

| Tema | Prometer | No prometer |
| --- | --- | --- |
| Automatización | Precarga y recomendaciones preliminares trazables. | Decisiones, firmas, aprobaciones o comunicaciones oficiales automáticas. |
| Inferencias | Fuente, método, fecha, confianza y estado pendiente. | Exactitud oficial o disponibilidad universal. |
| Documentos | Borradores con provenance, blockers y revisión humana. | Documentos finales, dictámenes o acuerdos aprobados. |
| Tiempo de precarga | Objetivo operativo de 5-15 min cuando existan fuentes/fixtures. | SLA universal mientras no exista worker async y conectores reales. |
| Fuentes públicas | Uso de Public Knowledge Base y estado `missing_source` cuando falla. | Scraping completo o datos políticos completos para todos los municipios. |
| Recomendaciones | Acciones específicas con fuente, confianza y trade-offs. | Mandatos automáticos o certezas universales. |
| Privacidad | Separación tenant/private, opt-in, anonimización, N mínimo 5 para observación interna. | Benchmarks identificables, comparación municipio contra municipio o patrones NOUS publicables antes de bias/founder gate. |
| Gates | Evidencia y cierre manual desde Plataforma 0. | Avance automático de etapa. |

## 7 · Checklist antes de cada demo

- [ ] Confirmar decisión de demo: prospecto, piloto o revisión interna.
- [ ] Usar tenant demo, no datos privados reales sin autorización.
- [ ] Confirmar que `/v` carga con tenant `validation`.
- [ ] Confirmar que `/p` y `/e` bloquean o redirigen para tenant `validation`.
- [ ] Confirmar que el resumen de primer login muestra fuente/confianza.
- [ ] Tener preparado un caso `missing_source`.
- [ ] Tener preparado un documento bloqueado por falta de evidencia.
- [ ] Tener preparado un ejemplo de discrepancia >20%.
- [ ] No mostrar analytics cross-tenant si no hay N mínimo y opt-in.
- [ ] No decir que NOUS está maduro; hablar solo de storage/observación inicial cuando aplique.
- [ ] Decir explícitamente “preliminar, no oficial” al menos una vez antes de cifras.
- [ ] Cerrar con límites y siguiente paso humano.

### Checklist BIOS operativo repetible

Antes de abrir la llamada:

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase15_first_login_uat.py backend/tests/test_phase14_data_moat.py backend/tests/test_phase13_runtime_automation.py backend/tests/test_phase12_document_automation.py backend/tests/test_phase11_automation.py backend/tests/test_admin_tenants.py
cd frontend && npm run test -- src/components/simulator/TenantProfilePanels.test.tsx
cd frontend && npm run type-check
```

Durante la demo:

- Mantener a la vista un tenant demo `validation`.
- Mantener preparado un documento con `blocked_missing_evidence`.
- Mantener preparado un dato con `missing_source`.
- Mantener preparado un ejemplo de discrepancia >20%.
- No usar datos reales de un prospecto si no existe autorización explícita.

Después de la demo:

- Registrar qué se mostró, qué falló y qué se prometió.
- Registrar si el prospecto pidió producción, piloto controlado o revisión técnica.
- Convertir cualquier promesa nueva en backlog, no en compromiso verbal.

## 8 · Si falla una fuente pública

Decir:

> “La plataforma no inventa. Cuando la fuente no está disponible, deja el campo como pendiente, registra la razón y permite que el municipio cargue evidencia privada.”

Operación:

1. Mostrar el campo como `missing_source` o `pending_source`.
2. Explicar qué fuente se intentó usar.
3. Pedir evidencia municipal o programar carga posterior.
4. No convertir el dato en oficial.
5. No copiar dato de otro municipio.

## 9 · Cómo explicar datos preliminares

Usar esta fórmula verbal:

> “Este dato es una lectura preliminar. Está anclado a una fuente o cálculo, tiene nivel de confianza y requiere validación humana antes de incorporarse a documentos formales.”

Si el prospecto pide exactitud:

> “ALQUIMIA no reemplaza la validación municipal; reduce el tiempo para llegar a una primera versión defendible y auditable.”

## 10 · Guía por tipo de prospecto

### Municipio grande

Enfatizar:

- velocidad de diagnóstico;
- separación de etapas;
- trazabilidad para Cabildo;
- privacidad y data moat anónimo;
- capacidad de crecer a planeación/ejecución.

Advertir:

- conectores públicos reales siguen en staging;
- validar cifras operativas privadas antes de prometer ahorro.

### Municipio pequeño o rural

Enfatizar:

- tolerancia a fuentes incompletas;
- pantalla no vacía con pendientes explícitos;
- menor dependencia de consultoría manual inicial.

Advertir:

- puede haber más `missing_source`;
- el valor inicial es ordenar incertidumbre, no fingir completitud.

### Entidad con pocos datos públicos

Enfatizar:

- ALQUIMIA conserva razón de ausencia;
- permite cargar documentos privados;
- recomienda próximos datos mínimos para completar expediente.

Advertir:

- no se debe prometer diagnóstico completo en primer login;
- el piloto requiere trabajo humano de validación.

## 11 · Legacy en demos

Usar nueva arquitectura cuando:

- el prospecto evalúa compra o piloto nuevo;
- se quiere explicar etapas, gates, privacidad y primer login;
- se necesita mostrar trazabilidad y documentos bloqueados.

Usar legacy solo cuando:

- una demo anterior ya fue acordada con ese flujo;
- se necesita comparar continuidad histórica del piloto SLP;
- la nueva ruta esté temporalmente inestable.

No usar legacy para vender la arquitectura futura como si fuera la principal.

## 12 · Riesgos comerciales que deben explicarse

| Riesgo | Cómo decirlo |
| --- | --- |
| Fuentes públicas incompletas | “Si una fuente falla, el sistema no inventa; marca pendiente y pide evidencia.” |
| Sin worker async real | “En staging la inferencia mínima corre controlada; el worker productivo está en backlog.” |
| Auth cliente por tenant pendiente de hardening | “La demo es controlada; producción abierta requiere hardening de acceso.” |
| UAT visual founder pendiente | “La experiencia está lista para recorrido humano de aceptación, no para finiquito sin revisión.” |
| Data moat con pocos tenants | “La observación agregada requiere opt-in y N mínimo 5; patrones NOUS publicables requieren más datos, bias audit y gate founder.” |

## 13 · Cierres permitidos por decisión

| Decisión del founder/prospecto | Frase de cierre permitida | Siguiente paso |
| --- | --- | --- |
| Piloto controlado | “Podemos arrancar un piloto controlado con datos preliminares, revisión humana y gates manuales.” | Crear tenant, obtener autorización de datos y ejecutar UAT. |
| Staging extendido | “La plataforma ya demuestra el flujo, pero conviene extender staging para hardening de conectores/auth.” | Priorizar worker async, auth tenant y UAT visual. |
| Bloqueado | “No debemos avanzar a operación si falla acceso por etapa, datos SLP, documentos bloqueados o privacidad.” | Abrir incidente P0/P1 y repetir QA. |
| Venta no recomendada | “Hoy podemos vender piloto asistido, no automatización oficial plena.” | Ajustar alcance comercial y contrato. |

## 14 · Recorrido probado y evidencia

Evidencia técnica vigente:

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase15_first_login_uat.py backend/tests/test_phase14_data_moat.py backend/tests/test_phase13_runtime_automation.py backend/tests/test_phase12_document_automation.py backend/tests/test_phase11_automation.py backend/tests/test_admin_tenants.py
```

Resultado registrado: `31 passed`.

```bash
cd frontend && npm run test -- src/components/simulator/TenantProfilePanels.test.tsx
cd frontend && npm run type-check
cd frontend && npm run build
```

Resultado registrado: pruebas y typecheck pasan; build pasa fuera del sandbox por restricción local de Turbopack al abrir proceso/puerto.

Smoke visual parcial:

- M00 muestra resumen de primer login.
- M00 comunica no-oficialidad.
- `missing_source` aparece cuando faltan fuentes.
- El walkthrough visual completo requiere sesión limpia y firma founder.

## 15 · Gate AUDITOR

Confirmado:

- El paquete no promete oficialidad.
- El paquete no promete conectores universales.
- El paquete no promete documentos aprobados.
- El paquete no promete decisiones automáticas.
- El paquete conserva privacidad tenant y anonimización.
- El paquete declara staging extendido y riesgos residuales.

## 16 · Estado final

**Fase 17: cerrada como paquete founder para operación comercial controlada.**

No equivale a aceptación final de producción. El siguiente gate humano es: founder ejecuta demo/UAT con este paquete y decide entre `piloto controlado`, `staging extendido` o `bloqueado`.
