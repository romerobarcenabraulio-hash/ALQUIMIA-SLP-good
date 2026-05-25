# Propuesta 03 · Desacoplar modules/lifecycle de app.*

**Aprobación requerida:** SUPREME + BIOS

## Problema

`modules/lifecycle/{financial_model.py,co2e_fallback.py,sensitivity.py}` importan:

- `app.schemas.simulate`
- `app.services.calculator`

Esto invierte la regla de capas: dominio no debe depender de API.

## Qué mover

| Lógica | De | A |
|--------|----|----|
| Schemas de simulación usados por BIOS | `app/schemas/simulate.py` | `modules/lifecycle/schemas.py` (extender) |
| Calculator compartido | `app/services/calculator.py` | `modules/lifecycle/calculator.py` o paquete compartido `modules/common/` |

## Qué se pierde

- Acoplamiento directo simulador ↔ BIOS (requiere adapter en backend router).

## Qué se gana

- `modules/lifecycle` importable sin levantar FastAPI
- Tests unitarios BIOS sin mock de app
- Cumple arquitectura capas en `architecture_map.md`

## Acción concreta

1. Extraer tipos mínimos de `app/schemas/simulate` a `modules/lifecycle/schemas.py`
2. Copiar/adaptar funciones de calculator usadas por BIOS
3. Backend lifecycle router importa desde modules y re-exporta schemas HTTP
4. `pytest backend/tests/test_bios_lifecycle.py`

**Prioridad:** ALTA
