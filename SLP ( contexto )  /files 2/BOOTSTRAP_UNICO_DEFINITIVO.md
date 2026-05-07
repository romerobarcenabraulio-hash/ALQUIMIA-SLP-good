# ╔══════════════════════════════════════════════════════════════════╗
# ║   ALQUIMIA RSU + ÁGORA GOV — BOOTSTRAP ÚNICO DEFINITIVO        ║
# ║   Un solo documento. Todo integrado. Sin conflictos.            ║
# ║   Claude Code: lee esto y construye todo. No hay más docs.      ║
# ╚══════════════════════════════════════════════════════════════════╝

---

# §0 — JERARQUÍA DE FUENTES (regla única, no negociable)

| Prioridad | Fuente | Gana en |
|-----------|--------|---------|
| 1 | APIs vivas (INEGI, CONAPO, SEMARNAT, Serper, Banxico) | Todos los datos numéricos |
| 2 | Este documento (sección §2 Datos certificados) | Valores de arranque y fallback |
| 3 | Capítulo SLP / docs del proyecto | Fases institucionales y marco legal |
| 4 | Arquitectura técnica | Secciones §5–§9 de este doc |

**Nunca al revés.** Si INEGI dice 1.42M en QRO, gana INEGI. Si Serper dice PET a $6.20, gana Serper. Los docs SLP son plantilla de estructura y voz, no de cifras.

Valores que ninguna API sobreescribe (decisiones de modelo, no mediciones):
- Composición RSU: Orgánico 45% · Papel 20% · Plásticos 15% · Vidrio 5% · Metales 5% · Otros 10%
- % PET dentro de plásticos: 50% · % Aluminio dentro de metales: 70%
- % Orgánico a biodigestor: 30% · a composta: 70%
- Mix P/M/G por fase (tabla §2.4)
- WACC 20% · ISR 30% · Factor CH4 234 m³/ton · GWP CH4 27 tCO₂e/t
- Rampa recicladoras: Año1 50% · Año2 75% · Año3+ 100%
- Múltiplo valor terminal EBITDA: 5x (rango 4–6x)

---

# §1 — SISTEMA DE DISEÑO COMPLETO

## §1.1 Paleta de color

```css
/* FONDO — marfil cálido */
--ivory-base:    #F8F6F1;   /* body background — toda la app */
--ivory-card:    #FDFCFA;   /* superficie de cards */
--ivory-border:  #E8E4DC;   /* bordes */
--ivory-hover:   #F0EDE5;   /* hover */

/* GRISES CÁLIDOS */
--gray-200: #E2DED6;  --gray-400: #A8A49C;
--gray-600: #6B6760;  --gray-900: #1C1B18;

/* VERDE ALQUIMIA */
--green-50:  #EAF3DE;  --green-500: #3B6D11;
--green-600: #2D5409;  --green-700: #1F3B06;

/* ÁMBAR (fase óptima ★, advertencia) */
--amber-50:  #FEF7E7;  --amber-300: #F6C84B;
--amber-500: #D4881E;  --amber-700: #8A4F08;

/* AZUL DATOS */
--blue-50:   #EBF3FB;  --blue-600:  #1A5FA8;
--blue-900:  #051D45;

/* ROJO RIESGO */
--red-50:  #FBEAEA;  --red-500: #C0392B;

/* TIERRA (recicladoras existentes, orgánico) */
--earth-100: #F0E8DC;  --earth-500: #8B6B4A;

/* COLORES POR MATERIAL (consistentes en todas las gráficas) */
--mat-organico:  #639922;  --mat-papel:     #D4881E;
--mat-plastico:  #1A5FA8;  --mat-vidrio:    #1D9E75;
--mat-aluminio:  #8B6B4A;  --mat-otros:     #A8A49C;
```

## §1.2 Tipografía

```
DISPLAY/TÍTULOS:  'Crimson Pro' (Google Fonts, weights 400+600)
  Hero:  52px / lh 1.0 / ls -0.03em
  H1:    38px / lh 1.05 / ls -0.02em
  H2:    28px / lh 1.1
  H3:    20px / lh 1.2 / weight 600

UI/CUERPO:        'Inter' (Google Fonts, weights 400+500)
  Base:  14px / lh 1.6
  Label: 12px / lh 1.3 / weight 500
  Micro: 10px / uppercase / ls 0.04em

DATOS/NÚMEROS:    'JetBrains Mono' (Google Fonts, weights 400+500)
  REGLA: cualquier número que el usuario lea o compare → font-mono obligatorio

NO implementar modo oscuro.
```

## §1.3 Tokens de espaciado

```css
--sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px;
--sp-6:24px; --sp-8:32px; --sp-12:48px; --sp-16:64px;
--r-sm:6px; --r-md:10px; --r-lg:14px; --r-xl:20px;
--shadow-sm: 0 1px 3px rgba(28,27,24,.07);
--shadow-md: 0 4px 12px rgba(28,27,24,.08);
--shadow-lg: 0 8px 24px rgba(28,27,24,.10);
```

## §1.4 Componentes clave

**Botón primario:** bg green-500 · color white · padding 10px 22px · r-sm · Inter 500 14px · hover: green-600 + translateY(-1px) · 150ms ease-out

**Card:** bg ivory-card · border 1px ivory-border · r-lg · padding 20px 24px · shadow-sm · hover: shadow-md + border gray-200 · 200ms

**Card ★ óptimo:** border amber-300 · bg amber-50 · badge "★ ÓPTIMO" amber-700

**Slider:** track 4px gray-200 · fill green-100 · thumb 18px green-500 · valor font-mono 13px green-500 · fuente 10px gray-400 italic debajo

