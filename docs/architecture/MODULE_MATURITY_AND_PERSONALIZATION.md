# MÓDULOS · MADUREZ Y PERSONALIZACIÓN GRANULAR POR MUNICIPIO

**Estado:** Firmado · Aprobado como baseline de madurez Fase 0 · 27 mayo 2026
**Dependencias:** ADR-0010, PLATAFORMA_0_BACKOFFICE_SPEC
**Construye:** HERMES (datos), POLIS (UI), MARCOS (estándares), FORGE (módulos pendientes)

---

## 1 · Propósito de este documento

Este documento responde tres preguntas operativas que el founder necesita tener resueltas antes de que la arquitectura nueva entre en producción:

1. ¿En qué estado de madurez está cada módulo hoy en producción?
2. ¿Qué datos específicos del municipio cliente debe capturar cada módulo para no ser plantilla genérica?
3. ¿Qué falta construir, qué falta personalizar, y en qué orden?

La granularidad mostrada va deliberadamente hasta el detalle operativo: número de regidores por municipio, horarios de turno de recolección, comisiones del Cabildo, funciones del secretario técnico que organiza el café antes de la sesión. Esto no es exceso de detalle — es la diferencia entre Alquimia institucional y Alquimia genérica.

---

## 2 · Estados de madurez

| Estado | Descripción | Comportamiento esperado |
|---|---|---|
| **Avanzado** | Funcional en producción, con datos, sin bloqueos | Se conserva intacto durante migración |
| **Intermedio** | Funcional pero requiere personalización adicional o polish | Refinamiento durante consolidación |
| **Pañales** | Existe el ID o un esbozo pero no es vendible | Construcción priorizada bajo el ADR-0010 |
| **No construido** | No existe en código | Pendiente bajo el roadmap |

Todos los módulos deben operar en dos modos según sección 4.6 de la Hoja de Ruta:

- **Modo Carga inicial.** Muestra qué se verá cuando esté poblado con datos del municipio. Placeholders honestos del tipo "Pendiente carga de datos del municipio" con CTA al cliente.
- **Modo Operación.** Una vez cargados los datos mínimos del cliente, opera con valores reales.

---

## 3 · Plataforma 1 · Validación · Diez módulos

### M00 · Guía de lectura

**Madurez:** Intermedia. Existe en producción con texto editorial sólido.

**Personalización:** Baja. Solo varía el título y la introducción según el servicio activo.

**Schema mínimo:**
```typescript
tenant.guia = {
  servicio: "rsu" | "agua" | "energia",
  saludo_personalizado: string,  // ej. "San Luis Potosí, Capital"
}
```

**Estado deseado:** Sin cambios significativos. Conservar intacto.

---

### M00B · Antecedentes municipales

**Madurez:** Pañales. El módulo aparece en el sidebar pero el pipeline de carga automática que HERMES debe construir no existe en producción.

**Personalización:** Máxima. Todo el contenido es específico del municipio cliente.

**Schema completo:**

