# ADR-0010 · Separación de plataforma por etapa del cliente

**Estado:** Firmado · Fase 0 cerrada para arranque de Fase 1
**Fecha:** 27 mayo 2026
**Reemplaza:** ADR-0007 (modo Validar/Implementar como toggle de UI)
**Autoría:** SUPREME + KOSMOS · Bajo gate L4 del founder

---

## 1 · Contexto

Alquimia hoy es una sola plataforma con cuarenta módulos visibles a través de dos modos seleccionables (Validar la propuesta, Implementar y operar). El cliente municipal abre el simulador y debe entender, por sí mismo, en qué modo está y cuáles módulos le corresponden. La arquitectura única ha producido tres síntomas observables y crecientes:

**Sobreingeniería por cobertura.** Cuando una sola plataforma intenta servir a tres preguntas distintas del cliente (¿vale la pena?, ¿cómo lo hacemos?, ¿está funcionando?), termina con módulos redundantes que dicen lo mismo desde tres ángulos. Los conjuntos M02/M02B/M02C/M02D y M05/M05B/M05C/M05D son evidencia textual de esa redundancia.

**Disolución del valor por etapa.** El alcalde que entra a validar no debería ver el módulo de conciliación mensual EVM. El director de servicios públicos que opera el programa no debería volver a ver el costo de la omisión cada vez que abre la plataforma. La plataforma única obliga a mostrar todo a todos.

**Falta de correspondencia con la realidad contractual.** Los gates G1, G2, G3 son contractuales y dividen el proyecto en tres relaciones comerciales distintas con tres tarifas, tres entregables y tres decisores. La plataforma no refleja esta separación.

---

## 2 · Decisión

Reorganizar Alquimia en tres plataformas independientes activadas secuencialmente por el estado del tenant, gobernadas por una cuarta plataforma de administración interna. Las tres plataformas comparten base de datos y autenticación; lo que cambia es la superficie visible al cliente y la lógica de edición.

### 2.1 Las cuatro plataformas

**Plataforma 0 · Administración.** Backoffice interno de Alquimia. No es visible al cliente municipal. Especificación detallada en documento separado.

**Plataforma 1 · Validación.** Activa cuando `tenant.current_stage = "validation"`. Diez módulos del Capítulo 1 (Diagnóstico) y Capítulo 3 (Modelo). Cierra con gate G1.

**Plataforma 2 · Planeación.** Activa cuando `tenant.current_stage = "planning"`. Siete módulos del Capítulo 2 (Planificación). Cierra con gate G2.

**Plataforma 3 · Ejecución.** Activa cuando `tenant.current_stage = "execution"`. Seis módulos del Capítulo 4 (Control). Cierra con gates G3, G4, G5 progresivos.

### 2.2 Modelo de estado del tenant

```typescript
type TenantStage = "validation" | "planning" | "execution" | "expansion"

interface TenantState {
  id: string
  municipio: { nombre: string; estado: string; inegi_clave: string }
  current_stage: TenantStage
  gates: {
    G1: GateStatus  // Cabildo + reforma
    G2: GateStatus  // Adenda concesión
    G3: GateStatus  // 3 meses datos reales
    G4: GateStatus  // Año uno operativo
    G5: GateStatus  // Escalamiento territorial
  }
  tier_comercial: "diagnostico" | "implementacion" | "operacion_completa"
  capabilities_activas: string[]
  fecha_ingreso: timestamp
  fecha_cambio_stage: timestamp
}

interface GateStatus {
  status: "no_iniciado" | "en_revision" | "cerrado" | "fallido"
  closed_at: timestamp | null
  evidencia_url: string | null
  decisor_humano: string | null
}
```

### 2.3 Reglas de transición

| De | A | Condición |
|---|---|---|
| `validation` | `planning` | `gates.G1.status === "cerrado"` |
| `planning` | `execution` | `gates.G2.status === "cerrado"` |
| `execution` | `expansion` | `gates.G3.status === "cerrado"` y `capabilities_activas.length > 6` |

Las transiciones son **manuales** desde Plataforma 0 con doble confirmación del founder. Ningún agente las ejecuta automáticamente.

### 2.4 Visibilidad de módulos según etapa

Cada módulo declara en el Capability Registry su visibilidad y editabilidad:

```json
{
  "module_id": "M01",
  "name": "Diagnóstico RSU línea base",
  "platforms": ["validation", "planning", "execution"],
  "editable_in": "validation",
  "readonly_after_stage": "validation",
  "deprecated_in": null,
  "depends_on": ["M00B"],
  "produces_data_for": ["M04", "M13", "M14", "M15", "M17"]
}
```

