## Hoja de referencia — rangos RSU verificables (ALQUIMIA)

Usar al validar KPIs del ScenarioBundle. Marcar **CRITICO** si un valor visible está fuera de rango sin justificación documentada.

### Generación
- RSU (t/día) = población × kg/hab/día / 1000
- SEMARNAT 2020 (ciudad media): ~0.90 kg/hab/día; metrópoli ~1.05; rural ~0.55
- **CRITICO** si gen_percapita < 0.40 o > 1.50 kg/hab/día sin fuente de campo

### Captura
- Captura año 1 en programas LATAM reales: típicamente 3–15%
- **CRITICO** si captura año 1 > 30% sin encuesta IPC ni piloto documentado
- Merma logística típica 8–15%; >25% sin explicación → IMPORTANTE

### Financiero
- TIR municipal típica defendible: 8–25%
- **CRITICO** si TIR > 50% o < −20% (revisar captura y precios)
- VPN negativo no invalida programa si BCR > 1.0 y se etiqueta costo-beneficio social
- WACC referencia SHCP proyectos públicos: ~12%; >25% sin justificación → IMPORTANTE
- DSCR mínimo orientativo crédito BANOBRAS: 1.2×

### Empleo y derrama
- Indirectos documentados CEMPRE: 2.0–3.5× directos (no usar 16% flat indefendible)
- Multiplicadores IO deben citar fuente; >3.0× sin INEGI SCIAN → CRITICO

### Ambiental
- Factor emisión relleno sin biogás: ~0.52 tCO₂e/t RSU (INECC)
- Con captura biogás activa: ~0.18 tCO₂e/t
- GWP₁₀₀ CH₄ = 27.9 (IPCC AR6)
- **No presentar** CO₂e como inventario GEI certificado municipal

### Research / proxies
- Precios de mercado: estimación_modelo hasta validar con Serper o contrato LOI
- Perplexity (cuando exista presupuesto): segunda capa de validación con cita — ver RESEARCH_INTELLIGENCE_ROADMAP.md