```typescript
tenant.antecedentes = {
  presidente_municipal: {
    nombre: string,
    partido: string,
    periodo_inicio: date,  // ej. "2024-10-01"
    periodo_fin: date,      // ej. "2027-09-30"
    es_reeleccion: boolean,
    formacion_profesional: string,
    cargo_inmediato_anterior: string,
  },
  cabildo: {
    composicion: {
      sindicos_total: number,            // típico 1-3
      regidores_mayoria_relativa: number, // típico 7-10
      regidores_representacion_proporcional: number, // típico 3-6
      regidores_total: number,            // suma
    },
    fracciones_politicas: [
      { partido: string, regidores_count: number, lidera_fraccion: string }
    ],
    sesion_ordinaria_dia: "lunes" | "martes" | "miercoles" | "jueves" | "viernes",
    sesion_ordinaria_hora: string,  // ej. "09:00"
    sesion_frecuencia: "semanal" | "quincenal",
    comisiones_permanentes: [
      {
        nombre: string,  // ej. "Comisión de Ecología y Aseo Público"
        presidente_regidor: string,
        integrantes_regidor: string[],
        secretario_tecnico: string,  // el que organiza, agenda, lleva minutas
        relevancia_para_servicio: "alta" | "media" | "baja"
      }
    ]
  },
  estructura_administrativa: {
    secretario_ayuntamiento: {
      nombre: string,
      funciones: string[],  // agenda Cabildo, custodia documentos, recibe comunicaciones
      relevancia_para_servicio: "alta"  // siempre alta — controla acceso al Cabildo
    },
    tesorero_municipal: {
      nombre: string,
      funciones: string[],  // aprueba presupuesto, ejecuta pagos, recibe ingresos
      relevancia_para_servicio: "alta"
    },
    contralor_interno: {
      nombre: string,
      funciones: string[]   // audita ejecución, certifica avances
    },
    direcciones_relevantes: [
      {
        nombre: string,  // ej. "Dirección de Servicios Públicos Municipales"
        titular: string,
        reporta_a: string,
        funciones_servicio: string[],
        presupuesto_anual: number,
        personal_total: number
      }
    ],
    personal_apoyo_decisional: [
      {
        rol: string,  // ej. "Secretario Técnico de Servicios Públicos", "Coordinador de Logística"
        nombre: string,
        funciones: string[]  // organiza reuniones, da seguimiento a acuerdos, etc.
      }
    ]
  },
  reglamento_limpia: {
    nombre_oficial: string,
    fecha_publicacion: date,
    periodico_oficial_numero: string,
    version_vigente: string,
    fecha_ultima_reforma: date | null,
    articulos_clave: [
      { articulo: number, tema: string, contenido: string }
    ],
    pdf_url: string  // archivo subido al tenant
  },
  concesion_actual: {
    tipo: "concesion" | "prestacion_directa" | "mixta",
    empresa_concesionaria: string | null,
    vigencia_inicio: date | null,
    vigencia_fin: date | null,
    alcance_servicios: string[],
    monto_pagado_anual: number | null
  },
  programas_previos_rsu: [
    {
      nombre: string,
      administracion_origen: string,
      años_operacion: string,
      resultado_documentado: string,
      por_que_no_continuo: string
    }
  ],
  prensa_24_meses: [
    { fecha: date, medio: string, titular: string, tema: string, url: string }
  ],
  proximo_proceso_electoral: {
    fecha_eleccion: date,
    tipo: "presidente_municipal" | "regidores" | "concurrente"
  }
}
```

**Ejemplo poblado para SLP capital** (datos aproximados, sujetos a verificación):

```
presidente: Enrique Galindo Ceballos (PAN)
periodo: 2024-10-01 a 2027-09-30 (reelección)
cabildo:
  síndicos: 2
  regidores mayoría relativa: 11
  regidores representación proporcional: 4
  total regidores: 15
  sesión: jueves 09:00
  comisión Ecología y Aseo Público: presidida por regidor de oposición (típico)
estructura:
  Secretario General del Ayuntamiento
  Tesorero Municipal
  Contralor Interno Municipal
  Direcciones: Servicios Públicos, Ecología y Aseo Público, Obras Públicas,
               Desarrollo Urbano, Seguridad, Hacienda, Gobierno y Reglamentos
reglamento_limpia: Reglamento de Limpia del Municipio de San Luis Potosí, vigente 2018
concesión_actual: por verificar con cliente
```

**Construye:** HERMES bajo Prompt 3 del catálogo.

---

### M01 · Diagnóstico RSU línea base

**Madurez:** Avanzada. Módulo más maduro de la plataforma. Doce KPIs operando, gráficas Recharts vivas, motor de recomendación de escenarios.

**Personalización:** Alta en cifras, baja en estructura.

**Schema:**

