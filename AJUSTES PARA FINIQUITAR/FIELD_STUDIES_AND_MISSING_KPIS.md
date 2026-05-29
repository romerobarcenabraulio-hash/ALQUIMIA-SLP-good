# FIELD STUDIES AND MISSING KPIs · Estudios de campo, antecedentes municipales y métricas no utilizadas

**Estado:** Propuesto · Pendiente de firma del founder
**Fecha:** 28 mayo 2026
**Dependencias:** Los siete documentos anteriores
**Construye:** HERMES (pipelines), AURUM (estudios), KOSMOS (schemas), MARCOS (estándares nuevos)

---

## 1 · Propósito

Este documento cubre tres áreas que la arquitectura tenía documentadas pero no completas. Primera, qué estudios de campo deben existir más allá de la encuesta de aceptación ciudadana (M02B) para que un diagnóstico sea técnicamente defendible. Segunda, cómo HERMES construye M00B Antecedentes municipales automáticamente desde fuentes públicas. Tercera, qué métricas y KPIs internacionales no estamos exponiendo todavía que diferencian a Alquimia de cualquier consultora tradicional.

La intención es cerrar tres gaps simultáneos. Sin estudios de campo formales, el diagnóstico de M01 es vulnerable a impugnación técnica por cualquier consultor competente del concesionario actual. Sin M00B automatizado, cada cliente nuevo requiere trabajo manual del founder. Sin los KPIs internacionales completos, Alquimia compite en el mismo terreno que Excel sofisticado en vez de competir en el terreno de plataforma institucional defendible ante banca multilateral.

---

## 2 · Estudios de campo formales requeridos

Más allá de la encuesta de aceptación ciudadana M02B (que ya existe en la arquitectura como módulo), hay seis estudios de campo que SEMARNAT, el Banco Mundial y los estándares internacionales consideran obligatorios para un diagnóstico defendible.

### 2.1 Estudio de cuarteo y caracterización física (NMX-AA-015-1985)

**Qué es.** Método mexicano estándar para muestrear residuos sólidos y obtener especímenes para análisis. Tres personas, área plana de cuatro por cuatro metros bajo techo, mínimo cincuenta kilogramos de muestra después del proceso de homogenización y división en cuatro partes (cuarteo). Se eliminan partes opuestas, se repite hasta cumplir el mínimo. Esta norma se complementa con NMX-AA-019 (peso volumétrico), NMX-AA-022 (selección y cuantificación de subproductos), NMX-AA-061 (generación), y NMX-AA-091 (terminología).

**Por qué es crítico.** Es el método legalmente reconocido en México. Sin cumplirlo, las cifras de generación per cápita, composición y peso volumétrico del módulo M01 son técnicamente impugnables. Un consultor del concesionario actual puede argumentar "esas cifras no siguen NMX-AA-015 y por tanto no son válidas para una decisión de Cabildo."

**Estado actual en Alquimia.** El módulo M01 muestra composición de residuos pero las cifras provienen de benchmarks SEMARNAT generales (Diagnóstico Básico para la Gestión Integral de los Residuos 2020), no de estudio de campo del municipio. La cifra nacional es 0.944 kg/hab/día. Cada municipio varía significativamente y solo un cuarteo local lo confirma.

**Schema requerido:**

```typescript
tenant.estudio_cuarteo = {
  metodologia_aplicada: "NMX-AA-015-1985",
  fecha_estudio: date,
  duracion_dias: number,  // típicamente 8 días consecutivos según norma
  consultor_responsable: string,
  zonas_muestreadas: [
    {
      colonia: string,
      estrato_socioeconomico: "alto" | "medio_alto" | "medio" | "medio_bajo" | "bajo",
      viviendas_muestreadas: number,
      participacion_voluntaria_pct: number
    }
  ],
  resultados_caracterizacion: {
    generacion_per_capita_kg_dia: number,
    peso_volumetrico_kg_m3: number,  // según NMX-AA-019
    composicion_pct: {
      organicos: number,
      papel_carton: number,
      plasticos: { pet: number, hdpe: number, ldpe: number, pp: number, otros: number },
      vidrio: { transparente: number, ambar: number, verde: number },
      metales: { ferrosos: number, no_ferrosos: number, aluminio: number },
      textiles: number,
      sanitarios: number,
      finos_inertes: number,
      otros: number
    },
    humedad_pct: number,  // según NMX-AA-016
    materia_organica_pct: number,  // según NMX-AA-021
    poder_calorifico_kJ_kg: number  // opcional, relevante si se considera valorización energética
  },
  evidencia: {
    fotografias_urls: string[],
    cedula_campo_pdf_url: string,
    informe_laboratorio_pdf_url: string,
    bitacora_pdf_url: string
  },
  costo_estudio_mxn: number,  // típicamente $80,000-$250,000 según tamaño del municipio
  proveedor_estudio: string  // laboratorio o consultor que lo ejecutó
}
```

