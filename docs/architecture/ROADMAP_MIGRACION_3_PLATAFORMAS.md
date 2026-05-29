# ROADMAP CONSOLIDADO DE MIGRACIÓN A LA ARQUITECTURA DE TRES PLATAFORMAS

**Estado:** Propuesto · 27 mayo 2026
**Dependencias:** ADR-0010 firmado, Plataforma 0 spec aceptado, Module Maturity aceptado
**Duración estimada:** 16 semanas con todos los agentes coordinados

---

## 1 · Estructura del roadmap

Siete fases secuenciales con dependencias declaradas. Cada fase tiene un criterio binario de cierre que el founder verifica antes de avanzar.

```
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7
   |        |        |        |        |        |        |        |
   1sem   3sem     2sem     3sem     1sem     4sem     2sem     2sem
```

Algunas fases corren en paralelo donde no hay dependencia técnica.

---

## 2 · Fases detalladas

### Fase 0 · Preparación normativa (Semana 1)

**Objetivo:** Tener todos los documentos firmados antes de tocar código.

**Agentes:** SUPREME, KOSMOS, founder.

**Entregables:**
- ADR-0010 firmado por founder.
- Capability Registry v2.0.0 publicado por KOSMOS en `/docs/architecture/capability_registry.json`.
- Backup integral del piloto SLP ejecutado por BIOS.
- AUDITOR verifica integridad del backup.
- Plataforma 0 Backoffice spec firmado.
- Module Maturity assessment firmado.

**Criterio binario de cierre:** Founder firma los cinco documentos. BIOS confirma backup. Sin esto, Fase 1 no arranca.

---

### Fase 1 · Plataforma 0 Administración MVP (Semanas 2 a 4)

**Objetivo:** Que el founder pueda administrar tenants antes de migrar al primero.

**Agentes:** KRONOS (backend), POLIS (frontend), FORGE (módulos administrativos).

**Entregables:**
- A1 Dashboard de portafolio funcional con lectura de tenants.
- A2 Gestión de tenants con seis secciones editables.
- A3 Stage transition control con evidencia subible y cierre manual de gates.
- A4 Capability Registry editor con CRUD básico.
- Auth doble factor (Resend + TOTP) funcional para usuarios internos.
- Audit log activo registrando cada acción.

**Diferido al post-MVP:** A5, A7, A8, A9 según spec.

**Criterio binario de cierre:** Founder puede crear un tenant, asignar tier, activar capabilities por defecto, cerrar G1 con evidencia, ver el dashboard. Ver criterio detallado en sección 10 de Plataforma 0 spec.

---

### Fase 2 · Backend de estado del tenant (Semanas 3 a 5, paralelo a Fase 1)

**Objetivo:** Que la base de datos y los endpoints soporten la lógica de tres plataformas.

**Agentes:** KRONOS, KOSMOS (validación de schema).

**Entregables:**
- Tabla `tenant_state` con `current_stage`, gates, capabilities, fechas.
- Migración de tabla `tenants` legacy a nueva estructura.
- Máquina de estados de transición con validación de evidencia.
- Endpoints REST:
  - `GET /admin/tenants` (lista con filtros)
  - `GET /admin/tenants/:id` (detalle completo)
  - `POST /admin/tenants` (crear)
  - `PATCH /admin/tenants/:id` (actualizar)
  - `POST /admin/tenants/:id/gates/:gateId/close` (cerrar gate con evidencia)
  - `POST /admin/tenants/:id/transition` (forzar transición — requiere doble confirmación)
  - `GET /admin/tenants/:id/state` (estado actual)
- Middleware de routing que lee `tenant.current_stage` y enruta correctamente.

**Criterio binario de cierre:** Tests E2E pasan transiciones G1→G2→G3 completas. KRONOS demuestra que un tenant con `current_stage = "planning"` no puede acceder a URLs de Ejecución (HTTP 403).

---

### Fase 3 · Frontend de routing por plataforma (Semanas 5 a 8)

**Objetivo:** Que el cliente municipal vea solo su plataforma activa.

**Agentes:** POLIS.

**Entregables:**
- Layout diferenciado para `/v`, `/p`, `/e`:
  - Header con badge de etapa actual.
  - Sidebar con módulos de la etapa.
  - Breadcrumbs por etapa.
  - Color de acento por plataforma (Validación azul, Planeación teal, Ejecución amber según design tokens).
- Badge "Lectura" en módulos de etapas anteriores visibles.
- Detector de etapa: al cargar app, redirección automática a `/v`, `/p`, o `/e` según `tenant.current_stage`.
- Componente `<ChapterIndex>` por plataforma que solo muestra módulos correspondientes.
- Eliminación del toggle Validar/Implementar legacy.