**Badge API en vivo:** bg green-50 · text green-500 · dot 5px pulse animation
**Badge Fallback:** bg amber-50 · text amber-600 · "Estimado · verificar"
**Overlay bloqueado:** opacity 0.35 · pointer-events none · banner rojo "Requiere Fase 1 — Reforma reglamentaria aprobada"

**Gráficas:** fondo transparent · grid ivory-border dashed · ejes gray-400 font-mono 10px · tooltips gray-900 white · animación 300ms ease-out

---

# §2 — DATOS CERTIFICADOS (fallback cuando no hay API)

## §2.1 Composición RSU (FIJA — Modelo_BASED.xlsx)

| Material | % | Factor adicional |
|----------|---|-----------------|
| Materia orgánica | 45% | 30% biodigestor · 70% composta |
| Papel y cartón | 20% | IPSL absorbe flujo completo SLP |
| Plásticos | 15% | 50% es PET |
| Vidrio | 5% | Vitro/Owens Illinois capacidad disponible |
| Metales | 5% | 70% es aluminio |
| Otros/no valorizables | 10% | rechazo al relleno |

## §2.2 Precios commodities (MXN/kg — base, Serper API los actualiza)

| Material | Precio | Rango histórico | Volatilidad σ |
|----------|--------|----------------|---------------|
| PET | $5.50 | $3.00–$12.00 | $1.20 |
| HDPE / otros polímeros | $8.50 | $5.00–$15.00 | $1.50 |
| Papel / cartón | $2.50 | $0.70–$5.00 | $0.80 |
| Vidrio | $2.30 | $0.90–$5.00 | $0.90 |
| Aluminio | $15.10 | $10.00–$40.00 | $3.50 |
| Orgánicos / composta | $1.00 | $0.30–$3.00 | $0.40 |

## §2.3 Escalas de centros de acopio (Modelo CFO certificado)

| | Pequeño (P) | Mediano (M) | Grande (G) |
|-|-------------|-------------|------------|
| Capacidad | 5 t/día | 15 t/día | 50 t/día |
| Superficie | 250 m² | 750 m² | 2,000 m² |
| CAPEX total | $726,476 MXN | $2,528,808 MXN | $7,131,655 MXN |
| OPEX mensual | $110,838 MXN | $320,354 MXN | $787,328 MXN |
| Ingreso mes Año 3 | $254,389 MXN | $1,023,638 MXN | $3,496,500 MXN |
| EBITDA mes Año 3 | $143,551 | $703,284 | $2,709,172 |
| TIR proyecto | 109.5% | 155.6% | 212.0% |
| Payback simple | ~6 meses | ~5 meses | ~7 meses |
| Empleos directos | 5 | 14 | 34 |
| Estructura D/E | 50/50 | 60/40 | 70/30 |
| Tasa deuda | 14% anual | 13.5% anual | 13.0% anual |
| Plazo deuda | 4 años | 4 años | 5 años |

## §2.4 Fases de despliegue de CAs (Eje B — mix P/M/G inmutable)

| Fase | Mix | CAs | Cap t/d | CAPEX | EBITDA/mes | % cobertura |
|------|-----|-----|---------|-------|------------|-------------|
| 1 Piloto | 3P+0M+0G | 3 | 15 | $2.18M | $430K | 25% |
| 2 Arranque | 5P+1M+0G | 6 | 40 | $6.16M | $1.42M | 40% |
| 3 Expansión | 5P+3M+0G | 8 | 70 | $11.22M | $1.83M | 60% |
| 4 Consolidación | 8P+4M+1G | 13 | 130 | $22.0M | $5.92M | 80% |
| 5 Madurez ★ | 10P+6M+2G | 18 | 230 | $35.5M | $10.35M | 90% |
| 6 Sistema completo | 20P+8M+3G | 31 | 370 | $71.9M | $24.9M | 100% |

★ = óptimo financiero (máximo EBITDA/CAPEX). Etiqueta visual obligatoria.

## §2.5 Fases institucionales (Eje A — del capítulo SLP, estructura inmutable)

| Fase | Meses | Nombre | Gate |
|------|-------|--------|------|
| 1 | 0–6 | Alineación institucional y jurídica | ★ BLOQUEANTE: sin reforma aprobada, secciones operativas en overlay rojo |
| 2 | 4–9 | Negociación y pacto con concesionario | Adenda al contrato |
| 3 | 9–18 | Despliegue de infraestructura | Construcción CAs |
| 4 | 18–24 | Arranque y operación del piloto | Validación KPIs |
| 5 | 24–36 | Evaluación y escalamiento | Cobertura ZM completa |

## §2.6 Presets de trayectoria de captura

| Preset | Año 1 | Año 2 | Año 3 | Año 4 | Año 5 |
|--------|-------|-------|-------|-------|-------|
| Plan SLP Original | 25% | 60% | 100% | — | — |
| Conservador | 15% | 35% | 55% | 80% | 100% |
| Realista | 20% | 45% | 70% | 90% | 100% |
| Agresivo | 35% | 65% | 85% | 95% | 100% |
| Acelerado | 50% | 80% | 95% | 100% | — |

## §2.7 Recicladoras existentes (absorben flujo sin CAPEX del programa)

| Empresa | Material | Capacidad | Ciudad |
|---------|----------|-----------|--------|
| IPSL | Papel/cartón | 79,200 t/año | SLP |
| PetStar Acopio | PET | 5,700 t/año | SLP (fases tempranas) |
| Vitro / Owens Illinois | Vidrio | Capacidad amplia | Regional |

En QRO y MTY el simulador descubre recicladoras vía DENUE/API — no hay hardcode.

## §2.8 Multiplicadores económicos (S&P / Deloitte / OMS)