**Quién lo ejecuta.** No Alquimia. El municipio contrata laboratorio certificado o el concesionario lo provee como parte de la línea base. Lo que Alquimia hace es exigirlo, validarlo, e integrarlo. Si no existe, Alquimia lo señala como brecha crítica y propone proveedores.

**Costo aproximado para el cliente.** Entre 80,000 y 250,000 pesos según tamaño del municipio. Esto está fuera del contrato Alquimia; el cliente lo paga directo al laboratorio.

### 2.2 Estudio de rutas y tiempos de recolección

**Qué es.** Documentación sistemática de las rutas actuales de recolección con tiempos reales, kilómetros recorridos, número de paradas, productividad por vehículo, frecuencia por zona.

**Por qué es crítico.** Sin esto, el módulo M08 (Operación piloto y comunicación) opera con supuestos. Las rutas optimizadas que Alquimia propone se comparan contra nada porque la línea base no está documentada.

**Estado actual.** M08 muestra rutas teóricas calculadas pero no compara contra rutas reales operadas hoy.

**Schema requerido:**

```typescript
tenant.estudio_rutas = {
  fecha_inicio_estudio: date,
  fecha_fin_estudio: date,
  rutas_documentadas: [
    {
      id: string,
      nombre_ruta: string,
      vehiculo_asignado: string,
      tipo_vehiculo: string,
      capacidad_ton: number,
      turno: "matutino" | "vespertino" | "nocturno",
      hora_inicio: string,
      hora_fin: string,
      kilometros_recorridos: number,
      paradas_total: number,
      tiempo_promedio_parada_seg: number,
      toneladas_recolectadas_promedio: number,
      vueltas_por_jornada: number,
      colonias_atendidas: string[],
      consumo_combustible_litros: number,
      eficiencia_kg_por_km: number,
      tiempo_traslado_relleno_min: number,
      problemas_recurrentes: string[]
    }
  ],
  cobertura_efectiva_pct: number,  // viviendas atendidas / total
  zonas_sin_cobertura: [
    { colonia: string, viviendas: number, motivo_no_atencion: string }
  ]
}
```

**Quién lo ejecuta.** Operador actual del servicio durante dos a cuatro semanas, supervisado por Alquimia con GPS tracking básico (apps de smartphone funcionan; no requiere hardware costoso).

### 2.3 Censo de pepenadores y trabajadores informales

**Qué es.** Identificación nominal de las personas que viven de la pepena en el relleno sanitario o en rutas urbanas. Cuántos son, cómo se organizan, qué ingresos generan, qué materiales recuperan.

**Por qué es crítico.** Tres razones combinadas. Primera, GRI 408-1 exige identificar operaciones con riesgo de trabajo infantil; los rellenos sanitarios mexicanos típicamente tienen menores trabajando. Segunda, cualquier programa RSU que ignore a los pepenadores se enfrenta a oposición política organizada (huelgas, bloqueos del relleno, presión mediática). Tercera, los pepenadores son frecuentemente sindicalizados y forman parte estructural del sistema de gestión actual; ignorarlos es el error más común de programas RSU fallidos.

**Estado actual.** El mapeo M02C identifica a pepenadores como actor genérico pero no los censa nominalmente.

**Schema requerido:**