```typescript
tenant.diagnostico_rsu = {
  poblacion_inegi_2020: number,
  poblacion_actualizada_conapo: number,
  viviendas_total: number,
  viviendas_calle_publica: number,
  viviendas_condominio: number,
  ocupantes_promedio: number,
  generacion_per_capita_kg_dia: number,
  composicion_residuos: {
    organicos_pct: number,
    papel_pct: number,
    plastico_pct: number,
    vidrio_pct: number,
    metal_pct: number,
    no_valorizable_pct: number
  },
  destino_actual: {
    relleno_sanitario_pct: number,
    tiradero_clandestino_pct: number,
    valorizado_documentado_pct: number,
    relleno_nombre: string,  // ej. "Peñasco" en SLP
    distancia_relleno_km: number
  },
  factor_emision_relleno_kg_co2e_ton: number,
  costo_disposicion_mxn_ton: number,
  horizonte_plan_años: number,
  perfil_adopcion_activo: "ambicioso" | "moderado" | "conservador" | "pesimista"
}
```

**Estado deseado:** Conservar. Solo integrar con M19 click-to-source cuando esté listo.

---

### M02 · Mapa social y de decisión (consolidado de M02, M02B, M02C, M02D)

**Madurez:** Pañales. M02 y M02C muestran cajas vacías en producción hoy. M02B y M02D no existen como interfaces.

**Personalización:** Máxima.

**Schema:**

```typescript
tenant.mapa_social = {
  demografia: {
    densidad_poblacional_hab_km2: number,
    edad_mediana: number,
    distribucion_edades: { menores: number, jovenes: number, adultos: number, adultos_mayores: number },
    nivel_educativo: { primaria: number, secundaria: number, prepa: number, superior: number },
    pib_per_capita_estimado: number,
    indice_marginacion_conapo: string
  },
  encuesta_aceptacion: {
    fecha_aplicacion: date,
    metodo: "sms_twilio" | "presencial" | "telefonica",
    muestra_n: number,
    error_estadistico_pct: number,
    consentimiento_municipio_url: string,
    preguntas: [
      {
        id: string,
        texto: string,
        opciones: string[],
        respuestas_count: { [opcion: string]: number }
      }
    ],
    ipc_ciudadano: number,  // 0-100, índice compuesto de preparación
    desglose_por_colonia: [
      { colonia: string, ipc: number, muestra_n: number }
    ]
  },
  actores_clave: [
    {
      id: string,
      nombre: string,
      organizacion: string,
      rol_organizacional: string,
      tipo: "publico" | "privado" | "sociedad_civil" | "academia" | "prensa",
      influencia_1_5: number,
      postura_actual: "favor" | "neutro_inclinado_favor" | "neutro" | "neutro_inclinado_contra" | "contra" | "indeciso",
      contacto: {
        email: string | null,
        telefono: string | null,
        prensa_publica: boolean
      },
      eventos_24m: [
        { fecha: date, evento: string, posicion_publica: string }
      ],
      gates_donde_es_critico: ("G1" | "G2" | "G3" | "G4" | "G5")[]
    }
  ],
  matriz_autoridad: {
    decisiones_requeridas: [
      {
        decision: string,  // ej. "Aprobación de reforma reglamentaria"
        instancia_decisora: string,  // ej. "Pleno del Cabildo"
        votos_requeridos: string,  // ej. "Mayoría calificada (2/3)"
        documento_resultante: string,  // ej. "Acuerdo de Cabildo publicado en Gaceta"
        tiempo_estimado_dias: number
      }
    ],
    roles_decisores: {
      presidente_municipal: { atribuciones: string[], poder_veto: boolean },
      sindico_procurador: { atribuciones: string[], firma_concesiones: boolean },
      regidores: [
        {
          nombre: string,
          partido: string,
          comisiones: string[],
          postura_rsu: string,
          peso_decision: "alto" | "medio" | "bajo"
        }
      ],
      tesorero_municipal: { atribuciones: string[], firma_presupuesto: boolean },
      contralor_interno: { atribuciones: string[] },
      secretario_ayuntamiento: { atribuciones: string[], agenda_cabildo: boolean }
    }
  }
}
```

**Ejemplo SLP capital** (parcial):