| Multiplicador | Valor | Fuente |
|---------------|-------|--------|
| Empleo formal local | 1.8x sobre directos | Deloitte LATAM |
| Empleo indirecto | 2.5x–3.5x sobre directos | PNUD México |
| Cadena de suministro | 0.25x del ingreso anual | S&P sector reciclaje |
| Valor de propiedad | +0.12x del ingreso zona | BBVA Research |
| Revenue fiscal | 0.16x del ingreso (IVA+ISR) | IMCO |
| Inversión privada atraída | 1.4x del ingreso anual | BID Economía Circular |
| Ahorro salud pública | $145 MXN/hab/año | OMS-OPS LATAM |
| Carbon credits (voluntario) | $5 USD/tCO₂e | VCS Market 2024 |
| Carbon credits (SCE México) | $10–20 USD/tCO₂e | SEMARNAT SCE |
| Carbon credits (EU ETS) | $60–90 USD/tCO₂e | EU reference |
| Tipo de cambio | $17.10 MXN/USD | Banxico API |

---

# §3 — INVENTARIO COMPLETO DE VARIABLES

## §3.1 Variables de entrada (ajustables por el usuario en la UI)

| Variable | Control UI | Rango | Default | Fuente |
|----------|-----------|-------|---------|--------|
| **Demográficas** |
| Generación per cápita (kg/hab/día) | Slider | 0.70–1.50 step 0.05 | Por ciudad | SEMARNAT DBGIR 2022 |
| Municipios activos | Checkboxes | Por ZM | Todos | - |
| Tipo de vivienda | Multi-toggle | Vertical/Casa/Residencial | Todos | - |
| **Plan** |
| Horizonte circularidad (años) | Botones 1–5 | 1–5 | 3 | Modelo |
| % captura por año | N sliders | 1–100 step 1 | Preset Realista | Modelo |
| Preset de trayectoria | Selector | 5 presets | Realista | §2.6 |
| **Precios** |
| Precio PET (MXN/kg) | Slider | 3.00–12.00 step 0.10 | $5.50 | Serper API |
| Precio Papel/Cartón | Slider | 0.70–5.00 step 0.10 | $2.50 | Serper API |
| Precio Vidrio | Slider | 0.90–5.00 step 0.10 | $2.30 | Serper API |
| Precio Aluminio | Slider | 10.00–40.00 step 0.50 | $15.10 | Serper API |
| Precio HDPE | Slider | 5.00–15.00 step 0.10 | $8.50 | Serper API |
| Precio Orgánicos/Composta | Slider | 0.30–3.00 step 0.10 | $1.00 | Modelo |
| **Operativos** |
| Merma logística (%) | Slider | 5–25 step 1 | 10% | Modelo |
| % rechazo por impureza | Por material | 3–25 step 1 | Por material | Modelo |
| Mix CAs por fase P/M/G | Botones +/- | 0–50 c/u | Auto por fase | §2.4 |
| Capacidad camión (ton) | Select 4 opciones | 8/10/12/14 | 12 | Modelo |
| Costo basureros diferenciados | Input | $80–$350/viv | $180 | Modelo |
| Vida útil basureros (años) | Select | 2/3/5 | 3 | Modelo |
| Costo comunicación social (MXN/año) | Input | 200K–2M | $600K | Modelo |
| Subsidio federal disponible (MXN) | Input | 0–50M | $0 | Usuario |
| Crédito verde BID/BM | Toggle | Sí/No | No | Usuario |
| Tasa crédito verde (%) | Input | 4–9 | 6.5% | Usuario |
| Plazo crédito (años) | Select | 5/7/10/15 | 7 | Usuario |
| **Financieros** |
| WACC (%) | Input | 12–30 step 1 | 20% | Modelo CFO |
| Tipo de cambio MXN/USD | Input | 14.00–22.00 | 17.10 | Banxico API |
| Precio carbono | Select 3 escenarios | Vol/SCE/EU | Voluntario | Modelo |
| Mes de inicio (estacionalidad) | Selector mes | Ene–Dic | Enero | Modelo |
| **Ambiental** |
| Distancia al relleno sanitario (km) | Input | 5–120 | Por ciudad | Usuario |
| Capacidad remanente relleno (años) | Input | 1–50 | Por ciudad | SEMARNAT |
| Factor captura biogás (%) | Slider | 50–80 step 5 | 65% | Modelo |
| Temperatura promedio anual (°C) | Input | 14–32 | Por ciudad | SMN API |

## §3.2 Variables calculadas (mostradas en tiempo real, no editables)

