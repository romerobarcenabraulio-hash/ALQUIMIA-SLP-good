# PLAN DE EJECUCION — Reestructura de Modulos ALQUIMIA (Fase 2)

> Creado por PD&SA (Opus). El agente ejecutor (Sonnet) debe seguir las instrucciones AL PIE DE LA LETRA.
> Guia estetica completa: `cursor-rules/ESTETICA_FRONTEND.md`
> Cada cambio debe compilar: `cd frontend && npx tsc --noEmit`

---

## RESUMEN EJECUTIVO

**10 tareas** divididas en 3 bloques:
- **Bloque A (Infraestructura):** Registrar modulos nuevos, reordenar journey, actualizar routing — T1-T6
- **Bloque B (Contenido):** Crear CostosProgramaStack, editorial briefs — T7-T8
- **Bloque C (Narrativa):** Activar codigo narrativo muerto en BottomBar — T9-T10

**Orden de dependencias:**
```
T4 → T7 → T1 → T2 → T3 → T5 → T6 → T8 → T9 → T10
```
T4 primero (definiciones), T7 segundo (stack nuevo), luego el resto secuencial.

---

## CONVENCION ESTETICA PARA TODO COMPONENTE NUEVO/MODIFICADO

Aplicar SIEMPRE estas reglas (ref: `cursor-rules/ESTETICA_FRONTEND.md`):

```
FONDO AREA PRINCIPAL:     bg-white (o bg-[#FAFAF7])
CARDS:                    bg-white border border-[#E7E5DC] rounded-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]
CARDS IMPORTANTES:        bg-[#F1F8EC] border-[#C9DDB1] (verde) o bg-[#FAF6ED] border-[#E8E4DC] (beige)
TITULO MODULO:            font-serif text-[28px] sm:text-[32px] font-semibold leading-tight text-[#1C1B18]
SUBTITULO:                text-[15px] font-medium text-[#3E7D27]
BREADCRUMB:               text-[11px] uppercase tracking-[0.06em] text-[#8A9286]
TITULO SECCION:           text-[20px] font-semibold text-[#1F2933]
TEXTO NORMAL:             text-[14px] leading-relaxed text-[#1F2933]
TEXTO SECUNDARIO:         text-[13px] text-[#5F6B5F]
LABELS:                   text-[11px] uppercase tracking-[0.06em] font-semibold text-[#8A9286]
KPI NUMERO:               text-[26px] font-semibold text-[#1F2933] (o text-[#2F6B1F] para positivo)
KPI LABEL:                text-[11px] uppercase tracking-[0.06em] text-[#8A9286]
TABLA HEADER:             text-[12px] font-semibold text-[#1F2933] bg-[#F7F7F2]
TABLA BODY:               text-[13px] text-[#1F2933]
SEPARACION SECCIONES:     space-y-6 (24px)
SEPARACION CARDS:         gap-4 (16px)
MARGEN CONTENIDO:         px-6 py-6 (24px)
BOTON PRIMARIO:           bg-[#2F6B1F] text-white rounded-[10px] h-[44px] font-semibold text-[14px]
BOTON SECUNDARIO:         bg-white border border-[#E7E5DC] text-[#5F6B5F] rounded-[10px]
CHIP VERDE:               bg-[#EAF5E4] text-[#2F6B1F] text-[11px] rounded-full px-3 py-1
CHIP AMARILLO:            bg-[#FFF7E6] text-[#D98A1E] text-[11px] rounded-full px-3 py-1
CHIP ROJO:                bg-[#FDECEC] text-[#C94A3A] text-[11px] rounded-full px-3 py-1
```

**Jerarquia por pagina (obligatoria):**
1. Titulo + subtitulo explicativo
2. 3-5 KPI cards (72-96px alto, max 5 por fila)
3. Lectura ejecutiva (2-4 lineas, "que se observa, por que importa, que decision habilita")
4. Grafica/tabla protagonista
5. Detalle secundario
6. Acciones
7. Consideraciones en rail derecho (gestionado por DecisionModuleShell)

---

