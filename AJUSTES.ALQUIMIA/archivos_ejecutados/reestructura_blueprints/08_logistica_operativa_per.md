# 08 Logística Operativa PER

## Propósito

Diseñar una sección operativa que explique con claridad cómo se recoge, transporta, verifica, educa y eventualmente sanciona el manejo de residuos, usando el enfoque PER: presión, estado y respuesta.

## Alcance

Incluye rutas, camiones, frecuencia, zonas, colonias, etapas, responsables, bitácora operativa, advertencias educativas, sanciones condicionadas a base legal validada y conexión con concesionario y cabildo.

## Problema Que Corrige

La operación puede volverse confusa si se mezclan recolección, contaminación de residuos, educación ciudadana, inspección y multas. El sistema debe explicar qué ocurre antes de sancionar y qué evidencia legal y operativa se necesita.

## Decisiones De Producto

- PER debe explicarse en lenguaje humano:
  - Presión: cuánto residuo y qué riesgo operativo existe.
  - Estado: cómo está separando la zona, qué contaminación existe, qué rutas operan.
  - Respuesta: educación, ajuste de rutas, advertencia, inspección o sanción validada.
- Advertencia educativa no es multa.
- Sanción solo procede si existe base legal municipal validada, debido proceso y evidencia.
- Cada ruta debe tener municipio, zona, colonias, frecuencia, camión, responsable y bitácora.
- La operación debe verse mes a mes durante la implementación.

## Modelo De Datos Sugerido

```ts
interface PERIndicator {
  tipo: 'presion' | 'estado' | 'respuesta'
  nombre: string
  valor: number | string
  fuente: string
  accion_recomendada?: string
}

interface CollectionRoute {
  id: string
  municipio_id: string
  zona_id: string
  colonias: string[]
  frecuencia: string
  tipo_camion_ton: number
  material_prioritario: string[]
  responsable: string
  concesionario_id?: string
}

interface OperationalLogEntry {
  id: string
  route_id: string
  fecha: string
  evento: 'recoleccion' | 'contaminacion' | 'advertencia_educativa' | 'inspeccion' | 'sancion_propuesta'
  evidencia: string[]
  estado_legal: 'no_aplica' | 'pendiente_validacion' | 'validado'
}
```

## Endpoints Sugeridos

- `GET /operations/summary/{municipio_id}`
- `POST /operations/routes`
- `GET /operations/routes/{municipio_id}`
- `POST /operations/log`
- `POST /operations/warnings`
- `POST /operations/violations` con gate legal obligatorio

## Componentes Frontend Sugeridos

- `PERExplainer`
- `OperationalRoutePlanner`
- `MonthlyOperationsTimeline`
- `TruckCapacityPanel`
- `EducationalWarningPanel`
- `LegalSanctionGateBanner`
- `OperationalLogbook`

## Relación Con Código Actual

Ya existen endpoints y pruebas en `backend/app/operations` y tests como `test_fase9_operacion_multas.py`. El store tiene `operationsSummary`. La reestructura no debe romper esa base: debe elevarla a una experiencia comprensible y conectarla con municipio, zona, legal y educación.

## Criterios De Aceptación

- El usuario entiende la diferencia entre advertencia educativa, inspección y sanción.
- Ninguna sanción se puede generar sin base legal validada y evidencia.
- Cada ruta tiene municipio, zona, colonias, frecuencia y responsable.
- La bitácora muestra eventos por fecha y estado legal.
- El documento operativo exportado explica PER sin jerga confusa.

## Riesgos De Mala Implementación

- Crear un módulo de multas que parezca recaudatorio.
- Permitir sanciones sin reglamento validado.
- Desconectar rutas de zonas y centros de acopio.
- Usar PER como etiqueta académica sin decisión operativa.

## Qué NO Hacer

- No llamar multa a una advertencia.
- No automatizar sanciones sin debido proceso.
- No mezclar municipios dentro de una ruta sin convenio.
- No esconder al concesionario si participa en operación.

## Prompt Final Para Agente Codificador

Reestructura el módulo operativo alrededor de PER. Usa `backend/app/operations` como base, pero asegura que rutas, bitácoras, advertencias y sanciones estén conectadas a municipio, zona y estado legal. Agrega gates para impedir sanciones sin validación jurídica. La UI debe explicar mes a mes qué ocurre y diferenciar advertencia educativa, inspección y sanción.