```typescript
tenant.censo_pepenadores = {
  fecha_censo: date,
  ubicaciones_relevadas: [
    {
      ubicacion: string,  // "Relleno Sanitario Peñasco", "Centro de Transferencia X"
      personas_identificadas: number,
      organizacion_formal: boolean,
      nombre_sindicato_union: string | null,
      lider_reconocido: string | null,
      composicion_demografica: {
        adultos: number,
        adultos_mayores: number,
        menores_18: number,  // crítico para GRI 408-1
        mujeres: number,
        hombres: number
      },
      materiales_recuperados_principales: string[],
      ingreso_diario_promedio_mxn: number,
      antiguedad_promedio_anos: number,
      acceso_seguridad_social_pct: number
    }
  ],
  esquema_actual_compensacion: string,
  riesgos_laborales_identificados: string[],
  propuesta_integracion: {
    incorporacion_a_centros_acopio: boolean,
    fondo_compensacion_estimado: number,
    capacitacion_propuesta: string[]
  }
}
```

**Quién lo ejecuta.** Trabajo social municipal con apoyo de ONG local, supervisado por Alquimia. Tiempo típico tres a seis semanas. Costo entre 50,000 y 150,000 pesos.

### 2.4 Auditoría de infraestructura existente

**Qué es.** Inventario físico documentado de la infraestructura de RSU del municipio: flotilla con antigüedad y estado mecánico, centros de transferencia con capacidad real (no nominal), relleno sanitario con vida útil remanente medida, contenedores comunitarios si los hay.

**Por qué es crítico.** M06 (infraestructura) propone centros de acopio nuevos basado en supuestos de la infraestructura actual. Si los supuestos están equivocados, el CAPEX propuesto en M09 está desviado. La auditoría establece la línea base verificable.

**Schema requerido:**

```typescript
tenant.auditoria_infraestructura = {
  flotilla: [
    {
      id_vehiculo: string,
      tipo: "compactador" | "volteo" | "barredora" | "auxiliar",
      marca_modelo: string,
      año_fabricacion: number,
      kilometraje_actual: number,
      estado_mecanico: "excelente" | "bueno" | "regular" | "malo" | "fuera_servicio",
      costo_mantenimiento_anual: number,
      vida_util_remanente_anos: number,
      propiedad: "municipio" | "concesionario" | "renta"
    }
  ],
  rellenos_sanitarios: [
    {
      nombre: string,
      ubicacion_lat_lng: [number, number],
      año_apertura: number,
      capacidad_diseno_ton: number,
      capacidad_utilizada_pct: number,
      vida_util_remanente_anos: number,
      cumplimiento_nom_083: boolean,
      sistema_lixiviados: boolean,
      sistema_biogas: boolean,
      sistema_pesaje: boolean,
      monitoreo_ambiental: boolean
    }
  ],
  centros_transferencia: [...],
  centros_acopio_existentes: [...],
  estacion_pesaje_publica: boolean,
  taller_mantenimiento_municipal: boolean
}
```

**Quién lo ejecuta.** Personal técnico del municipio o consultor externo, una a dos semanas, costo bajo (entre 30,000 y 80,000 pesos).

### 2.5 Estudio jurídico-administrativo del marco vigente

**Qué es.** Análisis legal sistemático del reglamento de limpia vigente, sus brechas frente a la LGPGIR federal, los precedentes jurídicos relevantes en el estado, las facultades reales del Cabildo para reformar.

**Por qué es crítico.** M03B (marco legal — tres artículos faltantes) hace este análisis pero típicamente sin firma de abogado especializado. Cuando el expediente llega a Cabildo, el síndico procurador exige opinión jurídica formal. Sin ella, el expediente se difiere.

**Schema requerido:**

```typescript
tenant.estudio_juridico = {
  abogado_firmante: {
    nombre: string,
    cedula_profesional: string,
    especialidad: string
  },
  fecha_dictamen: date,
  reglamento_vigente_analizado: {
    nombre: string,
    fecha_publicacion: date,
    ultima_reforma: date | null,
    articulos_clave_revisados: number[]
  },
  brechas_identificadas: [
    {
      articulo_faltante_o_insuficiente: string,
      ley_federal_referencia: string,  // LGPGIR Art X
      riesgo_si_no_se_reforma: string,
      propuesta_redaccion: string,
      precedente_municipios_que_lo_tienen: string[]
    }
  ],
  facultades_cabildo: {
    puede_aprobar_reforma_simple: boolean,
    requiere_consulta_publica: boolean,
    requiere_estudios_ambientales: boolean,
    tiempo_legal_estimado_dias: number
  },
  riesgos_juridicos: string[]
}
```