## TAREA 1: Reorganizar audienceModules.ts

**Archivo:** `frontend/src/lib/audienceModules.ts`

**Buscar el array `functionary` completo** y **reemplazar con:**

```typescript
  functionary: [
    // Guia de lectura — Steps for Circularity (obligatorio, pre-capitulo)
    'guia_circularidad',
    // Cap 1 — Diagnostico Base: Que tenemos y donde estamos?
    'city_baseline',        // M01 Linea base territorial y RSU
    'social_study',         // M02 Diagnostico social y aceptacion ciudadana
    'municipal_context',    // M03 Marco legal y brechas normativas
    // Cap 2 — Planificacion Estrategica: Que necesitamos construir?
    'future_goals',              // M04 Metas y trayectorias de captura
    'infrastructure_operations', // M05 Infraestructura y centros de acopio
    'logistica_operativa',       // M06 Logistica, rutas y diseno de piloto
    'costos_programa',           // M07 Tabla maestra CAPEX/OPEX (NUEVO)
    'market_traceability',       // M08 Mercado de materiales y compradores
    // Cap 3 — Diseno del Modelo: Quien paga, quien opera, es viable?
    'esquema_concesion',   // M09 Esquema de concesion y arbol de decision
    'scenarios_export',    // M10 Escenarios financieros y exportacion
    'risk_trends',         // M11 Riesgos del modelo completo
    // Cap 4 — Ejecucion y Control: Como arrancamos y como medimos?
    'inspeccion_predios',  // M12 Inspeccion y cumplimiento
    'monitoreo_real',      // M13 Monitoreo proyectado vs. real (RESCATADO)
    'doble_materialidad',  // M14 Doble materialidad y reporte ESG
    'source_traceability', // M15 Trazabilidad de fuentes y formulas
  ],
```

---

## TAREA 2: Actualizar DecisionModuleShell.tsx

**Archivo:** `frontend/src/components/simulator/DecisionModuleShell.tsx`

### 2a: MODULE_NUMBERS — buscar el bloque completo y reemplazar:

```typescript
const MODULE_NUMBERS: Record<string, string> = {
  guia_circularidad:        '00',
  city_baseline:            '01',
  social_study:             '02',
  municipal_context:        '03',
  citizen_inputs:           '02',
  future_goals:             '04',
  infrastructure_operations:'05',
  logistica_operativa:      '06',
  costos_programa:          '07',
  market_traceability:      '08',
  esquema_concesion:        '09',
  scenarios_export:         '10',
  risk_trends:              '11',
  inspeccion_predios:       '12',
  monitoreo_real:           '13',
  doble_materialidad:       '14',
  source_traceability:      '15',
  impact_finance:           '·',
  organization_profile:     'E1',
  containers_provider:      'E2',
  organization_report:      'E3',
}
```

### 2b: MODULE_ETAPA — buscar y reemplazar:

```typescript
const MODULE_ETAPA: Record<string, 1 | 2 | 3 | 4> = {
  city_baseline: 1, social_study: 1, municipal_context: 1, citizen_inputs: 1,
  future_goals: 2, infrastructure_operations: 2, logistica_operativa: 2,
  costos_programa: 2, market_traceability: 2,
  esquema_concesion: 3, scenarios_export: 3, risk_trends: 3,
  inspeccion_predios: 4, monitoreo_real: 4,
  doble_materialidad: 4, source_traceability: 4, impact_finance: 4,
}
```

### 2c: ETAPAS — buscar y reemplazar:

```typescript
const ETAPAS = [
  { num: 1 as const, label: 'Diagnostico',    modulos: ['city_baseline', 'social_study', 'municipal_context'] },
  { num: 2 as const, label: 'Planificacion',  modulos: ['future_goals', 'infrastructure_operations', 'logistica_operativa', 'costos_programa', 'market_traceability'] },
  { num: 3 as const, label: 'Modelo',         modulos: ['esquema_concesion', 'scenarios_export', 'risk_trends'] },
  { num: 4 as const, label: 'Control',        modulos: ['inspeccion_predios', 'monitoreo_real', 'doble_materialidad', 'source_traceability'] },
]
```