| Variable | Fórmula | Unidad |
|----------|---------|--------|
| **Demográficas** |
| Población activa | pop_zm × pct_munis × pct_vivienda_tipos | hab |
| Viviendas activas | viv_zm × filtros municipio × filtros vivienda | unidades |
| RSU total generado | pop_activa × gen_percapita × factor_estacionalidad_mes | t/día |
| RSU vertical | viv_V × ocu × gen × 1.00 | t/día |
| RSU casa habitación | viv_C × ocu × gen × 0.95 | t/día |
| RSU residencial | viv_R × ocu × gen × 1.15 | t/día |
| **Operativas** |
| Volumen capturable por material | rsu × comp_mat × tasa_captura_fase × (1 - merma_log) × (1 - rechazo_impureza) | t/día |
| Camiones requeridos por material | ceil(vol_mat / cap_camion / 2 viajes_dia) | unidades |
| Ocupación CAs (% capacidad) | vol_total_capturable / cap_instalada_cas | % |
| Break-even kg/día por CA-P | opex_mensual_P / (precio_promedio_ponderado × dias_op/30) | kg/día |
| DSCR | EBITDA / (amort_deuda + intereses) | ratio |
| **Financieras** |
| Ingresos brutos | Σ(vol_mat × precio_mat × dias_operativos_300) | MXN/año |
| CAPEX total programa | Σ(n_cas_tipo × capex_tipo) + capex_basureros + capex_comunicacion | MXN |
| CAPEX basureros | viv_activas × 0.80 × costo_basurero_tipo | MXN |
| OPEX anual CAs | Σ(n_cas_tipo × opex_mes_tipo × 12) | MXN/año |
| OPEX logística | n_camiones × (diesel_km × km_ruta × dias_op + mantenimiento + salarios) | MXN/año |
| OPEX comunicación | costo_comunicacion_anual | MXN/año |
| OPEX capacitación | empleos_nuevos_año × costo_capacitacion × (1 + rotacion) | MXN/año |
| EBITDA | ingresos_brutos - opex_total | MXN/año |
| Margen EBITDA | EBITDA / ingresos_brutos | % |
| VPN (WACC) | Σ FCF_t / (1 + WACC)^t · t=1..horizonte | MXN |
| TIR proyecto | NPV=0, solve for r | % |
| TIR equity | NPV equity = 0, solve | % |
| MOIC | VPN / CAPEX_equity | x |
| Payback simple | CAPEX / (EBITDA / 12) | meses |
| Payback descontado | cuando FCF acumulado descontado = 0 | meses |
| Ingreso crédito carbono | co2e_total × precio_carbono × tipo_cambio | MXN/año |
| Ingreso biogás | vol_organico × 0.30 × 0.65 m³CH4/kg × 2.2 kWh/m³ × precio_kwh | MXN/año |
| Ahorro disposición final | vol_desviado × $320 MXN/ton | MXN/año |
| **Empleos** |
| Empleos directos CAs | Σ(n_cas_tipo × emp_tipo) por año del plan | personas |
| Empleos directos recicladoras nuevas | por fase Eje C (0→80→120) | personas |
| Empleos totales directos | emp_cas + emp_recicladoras | personas |
| Empleos indirectos | emp_directos × mult (2.5 + año×0.2) | personas |
| Pepenadores formalizados | pepenadores_activos_zm × pct_formalización_fase | personas |
| Derrama salarial directa | emp_directos × salario_promedio × 12 | MXN/año |
| Derrama salarial total | derrama_directa × multiplicador_latam | MXN/año |
| **Ambiental** |
| CO₂e orgánicos evitadas | vol_org × 0.30 × 234 × 0.0007168 × 27 | tCO₂e/año |
| CO₂e reciclables evitadas | Σ(vol_mat × factor_emision_virgen_mat) | tCO₂e/año |
| PM2.5 evitado (no quema) | vol_rechazo_evitado_quema × 0.0043 | ton/año |
| kWh generados biogás | vol_org × 0.30 × 0.65 × 2.2 | kWh/año |
| Extensión vida útil relleno | vol_desviado × 365 / cap_relleno_ton_dia | años adicionales |
| **Salud** |
| Casos IRA niños evitados | pm25_evitado × 847 | casos/año |
| Casos dengue evitados | vol_organico_controlado × factor_aedes_0.003 | casos/año |
| AVAD evitados | (casos_ira × 0.006 + casos_dengue × 0.003) | AVAD/año |
| Ahorro hospitalario IRA | casos_ira × $450 MXN | MXN/año |
| Ahorro hospitalario dengue | casos_dengue × $8,200 MXN | MXN/año |
| Ahorro total salud | ahorro_ira + ahorro_dengue + (pop × 145 × tasa_adopcion) | MXN/año |
| **Económicos agregados** |
| Cadena de suministro activada | ingresos × 0.25 | MXN/año |
| Revenue fiscal generado | ingresos × 0.16 | MXN/año |
| Incremento valor de propiedad | ingresos × 0.12 | MXN/año |
| Inversión privada atraída | ingresos × 1.40 | MXN/año |
| Derrama total | ingresos×1.4 + crédito_carbono + biogás + ahorro_disposición + ahorro_salud | MXN/año |
| Score político | f(ambición_año1, payback_vs_periodo_gob, empleos, capex_municipal, pepenadores) | 0–100 |
| Rating ESG municipal Δ | f(co2e, empleos_formales, pureza_operación) | puntos |

## §3.3 KPIs operativos por fase (tabla fija en sección S10)

| KPI | F1 Piloto | F2 Arranque | F3 Expansión | F4 Consolidación | F5 Madurez |
|-----|-----------|-------------|--------------|-----------------|------------|
| Pureza material (%) | 60% | 72% | 80% | 87% | 92% |
| Rechazo impureza (%) | 40% | 28% | 20% | 13% | 8% |
| Ocupación CAs (%) | 72% | 78% | 84% | 88% | 91% |
| Tiempo ciclo (min/ton) | 52 | 44 | 38 | 33 | 29 |
| DSCR | 1.4x | 1.8x | 2.1x | 2.5x | 2.9x |
| Break-even CA-P (kg/d) | 1,850 | 1,620 | 1,450 | 1,310 | 1,190 |
| NPS ciudadanos | 31 | 44 | 58 | 67 | 74 |
| Quejas/mes | 85 | 52 | 28 | 14 | 6 |
| Pepenadores formal. | 15% | 35% | 55% | 75% | 90% |

## §3.4 Estacionalidad mensual de RSU (factor multiplicador sobre baseline)

```
Ene: -8%  Feb: -5%  Mar: +2%  Abr: +5%  May: +8%  Jun: +3%
Jul: +6%  Ago: +7%  Sep: +3%  Oct: +5%  Nov: +12% Dic: +18%
```
Afecta: camiones requeridos en pico, capacidad máxima CAs, almacenamiento.

## §3.5 Parámetros OPEX faltantes (integrados al motor de cálculo)

