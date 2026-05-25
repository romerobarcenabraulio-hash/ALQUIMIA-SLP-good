# Changelog · POLIS · Personalización municipal

| fecha | módulo | cambio | métrica impactada |
|-------|--------|--------|-------------------|
| 2026-05-25 | profile | Perfil municipal SLP completo en `/data/municipalities/SLP/profile.json` | viviendas, RSU, concesionario |
| 2026-05-25 | legal_framework | Marco legal SLP vinculado en `legal_framework.json` | adendos, jerarquía normativa |
| 2026-05-25 | templates | 6 plantillas base en `/data/municipalities/templates/` | replicabilidad multi-municipio |
| 2026-05-25 | cross_contamination | Detector activo en `modules/personalization/cross_contamination.py` | VETO contaminación cruzada |
| 2026-05-25 | coherence_validator | Validador coherencia en `modules/personalization/coherence_validator.py` | cifras canónicas |
| 2026-05-25 | cli | CLI `python -m modules.personalization.cli validate` | verificación operativa |
| 2026-05-25 | tests | Suite `test_polis_personalization.py` | cobertura POLIS |