---

## TAREA 3: Actualizar inyeccion en page.tsx

**Archivo:** `frontend/src/app/simulator/page.tsx`

### 3a: Agregar imports:

Al import de `functionaryJourneyEnrichment`, agregar `MONITOREO_REAL_MODULE` y `COSTOS_PROGRAMA_MODULE`.

### 3b: Reordenar logica de inyeccion:

En el `useMemo` de `portalJourneyWithTraceability`, reemplazar desde `// social_study despues de municipal_context` hasta `return result` con:

```typescript
    // social_study ANTES de municipal_context (M01 -> M02 social -> M03 legal)
    if (!result.some(m => m.module_id === 'social_study')) {
      const idx = result.findIndex(m => m.module_id === 'city_baseline')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), SOCIAL_STUDY_MODULE, ...result.slice(idx + 1)]
        : [SOCIAL_STUDY_MODULE, ...result]
    }
    // logistica_operativa despues de infrastructure_operations
    if (!result.some(m => m.module_id === 'logistica_operativa')) {
      const idx = result.findIndex(m => m.module_id === 'infrastructure_operations')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), LOGISTICA_MODULE, ...result.slice(idx + 1)]
        : [...result, LOGISTICA_MODULE]
    }
    // costos_programa despues de logistica_operativa (NUEVO)
    if (!result.some(m => m.module_id === 'costos_programa')) {
      const idx = result.findIndex(m => m.module_id === 'logistica_operativa')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), COSTOS_PROGRAMA_MODULE, ...result.slice(idx + 1)]
        : [...result, COSTOS_PROGRAMA_MODULE]
    }
    // esquema_concesion antes de scenarios_export
    if (!result.some(m => m.module_id === 'esquema_concesion')) {
      const idx = result.findIndex(m => m.module_id === 'scenarios_export')
      result = idx >= 0
        ? [...result.slice(0, idx), ESQUEMA_CONCESION_MODULE, ...result.slice(idx)]
        : [...result, ESQUEMA_CONCESION_MODULE]
    }
    // monitoreo_real despues de inspeccion_predios (RESCATADO)
    if (!result.some(m => m.module_id === 'monitoreo_real')) {
      const idx = result.findIndex(m => m.module_id === 'inspeccion_predios')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), MONITOREO_REAL_MODULE, ...result.slice(idx + 1)]
        : [...result, MONITOREO_REAL_MODULE]
    }
    // doble_materialidad despues de monitoreo_real
    if (!result.some(m => m.module_id === 'doble_materialidad')) {
      const idx = result.findIndex(m => m.module_id === 'monitoreo_real')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), DOBLE_MATERIALIDAD_MODULE, ...result.slice(idx + 1)]
        : [...result, DOBLE_MATERIALIDAD_MODULE]
    }
    // source_traceability siempre al final
    if (!result.some(m => m.module_id === 'source_traceability')) {
      result = [...result, SOURCE_TRACEABILITY_MODULE]
    }
    return result
```

---

## TAREA 4: Definir modulos nuevos en functionaryJourneyEnrichment.ts

**Archivo:** `frontend/src/lib/simulator/functionaryJourneyEnrichment.ts`

### 4a: Agregar exports despues de DOBLE_MATERIALIDAD_MODULE:

```typescript
export const COSTOS_PROGRAMA_MODULE: DecisionModule = {
  module_id: 'costos_programa',
  label: 'Costos del programa — CAPEX y OPEX',
  audience_mode: 'city_team',
  decision: 'Cuantificar la inversion total (CAPEX) y el costo operativo anual (OPEX) del programa, desglosados por equipo, personal y operacion.',
  evidence: 'Tabla maestra de inversion por categoria, estructura de personal con prestaciones, catalogo de equipos con precios de mercado verificables, comparativa P/M/G.',
  status: 'ready',
  next_action: 'Validar precios de equipamiento con cotizaciones locales antes de presentar presupuesto al tesorero municipal.',
}

export const MONITOREO_REAL_MODULE: DecisionModule = {
  module_id: 'monitoreo_real',
  label: 'Monitoreo — proyectado vs. real',
  audience_mode: 'city_team',
  decision: 'Comparar las proyecciones del simulador con los datos reales de operacion para detectar desviaciones y corregir el rumbo.',
  evidence: 'Dashboard de semaforo con metricas clave (tonelaje, empleos, ingresos, CO2e), datos de campo capturados, historial de desviaciones.',
  status: 'ready',
  next_action: 'Capturar los datos del primer mes de operacion del piloto para calibrar las proyecciones.',
}
```