```python
OPEX_PARAMS = {
    # Energía y agua
    "kwh_mes": {"P": 800, "M": 2400, "G": 7200},          # kWh/mes por CA
    "agua_m3_mes": {"P": 12, "M": 35, "G": 95},            # m³/mes
    "precio_kwh": 2.80,                                      # MXN — CFE tarifa industrial
    "precio_agua_m3": 18.50,                                # MXN promedio municipal

    # Personal
    "salario_operador": 9200,    # MXN/mes bruto
    "salario_chofer": 11500,     # MXN/mes bruto
    "salario_supervisor": 14800, # MXN/mes bruto
    "cuota_imss": 0.2168,        # % sobre salario nominal
    "rotacion_anual": 0.18,      # 18% rotación de personal
    "costo_capacitacion": 4500,  # MXN por empleado nuevo

    # Logística
    "diesel_l_km": 0.35,         # L/km camión compactador
    "precio_diesel": 24.0,       # MXN/L
    "mantenimiento_camion": 5500,# MXN/mes
    "vida_util_camion": 4,       # años

    # Inmueble
    "costo_terreno_m2": {        # MXN/m² por ciudad
        "MTY": 4200, "SP": 8500, "QRO": 2800, "SLP": 1600,
        "GDL": 3600, "default": 2000
    },
    "superficie_ca": {"P": 250, "M": 750, "G": 2000},      # m²
    "renta_mensual_pct_valor": 0.006,                       # 0.6% del valor catastral

    # Comunicación y social
    "comunicacion_anual": 600000, # MXN/año default
    "senaletica_ca": 18000,       # MXN por CA
    "costo_basurero_vertical": 180,   # MXN/depto
    "costo_basurero_casa": 280,       # MXN/casa
    "costo_basurero_residencial": 650, # MXN/casa
    "vida_util_basureros": 3,          # años
    "pct_viviendas_requieren_basurero": 0.80,
}
```

---

# §4 — COBERTURA NACIONAL

## §4.1 Fase A — En memoria, offline-ready (arranque inmediato)

### ZM Monterrey — Nuevo León
```
Municipios (9): Monterrey · San Pedro G.G. · San Nicolás de los Garza ·
                Guadalupe · Apodaca · Santa Catarina · García ·
                General Escobedo · Juárez
Pop: 5,341,171 | Viv: 890,000 | Ocu: 3.5 | Gen: 1.05 kg/d | Crec: 1.8%
Mix: Vertical 55% · Casa 30% · Residencial 15%
Costo terreno CA: $4,200–$8,500 MXN/m²
Relleno activo: El Guitarrón · Vida útil remanente: ~8 años
Pepenadores activos ZM: ~2,400 (estimado ENIGH 2022)
```

### ZM Querétaro — Querétaro
```
Municipios (4): Querétaro · Corregidora · El Marqués · Huimilpan
Pop: 1,404,306 | Viv: 260,000 | Ocu: 3.4 | Gen: 0.95 kg/d | Crec: 2.1%
Mix: Vertical 65% · Casa 20% · Residencial 15%
Costo terreno CA: $2,800 MXN/m²
Crecimiento habitacional vertical: 3.2% anual (uno de los más altos del país)
Pepenadores activos ZM: ~680 (estimado)
```

### ZM San Luis Potosí — SLP
```
Municipios (4): San Luis Potosí · Soledad de Graciano Sánchez ·
                Cerro de San Pedro · Villa de Pozos
Pop: 1,243,980 | Viv: 224,000 | Ocu: 3.6 | Gen: 0.90 kg/d | Crec: 1.2%
Mix: Vertical 50% · Casa 30% · Residencial 20%
Costo terreno CA: $1,600 MXN/m²
Relleno El Eje: Vida útil remanente: ~12 años
Recicladoras existentes: IPSL (papel), PetStar (PET), Vitro (vidrio)
Pepenadores activos ZM: ~540 (estimado)
Ingresos potencial plena cobertura: $370,969,321 MXN/año
  Desglose: PET $98.3M · Papel $119.2M · Vidrio $27.4M · Aluminio $126.0M
```

## §4.2 Fase B — Cache SQLite (sincroniza al arrancar app)

### Estado Jalisco completo
```
ZM Guadalajara (8 municipios):
  Guadalajara · Zapopan · Tlaquepaque · Tonalá · Tlajomulco de Zúñiga ·
  El Salto · Juanacatlán · Ixtlahuacán de los Membrillos
  Pop: 5,268,642 | Gen: 1.02 kg/d | Mix: Vertical 60% · Casa 25% · Res 15%

ZM Puerto Vallarta:
  Puerto Vallarta (Jal) · Bahía de Banderas (Nay)
  Pop: 469,076 | Gen: 1.10 kg/d (turismo +10%) | Mix: Vertical 70%

Municipios independientes Jalisco:
  Lagos de Moreno: 179,982 hab · 0.85 kg/d
  Tepatitlán: 160,517 · 0.83 kg/d
  Ciudad Guzmán: 120,193 · 0.88 kg/d
  Ocotlán: 105,027 · 0.86 kg/d
  Ameca: 80,742 · 0.82 kg/d
```

### Estado Guanajuato completo
```
ZM León: León · San Francisco del Rincón · Purísima del Rincón
  Pop: 1,867,724 | Gen: 0.95 kg/d | Crec: 1.9%
ZM Celaya: Celaya · Cortazar · Villagrán · Tarimoro
  Pop: 678,304 | Gen: 0.92 kg/d
ZM Salamanca-Irapuato: Salamanca · Irapuato · Abasolo
  Pop: 826,281 | Gen: 0.90 kg/d
ZM Guanajuato-Silao: Guanajuato · Silao de la Victoria
  Pop: 351,797 | Gen: 0.95 kg/d

Municipios independientes Guanajuato:
  San Miguel de Allende: 196,006 · 1.15 kg/d (turismo premium)
  Dolores Hidalgo: 150,028 · 0.85 kg/d
  Pénjamo: 155,416 · 0.82 kg/d
  Acámbaro: 121,647 · 0.85 kg/d
```

