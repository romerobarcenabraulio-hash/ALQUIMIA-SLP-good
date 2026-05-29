# LEARNING AND FEEDBACK LAYER · Agente NOUS y arquitectura de aprendizaje supervisado

**Estado:** Propuesto · Pendiente de firma del founder
**Fecha:** 28 mayo 2026
**Dependencias:** ADR-0010, PLATAFORMA_0_BACKOFFICE_SPEC, AUTOMATION_AND_PERSONALIZATION_LAYER, BILLING_CONTRACTS_LIFECYCLE
**Construye:** NOUS (nuevo agente), HERMES (datos), KRONOS (backend), KOSMOS (validación), AUDITOR (trazabilidad)

---

## 1 · Propósito

Definir cómo Alquimia aprende de la operación real de cada cliente sin convertirse en caja negra. La premisa es directa: el sistema mejora con cada validación, con cada gate cerrado, con cada divergencia entre lo proyectado y lo real. Pero cada aprendizaje queda documentado en lenguaje natural defendible ante un Cabildo, un auditor o un regidor de oposición.

Este documento introduce un agente nuevo en la familia Alquimia: **NOUS**. Su nombre viene del griego clásico — la facultad de comprensión que distingue patrones reales de coincidencias aparentes. NOUS no decide; observa, registra, sugiere y explica.

La distinción crítica que este documento defiende: no construimos machine learning opaco. Construimos estadística trazable con primacía del juicio humano. La diferencia importa porque determina si el producto es defendible legal, política y reputacionalmente.

---

## 2 · Principios no negociables del aprendizaje

**Explicabilidad antes que sofisticación.** Cualquier sugerencia que NOUS produzca debe poderse explicar en lenguaje natural a un alcalde sin formación técnica. "Según 7 municipios comparables con composición política dividida, el argumento financiero cuantificado aumentó la probabilidad de aprobación en Cabildo del 31% al 73%" es válido. "Nuestro modelo predice X" no es válido.

**Trazabilidad de cada aprendizaje.** Cada patrón que NOUS detecta tiene fuente, fecha, número de observaciones, intervalo de confianza, lista de tenants que contribuyeron (anonimizados). Una sugerencia sin trazabilidad no se publica.

**Consentimiento explícito para alimentar al colectivo.** Los datos de un tenant solo entran en analytics agregada si el tenant firmó la cláusula de opt-in del BILLING_CONTRACTS_LIFECYCLE. Sin firma, los datos del tenant alimentan a NOUS solo para mejorar las predicciones para ese mismo tenant, nunca cruzan al colectivo.

**Primacía del juicio humano.** NOUS sugiere; el cliente decide; el consultor humano puede contradecir. Cada sugerencia tiene tres botones: aceptar, ajustar, rechazar con motivo. El motivo de rechazo es parte del aprendizaje.

**Cero decisiones políticas automatizadas.** NOUS nunca recomienda con quién negociar, qué postura tomar ante el Cabildo, cómo comunicar al concesionario. Solo recomienda sobre variables cuantificables del modelo operativo y financiero.

**Sin sesgos amplificados.** El sistema vigila activamente patrones que podrían amplificar desigualdades entre municipios grandes y pequeños, entre estados ricos y pobres, entre composiciones políticas. Esto se documenta y revisa trimestralmente por el founder.

---

## 3 · Las tres capas del aprendizaje

### 3.1 Capa uno · Aprendizaje por validación del cliente

**Pregunta que responde:** ¿Qué tan bien están calibradas mis inferencias iniciales?

**Mecánica.** Cuando AUTOMATION_AND_PERSONALIZATION_LAYER precarga un dato desde fuentes públicas, el cliente lo valida con uno de cuatro botones:

- **Confirmar.** Dato correcto tal cual.
- **Ajustar.** Dato razonable pero requiere corrección. Cliente captura el valor real.
- **Reemplazar.** Dato incorrecto, cliente captura desde cero.
- **No aplica.** El dato no es relevante para este municipio.

Cada validación se registra en tabla `inference_corrections`:

```typescript
interface InferenceCorrection {
  id: string
  tenant_id: string
  module_id: string  // M01, M02, etc.
  field_id: string   // "factor_emision_relleno", "generacion_per_capita", etc.
  inferred_value: number | string
  validation_action: "confirm" | "adjust" | "replace" | "not_applicable"
  corrected_value: number | string | null
  delta_percentage: number | null  // (corrected - inferred) / inferred × 100
  corrected_by_role: string  // "Director Servicios Públicos", "Tesorero", etc.
  corrected_at: timestamp
  source_used_for_inference: string
  municipality_profile: {
    population_range: "menos_50k" | "50k_200k" | "200k_500k" | "500k_1M" | "mas_1M"
    region: "norte" | "centro" | "sur" | "metropolitana"
    political_composition: "mayoria_simple" | "dividido" | "alianza"
    tier: "diagnostico" | "implementacion" | "operacion_completa"
  }
}
```

**Aprendizaje resultante.** Después de tres correcciones similares en municipios con perfil comparable, NOUS ajusta el prior de inferencia para municipios del mismo perfil. Ejemplo concreto:

```
Estado inicial: factor de emisión inferido para rellenos sanitarios = 1.2 kgCO2e/kg
Después de 3 correcciones validadas (1.4, 1.35, 1.42) en municipios capital del norte:
  prior actualizado a 1.39 para próximos municipios del mismo perfil
  marcado de confianza sube de "inferred_medium_confidence" a "inferred_high_confidence_calibrated"
  sugerencia se acompaña de "Ajustado según validación de 3 municipios comparables"
```

**Reglas críticas:**

- Mínimo 3 correcciones validadas para activar ajuste de prior.
- Mínimo 5 correcciones para considerar el patrón "estable".
- La sugerencia ajustada lleva nota explícita citando los municipios anonimizados que contribuyeron.
- El cliente nuevo siempre puede sobrescribir el prior ajustado. Su corrección entra al sistema como observación adicional.

**Velocidad de aprendizaje.** Lenta y deliberada. Cero ajustes en los primeros 3 meses (sin volumen suficiente). Primeros ajustes mes 4-6 si hay 5+ clientes activos. Estabilización mes 12+.

### 3.2 Capa dos · Aprendizaje por outcome de gates

**Pregunta que responde:** ¿Qué configuraciones de los módulos correlacionan con éxito en los gates contractuales?

**Mecánica.** Cuando un tenant cierra o falla un gate (G1, G2, G3, G4, G5), NOUS captura un snapshot del estado de los módulos críticos al momento del cierre:

```typescript
interface GateOutcomeSnapshot {
  id: string
  tenant_id: string
  gate: "G1" | "G2" | "G3" | "G4" | "G5"
  outcome: "cerrado_exitoso" | "fallido" | "diferido" | "cerrado_con_modificaciones"
  closed_at: timestamp
  days_to_close: number  // desde entrada a la etapa
  module_state_at_close: {
    [module_id: string]: {
      data_completeness_pct: number  // qué tan poblado estaba el módulo
      validation_pct: number          // qué porcentaje de datos validados por cliente
      key_metrics: { [metric_id: string]: number | string }
      recommendations_accepted: number
      recommendations_rejected: number
      recommendations_rejected_reasons: string[]
    }
  }
  municipality_profile: { ... }  // mismo schema que capa uno
  political_context: {
    cabildo_composition: { ... }
    elections_proximity_months: number
    media_coverage_sentiment: "favorable" | "neutral" | "critico" | "mixto"
  }
  payer_configuration_at_close: "A" | "B" | "C" | "D"
}
```

**Aprendizaje resultante.** Después de 8 a 10 outcomes de un mismo gate, NOUS empieza a detectar correlaciones:

```
Patrón detectado: G1 en municipios capital con Cabildo dividido (oposición 40%+)
  - Cuando M04 (costo de la omisión) presenta argumento financiero cuantificado en pesos
    perdidos por administración:
    probabilidad de cierre exitoso = 73% (n=7)
  - Cuando M04 presenta solo argumento ambiental sin cuantificación financiera:
    probabilidad de cierre exitoso = 31% (n=4)
  - Diferencia estadísticamente significativa (test exacto de Fisher, p<0.05)
  - Recomendación: para municipios con perfil similar, priorizar cuantificación
    financiera en M04 antes de presentar al Cabildo
```

**Reglas críticas:**

- Mínimo 8 outcomes para considerar un patrón "emergente".
- Mínimo 15 outcomes para considerar un patrón "establecido".
- Mínimo 30 outcomes para considerar un patrón "robusto".
- Los patrones se publican como sugerencias solo en categoría correspondiente a su robustez.
- Las sugerencias incluyen siempre el N (número de observaciones) y el rango de confianza.

