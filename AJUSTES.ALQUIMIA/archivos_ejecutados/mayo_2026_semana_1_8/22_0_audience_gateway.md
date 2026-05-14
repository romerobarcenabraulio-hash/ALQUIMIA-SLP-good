# 22.0 · Gateway de Identidad (Ciudadano · Funcionario · Empresario)

Propósito: poner fin a la "era de los bloques" estableciendo una entrada obligatoria que segmente la experiencia y oculte ≥60% de la interfaz que no aporta valor a cada perfil.

## Contrato del gateway
- Ruta `/simulator` no carga ningún módulo del simulador hasta que `audience` esté definida en el `simulatorStore`.
- Tres opciones únicas en el gateway:
  - `citizen` — Ciudadano (educación)
  - `functionary` — Funcionario público (decisión)
  - `entrepreneur` — Empresario (negocio)
- La selección persiste en `localStorage` (`alquimia.audience`) y puede cambiarse desde un control discreto en el header del simulador.
- Cada audiencia mapea a un `PortalEntry` backend (sin tocar contratos en 22.x salvo 22.6 opcional):
  - `citizen` → `city_plan`
  - `functionary` → `city_plan`
  - `entrepreneur` → `organization`

## Reglas de negocio
- Sin `audience` no se solicita journey al backend; tampoco se renderiza ciudad/baseline.
- Cambiar de audiencia limpia la selección de módulo activo y reinicia la narrativa, manteniendo la ciudad seleccionada y el baseline.
- El `PortalEntrySelector` original se vuelve un control secundario (deprecated) y solo aparece para `entrepreneur` si en el futuro existen múltiples journeys empresariales.

## UX requerida
- Hero editorial: kicker "Identifica tu rol", título serif, subtítulo de promesa.
- Tres tarjetas con icono `lucide-react` (`HeartHandshake`, `Landmark`, `Briefcase`), microcopy de promesa, lista de módulos visibles y CTA "Continuar como [perfil]".
- Estado inicial vacío con badge "Selecciona una audiencia" y bloqueo del resto del simulador.

## Criterios de aceptación
- Sin selección, `/simulator` solo muestra el `AudienceGateway` (más header).
- Con selección, los módulos se filtran por `audienceModules.ts` (ver 22.2).
- Persistencia entre recargas verificada.
- Cambio de audiencia recalcula journey/módulos sin romper baseline ni ciudad.
