"""
Deuda catalogo geografico-administrativo (Navigator 23.0 — items 6-7).

ALQUIMIA 23.0 (simulacion) usa municipio_id como CLAVE INTERNA estable en semillas
(`slp`, `qro`, …) definidas en `app.legal.repository` / catálogo ZM. Esto NO es
el CVE de localidades o municipios INEGI hasta completar migracion acordada.

Migracion prevista (fuera de este modulo; requiere CSA + Navigator):
- Anclar cada fila municipal a CVE INEGI cuando exista capa MGN versionada.
- Exponer `version_mgn` (o equivalente) en contrato de capa segun blueprint 23.
- Mantener trazabilidad Municipio <-> ZM sin confundir autoridad sancionatoria.

No sustituir semillas ni contratos de API sin checklist Navigator explicito.
"""

# Version simbolica para trazabilidad en respuestas JSON / bitacora (no sustituye version_mgn real).
CATALOG_SIMULATION_EPOCH: str = "ALQUIMIA-SEED-JURISDICCION-MUNICIPIO-ZM-v0"