**Salvaguardas contra sesgo.**

- NOUS no aprende correlaciones que involucren variables protegidas: partido político específico, religión del decisor, género, etnia.
- NOUS sí aprende correlaciones sobre variables estructurales: composición de Cabildo (porcentaje oposición), tamaño del municipio, región, calendario electoral.
- Distinción crítica: "El argumento financiero funciona en Cabildos divididos" es válido. "El argumento financiero funciona con alcaldes de partido X" no lo es.

**Auditoría trimestral.** Cada trimestre, AUDITOR revisa todos los patrones nuevos detectados y verifica que cumplen las restricciones de sesgo. Patrones que violan se retiran y el founder es notificado.

### 3.3 Capa tres · Aprendizaje por divergencia proyectado vs real

**Pregunta que responde:** ¿Dónde sistemáticamente nuestras proyecciones se equivocan, y cómo recalibrarlas?

**Mecánica.** M17 ya compara proyectado contra real mensualmente. NOUS captura el delta y lo persiste:

```typescript
interface ProjectionDelta {
  id: string
  tenant_id: string
  module_id: string  // M01 (toneladas), M09 (CAPEX), M13 (TIR), etc.
  metric_id: string
  projected_value: number
  actual_value: number
  measurement_period: string  // "2026-05" formato YYYY-MM
  delta_absolute: number
  delta_percentage: number  // (actual - projected) / projected × 100
  delta_direction: "sobreestimacion" | "subestimacion" | "exacto"
  measurement_quality: "alta" | "media" | "baja"  // según fuente del dato real
  municipality_profile: { ... }
}
```

**Aprendizaje resultante.** Después de 3-6 meses de operación de un tenant, NOUS empieza a detectar sesgos sistemáticos del modelo para perfiles específicos:

```
Patrón detectado: M01 generación per cápita
  - En municipios conurbados de zona metropolitana (n=4):
    proyección promedio sobreestima 18.3% respecto a realidad
    desviación estándar de la sobreestimación = 4.2%
    consistencia: 14 de 18 mediciones mensuales muestran sobreestimación
  - Recomendación: ajustar prior de generación per cápita para perfil
    "conurbado_metropolitano" multiplicando por factor 0.82
  - Confianza: alta (n=18 mediciones, consistencia 78%)
```

**Reglas críticas:**

- Mínimo 6 meses de mediciones para considerar recalibración.
- Mínimo 3 tenants con perfil similar para considerar patrón general.
- Las recalibraciones se aplican a inferencias nuevas, nunca retroactivamente a inferencias ya validadas por clientes.
- Cada recalibración produce un changelog visible al cliente: "Ajustamos el modelo basado en N municipios comparables; tu cifra fue ajustada de X a Y."

**Bayesian updating explícito.** Este es el único punto donde NOUS aplica matemática que se podría llamar "ML" en sentido amplio. Pero la matemática es transparente:

```
Prior antes de calibración: μ_inicial = 0.90 kg/persona/día, σ_inicial = 0.15
Observaciones reales: 0.74, 0.78, 0.71, 0.76, 0.79, 0.73 (n=6)
Likelihood: media observada = 0.752, desviación = 0.030
Posterior calculado: μ_actualizado = 0.78, σ_actualizada = 0.08
Diferencia con prior: -13.3% (sobreestimación corregida)
```

El cálculo se publica abierto. Cualquier consultor con formación estadística básica puede replicarlo. Esto es lo opuesto de caja negra.

---

## 4 · El agente NOUS

### 4.1 Perfil del agente

**Nombre:** NOUS  
**Familia:** Agentes de aprendizaje (única instancia)  
**Nivel de autonomía:** L1 para detección de patrones; L0 para publicación de sugerencias (requiere gate humano)  
**Cuándo activa:** continuamente en background una vez hay datos suficientes  
**Cuándo se detiene:** cuando AUDITOR detecta sesgo amplificado o cuando founder lo pausa manualmente

### 4.2 Funciones específicas

1. **Observación.** Monitorea continuamente las tres capas de aprendizaje. Detecta correcciones, outcomes y deltas.

2. **Detección de patrones.** Aplica análisis estadístico básico (test de Fisher, intervalos de confianza, Bayesian updating) para identificar patrones emergentes, establecidos y robustos.