### 4b: Agregar labels en FUNCTIONARY_MODULE_LABELS:

```typescript
  costos_programa: {
    label: 'Costos del programa — CAPEX y OPEX',
    decision: 'Cuantificar la inversion total y el costo operativo anual del programa.',
    evidence: 'Tabla maestra CAPEX, estructura de personal, catalogo de equipos, comparativa P/M/G.',
    next_action: 'Validar precios con cotizaciones locales.',
  },
  monitoreo_real: {
    label: 'Monitoreo — proyectado vs. real',
    decision: 'Comparar proyecciones con datos reales de operacion.',
    evidence: 'Dashboard semaforo, datos de campo, historial de desviaciones.',
    next_action: 'Capturar datos del primer mes de operacion.',
  },
```

---

## TAREA 5: Routing en renderDecisionModule.tsx

**Archivo:** `frontend/src/app/simulator/renderDecisionModule.tsx`

### 5a: Dynamic imports (despues de GuiaCircularidadStack):

```typescript
const CostosProgramaStack = dynamic(
  () =>
    import('@/components/simulator/stacks/CostosProgramaStack').then(m => ({ default: m.CostosProgramaStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#5F6B5F]">Preparando costos del programa...</p>,
  },
)

const MonitoreoRealStack = dynamic(
  () =>
    import('@/components/simulator/stacks/MonitoreoRealStack').then(m => ({ default: m.MonitoreoRealStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#5F6B5F]">Preparando monitoreo...</p>,
  },
)
```

### 5b: Cases en switch (despues de logistica_operativa):

```typescript
    case 'costos_programa':
      return <CostosProgramaStack />
    case 'monitoreo_real':
      return <MonitoreoRealStack />
```

---

## TAREA 6: Actualizar narrativaSpine.ts

**Archivo:** `frontend/src/lib/narrativaSpine.ts`

### 6a: Reemplazar union ModuloId:

```typescript
export type ModuloId =
  | 'guia_circularidad'
  | 'city_baseline'
  | 'social_study'
  | 'municipal_context'
  | 'future_goals'
  | 'infrastructure_operations'
  | 'logistica_operativa'
  | 'costos_programa'
  | 'market_traceability'
  | 'esquema_concesion'
  | 'scenarios_export'
  | 'risk_trends'
  | 'inspeccion_predios'
  | 'monitoreo_real'
  | 'doble_materialidad'
  | 'source_traceability'
```

### 6b: Actualizar transiciones en generarTransicion():

Cambios especificos en el switch (el formato de cada caso ya existe, solo cambiar destinos y textos):

| Origen | Destino ACTUAL | Destino NUEVO | Accion |
|--------|---------------|---------------|--------|
| `guia_circularidad` | (no existe) | `city_baseline` | AGREGAR case nuevo |
| `city_baseline` | `municipal_context` | `social_study` | CAMBIAR nextModuloId + textos |
| `social_study` | `future_goals` | `municipal_context` | CAMBIAR nextModuloId + textos |
| `municipal_context` | `social_study` | `future_goals` | REESCRIBIR — ahora va a planificacion |
| `logistica_operativa` | `market_traceability` | `costos_programa` | CAMBIAR nextModuloId + textos |
| (nuevo) `costos_programa` | — | `market_traceability` | AGREGAR case nuevo |
| `market_traceability` | `risk_trends` | `esquema_concesion` | CAMBIAR nextModuloId + textos |
| `esquema_concesion` | `scenarios_export` | `scenarios_export` | SIN CAMBIO |
| `scenarios_export` | `inspeccion_predios` | `risk_trends` | CAMBIAR nextModuloId + textos |
| `risk_trends` | `esquema_concesion` | `inspeccion_predios` | CAMBIAR nextModuloId + textos |
| `inspeccion_predios` | `doble_materialidad` | `monitoreo_real` | CAMBIAR nextModuloId + textos |
| (nuevo) `monitoreo_real` | — | `doble_materialidad` | AGREGAR case nuevo |