```
actores_clave (mínimo 15):
  Públicos:
    Presidente Municipal Enrique Galindo (influencia 5, postura favor)
    Director Servicios Públicos Municipales (influencia 4, postura neutro)
    Director Ecología y Aseo Público (influencia 4, postura favor)
    Secretario del Ayuntamiento (influencia 3, postura neutro)
    Tesorero Municipal (influencia 4, decide presupuesto)
    Regidor presidente Comisión Ecología (influencia 3, postura por definir)

  Privados:
    Empresa concesionaria actual (influencia 4, postura contra cambios)
    CANACO SLP (influencia 3, postura favor circularidad)
    Cámaras de comercio (influencia 2-3, postura variable)
    Recicladoras locales — Red de Reciclajes SLP (influencia 2, postura favor)

  Sociedad civil:
    Pepenadores del relleno Peñasco (influencia 3, postura defensiva, requiere acuerdo)
    ONGs ambientales locales (influencia 2, postura favor)
    Asociaciones de colonos (influencia 2, postura variable)

  Academia:
    UASLP — Facultad de Ingeniería Ambiental (influencia 3, postura favor)
    El Colegio de San Luis (influencia 2, postura favor)

  Prensa:
    El Sol de San Luis (influencia 4, postura por definir)
    Pulso Diario (influencia 3, postura por definir)
    La Jornada SLP (influencia 3, postura crítica histórica)

matriz_autoridad:
  decisión clave: "Aprobación del programa RSU y reforma reglamentaria"
    instancia: Pleno del Cabildo
    votos: mayoría simple (8 de 15 regidores, suma síndicos)
    documento: Acuerdo de Cabildo + reforma publicada en Periódico Oficial
    tiempo estimado: 45 días desde primera sesión a publicación

  rol secretario del ayuntamiento:
    - Agenda sesiones de Cabildo (controla cuándo se discute el tema)
    - Custodia documentos oficiales
    - Recibe y registra comunicaciones formales del municipio
    - CRÍTICO para timing del proceso

  rol secretario técnico de la comisión de Ecología:
    - Organiza reuniones de la comisión
    - Lleva minutas y acuerdos preliminares
    - Coordina con técnicos del municipio
    - Tradicionalmente "lleva el café" pero también organiza la agenda real
    - SUBESTIMADO pero clave para fluidez del proceso
```

**Estándares aplicados:**
- M02 demografía: GRI 2-1, GRI 2-6
- M02 encuesta: GRI 2-29, AA1000 SES:2015, ISO 10002, GRI 418-1 (privacidad), ODS 16.7
- M02 actores: GRI 2-29, GRI 2-30, GRI 413-1, ISO 26000 §5.3
- M02 autoridad: GRI 2-12, GRI 2-13, PMI RACI

**Construye:** HERMES (carga de datos), POLIS (UI de cuatro pestañas), FORGE (lógica de matriz).

---

### M03B · Marco legal — tres artículos faltantes

**Madurez:** Avanzada. Cinco KPIs reales y cuatro cards semáforo en producción.

**Personalización:** Alta. Depende del reglamento específico del municipio.

**Schema:**

```typescript
tenant.marco_legal = {
  reglamento_actual: { ... },  // referencia a tenant.antecedentes.reglamento_limpia
  brecha_normativa: {
    obligacion_separar_residuos: {
      existe_articulo: boolean,
      articulo_actual: string | null,
      texto_propuesto: string,
      justificacion: string
    },
    sancion_mezcla_residuos: {
      existe_articulo: boolean,
      articulo_actual: string | null,
      tipo_sancion_propuesta: "administrativa" | "multa" | "ambas",
      monto_multa_uma: number,
      texto_propuesto: string
    },
    autorizacion_incentivos: {
      existe_articulo: boolean,
      articulo_actual: string | null,
      tipo_incentivo: "reduccion_predial" | "reconocimiento" | "transferencia",
      texto_propuesto: string
    }
  },
  ruta_reforma: {
    pasos: [
      { paso: string, instancia: string, tiempo_estimado_dias: number }
    ],
    tiempo_total_estimado_dias: number  // típico 45-60
  }
}
```

**Estado deseado:** Conservar. Reforzar conexión con M00B (reglamento subido).

---

### M03 · Marco institucional y cobertura (consolidado de M03, M03C, M03D)

**Madurez:** Intermedia. M03 existe básico, M03C y M03D existen como conceptos.

**Personalización:** Alta.

**Schema:**