**Criterio binario de cierre:** Tres demos en producción — un tenant simulado en cada etapa, cada uno viendo solo sus módulos, con badges correctos, sin posibilidad de saltar a plataforma siguiente sin gate cerrado.

---

### Fase 4 · Migración del piloto SLP (Semana 8)

**Objetivo:** SLP funcionando en la nueva arquitectura sin pérdida de datos.

**Agentes:** KRONOS (ejecuta), BIOS (valida), AUDITOR (verifica).

**Entregables:**
- SLP migrado a `current_stage = "validation"`.
- Módulos de Validación visibles y editables.
- Módulos de Ejecución preservados en código pero ocultos.
- Datos comparados pre y post migración con cero pérdida.
- Reporte de migración firmado por founder.

**Criterio binario de cierre:** AUDITOR confirma cero pérdida de datos. Founder ejecuta walkthrough completo del recorrido de Validación SLP y aprueba.

**Rollback disponible:** Botón en Plataforma 0 que restaura estado pre-migración. Disponible durante 90 días.

---

### Fase 5 · Consolidación de módulos (Semanas 9 a 12)

**Objetivo:** Reducir 40 módulos a 23 sin perder funcionalidad.

**Agentes:** FORGE (construcción), OCCAM (eliminación), POLIS (UI de pestañas), AUDITOR (verificación).

**Entregables:**
- M02 fusión: cuatro pestañas internas (Demografía, Encuesta, Actores, Autoridad). Datos legacy migrados.
- M03 fusión: M03, M03C, M03D consolidados en módulo único. M03B conservado aparte.
- M04 fusión: M04B y M04C absorbidos como subsecciones de M04.
- M05 fusión: cuatro pestañas (Roadmap, Cronograma, Ruta crítica, Oleadas).
- M08 fusión: dos pestañas (Rutas y vehículos, Educación ciudadana).
- M11 fusión: M11 y M12 consolidados (cuando se construyan).
- M20 fusión: M20 y M20B unificados.
- M21 fusión: M21 y M21B unificados.
- IDs duplicados retirados del Capability Registry.
- Componente ChapterSeparator decorativo eliminado.

**Criterio binario de cierre:** 23 módulos en el sidebar de las tres plataformas. Cero módulos huérfanos. AUDITOR confirma que ninguna cifra se perdió. POLIS confirma que las pestañas funcionan en mobile y desktop.

---

### Fase 6 · Personalización granular por municipio (Semanas 11 a 14, paralelo a Fase 5)

**Objetivo:** Que cada módulo capture los datos específicos del municipio cliente.

**Agentes:** HERMES (pipeline de datos), POLIS (formularios de captura), FORGE (lógica).

**Entregables:**
- Schema completo de tenant.antecedentes en Plataforma 0 con todas las secciones de M00B.
- Pipeline HERMES de carga automática para tres municipios de prueba: SLP, Monterrey, Guanajuato Capital.
- Schema de tenant.mapa_social con 15 actores mínimos por municipio.
- Schema de tenant.organigrama_servicio con turnos, roles y horarios.
- Formularios de captura en Plataforma 0 para cada schema.
- Vista en plataformas-cliente que consume los datos del tenant para personalización.

**Criterio binario de cierre:** SLP tiene su expediente completo poblado: Cabildo con 15 regidores nombrados, organigrama con turnos detallados, mapa de actores con 15 actores reales, reglamento subido. Monterrey y Guanajuato Capital tienen datos básicos cargados por pipeline HERMES.

---

### Fase 7 · Validación final y cierre (Semanas 15 a 16)

**Objetivo:** Aceptación formal de la nueva arquitectura.

**Agentes:** AUDITOR, founder.

**Entregables:**
- Lista de verificación de migración completa firmada.
- Walkthrough de las tres plataformas con stakeholders internos.
- Decisión sobre retiro de arquitectura legacy o mantenimiento en paralelo.
- Documentación final actualizada en `/docs/architecture/`.
- Lección aprendida documentada para futuras migraciones.

**Criterio binario de cierre:** Founder firma aceptación final. Arquitectura legacy retirada o programada para retiro en 30 días. Documentación publicada.

---

## 3 · Carga por agente

| Agente | Fases | Carga relativa |
|---|---|---|
| KRONOS | 1, 2, 4 | Alta |
| POLIS | 1, 3, 5, 6 | Muy alta |
| FORGE | 1, 5, 6 | Alta |
| HERMES | 6 | Media |
| KOSMOS | 0, 2 | Baja |
| BIOS | 0, 4 | Media |
| AUDITOR | 0, 4, 5, 7 | Media |
| OCCAM | 5 | Baja |
| MARCOS | (paralelo, no bloqueante) | Media |
| SUPREME | 0, 7 + ritual semanal | Baja |

