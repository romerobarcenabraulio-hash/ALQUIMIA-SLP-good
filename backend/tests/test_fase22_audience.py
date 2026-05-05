"""
Fase 22.6 — Tests de regresión para PortalEntry triádico.

Hoy el backend solo expone PortalEntry.city_plan y PortalEntry.organization;
la audiencia (citizen / functionary / entrepreneur) se mapea client-side al
PortalEntry existente. Este test documenta:

1. Que los journeys actuales no se rompieron por la fase 22.
2. Que las audiencias citizen y functionary apuntan a city_plan y entrepreneur
   a organization (mapping declarado en frontend/src/types/index.ts).
3. Una validación opcional para una futura migración server-side.

Cuando se active el filtrado audience-aware en backend (22.6 server-side),
este archivo debe extenderse con nuevos casos por audiencia.
"""

from __future__ import annotations

from app.city.repository import journey_for
from app.city.schemas import PortalEntry


# Espejo de frontend/src/types/index.ts AUDIENCE_TO_PORTAL.
AUDIENCE_TO_PORTAL = {
    "citizen": PortalEntry.city_plan,
    "functionary": PortalEntry.city_plan,
    "entrepreneur": PortalEntry.organization,
}


def test_audience_mapping_is_complete():
    """Las tres audiencias declaradas en Fase 22 tienen mapeo a PortalEntry."""
    assert set(AUDIENCE_TO_PORTAL) == {"citizen", "functionary", "entrepreneur"}
    assert all(isinstance(v, PortalEntry) for v in AUDIENCE_TO_PORTAL.values())


def test_city_plan_journey_unchanged_for_citizen_and_functionary():
    """Citizen y functionary comparten el journey city_plan; el backend no
    debe romper el contrato existente mientras el filtrado vive en frontend."""
    citizen_journey = journey_for(AUDIENCE_TO_PORTAL["citizen"])
    functionary_journey = journey_for(AUDIENCE_TO_PORTAL["functionary"])

    citizen_ids = [m.module_id for m in citizen_journey]
    functionary_ids = [m.module_id for m in functionary_journey]

    assert citizen_ids == functionary_ids, (
        "Mientras el filtrado sea client-side, ambas audiencias deben recibir "
        "el mismo journey backend; el shell se encarga de podar."
    )

    # Garantía de presencia mínima por audiencia (los IDs siguen igual a 22.0).
    assert "city_baseline" in citizen_ids
    assert "municipal_context" in citizen_ids
    assert "infrastructure_operations" in functionary_ids
    assert "scenarios_export" in functionary_ids


def test_organization_journey_for_entrepreneur():
    """Entrepreneur recibe el journey organization sin pérdida de módulos."""
    journey = journey_for(AUDIENCE_TO_PORTAL["entrepreneur"])
    ids = [m.module_id for m in journey]
    expected = {
        "organization_profile",
        "containers_provider",
        "market_traceability",
        "organization_report",
    }
    assert expected.issubset(set(ids)), (
        "El journey organization debe seguir incluyendo los módulos exigidos "
        "por la audiencia empresario."
    )


def test_containers_provider_still_blocked_until_org_declares_residuos():
    """containers_provider sigue siendo el huérfano que la fase 22.5 resuelve
    en frontend con un componente real; este test garantiza que el backend
    expone su estado bloqueado para que el frontend pueda darle tratamiento
    narrativo."""
    journey = journey_for(PortalEntry.organization)
    container_module = next(m for m in journey if m.module_id == "containers_provider")
    assert container_module.status == "blocked"
    assert container_module.blocker, "El módulo debe declarar el blocker."