### Nuevo León municipios independientes (fuera ZM MTY)
```
Linares: 99,254 · 0.85 kg/d | Montemorelos: 71,460 · 0.82 kg/d
Cadereyta Jiménez: 104,991 · 0.87 kg/d | Sabinas Hidalgo: 41,609 · 0.80 kg/d
China: 23,481 · 0.78 kg/d | Allende: 38,542 · 0.80 kg/d
```

### SLP municipios independientes
```
Ciudad Valles: 196,034 · 0.85 kg/d | Matehuala: 116,313 · 0.83 kg/d
Rioverde: 119,407 · 0.82 kg/d | Tamazunchale: 95,248 · 0.80 kg/d
Cd. Fernández: 57,294 · 0.80 kg/d | Ébano: 35,542 · 0.78 kg/d
```

### Querétaro municipios independientes
```
San Juan del Río: 280,714 · 0.92 kg/d (Crec 2.8%)
Tequisquiapan: 77,487 · 0.88 kg/d | Cadereyta: 79,756 · 0.83 kg/d
Ezequiel Montes: 50,654 · 0.85 kg/d | Jalpan de Serra: 28,408 · 0.78 kg/d
```

## §4.3 Fase C — API CONAPO en vivo (República Mexicana)

```
59 ZMs + 9 conurbaciones + 3 centros urbanos (CONAPO Delimitación 2020)

Top 15 por RSU generado (t/día):
1.  ZM Valle de México:      ~21,850  (CDMX + 59 municipios)
2.  ZM Monterrey:             ~5,608
3.  ZM Guadalajara:           ~5,374
4.  ZM Puebla-Tlaxcala:       ~2,450
5.  ZM Tijuana:               ~2,163
6.  ZM León:                  ~1,775
7.  ZM Toluca:                ~1,680
8.  ZM Juárez:                ~1,624
9.  ZM La Laguna:             ~1,518
10. ZM Querétaro:             ~1,334
11. ZM Mérida:                ~1,205
12. ZM Chihuahua:             ~1,123
13. ZM Veracruz:              ~1,018
14. ZM Aguascalientes:          ~924
15. ZM San Luis Potosí:         ~726

Generación per cápita por estrato (SEMARNAT DBGIR 2022):
  Megalópolis (>3M hab):       1.05–1.20 kg/hab/día
  Ciudad grande (500K–3M):     0.95–1.05
  Ciudad media (100K–500K):    0.85–0.95
  Ciudad pequeña (<100K):      0.75–0.85
```

---

# §5 — GRÁFICAS (19 obligatorias)

Recharts principal · D3 para Sankey · SVG custom para isométrico y gauges.
Colores del §1.1 siempre. Fondo transparent. Animación entrada 300ms ease-out.

```
1.  Curva captura acumulada [AreaChart]
    Usuario (azul-600) + Bogotá (verde-400) + B.Aires (ámbar-400) + Curitiba (tierra-500)
    Banda P10-P90 Monte Carlo (gris-200 opacity 0.4)

2.  Barras volumen por material/año [BarChart apilado]
    Colores por material §1.1

3.  Timeline despliegue CAs [SVG animado custom]
    Iconos P/M/G aparecen en su año · hover: card con CAPEX/TIR/empleos

4.  Capacidad vs demanda por material [Bullet chart horizontal]
    Barra = demanda · Línea = capacidad · Verde si OK · Rojo si déficit

5.  Mapa recicladoras [Mapbox GL JS]
    Gris = existente · Verde animado = nueva · Click: card financiera

6.  Gantt activación recicladoras [SVG custom]
    Eje X tiempo (meses) · Eje Y giro · Barra: construcción + rampa

7.  Sankey cadena de valor [D3]
    RSU → Separación → CA → Recicladora → Producto final
    Ancho proporcional a volumen en t/día

8.  Waterfall ingresos [ComposedChart]
    RSU capturable → materiales → merma → ingreso bruto → OPEX → EBITDA
    → carbono → biogás → ahorro disposición → ahorro salud → Derrama total

9.  Distribución Monte Carlo TIR [Histograma BarChart]
    10K simulaciones · 50 bins · área WACC verde · P10/P50/P90 marcados

10. Tornado sensibilidad [BarChart horizontal]
    ±20% en cada variable vs impacto en VPN · ordenado por impacto absoluto

11. Cashflow mensual acumulado [LineChart 3 escenarios]
    Azul=realista · Verde=optimista · Gris=pesimista · Punto rojo = payback

12. Grid stress test [4 cards semáforo]
    A: PET -40% · B: adopción 50% más lenta
    C: concesionario bloquea 12 meses · D: OPEX +20%

13. Pirámide empleos [BarChart horizontal apilado]
    CAs P/M/G + recicladoras por giro + indirectos · se actualiza por año

14. Crecimiento masa salarial [AreaChart]
    Derrama directa vs multiplicada año a año

15. Gauge CO₂e evitadas [SVG semicircular 270°]
    Arc animado de gris a verde · label central font-mono grande

16. Mapa calor salud [Mapbox coropleta]
    Opacidad por municipio = ahorro salud estimado · escala ivory→verde-500

17. Timeline benchmarks LATAM [SVG horizontal]
    2000–2030 · hitos Bogotá/B.Aires/Curitiba/Santiago/S.Paulo
    Marcador "Tú aquí" en año actual del plan del usuario

18. Roadmap legislativo [Timeline vertical interactivo]
    6 checkboxes · gates bloqueantes con ícono candado
    Al completar todos: overlay se levanta en secciones operativas

19. Contador oportunidad perdida [contador animado]
    MXN/día y MXN/semana en tiempo real (sube cada segundo)
    Color rojo intensificándose · calcula desde fecha estimada de reforma
```

---

# §6 — ESTRUCTURA DE LA APP (5 rutas)

## §6.1 Rutas Next.js