**Quién lo ejecuta.** Abogado externo especializado en derecho administrativo municipal. Costo entre 40,000 y 120,000 pesos. Tiempo dos a cuatro semanas.

### 2.6 Estudio de aceptación a pago por servicio (PSP)

**Qué es.** Estudio específico que mide cuánto está dispuesta a pagar la población por un servicio de RSU mejorado. Distinto de M02B (aceptación general); este es de disposición a pago.

**Por qué es crítico.** Si el modelo de financiamiento de M11 (esquema de concesión) incluye una tarifa al usuario, esa tarifa tiene que estar respaldada por un estudio de disposición a pago. Sin él, el alcalde no puede defender la tarifa políticamente.

**Schema requerido:**

```typescript
tenant.estudio_psp = {
  metodologia: "valoracion_contingente" | "experimento_eleccion" | "encuesta_directa",
  muestra_n: number,
  estratos_socioeconomicos: string[],
  resultados: {
    dap_promedio_mxn_mensual: number,
    dap_mediana_mxn_mensual: number,
    dap_por_estrato: { [estrato: string]: number },
    porcentaje_dispuesto_a_pagar: number,
    monto_maximo_aceptable_pct_estrato_alto: number,
    monto_maximo_aceptable_pct_estrato_bajo: number
  },
  condiciones_para_pagar: string[],  // qué exige el ciudadano a cambio
  proyeccion_recaudacion_mxn_anual: number
}
```

**Quién lo ejecuta.** Consultora especializada en estudios socioeconómicos, costo entre 100,000 y 300,000 pesos.

### 2.7 Resumen de estudios de campo

| Estudio | Norma de referencia | Costo aprox MXN | Tiempo | Quién lo paga | Crítico para gate |
|---|---|---|---|---|---|
| Cuarteo y caracterización | NMX-AA-015 | 80k-250k | 2-3 sem | Municipio | G1 |
| Rutas y tiempos | Buena práctica ISWM | 30k-100k | 2-4 sem | Municipio o concesionario | G2 |
| Censo de pepenadores | GRI 408-1 + buenas prácticas | 50k-150k | 3-6 sem | Municipio | G1 |
| Auditoría infraestructura | ISO 55000 | 30k-80k | 1-2 sem | Municipio | G2 |
| Estudio jurídico | LGPGIR + códigos estatales | 40k-120k | 2-4 sem | Municipio | G1 |
| Estudio PSP | Valoración contingente | 100k-300k | 4-8 sem | Municipio | G2 |

Total para diagnóstico completo: aproximadamente 330,000 a 1,000,000 de pesos en estudios de campo del municipio cliente, todos pagados a terceros, no a Alquimia. Esto fortalece la propuesta porque Alquimia no inventa cifras, las integra de fuentes profesionales independientes.

---

## 3 · M00B Antecedentes municipales · cómo HERMES lo construye automáticamente

El schema completo de M00B ya quedó documentado en `MODULE_MATURITY_AND_PERSONALIZATION.md`. Lo que falta es el pipeline HERMES que lo puebla automáticamente desde fuentes públicas en menos de quince minutos.

### 3.1 Las doce fuentes públicas mapeadas a cada campo