**Textos sugeridos para cases nuevos:**

```typescript
    case 'guia_circularidad':
      return {
        kicker:      'La guia orienta el primer analisis',
        title:       'Linea base territorial y RSU',
        summary:     `Ahora que entiendes la estructura de ALQUIMIA, el primer paso tecnico es cuantificar el problema: cuantas toneladas genera ${municipioLabel}, de que tipo, y cuanto se recupera hoy.`,
        nextModuloId: 'city_baseline',
      }

    case 'costos_programa': {
      return {
        kicker:      'Los costos necesitan compradores',
        title:       'Mercado y trazabilidad de materiales',
        summary:     `Con la inversion cuantificada, el siguiente paso es verificar que existe demanda real para cada fraccion de material. Sin mercado, el OPEX no se convierte en ingreso.`,
        nextModuloId: 'market_traceability',
      }
    }

    case 'monitoreo_real': {
      const co2 = resultados?.co2eEvitadasAnualTon ?? null
      const co2Str = co2 !== null ? `${tons(co2)} CO2e/ano` : 'toneladas significativas de CO2e/ano'
      return {
        kicker:      'Lo medido se reporta',
        title:       'Doble materialidad y reporte ESG',
        summary:     `El programa evita ${co2Str}. El monitoreo genera los datos que BID, BANOBRAS y fondos climaticos requieren en formato GRI 306 y ESRS E5.`,
        nextModuloId: 'doble_materialidad',
      }
    }
```

---

## TAREA 7: Crear CostosProgramaStack.tsx

**Archivo NUEVO:** `frontend/src/components/simulator/stacks/CostosProgramaStack.tsx`

### IMPORTANTE: Ya existe `CapexOpexBreakdown.tsx`

El componente `frontend/src/components/simulator/CapexOpexBreakdown.tsx` (640 lineas) ya tiene:
- Tabs por escala CA (P/M/G) con tablas de CAPEX, OPEX, equipos, personal
- Seccion de recicladoras por giro (PET, papel, vidrio, aluminio, organicos)
- Fases de inversion con grafica de barras
- Benchmarks externos
- FuenteBadge reutilizable

**CostosProgramaStack debe ENVOLVER (wrapper) a CapexOpexBreakdown**, agregando:
1. KPI cards resumen arriba (CAPEX total, OPEX anual, empleos totales, TIR ponderada)
2. Lectura ejecutiva
3. Grafica protagonista: barras CAPEX por fase con ExpandableChart

**NO duplicar** lo que ya existe en CapexOpexBreakdown.

### Estructura del componente:

```typescript
'use client'

import { useMemo } from 'react'
import { DollarSign, Users, Clock, TrendingUp } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { CapexOpexBreakdown } from '@/components/simulator/CapexOpexBreakdown'
import { ExpandableChart } from '@/components/ui/ExpandableChart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FASES_INVERSION, CAPEX_CA, OPEX_CA } from '@/lib/capexOpexData'
import { CA_CONFIG } from '@/lib/constants'

const fmtMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
const fmtN = (n: number) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(n)

export function CostosProgramaStack() {
  const mixCAs = useSimulatorStore(s => s.mixCAs)
  const resultados = useSimulatorStore(s => s.resultados)

  // Calcular CAPEX total del mix actual
  const capexTotal = useMemo(() => {
    return (mixCAs.P * CAPEX_CA.P.totalCAPEX)
         + (mixCAs.M * CAPEX_CA.M.totalCAPEX)
         + (mixCAs.G * CAPEX_CA.G.totalCAPEX)
  }, [mixCAs])

  const opexMesTotal = useMemo(() => {
    return (mixCAs.P * OPEX_CA.P.totalOPEXMes)
         + (mixCAs.M * OPEX_CA.M.totalOPEXMes)
         + (mixCAs.G * OPEX_CA.G.totalOPEXMes)
  }, [mixCAs])

  const empleosTotal = useMemo(() => {
    const perP = CA_CONFIG.P.empleos ?? 5
    const perM = CA_CONFIG.M.empleos ?? 14
    const perG = CA_CONFIG.G.empleos ?? 33
    return (mixCAs.P * perP) + (mixCAs.M * perM) + (mixCAs.G * perG)
  }, [mixCAs])

  const tir = resultados?.tir ?? null

  // Datos para grafica de fases
  const fasesData = FASES_INVERSION.map(f => ({
    name: `F${f.fase} ${f.nombre}`,
    capex: f.capexTotalSistema / 1_000_000,
    empleos: f.empleosTotales,
    ebitda: f.ebitdaMesSistema / 1_000,
  }))

  return (
    <div className="space-y-6">

      {/* S1: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'CAPEX TOTAL', value: fmtMXN(capexTotal), sub: `${mixCAs.P}P + ${mixCAs.M}M + ${mixCAs.G}G centros`, color: '#2F6B1F' },
          { icon: Clock, label: 'OPEX MENSUAL', value: fmtMXN(opexMesTotal), sub: `${fmtMXN(opexMesTotal * 12)}/año`, color: '#D98A1E' },
          { icon: Users, label: 'EMPLEOS DIRECTOS', value: String(empleosTotal), sub: 'Solo centros de acopio', color: '#1A5FA8' },
          { icon: TrendingUp, label: 'TIR PROYECTO', value: tir !== null ? `${fmtN(tir)}%` : '—', sub: tir !== null && tir > 20 ? 'Viable' : 'Calcular en M10', color: tir !== null && tir > 20 ? '#2F6B1F' : '#8A9286' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-[#E7E5DC] rounded-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-4 py-3 h-[88px] flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <kpi.icon size={12} style={{ color: kpi.color }} />
              <span className="text-[11px] uppercase tracking-[0.06em] font-semibold text-[#8A9286]">{kpi.label}</span>
            </div>
            <p className="text-[26px] font-semibold text-[#1F2933] leading-tight mt-1">{kpi.value}</p>
            <p className="text-[11px] text-[#5F6B5F]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* S2: Lectura ejecutiva */}
      <div className="bg-[#F1F8EC] border border-[#C9DDB1] rounded-[14px] px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.06em] font-semibold text-[#2F6B1F] mb-1">LECTURA EJECUTIVA</p>
        <p className="text-[14px] leading-relaxed text-[#1F2933]">
          El programa requiere una inversión inicial de {fmtMXN(capexTotal)} y un costo operativo de {fmtMXN(opexMesTotal)}/mes
          para operar {mixCAs.P + mixCAs.M + mixCAs.G} centros de acopio que generarán {empleosTotal} empleos directos.
          {tir !== null && tir > 0 ? ` La TIR proyectada de ${fmtN(tir)}% indica que el programa se paga solo.` : ''}
          {' '}Los precios de equipamiento están verificados contra mercado mexicano (mayo 2026).
          Esta información permite al tesorero municipal evaluar la viabilidad presupuestal antes de sesión de cabildo.
        </p>
      </div>

      {/* S3: Grafica de CAPEX por fase */}
      <div className="bg-white border border-[#E7E5DC] rounded-[14px] p-5">
        <h3 className="font-serif text-[20px] font-semibold text-[#1F2933] mb-1">Inversión por fase de despliegue</h3>
        <p className="text-[13px] text-[#5F6B5F] mb-4">CAPEX acumulado del sistema (CAs + recicladoras) en millones MXN</p>
        <ExpandableChart title="CAPEX por fase de despliegue">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={fasesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5F6B5F' }} />
              <YAxis tick={{ fontSize: 11, fill: '#5F6B5F' }} tickFormatter={v => `$${v}M`} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'capex' ? [`$${value.toFixed(1)}M MXN`, 'CAPEX']
                  : name === 'empleos' ? [value, 'Empleos']
                  : [`$${value.toFixed(0)}K/mes`, 'EBITDA']
                }
              />
              <Bar dataKey="capex" fill="#2F6B1F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChart>
      </div>

      {/* S4: CapexOpexBreakdown completo (componente existente) */}
      <CapexOpexBreakdown />

    </div>
  )
}
```