```
/               → Landing con hero + CTA "Comenzar simulación"
/login          → Auth (usuario/password · JWT 24h · refresh 7d)
/simulator      → Simulador principal (scroll vertical 20 secciones)
/ca-studio      → Módulo SimCity — Diseña tu CA
/hub            → Hub de documentos por municipio (ÁGORA outputs)
/aprende        → Centro educativo público (sin login)
/admin          → Panel admin (crear usuarios, ver logs)
```

## §6.2 Navegación persistente

**Header sticky:** Logo Crimson Pro + ZM activa + 4 KPIs resumen (font-mono) + "Guardar escenario" + "Exportar PDF"

**Sidebar izquierdo (desktop):** 8 anclas con scroll-spy activo en verde-500

**Mobile:** hamburger → drawer lateral con mismas 8 anclas

## §6.3 Secciones del simulador en orden de scroll

```
S1   Hero — título + texto intro + CTA + métricas globales
S2   Fuentes de datos — 6 API cards con badges de estado
S3   Cómo usar — 4 pasos numerados
S4   Selector ZM + municipios checkboxes + Mapbox zoom flyTo
S4.5 Marco legal y reforma reglamentaria
       Diagnóstico reglamento vigente · Brecha normativa
       Reforma propuesta · Roadmap legislativo (gráfica 18)
       Contador oportunidad perdida (gráfica 19)
S5   Mapa densidad RSU (Mapbox heatmap AGEB · layer toggles)
S6   Composición RSU — 6 cards FIJOS · badge "Dato certificado"
S7   Tipo de vivienda + slider gen per cápita + tabla RSU/tipo
     + calculadora inversión en basureros diferenciados
S8   Horizonte circularidad — botones 1-5 años
S9   Editor trayectoria — N sliders + gráfica curva (gráfica 1)
     + presets + narrativa dinámica en vivo
S10  Centros de acopio — 3 cards P/M/G + mix automático
     + gráfica despliegue (gráfica 3) + tabla KPIs operativos por fase
     + capacidad vs demanda (gráfica 4)
S11  Logística — tabla camiones × material × días × horario
     + gráfica volumen estacional (variación mensual)
S12  Empleos — pirámide (gráfica 13) + masa salarial (gráfica 14)
     + pepenadores formalizados + narrativa dinámica
S13  Recicladoras — mapa (gráfica 5) + gantt (gráfica 6)
     + sankey cadena valor (gráfica 7)
S14  Impacto financiero — waterfall (8) + Monte Carlo (9)
     + tornado (10) + cashflow (11) + stress test (12)
S15  Impacto ambiental — gauge CO₂e (15) + mapa calor salud (16)
     + PM2.5 evitado + AVAD + extensión relleno + kWh biogás
S16  Multiplicadores económicos — 6 cards + KPI strip
S17  Score viabilidad política — 0-100 con desglose por componente
S18  Benchmark LATAM — timeline (gráfica 17)
S19  Comparador escenarios — hasta 5 guardados lado a lado
S20  Exportar — PDF ejecutivo + Excel CFO + compartir enlace
```

## §6.4 Narrativa dinámica en vivo (en S9, S12, S14)

Bloque de texto debajo de cada sección que se reescribe con debounce 400ms.
Máximo 3 líneas. Usa plantillas con interpolación (no IA, más rápido).

Ejemplo S9: *"Con un plan de {N} años para {ZM}, el primer año se capturará el {pct}% del RSU — {vol} t/día que hoy van al relleno. Esta tasa es {comparable con Bogotá 2012–2015 / similar a Buenos Aires 2018–2021 / más ambiciosa que cualquier benchmark LATAM documentado}."*

---

# §7 — MÓDULO CA-STUDIO (SimCity)

## §7.1 Vista isométrica SVG animada

Tecnología: SVG.js o Paper.js — isométrica 45°, loops 8–12s, pause on hover.

**Selector de escala:** [Pequeño 250m²] [Mediano 750m²] [Grande 2,000m²]

**Selector de contexto:** [Torre residencial] [Casa habitación] [Privada/residencial] [Comercial mixto]

## §7.2 Animaciones por escala

**CA Pequeño:** báscula parpadea al pesar · compactadora manual pistón · carretillas en movimiento · contenedores con nivel de llenado

**CA Mediano:** báscula vehicular camión sube · banda transportadora continua · 3 prensas hidráulicas ciclo compresión · montacargas moviendo pacas · volteo de composta pala mecánica

**CA Grande:** andén 4 bahías simultáneas · banda automática clasificación · 5 prensas industriales · 2 montacargas apilando · digestor orgánico burbujeando · laboratorio de calidad activo

## §7.3 Panel lateral (conectado a sliders del simulador)

```
ENTRADAS HOY (t):
  Plásticos ████████░░ 8.2
  Papel     ██████████ 14.6
  Vidrio    ████░░░░░░ 3.1
  Orgánico  ██████████ 32.4

SALIDAS ESTE MES:
  A recicladoras: 287.4 t → $1.2M MXN
  A composta: 194.8 t → $97.4K MXN
  Biogás generado: 12,400 kWh

PERSONAL EN TURNO: ●●●●●●●●●● 10/14
ESTADO MAQUINARIA:
  ✓ Banda ✓ Prensa 1 ✓ Prensa 2 ⚠ Prensa 3 ✓ Montacargas
```

## §7.4 Guía operativa (pestaña en el mismo módulo)

8 pasos con GIF animado de 3–5s cada uno:
Recepción y pesaje · Clasificación inicial · Separación por fracción · Compactación · Almacenamiento · Despacho · Registro/trazabilidad · Mantenimiento diario

## §7.5 Estudios de idoneidad (4 animaciones)