| Campo del schema | Fuente pública | Método de extracción | Tiempo aproximado |
|---|---|---|---|
| Presidente municipal nombre, partido, periodo | INE Sistema Nacional de Registro de Precandidatos y Candidatos + sitio web oficial municipal | Scraping + verificación cruzada con INEGI INAFED | 30 seg |
| Composición del Cabildo | Sitio web municipal (sección Gobierno) + Periódico Oficial del Estado con la convocatoria de instalación | Scraping con fallback manual | 1-3 min |
| Comisiones permanentes | Sitio web municipal + Gaceta Municipal | Scraping de página de Reglamento Interior | 1-2 min |
| Estructura administrativa | Plataforma Nacional de Transparencia (PNT) + sitio web municipal | Consulta API PNT por RFC del municipio | 30 seg |
| Reglamento de limpia | Sitio web Periódico Oficial del Estado | Búsqueda por palabras clave "reglamento limpia" o "aseo público" + año más reciente | 2-5 min |
| Reglamento orgánico | Sitio web municipal sección Marco Normativo | Scraping + descarga PDF | 1-2 min |
| Plan Municipal de Desarrollo | Sitio web municipal o PNT | Búsqueda + descarga | 1-2 min |
| Convenios intermunicipales | DOF estatal + Gaceta Municipal | Búsqueda por palabras clave | 2-5 min |
| Concesión RSU actual | Periódico Oficial del Estado con la convocatoria histórica + prensa local | Búsqueda con año estimado | 3-8 min |
| Personal operativo del servicio | PNT + presupuesto egresos municipal | Consulta y cálculo derivado | 1-2 min |
| Flotilla vehicular | Padrón vehicular municipal (si público) + DENUE INEGI | Difícil — requiere validación manual frecuente | Variable |
| Programas previos RSU | Hemeroteca digital de prensa local 5 años atrás | Búsqueda con términos clave | 5-10 min |
| Prensa 24 meses | Google News API + agregadores de prensa local | API call con filtros | 2-3 min |
| Próximo proceso electoral | INE calendario electoral nacional + estatal | Consulta directa | 30 seg |

Tiempo total estimado del pipeline completo: entre 20 y 45 minutos según calidad de las fuentes locales. Si una fuente falla (sitio web caído, transparencia desactualizada), HERMES marca el campo como "pendiente de validación manual" y continúa con los demás.

### 3.2 Algoritmo de extracción

```typescript
async function buildAntecedentesM00B(tenant: Tenant): Promise<AntecedentesM00B> {
  const profile: AntecedentesM00B = initializeEmptyProfile(tenant);
  
  // Fase 1: fuentes oficiales del SAT y INEGI (alta confianza)
  await Promise.all([
    fetchINEGIData(tenant.inegi_clave, profile),
    fetchPNTData(tenant.municipio, profile),
    fetchINEData(tenant.municipio, tenant.estado, profile)
  ]);
  
  // Fase 2: sitio web oficial municipal (media-alta confianza)
  const siteResult = await scrapeMunicipalSite(tenant.municipio, profile);
  if (siteResult.status === 'failed') {
    profile.cabildo_composicion.requires_manual_input = true;
    profile.estructura_administrativa.requires_manual_input = true;
  }
  
  // Fase 3: Periódico Oficial del Estado (alta confianza, baja velocidad)
  await fetchPeriodicoOficial(tenant.estado, profile);
  
  // Fase 4: prensa local 24 meses (media confianza)
  await fetchLocalNewsArchive(tenant.municipio, 24, profile);
  
  // Fase 5: validación cruzada y marcado de confianza
  profile.confidence_marking = validateCrossReferences(profile);
  
  // Fase 6: identificación de campos pendientes
  profile.manual_validation_required = identifyMissingFields(profile);
  
  return profile;
}
```

### 3.3 Marcado de confianza por campo

Cada campo del M00B poblado por HERMES lleva uno de cuatro estados:

- `verified_official`: extraído de fuente oficial primaria (INEGI, INE, PNT). Marca verde sólida.
- `verified_secondary`: extraído de sitio web municipal o Periódico Oficial pero no validado cruzadamente. Marca verde con asterisco.
- `inferred`: derivado por cálculo o extrapolación. Marca amarilla, requiere validación del cliente.
- `manual_required`: no se pudo extraer automáticamente. Marca naranja con instrucción al cliente.

### 3.4 Lo que HERMES NO infiere para M00B

Por privacidad y por riesgo de error:
- Posturas políticas no declaradas públicamente de regidores específicos.
- Conflictos internos del Cabildo no documentados en prensa.
- Cifras del concesionario actual (información comercial privada).
- Datos personales identificables de funcionarios más allá del cargo público.

Estos campos siempre requieren validación humana del cliente cuando entra a la plataforma.

