# Caso de referencia SLP — Baseline documental

**Tipo:** Referencia · No hardcodear en cursor rules genéricos  
**Municipio/ZM:** ZM San Luis Potosí (piloto documentado)  
**Fuentes:** Modelo_BASED.xlsx · Centros_Acopio_v2.xlsx · Gantt_RSUSLP.xlsx · Capitulo_SLP.docx  
**Uso:** Solo cuando el documento o simulación es explícitamente para SLP. En producto multi-municipio, calibrar vía `simulatorStore` + `applyMunicipioCatalog()`.

---

## Red física (Año 3 objetivo SLP)

| Elemento | Valor referencia |
|----------|------------------|
| Viviendas universo | 224,000 |
| Centros de acopio | 18 (UV-G×4, UV-M×7, UV-P×7) |
| Recicladoras por giro | 5 (PET, papel/cartón, aluminio, vidrio, orgánicos) |
| Tonelaje objetivo Año 3 | 725.76 t/día |

## Modelo económico tres fases (SLP)

| Fase | Cobertura | t/día | Ingreso anual | CO2e anual |
|------|-----------|-------|---------------|------------|
| Año 1 | 25% | 181.44 | $90.3M MXN | 133,294 t |
| Año 2 | 60% | 435.46 | $216.7M MXN | 319,907 t |
| Año 3 | 100% | 725.76 | $361.1M MXN | 533,178 t |

## Indicadores clave (SLP)

| Indicador | Valor referencia |
|-----------|------------------|
| VPN | $756M MXN |
| CAPEX total | ~$46.2M MXN |
| OPEX anual | $26–33M MXN/año |
| Ahorro relleno sanitario | $52–94M MXN/año |
| Empleos directos | 180–275 |

## Precios ancla mercado (defaults simulador — editables por municipio)

| Material | $/kg |
|----------|------|
| PET | 5.50 |
| Papel/cartón | 2.50 |
| Vidrio | 2.30 |
| Aluminio | 15.10 |

---

*SUPREME · Extraído de supreme.md v1.0 para evitar duplicación en cursor rules · mayo 2026*