3. **Validación de patrones.** Antes de publicar cualquier patrón, lo valida contra las restricciones de sesgo. Si el patrón viola las restricciones, lo retira y notifica al founder.

4. **Redacción de sugerencias.** Convierte cada patrón estadístico en una sugerencia en lenguaje natural defendible. Cada sugerencia incluye: qué se observó, en cuántos casos, con qué confianza, qué se sugiere, cómo se puede rechazar.

5. **Trazabilidad.** Mantiene log auditable de cada patrón detectado, cada sugerencia publicada, cada aceptación/rechazo del cliente, cada decisión del founder.

6. **Self-monitoring.** Trimestralmente, NOUS produce reporte de su propia operación: cuántos patrones detectó, cuántos fueron retirados por sesgo, qué tan bien sus sugerencias correlacionaron con outcomes posteriores.

### 4.3 Lo que NOUS nunca hace

- No toma decisiones por el cliente. Solo sugiere.
- No accede a datos individuales identificables de funcionarios públicos (nombres, teléfonos, correos personales).
- No aprende correlaciones que involucren variables protegidas legalmente.
- No publica sugerencias sobre tenants que no firmaron opt-in de analytics agregada.
- No modifica datos del cliente sin validación humana.
- No envía notificaciones directas al cliente sin gate del founder.
- No actualiza Capability Registry. Eso solo lo hace KOSMOS con autorización del founder.
- No genera contenido para reportes formales (expediente Cabildo, reporte ESG). Eso lo hacen los agentes existentes.

### 4.4 Cómo NOUS se relaciona con otros agentes

| Agente | Relación con NOUS |
|---|---|
| **HERMES** | Proporciona datos de fuentes públicas. NOUS no modifica las fuentes, solo aprende patrones de cómo se corrigen. |
| **KRONOS** | Implementa el backend de NOUS. Storage, jobs de análisis, webhooks. |
| **KOSMOS** | Valida que los aprendizajes de NOUS respetan el schema del Capability Registry. Decide cuándo un patrón se incorpora oficialmente al sistema. |
| **MARCOS** | Verifica que las sugerencias de NOUS no contradicen los estándares declarados (GRI, ISO, PMI, CSRD). |
| **AUDITOR** | Trimestralmente audita todos los patrones de NOUS. Tiene poder de veto sobre cualquier sugerencia. |
| **POLIS** | Diseña la UI donde las sugerencias de NOUS aparecen al cliente y al founder. |
| **EIDOS** | Verifica que la redacción de sugerencias de NOUS respeta los principios editoriales (conclusión primero, lenguaje claro). |
| **SUPREME** | En el ritual semanal, revisa qué aprendió NOUS esa semana y qué patrones nuevos emergieron. |
| **LISTENER** | Asegurarse que el log de NOUS está completo y trazable. |

---

## 5 · Arquitectura técnica

### 5.1 Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    NOUS Agent Runtime                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │ Observers        │  │ Pattern Detectors        │    │
│  │ - Validation     │  │ - Capa 1 (correcciones)  │    │
│  │ - Gate outcomes  │  │ - Capa 2 (outcomes)      │    │
│  │ - Projection     │  │ - Capa 3 (proyecciones)  │    │
│  │   deltas         │  │                          │    │
│  └────────┬─────────┘  └─────────┬────────────────┘    │
│           │                       │                      │
│           ▼                       ▼                      │
│  ┌─────────────────────────────────────────────┐       │
│  │ Bias Filter & Sensitivity Validator         │       │
│  └─────────────────────────────────────────────┘       │
│                       │                                  │
│                       ▼                                  │
│  ┌─────────────────────────────────────────────┐       │
│  │ Suggestion Composer (lenguaje natural)      │       │
│  └─────────────────────────────────────────────┘       │
│                       │                                  │
│                       ▼                                  │
│  ┌─────────────────────────────────────────────┐       │
│  │ Founder Gate Queue                          │       │
│  └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Plataforma 0 · A11   │
            │  NOUS Insights Panel │
            └──────────────────────┘