---

## 4 · Métricas y KPIs internacionales no utilizados

Investigación de los estándares y marcos vigentes revela ocho categorías de KPIs que la industria de RSU usa internacionalmente y que Alquimia no expone aún. Incorporarlos posiciona la plataforma frente a banca multilateral (BID, Banco Mundial, CAF), reportes ESG corporativos y benchmarking internacional.

### 4.1 Wasteaware Benchmark Indicators (Wilson et al. 2015)

Marco analítico validado en más de cincuenta ciudades en seis continentes. Dos triángulos superpuestos: componentes físicos (recolección, reciclaje, disposición) y componentes de gobernanza (inclusividad, sostenibilidad financiera, instituciones).

**Indicadores físicos:**
- **Tasa de recolección formal** (porcentaje de generación total que es recolectada por servicio formal). Hoy Alquimia muestra cobertura territorial pero no tasa de recolección formal vs informal.
- **Tasa de captura para reciclaje** (porcentaje del flujo total que se desvía a recuperación). Esto es similar a lo que M01 calcula pero el indicador Wasteaware incluye recuperación informal de pepenadores, no solo formal.
- **Tasa de disposición controlada** (porcentaje del flujo total que va a disposición sanitaria controlada vs tiraderos a cielo abierto). Crítico para SDG 11.6.1.

**Indicadores de gobernanza:**
- **Inclusividad de usuarios** (qué proporción de población urbana y peri-urbana tiene acceso al servicio, con calidad mínima aceptable).
- **Inclusividad del sector informal** (qué tan integrados están los pepenadores al sistema formal). Esto es completamente nuevo en Alquimia.
- **Sostenibilidad financiera local** (qué porcentaje de los costos del servicio se cubre con ingresos locales sostenibles, no transferencias).
- **Marco institucional local** (calidad del marco normativo, ya parcialmente cubierto por M03B).
- **Marco nacional aplicable** (calidad del marco federal y estatal aplicable al municipio, contexto que la plataforma no expone).

**Schema propuesto para nuevo módulo o ampliación de M01:**

```typescript
tenant.wasteaware_indicators = {
  fecha_evaluacion: date,
  fisicos: {
    tasa_recoleccion_formal_pct: number,
    tasa_captura_reciclaje_pct: number,
    tasa_disposicion_controlada_pct: number,
    calidad_recoleccion_score: number,  // 0-100 según rubrica Wasteaware
    calidad_reciclaje_score: number,
    calidad_disposicion_score: number
  },
  gobernanza: {
    inclusividad_usuarios_score: number,
    inclusividad_sector_informal_score: number,
    sostenibilidad_financiera_score: number,
    marco_institucional_local_score: number,
    marco_nacional_aplicable_score: number
  },
  performance_global_score: number,  // promedio ponderado
  benchmark_vs_ciudades_comparables: {
    score_propio: number,
    score_promedio_comparables: number,
    score_top_10pct: number
  }
}
```

### 4.2 SDG 11.6.1 — Indicador oficial de Naciones Unidas

Indicador 11.6.1 del SDG 11 (Ciudades Sostenibles): "Proporción de residuos sólidos municipales recolectados y manejados en instalaciones controladas respecto al total de residuos generados, por ciudades."

Tiene cuatro sub-indicadores: uno Nivel I (la métrica principal), uno Nivel II (cobertura de recolección), dos Nivel III (calidad de la disposición).

**Por qué incorporarlo.** Es el indicador oficial de la ONU. Reportes ESG corporativos y solicitudes de financiamiento a banca multilateral piden este indicador específico. Sin él, Alquimia no es elegible para apalancar fondos verdes del BID, CAF o Banco Mundial.

**Está parcialmente cubierto** por M01 con tasa de captura pero no con el formato exacto SDG.

### 4.3 What a Waste 3.0 — Banco Mundial (2024)

La tercera edición del estudio insignia del Banco Mundial sobre RSU global, con datos de 217 países y 262 ciudades, publicada en 2024. Cubre generación, composición, recolección, tratamiento, disposición, legislación, arreglos institucionales, gestión de plásticos, participación del sector privado, empleo, impactos ambientales, costos y financiamiento.