```
A. Torre con CA en planta baja + chutes por piso
   GIF: edificio sección transversal, 4 chutes de colores, CA activo abajo

B. Torre con tubería de separación integrada
   GIF: planos arquitectónicos, tuberías instaladas, flujo por gravedad

C. Privada con CA central + carrito eléctrico
   GIF: vista aérea privada, carrito haciendo ruta, CA en entrada

D. Door-to-door casa habitación
   GIF: calle, camioneta parándose, habitante saca 3 cubetas, clasificación in situ
```

---

# §8 — HUB DE DOCUMENTOS (ruta /hub)

## §8.1 Estructura de archivos por municipio

```
/hub/{municipio}/
  Marco legal:     diagnóstico vigente · iniciativa reforma · adenda concesión · análisis comparado
  Modelo financiero: CFO Excel · Monte Carlo PDF · reporte ejecutivo 1 pág
  Operativo:       Gantt implementación · manuales CA-P/M/G · bitácora template · protocolo separación
  Comunicación:    presentación Cabildo · carta ciudadanos · guía separación · kit prensa
  Estudios:        idoneidad CA · análisis AGEB · benchmark LATAM · mapeo stakeholders
```

## §8.2 Flujo de generación automática

Botón "Generar todos los documentos" → lanza agentes ÁGORA en secuencia:
ALQUIMIA corre → JSON outputs → Director → Arquitecto → Ghostwriter → Comparador → Mapeador → Validador → Humanizador → Hub actualizado → notificación usuario

## §8.3 Estado de documentos y visibilidad

Cada doc: Borrador / Revisión / Aprobado / **Publicado** (URL pública sin login)
URL pública: `alquimia.mx/municipio/{slug}/public`

---

# §9 — CENTRO EDUCATIVO /aprende (sin login)

```
Sección 1: ¿Qué es un RSU y cómo separo?
  Infografía animada 5 fracciones · reglas por fracción con ✓ y ✗
  Selector tipo vivienda → instrucciones específicas · PDF descargable

Sección 2: ¿Qué pasa con mi basura?
  Flujo animado: casa → camión → CA → recicladora → producto nuevo
  Click por material: PET→fibra ropa, Aluminio→latas en 60d, etc.

Sección 3: El costo de NO separar
  Contador tiempo real toneladas al relleno desde que entraste
  México: 120,000 t/día RSU · 75% al relleno
  Mapa rellenos sanitarios activos (SEMARNAT) + vida útil remanente
  Valor enterrado al año en MXN (calculado en vivo)

Sección 4: Estudios de idoneidad (las 4 animaciones del CA-Studio)

Sección 5: FAQ
  ¿Mi ciudad ya tiene un programa? / ¿Cómo proponer a mi edificio?
  ¿Puedo invertir en un CA? / ¿Qué hago con pilas y medicamentos?

Sección 6: Biblioteca de investigación
  Docs del hub marcados como Publicado + papers referenciados
  Cada entrada: fuente · año · DOI · resumen 2 líneas
```

---

# §10 — AUTENTICACIÓN Y ROLES

```
Roles: admin · analista · visitante (solo /aprende sin login)
Login: JWT 24h · refresh token 7d · bcrypt passwords
Rate limit: 5 intentos fallidos → bloqueo 15 min
Panel /admin: crear usuarios · ver logs de generación · estado agentes ÁGORA
```

---

# §11 — APIS INTEGRADAS

| API | Endpoint base | Dato | Fallback |
|-----|--------------|------|---------|
| INEGI Indicadores | api.inegi.org.mx/consulta/v1.0 | Población, viviendas | Datos hardcoded §4 |
| INEGI DENUE | api.inegi.org.mx/app/api/denue/v1 | Recicladoras existentes | IPSL/PetStar/Vitro hardcoded |
| CONAPO | datos.gob.mx proyecciones | Crecimiento poblacional | Tasas hardcoded §4 |
| RUV | ruv.org.mx datos-abiertos | Pipeline vivienda nueva | Tasa histórica |
| SEMARNAT DGEIA | dgeiawf.semarnat.gob.mx | RSU por municipio | DBGIR 2022 hardcoded |
| Serper | api.serper.dev/search | Precios commodities spot | Precios §2.2 |
| Mapbox GL JS | api.mapbox.com | Mapa, rutas, geocoding | Mapa estático fallback |
| Banxico | banxico.org.mx SIE API | Tipo de cambio MXN/USD | $17.10 |
| SMN | smn.conagua.gob.mx | Temperatura promedio ciudad | Dataset histórico |

Siempre mostrar badge de fuente en cada dato: "INEGI API · hoy" o "Fallback · SEMARNAT 2022".

---

# §12 — INSTRUCCIONES DE IMPLEMENTACIÓN

1. Stack: Next.js 14 + TypeScript + Tailwind + Mapbox GL JS + Recharts + D3 + Zustand + Framer Motion + shadcn/ui (frontend) · FastAPI + Pydantic + JWT + PostgreSQL (backend) · Docker.
2. Fondo body: #F8F6F1 en todas las páginas sin excepción.
3. Cargar Google Fonts: Crimson Pro · Inter · JetBrains Mono.
4. Implementar las 19 gráficas de §5 en el orden del scroll.
5. Implementar todas las variables de §3 — tanto las de entrada como las calculadas.
6. Cobertura: Fase A offline en memoria · Fase B SQLite · Fase C CONAPO API.
7. Overlay de bloqueo en S5–S20 mientras roadmap legislativo no esté completo.
8. Módulos independientes: /ca-studio · /hub · /aprende con sus propios layouts.
9. Toda variable de entrada muestra su fuente. Toda variable calculada muestra su fórmula en tooltip.
10. Mobile responsive: breakpoints 640/768/1024/1280.
11. Al terminar: `npm run build` + `pytest tests/` + reporte de resultados.

**NO preguntes nada. Construye todo. Loguea errores y continúa sin parar.**