```

### 5.2 Storage

Cuatro tablas nuevas en PostgreSQL:

```sql
-- Tabla 1: Correcciones validadas por cliente (capa 1)
CREATE TABLE inference_corrections (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  module_id VARCHAR(10),
  field_id VARCHAR(100),
  inferred_value JSONB,
  validation_action VARCHAR(20),
  corrected_value JSONB,
  delta_percentage NUMERIC,
  corrected_by_role VARCHAR(100),
  corrected_at TIMESTAMPTZ,
  source_used_for_inference VARCHAR(255),
  municipality_profile JSONB,
  included_in_aggregate BOOLEAN DEFAULT FALSE  -- depende de opt-in del tenant
);

-- Tabla 2: Outcomes de gates (capa 2)
CREATE TABLE gate_outcomes (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  gate VARCHAR(3),
  outcome VARCHAR(30),
  closed_at TIMESTAMPTZ,
  days_to_close INT,
  module_state_at_close JSONB,
  municipality_profile JSONB,
  political_context JSONB,
  payer_configuration VARCHAR(1),
  included_in_aggregate BOOLEAN DEFAULT FALSE
);

-- Tabla 3: Deltas proyectado vs real (capa 3)
CREATE TABLE projection_deltas (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  module_id VARCHAR(10),
  metric_id VARCHAR(100),
  projected_value NUMERIC,
  actual_value NUMERIC,
  measurement_period VARCHAR(7),
  delta_absolute NUMERIC,
  delta_percentage NUMERIC,
  delta_direction VARCHAR(20),
  measurement_quality VARCHAR(10),
  municipality_profile JSONB,
  included_in_aggregate BOOLEAN DEFAULT FALSE
);

-- Tabla 4: Patrones detectados por NOUS
CREATE TABLE nous_patterns (
  id UUID PRIMARY KEY,
  pattern_layer INT,  -- 1, 2 o 3
  pattern_description_natural TEXT,
  pattern_description_technical JSONB,
  observations_count INT,
  confidence_level VARCHAR(20),  -- "emergente", "establecido", "robusto"
  statistical_significance NUMERIC,
  contributing_tenant_profiles JSONB,
  bias_check_status VARCHAR(20),
  bias_check_at TIMESTAMPTZ,
  bias_check_by VARCHAR(50),
  founder_gate_status VARCHAR(20),  -- "pendiente", "aprobado", "rechazado"
  published_to_clients BOOLEAN DEFAULT FALSE,
  retired_at TIMESTAMPTZ,
  retired_reason TEXT
);
```

### 5.3 Jobs en background

```typescript
// Cron job diario 03:00 hora SLP
async function dailyPatternDetection() {
  // Solo procesa tenants con opt-in firmado
  const eligibleTenants = await getTenantsWithAggregateOptIn();
  
  // Capa 1: correcciones validadas en últimas 24h
  const newCorrections = await getRecentCorrections(24);
  for (const correction of newCorrections) {
    await analyzeCorrectionForPattern(correction);
  }
  
  // Capa 2: gates cerrados en últimas 24h
  const newGateOutcomes = await getRecentGateOutcomes(24);
  for (const outcome of newGateOutcomes) {
    await analyzeGateOutcomeForPattern(outcome);
  }
  
  // Capa 3: deltas mensuales del mes anterior
  if (isFirstDayOfMonth()) {
    const previousMonthDeltas = await getMonthlyDeltas();
    for (const delta of previousMonthDeltas) {
      await analyzeDeltaForPattern(delta);
    }
  }
  
  // Notificar al founder
  const newPatternsForReview = await getPendingFounderGate();
  if (newPatternsForReview.length > 0) {
    await notifyFounder(newPatternsForReview);
  }
}