Picos de carga: semana 5 (POLIS empieza routing mientras KRONOS termina backend), semana 11 (consolidación + personalización en paralelo).

---

## 4 · Gates humanos del founder

Gate después de cada fase:
- **Después de Fase 0:** firmar los documentos.
- **Después de Fase 1:** aceptar el MVP de Plataforma 0.
- **Después de Fase 2:** validar máquina de estados.
- **Después de Fase 3:** validar las tres plataformas funcionando.
- **Después de Fase 4:** firmar reporte de migración SLP sin pérdida.
- **Después de Fase 5:** validar consolidación de módulos.
- **Después de Fase 6:** validar datos personalizados de SLP.
- **Después de Fase 7:** firmar aceptación final.

Ocho gates totales. Sin firma, la siguiente fase no arranca.

---

## 5 · Riesgos del roadmap

**Riesgo uno: founder en sprint de venta no atiende los gates.** Si las firmas se retrasan, todo el roadmap se retrasa. Mitigación: agendar bloques de 1 hora cada viernes para revisar avances y firmar pendientes.

**Riesgo dos: aparece un cliente nuevo en demo durante la migración.** Demo legacy funciona pero el founder no puede prometer la nueva arquitectura sin que esté terminada. Mitigación: comunicar claramente a prospectos en curso que la arquitectura está en evolución, ofrecer demo de la versión actual con compromiso de migración asistida sin costo adicional.

**Riesgo tres: bug crítico en máquina de estados del tenant.** Catastrófico — un cliente podría ver la plataforma equivocada. Mitigación: testing E2E exhaustivo de todas las transiciones, ambiente de staging idéntico a producción para validación, rollback de un click disponible 90 días.

**Riesgo cuatro: M01, M13, M14, M21 se rompen durante consolidación.** Estos son los módulos pilar que el founder usa en demo. Mitigación: regla absoluta — no se tocan durante consolidación, solo se mueven al sidebar de la plataforma correcta.

**Riesgo cinco: pipeline HERMES no escala.** Si la carga automática es lenta (>60s), el cliente nuevo tiene mala primera experiencia. Mitigación: cargar antecedentes en background, mostrar progreso al cliente, permitir entrar al simulador con datos parciales.

---

## 6 · Decisión de continuidad

Después de Fase 7, el founder decide:

1. **Continuar con arquitectura nueva sola.** Retirar legacy. Comunicación pública del cambio.
2. **Mantener legacy en paralelo durante 30-60 días.** Permite demos legacy a prospectos en negociación previos al cambio.
3. **Pausar y evaluar.** Si la migración reveló problemas no anticipados, decidir si continuar o ajustar.

La opción 2 es la más segura desde perspectiva comercial. La opción 1 es la más limpia desde perspectiva técnica.

---

## 7 · Addendum Fase 17R · Reconciliación NOUS

El documento `LEARNING_AND_FEEDBACK_LAYER.md` se incorpora como restricción posterior al roadmap original. NOUS no entra como feature madura en Fases 11-17. Entra primero como aprendizaje observacional, lento, trazable y supervisado.

Reglas incorporadas:

- NOUS observa antes de sugerir.
- N=5 permite analítica agregada interna, no publicación de patrones a clientes.
- Mínimo 3 correcciones similares para patrón emergente interno de inferencia.
- Mínimo 8 outcomes para patrón emergente interno de gate.
- Mínimo 15 observaciones para patrón establecido candidato a founder gate.
- Mínimo 30 observaciones para patrón robusto.
- Sin opt-in, los datos del tenant no alimentan analytics agregada.
- Ningún patrón se publica sin founder gate.
- AUDITOR puede retirar patrones por sesgo.
- Variables protegidas no se usan para correlaciones.
- Se prohíbe lenguaje tipo “nuestro modelo predice”.

Fase recomendada posterior:

**Fase 18 · NOUS storage observacional y metodología.** Crear únicamente tablas/schemas/eventos para `inference_corrections`, `gate_outcomes`, `projection_deltas` y `nous_patterns`, más opt-in, audit log, bias policy y documentación metodológica. No construir A11 completo, detectores productivos, recalibración automática ni sugerencias NOUS al cliente hasta tener datos suficientes y firma founder.

Documento de control: `docs/architecture/FASE17R_RECONCILIACION_NOUS_LEARNING_FEEDBACK.md`.

---

*ROADMAP CONSOLIDADO · Alquimia · 27 mayo 2026*