```typescript
tenant.marco_institucional = {
  capacidad_actual: {
    personal_dedicado_servicio: number,
    personal_administrativo: number,
    personal_operativo_recoleccion: number,
    personal_operativo_disposicion: number,
    presupuesto_anual_servicio_mxn: number,
    presupuesto_pct_del_total_municipal: number,
    flotilla_vehiculos: [
      { tipo: string, marca_modelo: string, año: number, capacidad_ton: number, estado: "operativo" | "mantenimiento" | "fuera_servicio" }
    ],
    centros_acopio_existentes: [
      { id: string, ubicacion: string, capacidad_ton_dia: number, fracciones: string[] }
    ],
    rellenos_disponibles: [
      { nombre: string, ubicacion: string, distancia_km: number, capacidad_remanente_años: number }
    ]
  },
  cobertura_territorial: {
    superficie_atendida_km2: number,
    superficie_total_km2: number,
    pct_cobertura: number,
    zonas_atendidas: [
      { colonia: string, frecuencia: "diaria" | "3_dias" | "semanal", turno_recoleccion: string }
    ],
    zonas_sin_atender: [
      { colonia: string, motivo: string, poblacion_estimada: number }
    ]
  },
  alternativas_descartadas: [
    {
      alternativa: string,
      por_que_se_descartó: string,
      cuándo_se_consideraría_volver: string
    }
  ]
}
```

**Construye:** FORGE bajo coordinación de OCCAM (consolidación).

---

### M04 · Costo de la omisión + cierre lógico (consolidado de M04, M04B, M04C)

**Madurez:** Avanzada en M04 base. M04B y M04C existen como secciones que pasan a subsecciones.

**Personalización:** Alta en cifras.

**Schema:** preserva el actual de M04 + agrega bloques de M04B (empleos, alivio fiscal proxy) y M04C (plan lógico de cierre del diagnóstico) como subsecciones colapsables.

**Estado deseado:** Refactoring de presentación. Los datos no cambian.

---

### M13 · Escenarios financieros TIR/VPN/Monte Carlo

**Madurez:** Avanzada. Tres TIRs operando.

**Personalización:** Alta.

**Pendiente crítico:** bloque maestro editorial arriba de las tres TIRs que explique qué mide cada una. Sin esto, el alcalde concluye que el modelo es inconsistente. Trabajo de tres líneas para EIDOS bajo gate de POLIS.

---

### M14 · Riesgos del modelo

**Madurez:** Avanzada en producción.

**Personalización:** Media. La estructura de riesgos es genérica pero los pesos pueden personalizarse por municipio.

**Pendiente:** integración con datos reales de M02C (mapa de actores). Cuando M02C tenga datos, M14 actualiza su confianza del 45% actual al rango 70-85%.

---

### M15 · Expediente para Cabildo

**Madurez:** Intermedia. Cuatro exports funcionando, seis secciones trazadas. Falta auto-generación del PDF completo.

**Personalización:** Máxima. Cada expediente tiene el nombre del municipio, las cifras INEGI específicas, los actores reales, los artículos del reglamento local.

**Pendiente:** completar el flujo de exportación PDF integral con datos de todos los módulos. Trabajo de FORGE.

---

## 4 · Plataforma 2 · Planeación · Siete módulos

### M05 · Plan maestro y ruta crítica (consolidado de M05, M05B, M05C, M05D)

**Madurez:** Pañales. El cronograma se construye desde cero por municipio.

**Personalización:** Total.

**Schema:**

```typescript
tenant.plan_maestro = {
  fecha_inicio_planeacion: date,
  duracion_total_meses: number,
  fases: [
    {
      id: string,
      nombre: string,  // ej. "Fase 1 - Habilitación normativa"
      fecha_inicio: date,
      fecha_fin: date,
      dependencias_fases: string[],
      entregables: [
        { id: string, descripcion: string, responsable_rol: string, fecha_compromiso: date }
      ],
      hito_gate: "G1" | "G2" | "G3" | null
    }
  ],
  ruta_critica: string[],  // IDs de actividades sin holgura
  oleadas_territoriales: [
    {
      ola_numero: number,
      fecha_inicio: date,
      fecha_fin: date,
      colonias_objetivo: string[],
      poblacion_total: number,
      viviendas_total: number,
      pct_captura_objetivo: number,
      kpis_evaluacion: string[]
    }
  ]
}
```