### Notas:
- `CapexOpexBreakdown` ya trae TODAS las tablas detalladas (equipos, personal, recicladoras, fases, benchmarks)
- CostosProgramaStack solo agrega la capa de KPIs, lectura ejecutiva y grafica protagonista
- Todo dato viene de `capexOpexData.ts` — cero hardcode
- Chips de verificacion ya estan implementados en CapexOpexBreakdown via `FuenteBadge`

---

## TAREA 8: Editorial briefs

**Archivo:** `frontend/src/data/moduleEditorialBriefs.ts`

Agregar cases para `costos_programa` y `monitoreo_real` en `getModuleEditorialBrief()`.

Para `costos_programa`:
```typescript
case 'costos_programa':
  return {
    moduleId,
    title: 'Costos del programa — CAPEX y OPEX',
    subtitulo_catchy: 'Cada peso de inversion tiene nombre, precio verificado y plazo de recuperacion.',
    situacion_actual: `El programa para ${territorio} requiere una inversion inicial (CAPEX) en centros de acopio, equipos y capital de trabajo, mas un costo operativo mensual (OPEX) que incluye nomina, energia, renta e insumos. Este modulo desglosa cada linea.`,
    observacion_alquimia: 'Los precios de equipamiento fueron verificados contra mercado mexicano en mayo 2026. Los salarios siguen tabulador IMSS Rama 37 con factor de prestaciones de 1.35x. La contingencia del 10% sigue estandar AACE International Class 4.',
    criterio_decision: 'El tesorero municipal necesita saber exactamente cuanto cuesta el programa por fase, que equipos se compran, cuantas personas se contratan y en cuanto tiempo se recupera la inversion.',
    que_no_significa: 'No es una cotizacion formal. Es un modelo parametrizado que debe validarse con proveedores locales antes de comprometer presupuesto.',
    siguiente_accion: 'Solicitar cotizaciones formales a proveedores locales para los 3-5 equipos de mayor impacto en el CAPEX.',
    fuente_o_evidencia: 'Centros_Acopio_v2.xlsx (modelo CFO), precios verificados mayo 2026 (grupozuma.com.mx, reciclamas.com.mx, losmontacargas.mx, rte.mx, cocoisa.mx). Salarios: INEGI ENOE T1 2025, Computrabajo 2025.',
    metodologia_editorial: {
      como_se_calcula: 'CAPEX = equipamiento + adecuacion nave + gastos preoperativos + contingencia 10% + capital de trabajo (3 meses OPEX). OPEX = nomina con prestaciones + renta + energia + combustible + mantenimiento + insumos + seguros.',
      origen_datos: 'Precios de equipos verificados contra marketplaces mexicanos (mayo 2026). Salarios base tabulador IMSS Rama 37. Renta zona industrial SLP $65/m2.',
      por_que_este_enfoque: 'Un modelo CAPEX/OPEX transparente es requisito para que el municipio apruebe presupuesto en sesion de cabildo y para que BID/BANOBRAS evaluen solicitudes de credito.',
      supuesto_critico: 'Los precios de mercado son de referencia (mayo 2026). Inflacion, tipo de cambio y disponibilidad local pueden variar. El factor de contingencia del 10% absorbe variaciones moderadas.',
    },
    chart_briefs: [],
  }
```

