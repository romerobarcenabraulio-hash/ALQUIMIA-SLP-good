# 22.5 · Purgación visual y huérfanos

Propósito: eliminar quirúrgicamente los bloques blancos con sombras genéricas, badges huérfanos y léxico de prototipo. Reemplazar por diagramas y chips editoriales.

## Strings a purgar (visibles al usuario)
- `Evidencia:` (line items huérfanos en `PortalEntrySelector`, `DecisionModuleShell`, `OperacionPERBitacora`, `GovernancePanel`).
- `LISTO`, `listo` como badge crudo (sustituir por chip con icono).
- `Demo`, `demo guiada`, `blockedDemo`, `legalValidadoDemo`, `zmDemo` (esconder detrás de un toggle "Modo demo" en footer del módulo).
- `placeholder`, `Ej.`, `TODO`.
- "Tu plan está listo" (en `ExportarSection`) → reemplazar por copy editorial: "Paquete entregable preparado".

## Reemplazos visuales

| Componente | Bloque actual | Reemplazo |
|---|---|---|
| `RecicladoarasSection` | Tabla "promesa Sankey" | Sankey real (recharts/Sankey o D3) |
| `FlujosResiduos` | JSON crudo de respuesta | Sankey + NarrativeBridge |
| `BenchmarkLATAM` | Tabla densa | Timeline horizontal editorial |
| `OperacionPERBitacora` | Lista vertical eventos | Timeline horizontal con hitos |
| `ReasoningGraphPanel` | Texto-contador | Grafo dirigido (D3-force o react-flow) |
| `Precolocacion` | Bloques gray/indigo | Tarjetas serif con kicker uppercase |
| `CoberturaNacional` | Tabla densa | Mapa simple + tarjetas síntesis |
| `Macrogeneradores` | Bloque sans gris | Hero serif + tabla editorial |
| Badges `listo/bloqueado` | Texto plano | Chips con `lucide-react` (`CheckCircle`, `Lock`, `AlertTriangle`) |

## Paleta editorial unificada
- Fondo página: `#F8F6F1`
- Tarjeta primaria: `#FDFCFA` borde `#E8E4DC`
- Texto primario: `#1C1B18` (serif Cormorant para hero, sans para data)
- Acento positivo: `#3B6D11` (verde) / `#2D7A0A` (refuerzo)
- Acento warning: `#C47E00`
- Acento error: `#B3261E`
- Acento neutro/info: `#4B5563`

## Huérfanos a resolver
- `containers_provider` del journey `organization`: crear `ContainersProvider.tsx` con NarrativeBridge "Próximamente" y CTA a contacto comercial; alternativa: pliegue tipo "fase próxima" sin pintar tarjeta vacía.
- `OperacionCampo.tsx` y `SelectorZM.tsx` (no referenciados en `page.tsx`): documentar como reservados, no exponer en gateway.

## Criterios de aceptación
- Ningún string purgado visible en producción para audiencias que no lo usan.
- Cada reemplazo visual con NarrativeBridge contiguo.
- Paleta consistente (paso visual del estándar 18/19).