**Construye:** FORGE.

---

### M06 · Infraestructura — centros de acopio

**Madurez:** Intermedia. AURUM y FORGE trabajando bajo Prompt 6.

**Personalización:** Alta — depende de cobertura y demografía del municipio.

**Schema:**

```typescript
tenant.infraestructura = {
  centros_acopio_planeados: [
    {
      id: string,
      nombre: string,
      lat: number, lng: number,
      area_m2: number,
      capacidad_ton_dia: number,
      fracciones_que_recibe: string[],
      inversion_capex_mxn: number,
      operador: "municipio" | "concesionario" | "tercero",
      fecha_construccion_objetivo: date
    }
  ],
  contenedores_distribuidos: {
    plastico_240L_count: number,
    metalico_1100L_count: number,
    semi_subterraneo_count: number,
    inversion_capex_total_mxn: number,
    edificios_elegibles: [
      { place_id: string, nombre: string, lat: number, lng: number, unidades_estimadas: number }
    ]
  },
  rellenos_destino_final: [
    { nombre: string, lat: number, lng: number, tonelaje_aceptable_ton_dia: number, costo_disposicion_mxn_ton: number }
  ]
}
```

**Pendiente:** integración Google Places funcional, mapa georreferenciado, reconciliación con CAPEX en M09.

---

### M07 · Organigrama y estructura de personal — Personalización máxima

**Madurez:** Pañales. No construido como módulo de pleno derecho.

**Personalización:** Total. Aquí vive el detalle operativo más granular del programa.

**Schema:**

```typescript
tenant.organigrama_servicio = {
  responsable_general: {
    rol: string,  // ej. "Director de Servicios Públicos Municipales"
    nombre: string,
    contacto: { email: string, telefono: string },
    reporta_directo_a: "presidente_municipal"
  },
  estructura_organica: [
    {
      id: string,
      rol: string,
      nivel_jerarquico: number,  // 1 = director, 2 = jefe departamento, 3 = supervisor, 4 = operativo
      reporta_a: string,
      personal_a_cargo: number,
      funciones_principales: string[],
      certificaciones_requeridas: string[],
      formacion_minima: string,
      horario_base: { dias: string[], hora_inicio: string, hora_fin: string },
      turno: "matutino" | "vespertino" | "nocturno" | "rotativo" | "administrativo"
    }
  ],
  turnos_recoleccion: [
    {
      turno: "matutino",
      horario: { inicio: string, fin: string },  // ej. "06:00" - "14:00"
      dias_operacion: string[],  // ej. ["lunes","martes","miercoles","jueves","viernes","sabado"]
      personal_operativo_count: number,
      supervisor_id: string,
      vehiculos_asignados: string[],
      zona_cobertura: string,
      vueltas_objetivo: number
    },
    {
      turno: "vespertino",
      horario: { inicio: "14:00", fin: "22:00" },
      dias_operacion: string[],
      personal_operativo_count: number,
      supervisor_id: string,
      vehiculos_asignados: string[],
      zona_cobertura: string
    },
    {
      turno: "nocturno",
      horario: { inicio: "22:00", fin: "06:00" },
      dias_operacion: string[],
      personal_operativo_count: number,
      tareas: ["limpieza_centro", "mantenimiento_flotilla", "recoleccion_emergencia"]
    }
  ],
  personal_administrativo: [
    {
      rol: string,  // ej. "Secretario Técnico de la Dirección"
      funciones: string[],  // ej. ["organizar agenda del Director", "dar seguimiento a acuerdos del Cabildo", "coordinar logística de reuniones"]
      horario: { ... },
      es_apoyo_decisional: boolean  // sí incluso el rol de "lleva el café" si es estructural
    }
  ],
  guardias_centros_acopio: [
    {
      ca_id: string,  // referencia a M06
      supervisor_id: string,
      personal_total: number,
      cobertura_horaria: { inicio: string, fin: string },
      dias_operacion: string[]
    }
  ],
  capacitacion_requerida: {
    operativos: { horas_anuales: number, temas: string[] },
    supervisores: { horas_anuales: number, temas: string[] },
    administrativos: { horas_anuales: number, temas: string[] }
  }
}
```