Para `monitoreo_real`:
```typescript
case 'monitoreo_real':
  return {
    moduleId,
    title: 'Monitoreo — proyectado vs. real',
    subtitulo_catchy: 'Lo que no se mide no se mejora. Lo que se mide mal, destruye programas.',
    situacion_actual: `Una vez en operacion, ${territorio} necesita comparar las proyecciones del simulador con los datos reales de campo para detectar desviaciones y corregir el rumbo antes de que se conviertan en perdidas.`,
    observacion_alquimia: 'Este modulo esta disenado para recibir datos de campo una vez que el programa este operando. Hasta entonces, muestra las metricas proyectadas como linea base de referencia.',
    criterio_decision: 'El director de servicios publicos necesita un semaforo claro: verde si la operacion esta dentro de las proyecciones, amarillo si hay desviaciones moderadas, rojo si se requiere intervencion.',
    que_no_significa: 'No sustituye un sistema de monitoreo en tiempo real. Es una herramienta de comparacion periodica (mensual/trimestral) entre lo proyectado y lo medido.',
    siguiente_accion: 'Definir el protocolo de captura de datos de campo (frecuencia, responsable, formato) antes del arranque del piloto.',
    fuente_o_evidencia: 'Proyecciones del simulador ALQUIMIA (modulos M01-M11). Datos reales: captura manual o integracion con sistema de pesaje en CAs.',
    metodologia_editorial: {
      como_se_calcula: 'Desviacion = (valor_real - valor_proyectado) / valor_proyectado × 100. Semaforo: verde <=10%, amarillo 10-25%, rojo >25%.',
      origen_datos: 'Proyecciones: motor del simulador. Datos reales: captura de campo (pendiente de implementacion).',
      por_que_este_enfoque: 'La teoria de cambio (Theory of Change) requiere verificacion empirica. Sin monitoreo, el programa pierde credibilidad ante financiadores y cabildo.',
      supuesto_critico: 'Los datos de campo deben capturarse con la misma metodologia y frecuencia que las proyecciones para que la comparacion sea valida.',
    },
    chart_briefs: [],
  }
```

---

## TAREA 9: Activar narrativa en BottomBar

**Archivo:** `frontend/src/components/simulator/DecisionModuleShell.tsx`

### 9a: Agregar imports al inicio del archivo:

```typescript
import { generarTransicion, type ModuloId } from '@/lib/narrativaSpine'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
```

### 9b: En la funcion BottomBar, agregar hook de narrativa:

Despues de `const next = modules[idx + 1] ?? null`, agregar:

```typescript
  const resultados = useSimulatorStore(s => s.resultados)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipioLabel = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const transicion = useMemo(
    () => generarTransicion(activeId as ModuloId, resultados, municipioLabel),
    [activeId, resultados, municipioLabel],
  )
```

### 9c: Agregar texto narrativo debajo del boton "next":

Despues del boton `{next.label} →`, agregar:

```tsx
        {next && transicion && (
          <p className="text-[10px] text-[#8A9286] mt-1 max-w-xs text-right leading-snug">
            {transicion.kicker}
          </p>
        )}
```

**NOTA:** Tambien necesitaras agregar `useMemo` al import de React si no esta ya, y `useSimulatorStore` si no esta importado en BottomBar.

---

## TAREA 10: Verificar, commit y push

```bash
cd frontend && npx tsc --noEmit
```

Si pasa limpio:

```bash
cd .. && git add -A && git commit -m "refactor: reorganizar modulos en 4 capitulos BID + crear M07 costos + activar narrativa BottomBar"
git push origin main
```

---

## CHECKPOINTS DE COMPILACION

Ejecutar `cd frontend && npx tsc --noEmit` despues de:

1. **Checkpoint 1:** Despues de T4 (definiciones nuevas)
2. **Checkpoint 2:** Despues de T7 (CostosProgramaStack creado)
3. **Checkpoint 3:** Despues de T1+T2+T3+T5+T6 (reorg completa)
4. **Checkpoint 4:** Despues de T8+T9 (briefs + narrativa)
5. **Checkpoint final:** T10

Si hay errores TypeScript, corregirlos ANTES de continuar con la siguiente tarea.