// Cron job trimestral
async function quarterlyBiasAudit() {
  const allActivePatterns = await getAllActivePatterns();
  for (const pattern of allActivePatterns) {
    const biasCheck = await runBiasValidation(pattern);
    if (biasCheck.failed) {
      await retirePattern(pattern, biasCheck.reason);
      await notifyFounder({ retired: pattern });
    }
  }
}
```

---

## 6 · Módulo A11 en Plataforma 0 · NOUS Insights Panel

Módulo nuevo dedicado a la interfaz humana con NOUS.

### 6.1 Pestañas

**A11.1 · Patrones pendientes de revisión.** Founder ve patrones nuevos detectados que esperan su gate. Cada patrón muestra: descripción en lenguaje natural, evidencia estadística, número de observaciones, bias check passed/failed, botones aprobar/rechazar/posponer.

**A11.2 · Patrones publicados.** Lista de todos los patrones activos siendo usados como sugerencias para clientes. Filtrable por capa, por módulo, por confianza. Founder puede retirar patrones manualmente si decide.

**A11.3 · Auditoría de sesgo.** Reporte trimestral de patrones revisados por sesgo. Cuántos pasaron, cuántos se retiraron, motivos.

**A11.4 · Performance de NOUS.** Métricas de cuán bien NOUS predice. Patrones publicados versus outcomes posteriores. Si NOUS sugirió X y el cliente lo aceptó y el outcome fue Y, ¿cómo se compara?

**A11.5 · Self-report trimestral.** Reporte que NOUS produce sobre su propia operación: qué aprendió, qué patrones emergieron, qué retiró, qué confianza tiene en cada categoría.

### 6.2 Vista del cliente (en las plataformas 1, 2, 3)

Cuando NOUS publica una sugerencia para un cliente, aparece como tarjeta especial dentro del módulo correspondiente:

```
┌─────────────────────────────────────────────────────────┐
│ ↗ Sugerencia NOUS                                       │
│                                                          │
│ Para municipios capital con composición política        │
│ similar al suyo (7 casos comparables), cuantificar el  │
│ argumento financiero en pesos perdidos por             │
│ administración aumenta la probabilidad de aprobación   │
│ en Cabildo del 31% al 73%.                              │
│                                                          │
│ Sugerimos priorizar la sección "Costo evitado por      │
│ administración" en M04 antes de la presentación.       │
│                                                          │
│ Confianza: establecido (n=7, p<0.05)                   │
│ Basado en: 7 municipios comparables anonimizados       │
│                                                          │
│ [Aceptar sugerencia] [Ajustar] [Rechazar con motivo]   │
└─────────────────────────────────────────────────────────┘
```

El cliente nunca ve el patrón estadístico crudo. Ve la sugerencia traducida a su contexto operativo.

---

## 7 · Cronograma de activación

NOUS no se construye todo de una vez. Se activa por capas según los datos disponibles.

| Momento | Estado de Alquimia | Capa de NOUS activa | Justificación |
|---|---|---|---|
| Mes 0-3 | 1 cliente operando (SLP) | Solo storage observacional. NOUS recolecta sin sugerir nada. | Volumen insuficiente para patrones. Construir solo las tablas y observers. |
| Mes 3-6 | 2-3 clientes operando | Capa 1 emerge para municipios del mismo perfil. | Suficientes correcciones validadas para ajustar priors básicos. |
| Mes 6-12 | 5+ clientes operando | Capa 1 madura, capa 2 emerge para G1 si hay outcomes suficientes. | Primeros patrones de outcome de gate disponibles. |
| Mes 12-18 | 8+ clientes operando | Capa 1 robusta, capa 2 establecida, capa 3 emerge. | Tres tenants con 6+ meses de operación permiten detectar sesgos de proyección. |
| Mes 18-24 | 12+ clientes operando | Las tres capas operando. Cross-tenant analytics maduro. | Data moat empieza a ser tangible. |
| Mes 24+ | 15+ clientes operando | NOUS sugiere automáticamente con alta confianza para perfiles establecidos. | Sistema completamente maduro. |

**No acelerar.** El error más grande sería activar capas con datos insuficientes. Eso produce ruido en lugar de señal y daña la credibilidad del sistema.

---

## 8 · Gates humanos del founder

**Gate uno.** Aprobación de este documento antes de que NOUS se construya.

**Gate dos.** Aprobación del schema de patrones antes de que la primera tabla se cree.

**Gate tres.** Cada patrón individual antes de publicarse a clientes. Aceptar, rechazar o posponer.

**Gate cuatro.** Auditoría trimestral. Founder revisa el reporte de sesgo y decide si retira patrones adicionales.

**Gate cinco.** Decisión anual de continuidad. ¿NOUS sigue operando como está? ¿Se ajustan reglas? ¿Se pausa temporalmente?

---

## 9 · Casos de uso operativos

### 9.1 Querétaro corrige una inferencia inicial

```
Día 1. Querétaro firma contrato.
Día 1. Pipeline de inferencia inicial precarga:
  M01 factor de emisión de relleno = 1.2 kgCO2e/kg (benchmark SEMARNAT general)
Día 3. Director de Servicios Públicos Querétaro abre M01, revisa.
Día 3. Director hace click en "Ajustar", captura valor real basado en estudio
       local: 1.38 kgCO2e/kg.