**Ejemplo SLP capital:**

```
responsable_general: Director de Servicios Públicos Municipales

turno_matutino: 06:00-14:00
  zona: Centro Histórico + colonias surponiente (24 colonias)
  personal: 24 operativos
  vehículos: 8 camiones recolectores
  vueltas objetivo: 2 por vehículo
  supervisor de turno: Jefe de Cuadrilla matutino

turno_vespertino: 14:00-22:00
  zona: Norte + poniente (32 colonias)
  personal: 18 operativos
  vehículos: 6 camiones
  vueltas objetivo: 2 por vehículo
  supervisor de turno: Jefe de Cuadrilla vespertino

turno_nocturno: 22:00-06:00
  personal: 12 operativos
  tareas: limpieza de centros de acopio, mantenimiento de flotilla,
          recolección de emergencia en eventos masivos
  supervisor: Encargado de Servicio Nocturno

personal_administrativo:
  - Secretario Técnico de la Dirección (organiza agenda, da seguimiento)
  - Coordinador de Logística (planifica rutas, ajusta turnos)
  - Auxiliar Administrativo (correspondencia, café para reuniones, agenda)
  - Auxiliar de Captura (datos diarios, reportes mensuales)
  - Encargado de Almacén (insumos, EPP, refacciones)
```

**Estándares aplicados:** GRI 2-9 (gobernanza), GRI 403-1 (SST), GRI 408-1 (trabajo infantil — pepenadores), ISO 45001:2018 §5.3, PMI PMBOK §9.

**Construye:** FORGE bajo coordinación con HERMES (datos del cliente).

---

### M08 · Operación piloto + comunicación (consolidado de M08, M08B)

**Madurez:** Pañales.

**Schema:**

```typescript
tenant.operacion_piloto = {
  rutas_recoleccion: [
    {
      id: string,
      ola_territorial: number,  // referencia a M05
      vehiculo_asignado: string,
      turno: string,
      waypoints: [{ lat: number, lng: number, colonia: string, tiempo_estimado: string }],
      distancia_total_km: number,
      tiempo_total_estimado_min: number,
      frecuencia_semanal: number
    }
  ],
  plan_educativo: {
    calendario_actividades: [
      { fecha: date, actividad: string, audiencia: string, presupuesto: number }
    ],
    canales: ("perifoneo" | "redes_sociales" | "talleres" | "sms" | "radio" | "casa_por_casa")[],
    presupuesto_total: number,
    indicadores_exito: string[]
  }
}
```

---

### M09 · CAPEX y OPEX

**Madurez:** Intermedia.

**Personalización:** Alta — depende de infraestructura específica del municipio.

**Pendiente:** integración con M06 (infraestructura) y M13 (escenarios financieros).

---

### M10 · Mercado de materiales y compradores

**Madurez:** Intermedia. AURUM tiene contenido.

**Personalización:** Alta — recicladoras locales varían por región.

**Schema:**

```typescript
tenant.mercado_materiales = {
  recicladoras_locales: [
    {
      empresa: string,
      contacto: { responsable: string, email: string, telefono: string, direccion: string },
      materiales_que_compra: ["plastico_pet", "plastico_hdpe", "carton", "papel", "vidrio", "aluminio", "metal_ferroso"][],
      precio_por_material_mxn_ton: { [material: string]: number },
      capacidad_mensual_ton: number,
      requiere_separacion_previa: boolean,
      tiempo_pago_dias: number
    }
  ],
  precios_referencia_nacional: { ... },
  riesgos_mercado: [...]
}
```

---

### M11 · Estructura financiera y de gobernanza (consolidado de M11, M12)

**Madurez:** No construido.

**Construye:** FORGE cuando el founder lo priorice. No es bloqueante para vender Tier Diagnóstico.

---

## 5 · Plataforma 3 · Ejecución · Seis módulos

### M16 · Inspección y enforcement

**Madurez:** Avanzado.

