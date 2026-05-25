# Glosario canónico ALQUIMIA (EIDOS)

Fuente normativa operativa: `cursor-rules/eidos.md` · machine-readable: `backend/app/agents/eidos_glossary.py`

> **Regla:** en documentos formales, UI institucional y PDFs exportados se usa la columna **Canónico**. Las variantes de **Prohibido** son errores terminológicos salvo cita literal entre comillas.

## Identidad del producto

| Canónico | Prohibido | Notas |
|----------|-----------|-------|
| **ALQUIMIA** | Alquimia SLP, simulador RSU, app ALQUIMIA, software ALQUIMIA, herramienta ALQUIMIA | Nombre propio del producto |
| Plataforma de consultoría integral de gestión pública municipal | Simulador, herramienta de reciclaje, app de basura | Descriptor institucional |

## Operación RSU

| Canónico | Prohibido | Notas |
|----------|-----------|-------|
| **Centro de acopio (CA)** | Nodo, nodo de transferencia, punto de captación, centro de reciclaje | Término legal del proyecto |
| **Fracción** | Material genérico, desecho, residuo mezclado | Sistema de cinco separaciones |
| **RSU** | Basura, trash, waste (sin traducir en docs ES) | Residuos Sólidos Urbanos — definir en primera mención ciudadana |
| **Valorización** | Valoración, reciclaje (como sustituto), aprovechamiento | LGPGIR |
| **Recuperación / captura** | Reciclaje total (cuando no es formal) | Distinguir tasa de captura vs. reciclaje formal |
| **Disposición final** | Tiradero (salvo cita coloquial), dump | Relleno sanitario / disposición final |

## Gobernanza y contratos

| Canónico | Prohibido | Notas |
|----------|-----------|-------|
| **Concesionario** | Operador genérico, contratista, empresa (sin rol) | Definido en título de concesión |
| **Gate** | Hito, milestone, checkpoint | Término propio ALQUIMIA/KRONOS |
| **Actor / parte interesada** | Stakeholder | Documentos en español |
| **Cabildo** | Concejo (salvo nombre oficial local), ayuntamiento pleno (ok alternativo) | Audiencia decisoria |
| **Municipio** | Ciudad (como jurisdicción legal), localidad | Separar de ZM en copy metropolitano |

## Legal vs. técnico

| Canónico | Prohibido en contexto | Notas |
|----------|----------------------|-------|
| **Cadena de custodia** | Trazabilidad (en reglamento, folio, sanción) | Ámbito jurídico-normativo |
| **Trazabilidad** | Cadena de custodia (en anexo técnico M19, fuentes, API) | Evidencia digital y procedencia de datos |
| **Reglamento municipal** | Ley local, normativa (sin especificar) | Anclar al instrumento vigente |

## Financiero (español)

| Canónico | Prohibido | Notas |
|----------|-----------|-------|
| **VPN** | NPV | Valor Presente Neto |
| **TIR** | IRR | Tasa Interna de Retorno |
| **Desempeño** | Performance | Documentos en español |
| **Tablero de control** | Dashboard (salvo UI técnica interna) | Preferir en copy ejecutivo |
| **CAPEX / OPEX / EBITDA / EVM / KPI** | — | Anglicismos aceptados en registro técnico |

## Territorio

| Canónico | Prohibido | Notas |
|----------|-----------|-------|
| **Municipio** (obligación legal) | ZM como autoridad única | Navigator: no mezclar alcances |
| **Zona metropolitana (ZM)** | Región, área metropolitana genérica | Vista coordinada, no sustituto municipal |
| **Horizonte del plan** | Timeline, timeframe | Años del escenario |

## Registro y tono (resumen)

| Audiencia | Tono |
|-----------|------|
| Alcalde / Cabildo | Narrativo, sin jerga, orientado a decisión |
| PMO / técnicos | Preciso, tablas, métricas |
| Inversionistas | Financiero, retorno, riesgo |
| Operadores de campo | Instructivo, directo |
| Ciudadano | Accesible, sin anglicismos innecesarios |

## Palabras prohibidas en copy institucional

- revolucionario, garantizado, sin precedentes, dictamen oficial (como autodescripción del producto)

---

*Mantenido por EIDOS · revisar con `python scripts/eidos_check_docs.py`*