Día 3. Sistema registra correction en tabla inference_corrections:
  - delta_percentage = +15%
  - corrected_by_role = "Director de Servicios Públicos"
  - municipality_profile = capital, centro, dividido, diagnostico
Día 3. NOUS observa la corrección. Aún no hay patrón (es la primera para este perfil).
```

### 9.2 NOUS detecta patrón después de la tercera corrección

```
Mes 5. Tres municipios capital del norte han corregido el mismo campo:
  - SLP: 1.40
  - Monterrey: 1.35
  - Hermosillo: 1.42
Mes 5. Job diario de NOUS detecta:
  - Media de correcciones: 1.39
  - Desviación: 0.035
  - Consistencia: 3 de 3 corrigieron al alza
Mes 5. NOUS marca patrón como "emergente" (n=3, por debajo de umbral n=8 establecido).
Mes 5. NOUS NO publica todavía. Espera más observaciones.

Mes 9. Octava corrección llega.
Mes 9. NOUS recalcula y marca patrón como "establecido".
Mes 9. NOUS genera sugerencia en lenguaje natural.
Mes 9. AUDITOR ejecuta bias check automático. Pasa (no involucra variables protegidas).
Mes 9. Patrón entra a queue de revisión del founder en A11.1.
Mes 9. Founder revisa, aprueba.
Mes 9. Patrón se publica como sugerencia para el próximo cliente con perfil similar.
```

### 9.3 NOUS detecta correlación con outcome de gate

```
Mes 14. Octavo municipio ha cerrado o fallado G1.
Mes 14. NOUS analiza:
  - 7 G1 cerrados exitosos
  - 1 G1 fallido
  - De los 7 exitosos: 5 tenían M04 con cuantificación financiera detallada
  - Del 1 fallido: no tenía M04 con cuantificación financiera
Mes 14. NOUS calcula test exacto de Fisher: p < 0.05
Mes 14. NOUS genera sugerencia natural.
Mes 14. AUDITOR verifica que el patrón no involucra variables protegidas.
Mes 14. Patrón aprobado, publicado.
Mes 15. Siguiente cliente entra a Validación. Cuando llega a M04 ve la sugerencia.
```

### 9.4 NOUS detecta sesgo en proyección de M01

```
Mes 18. Cuatro municipios conurbados de zona metropolitana llevan 6 meses operando.
Mes 18. NOUS analiza deltas mensuales de generación per cápita proyectada vs real:
  - 18 mediciones totales
  - 14 sobreestimaciones, 4 exactas, 0 subestimaciones
  - Sobreestimación promedio: 18.3% ± 4.2%
Mes 18. NOUS calcula recalibración Bayesiana:
  - Prior actual del modelo: 0.90 kg/persona/día
  - Posterior con observaciones: 0.78 kg/persona/día
  - Factor de ajuste para perfil "conurbado_metropolitano": ×0.82
Mes 18. NOUS prepara changelog con explicación matemática completa.
Mes 18. Founder revisa, aprueba.
Mes 18. Para próximos clientes con perfil similar, M01 precarga 0.78 en lugar de 0.90.
Mes 18. Changelog visible al cliente: "Ajustamos el modelo basado en 4 municipios
        comparables; tu cifra fue ajustada de 0.90 a 0.78 kg/persona/día."