Reglas operativas:
- Un módulo puede aparecer en varias plataformas pero solo se edita en una.
- Una vez cerrado el gate de su etapa, el módulo pasa a `read_only` en las plataformas siguientes.
- Los módulos de Ejecución (M16-M21) **no son visibles** en Validación. El alcalde no debe ver controles operativos antes de aprobar el programa.
- Los módulos de Validación (M01, M04, M13, M14) **sí son visibles** en Planeación y Ejecución como referencia trazable.

### 2.5 Estructura de URLs

```
/admin/*           Plataforma 0 (auth interna Alquimia)
/v/*               Plataforma 1 Validación
/p/*               Plataforma 2 Planeación
/e/*               Plataforma 3 Ejecución
```

El frontend lee `tenant.current_stage` y redirige automáticamente al cliente a la plataforma correspondiente. Acceso directo a una URL de plataforma posterior a la actual del tenant resulta en HTTP 403 con mensaje explicativo.

### 2.6 Capability Registry — schema final

Ubicación: `/docs/architecture/capability_registry.json`. Es la fuente única de verdad sobre qué módulos están activos en qué plataforma para qué tenant.

```json
{
  "version": "2.0.0",
  "modules": [
    {
      "module_id": "M01",
      "platforms": ["validation", "planning", "execution"],
      "editable_in": "validation",
      "default_active": true,
      "min_tier": "diagnostico",
      "monthly_price_addon": 0,
      "depends_on": ["M00B"],
      "produces_data_for": ["M04", "M13", "M14"]
    }
  ],
  "tenant_overrides": {
    "slp-capital": {
      "additional_capabilities": ["whatsapp_alerts", "google_routes"],
      "disabled_modules": []
    }
  }
}
```

---

## 3 · Migración del piloto SLP

SLP capital está hoy en "construcción libre" sin gates cerrados. La migración tiene tres pasos:

**Paso uno.** SLP entra a la nueva arquitectura con `current_stage = "validation"`. Todos los módulos avanzados de Capítulo 1 y Capítulo 3 (M01, M03B, M04, M13, M14, M15, M21) se conservan intactos. Los módulos en pañales (M02, M02C) entran en modo Carga inicial honesto.

**Paso dos.** Los módulos del Capítulo 4 ya construidos (M16, M17, M18, M19, M20, M21) **se preservan en código** pero quedan ocultos del cliente SLP hasta que llegue a etapa Ejecución. No se borran. Quedan en el repositorio como módulos disponibles que el Capability Registry decide cuándo activar.

**Paso tres.** Los módulos no construidos (M07, M11, M12) se documentan como pendientes en su plataforma correspondiente. Aparecen en el sidebar con etiqueta "En construcción" para que el cliente vea el plan completo aunque no esté terminado.

Datos preservados sin pérdida: bibliografía, cálculos, escenarios, configuraciones. Lo que cambia es solamente la organización visual y la lógica de visibilidad.

---

## 4 · Consecuencias

### 4.1 Positivas

Cada plataforma se optimiza para su único cliente y su única pregunta. La sobreingeniería desaparece por construcción porque no hay incentivo a meter módulos redundantes en una plataforma donde no responden a la pregunta del momento.

El producto comercial se simplifica radicalmente. Tres tiers (Diagnóstico, Implementación, Operación Completa) mapean uno-a-uno con tres plataformas. La propuesta deja de explicar modos y empieza a explicar relación.

El expansion revenue adquiere boundary natural. Cada plataforma puede agregar capabilities sin desordenar las anteriores. La Plataforma 3 Ejecución es donde vive el modelo Bloomberg de NRR creciente: capa de rutas, capa de tesorería, capa de quejas ciudadanas. Cada una activable desde Plataforma 0 sin tocar las plataformas anteriores.

El data moat se construye estructuralmente. Plataforma 0 ve los datos cross-tenant; las tres plataformas-cliente nunca. Esto preserva la confidencialidad por tenant mientras Alquimia acumula la inteligencia agregada que ningún competidor puede replicar.

### 4.2 Negativas

Trabajo de migración significativo. Estimación: 11 a 16 semanas con FORGE, POLIS, KRONOS, KOSMOS coordinados. Si el founder está en sprint de venta, esta arquitectura compite por atención con materiales comerciales.

Los demos actuales que muestran modo Validar e Implementar lado a lado se vuelven obsoletos. Hay que rehacerlos. Antes de migración formal, founder debe decidir si congela demos al estado actual durante 2-3 meses o si comunica el cambio progresivo a prospectos en curso.

La lógica de estado del tenant es nueva en el backend. Requiere testing exhaustivo de transiciones, read-only enforcement, y comportamiento en estados intermedios (G1 en revisión, por ejemplo). Bug en estado del tenant es catastrófico — el cliente podría ver la plataforma equivocada.

---

## 5 · Gates humanos inviolables para esta migración

**Gate founder uno.** Firma de este ADR antes de cualquier escritura de código. Sin firma, KRONOS, POLIS y FORGE no arrancan.