**Por qué incorporarlo.** Es la base de datos de referencia más completa del mundo. Cualquier propuesta de Alquimia a una banca multilateral o a una fundación internacional cita What a Waste 3.0 como benchmark.

**Lo que Alquimia debe exponer.** Comparativo del municipio cliente contra:
- Promedios para su categoría de ingreso (Latinoamérica clase media-alta).
- Ciudades comparables específicas del dataset (Lima, Bogotá, Curitiba, São Paulo, ciudades mexicanas con datos en el reporte).
- Tendencias regionales y mundiales.

### 4.4 UN-Habitat Waste Wise Cities Tool

Herramienta operativa de UN-Habitat para que ciudades midan su desempeño en RSU usando un cuestionario estandarizado de 22 preguntas. Datos comparables internacionalmente. Recomendado por SDG para ciudades sin datos confiables propios.

**Por qué incorporarlo.** Para clientes que quieren reportar a UN-Habitat o aspirar a programas de "ciudad sostenible" patrocinados por la ONU.

### 4.5 Indicadores de salud financiera municipal

Más allá de las cifras de M09 (CAPEX y OPEX) y M13 (escenarios financieros), faltan los indicadores formales de salud financiera municipal que las calificadoras crediticias (Fitch, Moody's, HR Ratings, Standard & Poor's) usan para evaluar capacidad de pago de un municipio.

**Por qué incorporarlo.** Si Alquimia se posiciona como sistema operativo de gestión municipal, la salud financiera del cliente es contexto crítico. Un municipio AAA mx puede asumir compromisos de gasto que un municipio BBB no puede sostener.

**Indicadores a incorporar:**

```typescript
tenant.salud_financiera_municipal = {
  calificacion_crediticia: {
    fitch: string | null,
    moodys: string | null,
    hr_ratings: string | null,
    sp: string | null,
    fecha_ultima_calificacion: date
  },
  indicadores_clave: {
    autonomia_financiera_pct: number,  // ingresos propios / ingresos totales
    saldo_operativo_pct: number,        // (ingresos operativos - gastos operativos) / ingresos
    razon_servicio_deuda: number,       // servicio de deuda / ingresos disponibles
    deuda_total_vs_ingresos_pct: number,
    inversion_publica_per_capita: number,
    recaudacion_predial_efectividad_pct: number  // recaudado / facturado
  },
  participaciones_federales_vs_ingresos_pct: number,
  prospectiva_pago: "fuerte" | "buena" | "moderada" | "débil"
}
```

Esto se construye desde el Sistema de Recursos Federales Transferidos (SRFT) de SHCP, la cuenta pública municipal del año fiscal anterior, y las calificaciones publicadas por las agencias.

### 4.6 Indicadores GRI faltantes de tu carpeta

Revisando los GRI que tienes pero no estás usando en ningún módulo:

**GRI 302 Energía (2016)**
- 302-1: Consumo energético dentro de la organización. Aplica a: M01 (biogás como energía recuperable del relleno), M08 (consumo de combustible flotilla).
- 302-4: Reducción del consumo energético. Aplica a M17 cuando se documenta optimización.

**GRI 303 Agua y efluentes (2018)**
- 303-2: Gestión de impactos relacionados con vertidos de agua. Aplica a M06 (lixiviados de centros de acopio) y M01 (manejo de aguas en relleno sanitario).

**GRI 402 Relaciones trabajador-empresa (2016)**
- 402-1: Plazos mínimos de aviso sobre cambios operacionales. Aplica a M07 (organigrama, derechos de pepenadores).

**GRI 406 No discriminación (2016)**
- 406-1: Incidentes de discriminación y acciones correctivas. Aplica a M07 (política de no discriminación en contratación).

**GRI 101 Biodiversidad (2024)**
- Versión nueva publicada en 2024. Aplica a M01 (impacto del relleno sanitario en ecosistemas aledaños).

**GRI 207 Fiscalidad (2019)**
- 207-1: Enfoque fiscal. Aplica a M11 (estructura fiscal de la concesión).

### 4.7 Indicadores ESG comparables a corporativos