**Personalización:** Alta — tipos de predios elegibles varían por municipio.

---

### M17 · Monitoreo proyectado vs real

**Madurez:** Intermedia.

**Personalización:** Total — datos reales del cliente alimentan este módulo mensualmente.

**Pendiente:** flujo automático de captura de datos mensuales por parte del municipio.

---

### M18 · Doble materialidad y reporte ESG

**Madurez:** Pañales. Existe el ID pero la matriz de doble materialidad funcional no está construida.

**Crítico:** este es el módulo de mayor diferenciación frente a banca multilateral y reportes ESG corporativos.

**Schema:**

```typescript
tenant.doble_materialidad = {
  temas_evaluados: [
    {
      id: string,
      tema: string,
      impacto_organizacion_a_entorno: number,  // 0-5 según GRI 3:2021
      impacto_entorno_a_organizacion: number,  // 0-5 según CSRD ESRS 1:2023
      es_material: boolean,
      grupos_interes_consultados: string[],
      evidencia: string[]
    }
  ],
  matriz_visual_url: string,
  metodologia_documentada_url: string
}
```

**Estándares:** GRI 3:2021 §3-1, §3-2, §3-3; CSRD ESRS 1:2023; EFRAG IG 1:2023.

**Construye:** FORGE prioridad alta cuando se entre a Ejecución.

---

### M19 · Trazabilidad click-to-source

**Madurez:** Intermedia. Estructura existe, falta wire-up sistemático en todas las cifras.

---

### M20 · Control presupuestal EVM (consolidado de M20, M20B)

**Madurez:** Intermedia.

**Personalización:** Total — cada mes el cliente carga sus cifras reales.

---

### M21 · Riesgos y gates (consolidado de M21, M21B)

**Madurez:** Avanzado en M21. M21B existe como módulo separado, se fusiona como subsección.

---

## 6 · Plataforma 0 · Administración

**Madurez:** No construido en absoluto.

**Crítico:** sin esta plataforma, no se puede gestionar el portafolio bajo la nueva arquitectura.

Ver `PLATAFORMA_0_BACKOFFICE_SPEC.md` para especificación detallada.

**Construye:** KRONOS + POLIS + FORGE bajo Fase 1 del roadmap del ADR-0010.

---

## 7 · Resumen de prioridades de construcción

### Construcción prioridad 1 (sin esto la nueva arquitectura no opera)

1. Plataforma 0 Administración MVP (A1, A2, A3, A4 según spec).
2. Backend de estado del tenant con máquina de gates.
3. Frontend de routing por plataforma (/v, /p, /e).
4. Migración del piloto SLP a la nueva arquitectura.

### Construcción prioridad 2 (consolidación)

5. M02 consolidado (cuatro pestañas).
6. M05 consolidado (cuatro pestañas).
7. M08 consolidado (dos pestañas).
8. M20 y M21 consolidados.

### Construcción prioridad 3 (personalización granular)

9. Schemas de Cabildo, organigrama, turnos en Plataforma 0.
10. M00B pipeline automatizado de HERMES.
11. M07 organigrama operativo personalizable.
12. M02C mapa de actores poblado para SLP.

### Construcción prioridad 4 (módulos en pañales)

13. M18 doble materialidad funcional.
14. M11 estructura financiera consolidada.
15. M19 click-to-source completo.

### Construcción prioridad 5 (expansion revenue)

16. Capabilities adicionales activables desde Plataforma 0: WhatsApp alerts, Google Routes, conector tesorería, conector quejas ciudadanas.

---

*MÓDULOS · MADUREZ Y PERSONALIZACIÓN · Alquimia · 27 mayo 2026*

---

## 8 · Firma Fase 0

Assessment validado como baseline previo a migracion. La firma conserva los estados de madurez declarados y prohibe tratar modulos en panales o no construidos como capacidades vendibles hasta que pasen su fase correspondiente.

```
[x] Founder / Usuario soberano: aprobado por instruccion directa · 2026-05-27
[x] SUPREME architectural review: firmado · 2026-05-27
[x] KOSMOS registry consistency: compatible con 37 entradas del Capability Registry v2.0.0 · 2026-05-27
```