```

---

## 10 · Criterios binarios de cierre

NOUS está cerrado cuando se cumplen:

1. Agente NOUS funcional en producción con sus cuatro componentes (Observers, Detectors, Bias Filter, Composer).
2. Cuatro tablas de storage operativas en PostgreSQL.
3. Jobs en background corriendo diariamente y trimestralmente.
4. Módulo A11 en Plataforma 0 con sus cinco pestañas operativas.
5. UI de sugerencias en plataformas-cliente (1, 2, 3) con tres botones (aceptar, ajustar, rechazar).
6. Audit log completo de cada patrón, cada sugerencia, cada decisión.
7. Bias check funcional que retira patrones que involucran variables protegidas.
8. Reporte trimestral auto-generado de operación de NOUS.
9. Opt-in del tenant respetado: datos de tenants sin firma no entran a aggregate.
10. Cero patrones publicados sin gate del founder.

---

## 11 · Riesgos operativos

**Riesgo uno · Overfitting con pocos datos.** Con n=3 detectar un patrón es prácticamente garantía de detectar coincidencias. Mitigación: umbrales conservadores (n=8 mínimo establecido, n=15 robusto), reportes de confianza explícitos al founder, capacidad de retirar patrones rápidamente.

**Riesgo dos · Sesgo amplificado.** NOUS aprende de outcomes históricos que pueden reflejar sesgos del sistema político mexicano (municipios pobres reciben menos atención, oposición gana menos). Mitigación: bias check trimestral con variables protegidas explícitas, founder con poder de veto, auditoría AUDITOR continua.

**Riesgo tres · Cliente confía ciegamente.** "NOUS lo dijo" se vuelve excusa para no pensar. Mitigación: cada sugerencia incluye explícitamente N, confianza, motivo. Cada sugerencia tiene botón de rechazo con motivo obligatorio. UI evita lenguaje de autoridad ("debes", "tienes que") y privilegia lenguaje sugerente ("sugerimos", "considera").

**Riesgo cuatro · Caja negra percibida.** Aunque la matemática es trazable, un cliente puede sentir que "el sistema decide por mí". Mitigación: explicabilidad obligatoria en lenguaje natural, capacidad de pedir explicación detallada (auto-generada en lenguaje técnico para auditores), publicación de la metodología completa en /docs/methodology/nous.md.

**Riesgo cinco · Patrones contradicen estándares.** NOUS detecta un patrón que sugiere acciones contrarias a GRI o ISO. Mitigación: MARCOS valida cada sugerencia contra standards_map.json antes de publicar.

**Riesgo seis · Manipulación maliciosa.** Si un cliente sabe cómo funciona NOUS, podría introducir correcciones sesgadas para alterar el sistema. Mitigación: detección de correcciones outliers, validación cruzada entre tenants, founder revisa cualquier corrección con delta > 50%.

**Riesgo siete · Computacionalmente costoso a escala.** Con 50+ tenants, los jobs diarios pueden ser pesados. Mitigación: arquitectura preparada para mover NOUS a worker dedicado en Render cuando volumen lo requiera.

---

## 12 · Implementación en el roadmap

Esta capa NO entra en el roadmap del ADR-0010 directamente. Se implementa en una fase posterior cuando los datos disponibles lo justifican.

| Momento | Acción |
|---|---|
| Fase 4 ADR-0010 (semana 8) | SLP migrado. Construir solo tablas de storage de NOUS (sin lógica). |
| Mes 4-6 post-Fase 7 | Cuando hay 3 clientes operando, construir Observers y storage. |
| Mes 6-9 post-Fase 7 | Construir Pattern Detectors capa 1. Primeros patrones emergentes. |
| Mes 9-12 post-Fase 7 | Construir capa 2 (outcomes de gate). |
| Mes 12-18 post-Fase 7 | Construir capa 3 (proyecciones). Sistema completo. |
| Mes 18+ | Operación madura. Self-monitoring trimestral activo. |

Trabajo de desarrollo total: aproximadamente 4-6 semanas distribuidas en 12-18 meses, en lugar de un sprint único. Esto es intencional. La velocidad lenta es la mejor mitigación contra los riesgos anteriores.

---

## 13 · Documentos relacionados

- `ADR-0010_stage_based_platform_separation.md` — arquitectura base
- `PLATAFORMA_0_BACKOFFICE_SPEC.md` — donde vive A11
- `MODULE_MATURITY_AND_PERSONALIZATION.md` — schemas de los módulos que NOUS observa
- `AUTOMATION_AND_PERSONALIZATION_LAYER.md` — inferencias iniciales que NOUS calibra
- `BILLING_CONTRACTS_LIFECYCLE.md` — cláusula de opt-in para aggregate
- `HOJA_DE_RUTA_ALQUIMIA.md` — verdad operativa institucional
- `alquimia_prompts_agentes.md` — catálogo donde se agregará el prompt de NOUS

---

## 14 · Aprobación

```
[ ] Founder · aprobación de filosofía y alcance
[ ] SUPREME · architectural review
[ ] KOSMOS · schema validation
[ ] KRONOS · technical feasibility
[ ] MARCOS · standards compatibility
[ ] AUDITOR · bias and traceability framework
[ ] EIDOS · suggestion language guidelines
```

Las siete firmas. Sin ellas, NOUS no opera.

---

*LEARNING AND FEEDBACK LAYER · Agente NOUS · Alquimia · 28 mayo 2026*