Los reportes ESG corporativos serios (los que demanda CSRD) usan un set específico de métricas que el sector público mexicano todavía no expone sistemáticamente. Si Alquimia las incluye, posiciona a sus clientes como pioneros.

- Intensidad de carbono por servicio entregado (kgCO2e/tonelada gestionada).
- Costo de evitación de emisiones (MXN/tCO2e evitadas). Indicador clave para programas de bonos verdes.
- Empleo verde generado (FTE en actividades de economía circular).
- Tasa de circularidad de materiales (porcentaje de materiales que regresan a la economía).
- Brecha de género en empleos del sector (porcentaje de mujeres en posiciones operativas, técnicas, directivas).
- Inversión social per cápita en programas relacionados al servicio.

### 4.8 Indicadores políticos-comerciales propios de Alquimia

Estos son métricas que solo Alquimia puede generar porque tiene datos cross-tenant. Diferencian al producto de cualquier consultora.

- **Probabilidad de éxito del gate G1** según perfil del municipio y configuración de módulos. Generado por NOUS (capa 2 de aprendizaje).
- **Tiempo proyectado a Cabildo** según composición política y calendario electoral.
- **Score de riesgo de cambio administrativo** según meses hasta próxima elección.
- **Brecha de la propuesta vs benchmarks regionales** según municipios comparables anonimizados.
- **Predicción de costo evitado a tres años** con intervalo de confianza calibrado por experiencia real (capa 3 de aprendizaje de NOUS).

---

## 5 · Lista priorizada de KPIs a incorporar

Tres oleadas según urgencia:

### 5.1 Oleada uno · Imprescindibles para defensibilidad (semanas 1-4 del próximo sprint)

- SDG 11.6.1 oficial (necesario para banca multilateral).
- Wasteaware ISWM indicators físicos y de gobernanza (validado internacionalmente).
- GRI 302-1 energía (cubre biogás y combustible).
- GRI 303-2 agua (lixiviados).
- Indicador de inclusión del sector informal (pepenadores).

### 5.2 Oleada dos · Diferenciación frente a consultoría tradicional (mes 2-3)

- Salud financiera municipal (calificaciones crediticias + indicadores propios).
- What a Waste 3.0 benchmarking (comparación internacional automática).
- Intensidad de carbono por servicio.
- Costo de evitación de emisiones.
- GRI 101 Biodiversidad versión 2024.

### 5.3 Oleada tres · Ventaja competitiva avanzada (mes 4-6)

- KPIs cross-tenant de NOUS (probabilidad de gate, tiempo a Cabildo, etc.).
- Waste Wise Cities Tool de UN-Habitat completo.
- Empleo verde y métricas de género.
- Tasa de circularidad de materiales.
- GRI 207 Fiscalidad de la concesión.

---

## 6 · Criterios binarios de cierre

Esta capa está cerrada cuando:

1. Schemas de los seis estudios de campo formalizados en `MODULE_MATURITY_AND_PERSONALIZATION.md` o en archivo dedicado.
2. Pipeline HERMES de M00B documentado paso a paso y construible.
3. Lista de doce fuentes públicas con su método de extracción específico.
4. KPIs de oleada uno integrados al `capability_registry.json` como módulos o submódulos activables.
5. Cada KPI nuevo lleva su estándar internacional declarado en `standards_map.json`.
6. AUDITOR verifica que ningún KPI nuevo contradice los estándares ya declarados.
7. Founder firma la priorización de las tres oleadas y el cronograma de implementación.

---

## 7 · Documentos relacionados

- `MODULE_MATURITY_AND_PERSONALIZATION.md` — schemas de personalización por módulo
- `AUTOMATION_AND_PERSONALIZATION_LAYER.md` — pipelines de HERMES
- `LEARNING_AND_FEEDBACK_LAYER.md` — KPIs cross-tenant de NOUS
- `BILLING_CONTRACTS_LIFECYCLE.md` — qué se cobra por estudios de campo
- `standards_map.json` — donde se incorporan los estándares nuevos
- `capability_registry.json` — donde se activan los KPIs nuevos

---

*FIELD STUDIES AND MISSING KPIs · Alquimia · 28 mayo 2026*