**Gate founder dos.** Revisión del Capability Registry definitivo producido por KOSMOS antes de migración. KOSMOS publica el JSON, founder aprueba o ajusta.

**Gate founder tres.** Validación del backup del estado actual del piloto SLP antes de migración irreversible. BIOS produce el dump, AUDITOR verifica integridad, founder firma snapshot.

**Gate founder cuatro.** Aceptación de la primera versión migrada del piloto SLP antes de retirar la arquitectura legacy. Walkthrough completo, lista de verificación cumplida, datos comparados pre y post.

---

## 6 · Plan de implementación por fases

### Fase 0 · Preparación normativa (semana 1)

Responsables: SUPREME, KOSMOS, founder.
Entregables: este ADR firmado, Capability Registry v2.0.0 publicado, backup integral del piloto SLP, lista de verificación de migración.

### Fase 1 · Plataforma 0 Administración MVP (semanas 2 a 4)

Responsables: KRONOS (backend), POLIS (frontend), FORGE (módulos administrativos).
Entregables: CRUD de tenants, gestión de gates, Capability Registry editor, dashboard de portafolio. Especificación detallada en documento separado.

### Fase 2 · Backend de estado del tenant (semanas 3 a 5, paralelo a Fase 1)

Responsable: KRONOS.
Entregables: tabla `tenant_state`, máquina de estados de gates, middleware de routing por etapa, endpoints `/admin/tenants/:id/transition`.

### Fase 3 · Frontend de routing por plataforma (semanas 5 a 8)

Responsable: POLIS.
Entregables: layouts diferenciados `/v`, `/p`, `/e`, sidebars adaptativos, breadcrumbs por etapa, badges de read-only en módulos de etapas anteriores.

### Fase 4 · Migración del piloto SLP (semana 8)

Responsables: KRONOS (ejecuta), BIOS (valida), AUDITOR (verifica).
Entregables: SLP migrado a `current_stage = "validation"`, módulos de Validación visibles, módulos de Ejecución preservados pero ocultos, datos comparados con backup pre-migración.

### Fase 5 · Consolidación de módulos (semanas 9 a 12)

Responsable: FORGE bajo dirección de OCCAM y POLIS.
Entregables: fusión M02 (cuatro pestañas), fusión M05 (cuatro pestañas), fusión M08 (dos pestañas), fusión M20 y M21 (subsecciones), supresión de IDs duplicados del Registry. Especificación de fusiones en documento de consolidación.

### Fase 6 · Personalización granular por municipio (semanas 11 a 14, paralelo a Fase 5)

Responsable: HERMES (datos) y POLIS (UI).
Entregables: schemas de Cabildo, organigrama operativo, turnos de logística, comisiones de regidores, todos personalizables por tenant. Especificación en documento de personalización.

### Fase 7 · Validación final y aceptación (semanas 15 a 16)

Responsable: AUDITOR + founder.
Entregables: lista de verificación completa, walkthrough con stakeholders internos, decisión de retirar arquitectura legacy o mantenerla en paralelo durante un periodo de transición.

---

## 7 · Rollback strategy

Si la migración falla en cualquier fase, el rollback se ejecuta desde Plataforma 0 con un solo botón "Restaurar estado pre-migración". El backup integral del piloto SLP se mantiene activo durante 90 días posteriores a la migración exitosa.

La arquitectura legacy (modo Validar/Implementar) puede coexistir con la nueva durante hasta 60 días bajo flag `legacy_mode_available = true` por tenant. Esto permite que founder compare ambos lados durante decisiones comerciales en curso.

---

## 8 · Documentos relacionados

- `ADR-0001_compositional_architecture.md` — arquitectura compositiva por capabilities (base de este ADR)
- `ADR-0007_validar_implementar_toggle.md` — arquitectura que este ADR reemplaza
- `PLATAFORMA_0_BACKOFFICE_SPEC.md` — especificación detallada de la plataforma administrativa
- `MODULE_MATURITY_AND_PERSONALIZATION.md` — assessment de madurez y schemas de personalización por módulo
- `HOJA_DE_RUTA_ALQUIMIA.md` — verdad operativa institucional (no se modifica con este ADR)

---

## 9 · Aprobación

```
[x] Founder / Usuario soberano: aprobado por instruccion directa · 2026-05-27
[x] SUPREME architectural review: firmado · sin conflicto normativo detectado · 2026-05-27
[x] KOSMOS capability registry approved: v2.0.0 revisado · 37 modulos · slp-capital en validation · 2026-05-27
[x] KRONOS technical feasibility confirmed: fase posterior autorizada solo despues de Fase 0 · 2026-05-27
[x] AUDITOR backup verification: backup integral creado e integridad verificada por checksum · 2026-05-27
```

Sin estas cinco firmas, ningún agente arranca implementación.

*ADR-0010 · Alquimia · 27 mayo 2026*
