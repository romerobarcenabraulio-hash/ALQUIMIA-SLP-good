# MODULES OPERATIONAL SPECS · Validación · Especificación máxima para reconstrucción

**Estado:** Spec operativo para PM · No es documento conceptual
**Fecha:** 30 mayo 2026
**Filosofía aplicada:** Cero invención. Solo investigado, calculado justificable, o aportado por cliente.
**Uso:** El PM construye módulo por módulo según este spec. Cero ambigüedad sobre qué va dónde.

---

## Patrones comunes que se repiten en todos los módulos

Antes de ir módulo por módulo, los patrones que se repiten. Construirlos una vez como componentes reutilizables ahorra trabajo en cada módulo.

### Patrón A · Header de módulo

```
┌──────────────────────────────────────────────────────────────────┐
│ [Título humano del módulo]                                       │
│ [Subtítulo descriptivo · MXX]                                    │
│ ─────────────────────────────────────────────────────────────    │
│ Progreso del módulo: [X de Y secciones completas]   [Estado]     │
└──────────────────────────────────────────────────────────────────┘
```

Tipografía: serif para H1 del título, sans-serif para subtítulo, tamaño 32px/14px.
Color: texto primario para H1, texto terciario para subtítulo.
Border-bottom: 1px subtle.
Estado a la derecha: 🔒 Bloqueado · ▶ En progreso · ✓ Completo · ⚠ Atención requerida.

### Patrón B · Sección dentro de módulo

```
┌──────────────────────────────────────────────────────────────────┐
│ Sección N · [Nombre de la sección]                          (1)  │
│ [Descripción breve de qué establece esta sección]                │
│                                                                  │
│ Campos obligatorios:                                             │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ [Campo 1: valor] [Sello de origen]                         │   │
│ │ [Campo 2: valor] [Sello de origen]                         │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Campos complementarios (opcionales):                             │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ [Campo A: vacío con instrucción de upload]                 │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ [Gráfica si aplica, solo si hay datos]                           │
│                                                                  │
│ Citas activas en esta sección: ¹ ² ³                            │
└──────────────────────────────────────────────────────────────────┘
```

(1) Número de sección + total: "(1 de 3)"

### Patrón C · DataPoint visible

```
┌──────────────────────────────┐
│ Generación per cápita        │
│ 0.85 kg/hab/día              │
│ [Sello de origen]            │
└──────────────────────────────┘
```

Los cuatro sellos posibles:

- 🟢 **Investigado** · INEGI / SEMARNAT / etc. Hover muestra cita completa.
- 🟡 **Calculado** · Hover muestra fórmula + fuentes que alimentan.
- 🔵 **De tu documento** · [nombre del documento]. Hover muestra cita literal + página.
- ⚪ **Pendiente** · [instrucción explícita de qué se requiere para llenar].

### Patrón D · Sección de upload por módulo

```
┌──────────────────────────────────────────────────────────────────┐
│ Documentos pendientes para completar este módulo                 │
│ ──────────────────────────────────────────────────────────────   │
│                                                                  │
│ Identificamos que existen estos documentos institucionales para  │
│ tu municipio. Súbelos para enriquecer el análisis.               │
│                                                                  │
│ ▢ Reglamento de Limpia vigente   [Subir]  [No aplica]            │
│ ▢ Plan Municipal de Desarrollo   [Subir]  [No aplica]            │
│ ▢ Manual de organización         [Subir]  [No aplica]            │
│                                                                  │
│ También puedes enviarlos por email a documentos@[dominio]        │
└──────────────────────────────────────────────────────────────────┘
```

### Patrón E · Citas al pie de cada sección

```
─────────────────────────────────────────────────────────────────
¹ INEGI, Censo de Población y Vivienda 2020, Datos por municipio,
  San Luis Potosí (Aguascalientes: INEGI, 2021),
  https://www.inegi.org.mx/programas/ccpv/2020/,
  consultado el [fecha].
² Gobierno del Estado de San Luis Potosí, "Reglamento de Limpia
  del Municipio de San Luis Potosí," Periódico Oficial del Estado,
  Edición Extraordinaria, 15 de marzo de 2018.
─────────────────────────────────────────────────────────────────
```

### Patrón F · Footer de módulo con transición

```
┌──────────────────────────────────────────────────────────────────┐
│ Criterio de completitud:                                         │
│ ✓ Sección 1 · Datos básicos                                      │
│ ✓ Sección 2 · Composición política                               │
│ ⚠ Sección 3 · Estructura administrativa (faltan 2 obligatorios)  │
│ ◯ Sección 4 · Marco normativo                                    │
│                                                                  │
│ [Botón: Marcar módulo completo · disabled hasta cumplir]         │
│                                                                  │
│ Al completar este módulo se desbloquea: [Siguiente Módulo]       │
└──────────────────────────────────────────────────────────────────┘
```

---

## M00 · Cómo leer este diagnóstico

**Título humano:** Cómo leer este diagnóstico
**Subtítulo:** Guía de navegación · M00
**Posición en sidebar:** 1 de 10
**Desbloqueo:** Siempre disponible al primer login.

### Estructura interna del módulo

**Sección 1 · La filosofía Alquimia.**
Bloque de texto institucional. Cero campos.

> Alquimia opera bajo un principio inamovible: cero invención. Cada cifra que aparece en tu diagnóstico es justificable con bibliografía. Hay tres orígenes válidos: investigada de fuentes oficiales como INEGI o SEMARNAT, calculada con metodología transparente que combina fuentes citables, o aportada por ti mediante documentos institucionales de tu municipio.

**Sección 2 · Los cuatro sellos visibles.**
Tabla pedagógica con un ejemplo de cada sello.

| Sello | Significado | Ejemplo |
|---|---|---|
| 🟢 Investigado | Dato de fuente externa con cita verificable | "Población 824,229 · INEGI 2020" |
| 🟡 Calculado | Derivado con fórmula transparente de fuentes citables | "Generación 696 ton/día · población × benchmark BM 2024" |
| 🔵 De tu documento | Extraído del documento que tu equipo subió | "Frecuencia 3x/semana · Reglamento art. 14, p.8" |
| ⚪ Pendiente | Campo vacío esperando documento o validación | "Falta: estudio de cuarteo NMX-AA-015-1985" |

**Sección 3 · Cómo se desbloquean los módulos.**
Diagrama estático simple (SVG embedded, NO dinámico):

```
M00 → M00B → M01 → M02 → M03 → M03B → M04 → M13 → M14 → M15
 ✓     ←    Cada módulo se desbloquea al completar el anterior    
```

Texto acompañante:
> Avanzas módulo por módulo. Cada uno tiene campos obligatorios (mínimos para progresar) y complementarios (mejoran calidad pero no bloquean). Cuando completas los obligatorios, el siguiente módulo se desbloquea automáticamente.

**Sección 4 · Cómo aportar tu información.**
Texto explicativo:
> Hay dos formas de aportar información a tu diagnóstico. Subir documentos directamente desde cada módulo, o enviarlos por email a documentos@[dominio]. ARCHIVO los procesa automáticamente: extrae el texto, identifica cifras citables, y las integra al módulo correspondiente con su sello "De tu documento."

**Sección 5 · Cómo exportar tu diagnóstico.**
Texto explicativo:
> En cualquier momento puedes descargar tu diagnóstico en estado actual. Recibes un ZIP encriptado con todos los módulos compilados en PDF. La contraseña llega por email separado. Tres exportaciones por mes mientras el diagnóstico está en construcción. Sin límite después de firmar contrato.

### Gráficas en este módulo
Cero gráficas con datos. Solo el diagrama de flujo entre módulos (SVG estático).

### Citas en este módulo
Cero citas, no hay datos del municipio.

### Criterio de completitud
Click en botón único: "He leído la guía, continuar."

### Transición al siguiente
M00B se desbloquea. Banner: "M00 completado. M00B Antecedentes ya está disponible."

---

## M00B · Antecedentes del municipio

**Título humano:** Antecedentes del municipio
**Subtítulo:** Contexto institucional · M00B
**Posición:** 2 de 10
**Desbloqueo:** Tras completar M00.

### Estructura interna · 6 secciones

**Sección 1 · Datos básicos del municipio.** (Obligatoria)

Campos obligatorios:
- Nombre del municipio (texto)
- Estado (dropdown)
- Clave INEGI (lookup automático según municipio)
- Población actual (número, kg/hab)
- Superficie en km²
- Número de localidades (número)

Origen permitido: 🟢 Investigado de INEGI Censo 2020 con cita ¹.

Gráfica: ninguna. Es bloque de datos.

**Sección 2 · Composición política del Cabildo.** (Obligatoria)

Campos obligatorios:
- Nombre del Presidente Municipal
- Partido del Presidente
- Periodo de gobierno (formato: AAAA-AAAA)
- Lista de regidores (tabla: nombre, partido, comisión asignada)
- Comisiones permanentes relacionadas con RSU

Origen permitido: 🔵 De tu documento (Acta de instalación del Ayuntamiento) o 🟢 Investigado de INE/Periódico Oficial.

Gráfica: tabla del Cabildo con badges de partido por color. Cuando hay 5+ regidores, mostrar mini-gráfica de barras de composición política.

Cita aplicable: ² Acta de instalación del Ayuntamiento publicada en Periódico Oficial del Estado.

**Sección 3 · Estructura administrativa.** (Obligatoria)

Campos obligatorios:
- Dirección/Secretaría responsable de RSU (nombre exacto)
- Director actual (nombre + cargo)
- Número de personal operativo (número)
- Número de turnos diarios
- Áreas dependientes (lista)

Origen permitido: 🔵 De tu documento (Manual de organización) o aportado manualmente por usuario validado por founder.

Gráfica: organigrama simple si el cliente sube manual de organización. Si no se sube, mostrar tabla básica.

**Sección 4 · Marco normativo vigente.** (Obligatoria)

Campos obligatorios:
- Reglamento de limpia o aseo público vigente (título + fecha de publicación + última reforma)
- Plan Municipal de Desarrollo (periodo cubierto + fecha de publicación)

Campos complementarios:
- Bando de policía y buen gobierno
- Reglamento orgánico del Ayuntamiento
- Convenios intermunicipales relacionados

Origen permitido: 🔵 De tu documento exclusivamente. Estos son documentos institucionales del municipio.

Gráfica: línea del tiempo simple de reformas si hay múltiples reformas registradas.

Cita aplicable: ³ Reglamento de Limpia vigente. ⁴ Plan Municipal de Desarrollo.

**Sección 5 · Servicio operativo actual.** (Obligatoria)

Campos obligatorios:
- Modalidad del servicio (dropdown: público directo / concesión total / concesión parcial / mixto)
- Si hay concesión: nombre del concesionario, fecha de inicio, vigencia, fecha de término
- Cobertura territorial estimada (porcentaje, dato del cliente)
- Frecuencia de recolección por zona

Origen permitido: 🔵 De tu documento (Título de concesión si aplica + reportes operativos).

Gráfica: mapa simple de cobertura si el cliente sube datos geográficos.

Cita aplicable: ⁵ Título de concesión si aplica.

**Sección 6 · Programas previos y posicionamiento mediático.** (Opcional)

Campos complementarios:
- Programas anteriores de RSU implementados (lista con resultados)
- Cobertura de prensa últimos 24 meses (notas relevantes)
- Posicionamientos políticos públicos del Presidente Municipal sobre RSU

Origen permitido: 🔵 De documentos o 🟢 Investigado por Perplexity con citas verificables.

Gráfica: línea del tiempo de programas previos si hay 3+ registros.

### Criterio de completitud
Secciones 1-5 completas (cada una con sus obligatorios cumplidos). Sección 6 es opcional. Sistema marca módulo como "Completo."

### Transición al siguiente
M01 se desbloquea. Banner: "M00B completado. M01 Diagnóstico de residuos sólidos ya está disponible."

### Citas posibles en este módulo
¹ INEGI Censo 2020. ² Acta de instalación del Ayuntamiento. ³ Reglamento vigente. ⁴ Plan Municipal de Desarrollo. ⁵ Título de concesión si aplica.

---

## M01 · Diagnóstico de residuos sólidos

**Título humano:** Diagnóstico de residuos sólidos
**Subtítulo:** Línea base · M01
**Posición:** 3 de 10
**Desbloqueo:** Tras completar M00B.

### Estructura interna · 4 secciones

**Sección 1 · Generación de RSU.** (Obligatoria)

Campos obligatorios:
- Generación total diaria (toneladas/día)
- Generación per cápita (kg/hab/día)
- Variación estacional (si datos lo permiten)
- Fuente principal del dato

Origen permitido:
- 🔵 De tu documento (estudio de cuarteo NMX-AA-015-1985 que el cliente sube), o
- 🟡 Calculado a partir de población INEGI × generación per cápita benchmark Banco Mundial What a Waste 3.0 para municipios de tamaño X.

Si solo hay cálculo y no documento, mostrar instrucción: "Para validar esta cifra con datos reales de tu municipio, sube estudio de cuarteo NMX-AA-015-1985. Costo de mercado: $80,000-250,000 MXN, lo gestiona laboratorio certificado."

Gráfica: tarjeta de cifra grande con sello 🟡 Calculado o 🔵 De tu documento.

Citas: ¹ INEGI Censo 2020 para población. ² Banco Mundial, What a Waste 3.0 (2024).

**Sección 2 · Composición de los residuos.** (Obligatoria)

Campos obligatorios (porcentajes que sumen 100%):
- Orgánicos
- Papel y cartón
- Plásticos
- Vidrio
- Metales
- Otros valorizables
- No valorizables

Origen permitido:
- 🔵 De tu documento (estudio de cuarteo, misma fuente que Sección 1), o
- 🟡 Calculado con benchmarks Banco Mundial / SEDESOL para municipios comparables.

Gráfica permitida: gráfica de pastel o donut con las fracciones, colores institucionales (sage para orgánicos, azul para reciclables, rojizo para no valorizables). Solo se renderiza si hay datos. Sin datos, placeholder con instrucción.

Citas: misma ² para Banco Mundial.

**Sección 3 · Recolección actual.** (Obligatoria)

Campos obligatorios:
- Tipo de servicio (público directo / concesión / mixto · heredado de M00B sección 5)
- Cobertura territorial (porcentaje de la población atendida)
- Número total de vehículos de recolección
- Capacidad agregada de la flota (toneladas)
- Rutas activas (número)
- Frecuencia promedio por colonia (días/semana)

Campos complementarios:
- Antigüedad promedio de los vehículos
- Estado de mantenimiento (bueno/regular/crítico)

Origen permitido: 🔵 De tu documento (reportes operativos del concesionario o de la Dirección).

Gráfica permitida: tabla simple con vehículos y rutas. Mapa de cobertura solo si el cliente sube datos geográficos.

Citas: ³ Reportes operativos del servicio.

**Sección 4 · Disposición final.** (Obligatoria)

Campos obligatorios:
- Sitio de disposición final actual (nombre)
- Ubicación (georeferencia)
- Tipo de sitio (relleno sanitario, sitio controlado, tiradero a cielo abierto)
- Vida útil remanente (años)
- Cumplimiento de NOM-083-SEMARNAT-2003 (sí/no/parcial)
- Fecha de operación y autorización

Origen permitido: 🔵 De tu documento (título de operación del relleno sanitario, manifestación de impacto ambiental).

Gráfica permitida: tarjeta de KPI mostrando vida útil remanente con código de color (verde >5 años, amarillo 2-5, rojo <2).

Citas: ⁴ NOM-083-SEMARNAT-2003. ⁵ Título de operación del relleno.

### Criterio de completitud
Las cuatro secciones con sus obligatorios cumplidos.

### Transición al siguiente
M02 se desbloquea.

### Gráficas máximas en el módulo
1. Tarjeta de generación per cápita
2. Donut de composición
3. Tabla de recolección
4. Tarjeta de vida útil del sitio

Todas se renderizan solo si hay datos. Sin datos, placeholders honestos.

---

## M02 · Mapa social y de decisión

**Título humano:** Mapa social y de decisión
**Subtítulo:** Actores, autoridad, ciudadanía · M02
**Posición:** 4 de 10
**Desbloqueo:** Tras completar M01.

### Estructura interna · 3 secciones

**Sección 1 · Actores institucionales.** (Obligatoria)

Campos obligatorios:
- Cabildo (heredado de M00B)
- Direcciones municipales relevantes (con sus titulares)
- Autoridades estatales relevantes (SEDARH, SEMARNAT delegación estatal, etc.)
- Autoridades federales con jurisdicción (PROFEPA, SEMARNAT)

Origen permitido: 🔵 De tu documento (organigrama municipal, directorios oficiales).

**Sección 2 · Sociedad civil y organizaciones.** (Obligatoria con tolerancia)

Campos:
- Organizaciones civiles registradas relacionadas con ambiente o RSU
- Asociaciones vecinales activas
- Universidades locales con investigación en sostenibilidad

Origen permitido: 🟢 Investigado vía INDESOL, padrón estatal de OSC, o 🔵 Aportado por el cliente.

Gráfica permitida: matriz Mendelow (poder × interés) cuando hay 5+ actores identificados. Cada actor un punto con etiqueta.

Citas: ⁶ INDESOL padrón. ⁷ Registro estatal de OSC.

**Sección 3 · Sector privado.** (Complementaria)

Campos opcionales:
- Cámaras empresariales locales (CANACO, COPARMEX, sectorial RSU)
- Concesionarios actuales y prospectivos
- Recicladoras formales locales
- Generadores grandes (centros comerciales, parques industriales)

Origen permitido: 🟢 Investigado vía DENUE INEGI, cámaras locales, o 🔵 Aportado.

### Criterio de completitud
Secciones 1 y 2 con obligatorios. Sección 3 opcional.

### Transición al siguiente
M03 se desbloquea.

### Gráficas máximas
1. Matriz Mendelow (si hay 5+ actores)
2. Tabla de actores por categoría

---

## M03 · Capacidad institucional

**Título humano:** Capacidad institucional
**Subtítulo:** Marco normativo y cobertura · M03
**Posición:** 5 de 10
**Desbloqueo:** Tras completar M02.

### Estructura interna · 3 secciones

**Sección 1 · Marco normativo aplicable.** (Obligatoria)

Campos obligatorios:
- LGPGIR (Ley General para la Prevención y Gestión Integral de los Residuos) artículos clave aplicables
- Ley estatal de gestión de residuos (si existe)
- Reglamento municipal vigente (heredado de M00B)
- NOMs aplicables (NOM-083, NOM-098, NOM-161)
- NMXs aplicables (NMX-AA-015, NMX-AA-019, NMX-AA-022, NMX-AA-061, NMX-AA-091)

Origen permitido: 🟢 Investigado de DOF y Periódicos Oficiales.

Gráfica permitida: pirámide de jerarquía normativa (Constitución → Ley federal → Ley estatal → Reglamento municipal → Bando), SVG estático con bullets de qué cae en cada nivel para este municipio.

Citas: ⁸ LGPGIR. ⁹ Ley estatal aplicable. ¹⁰ NOMs aplicables.

**Sección 2 · Capacidad operativa actual.** (Obligatoria)

Campos obligatorios:
- Presupuesto anual de Servicios Públicos (heredado o aportado)
- Porcentaje destinado a RSU
- Costo unitario actual del servicio (MXN por tonelada manejada)
- Personal operativo y administrativo (heredado de M00B sección 3)

Origen permitido: 🔵 De tu documento (Presupuesto de Egresos del Municipio, Cuenta Pública).

**Sección 3 · Capacidad fiscal y financiera.** (Obligatoria)

Campos obligatorios:
- Ingresos propios del municipio (último ejercicio fiscal)
- Participaciones federales (Ramo 28)
- Aportaciones federales (Ramo 33, FAIS, FORTAMUN)
- Calificación crediticia vigente si existe (Moody's/Fitch/HR Ratings/S&P)

Origen permitido: 🔵 De tu documento (Cuenta Pública) o 🟢 Investigado de ASF/INAFED.

Gráfica permitida: gráfica de barras horizontal mostrando origen de ingresos del municipio. Tarjeta con calificación crediticia si aplica.

Citas: ¹¹ Cuenta Pública del Municipio. ¹² Reporte de calificadora si aplica.

### Criterio de completitud
Las tres secciones completas.

### Transición al siguiente
M03B se desbloquea.

---

## M03B · Reforma reglamentaria propuesta

**Título humano:** Reforma reglamentaria propuesta
**Subtítulo:** Tres artículos faltantes · M03B
**Posición:** 6 de 10
**Desbloqueo:** Tras completar M03.

### Estructura interna · 2 secciones (Propuesta + Justificación)

**Sección 1 · Propuesta de reforma.** (Obligatoria)

Campos obligatorios:
- Reglamento vigente (heredado de M00B sección 4)
- Análisis de brechas del reglamento vigente (qué no contempla)
- Propuesta de adendos: artículos nuevos a incorporar
- Texto exacto propuesto para cada adendo

Origen permitido: análisis legal generado a partir del reglamento vigente + comparativo con reglamentos modelo (CDMX, Querétaro, Mérida) + Ley estatal.

Gráfica permitida: tabla comparativa "Artículo en vigente | Artículo en propuesta | Brecha que cierra."

**Sección 2 · Justificación técnica de los adendos.** (Obligatoria · sub-sección debajo de Sección 1)

Esta es la sub-sección que se restituye según SPRINT_POST_AUTH Bloque 3.

Para cada adendo propuesto:
- Brecha legal específica que cierra (referencia a LGPGIR o ley estatal)
- Precedente en otros municipios mexicanos
- Riesgo si no se reforma (cuantificable cuando posible)
- Implicación presupuestal de implementación

Origen: análisis técnico-legal que combina marco normativo investigado con datos del municipio aportados.

Gráfica permitida: cero gráficas. Es bloque de texto justificativo con citas.

Citas: ⁸ LGPGIR (heredada). ¹³ Reglamentos modelo de municipios comparables.

### Criterio de completitud
Ambas secciones completas. Mínimo 3 adendos propuestos con justificación.

### Transición al siguiente
M04 se desbloquea.

---

## M04 · Costo de no actuar

**Título humano:** Costo de no actuar
**Subtítulo:** Impacto financiero acumulado · M04
**Posición:** 7 de 10
**Desbloqueo:** Tras completar M03B.

### Estructura interna · 3 secciones

**Sección 1 · Costos directos del manejo actual.** (Obligatoria)

Campos obligatorios:
- Costo anual del servicio actual de recolección
- Costo anual de disposición final
- Costos de operación de centros de transferencia si aplica

Origen permitido: 🔵 De tu documento (Presupuesto, Cuenta Pública) o 🟡 Calculado con costo unitario de M03 × toneladas de M01.

**Sección 2 · Costos indirectos del no-actuar.** (Obligatoria con tolerancia)

Campos obligatorios:
- Costo de remediación ambiental por sitio mal manejado (estimable con datos de SEMARNAT)
- Costo de salud pública por proximidad a tiraderos (estimable con OMS factores)
- Costo de emisiones de metano del sitio (calculable con IPCC AR6 factores)
- Costo de oportunidad de materiales valorizables no recuperados (mercado de materiales)

Origen permitido: 🟡 Calculado con metodología transparente. Cada fórmula visible.

Citas: ¹⁴ IPCC AR6. ¹⁵ OMS factores de externalidades de salud. ¹⁶ Mercado de materiales reciclados (CONAMAT o referencias).

**Sección 3 · Acumulado a 10 años.** (Obligatoria)

Campos obligatorios:
- Proyección lineal a 10 años con tasa de crecimiento poblacional INEGI
- Proyección con tasa de descuento SHCP
- Comparativo escenario actuar vs no actuar

Origen permitido: 🟡 Calculado con todas las fuentes anteriores integradas.

Gráfica permitida: árbol de decisión con dos ramas (actuar vs no actuar) y consecuencias cuantificadas en años 1, 3, 5, 10. SVG estático parametrizable con cifras del tenant. Línea acumulativa de costo evitado.

Citas: ¹⁷ Tasas SHCP. ¹⁸ Proyecciones poblacionales CONAPO.

### Criterio de completitud
Las tres secciones con obligatorios.

### Transición al siguiente
M13 se desbloquea (saltando M05-M12 que pertenecen a Planeación).

### Gráficas máximas
1. Tabla de costos directos
2. Tarjetas de costos indirectos calculados
3. Árbol de decisión actuar vs no actuar
4. Gráfica acumulativa a 10 años

---

## M13 · Escenarios financieros

**Título humano:** Escenarios financieros
**Subtítulo:** TIR · VPN · Monte Carlo · M13
**Posición:** 8 de 10
**Desbloqueo:** Tras completar M04.

### Estructura interna · 3 secciones (un escenario por sección)

**Sección 1 · Escenario Ambicioso.** (Obligatoria)

Campos:
- Inversión inicial (CAPEX en MXN)
- OPEX anual proyectado
- Ingresos por valorización de materiales
- Ingresos por aprovechamiento energético si aplica
- TIR proyectada
- VPN a tasa SHCP
- Periodo de recuperación

Origen permitido: 🟡 Calculado con metodología transparente. Fórmulas visibles.

Gráfica permitida: tarjetas de KPI (TIR, VPN, Payback).

**Sección 2 · Escenario Moderado.** (Obligatoria)

Mismos campos con asunciones más conservadoras.

**Sección 3 · Escenario Conservador.** (Obligatoria)

Mismos campos con asunciones mínimas garantizables.

### Gráfica integradora del módulo

Una gráfica de líneas con los tres escenarios sobrepuestos. Eje X: años (0-10). Eje Y: valor acumulado MXN. Cada línea con banda de incertidumbre (mín-máx).

Adicionalmente: gráfica de sensibilidad de un parámetro clave (precio de material valorizable, tasa de captura, costo de oportunidad de capital).

Citas: ¹⁷ Tasas SHCP. ¹⁹ Mercado de materiales referencias.

### Criterio de completitud
Los tres escenarios calculados con sus parámetros.

### Transición al siguiente
M14 se desbloquea.

---

## M14 · Riesgos del programa

**Título humano:** Riesgos del programa
**Subtítulo:** ISO 31000 · M14
**Posición:** 9 de 10
**Desbloqueo:** Tras completar M13.

### Estructura interna · 1 sección con registro estructurado

**Sección 1 · Registro de riesgos.** (Obligatoria)

Campos obligatorios: mínimo 10 riesgos identificados. Cada riesgo con:
- ID único
- Categoría (político, legal, financiero, operativo, ambiental, social)
- Descripción
- Probabilidad (1-5 según ISO 31000)
- Impacto (1-5)
- Score = Prob × Impacto
- Mitigación propuesta
- Responsable de mitigación

Origen permitido: 🟡 Análisis basado en metodología ISO 31000 + datos del municipio investigados/aportados.

Gráfica permitida: matriz visual probabilidad × impacto (cuadrícula 5x5) con cada riesgo como punto etiquetado. Color según severidad: verde (≤6), amarillo (7-14), rojo (≥15).

Citas: ²⁰ ISO 31000 Gestión del Riesgo. ²¹ PMBOK 7.

### Criterio de completitud
Mínimo 10 riesgos identificados con todos sus campos.

### Transición al siguiente
M15 se desbloquea.

---

## M15 · Borrador de expediente

**Título humano:** Borrador de expediente para Cabildo
**Subtítulo:** Documento de soporte · M15
**Posición:** 10 de 10
**Desbloqueo:** Tras completar M14 (y verificación de que M00B a M14 están completos).

### Estructura del módulo

Este módulo NO tiene captura de datos. Es compilación automática.

**Sección única · Compilado.**

El sistema genera automáticamente el borrador del expediente con:
- Portada con datos del municipio
- Resumen ejecutivo (2-3 páginas)
- Compilado de cada módulo anterior en orden M00B → M01 → ... → M14
- Bibliografía completa generada con sistema de citas
- Anexos con documentos subidos por el cliente

Gráficas embebidas: todas las gráficas válidas de los módulos anteriores se embeben en sus secciones correspondientes.

### Sello institucional al pie de cada página del PDF
> Diagnóstico en construcción · [N] de 10 módulos completos · [fecha]
> Documento elaborado con metodología Alquimia · alquimiaplatform.com/metodologia
> Cumplimiento verificado: [estándares aplicables]

### Criterio de completitud
Todos los módulos anteriores M00B a M14 deben estar completos. M15 se marca como completo automáticamente al estar generado.

### Cierre de Validación
Banner verde grande al completar M15:
> Has completado la Validación. Tu expediente está listo para revisión final con el equipo Alquimia. Súmate al cambio y avanza a Planeación.

CTAs:
- Primario: "Agendar conversación con Alquimia" → email al founder
- Secundario: "Descargar diagnóstico (ZIP)" → genera ZIP encriptado con contraseña separada

Plataformas /p y /e siguen bloqueadas hasta firma de contrato (decisión del founder en Plataforma 0).

---

## Resumen de gráficas por módulo

| Módulo | Gráficas (solo si hay datos) |
|---|---|
| M00 | Diagrama estático de flujo entre módulos |
| M00B | Tabla del Cabildo · línea del tiempo de reformas · organigrama |
| M01 | Tarjeta generación per cápita · Donut composición · Tabla recolección · KPI vida útil |
| M02 | Matriz Mendelow · Tabla de actores |
| M03 | Pirámide normativa · Barras de ingresos · Tarjeta calificación |
| M03B | Tabla comparativa de artículos |
| M04 | Tabla costos directos · Tarjetas indirectos · Árbol de decisión · Acumulado 10 años |
| M13 | Tarjetas KPI por escenario · Comparativo de tres escenarios · Sensibilidad |
| M14 | Matriz probabilidad-impacto |
| M15 | Todas las anteriores embebidas |

---

## Resumen de citas por módulo

Cada módulo lleva su numeración propia de citas que se compilan al final del PDF exportado.

Citas universales que pueden aparecer en múltiples módulos:
- INEGI Censo 2020 (población, vivienda)
- INEGI MGN (geografía)
- INEGI DENUE (unidades económicas)
- SEMARNAT Diagnóstico Básico para la Gestión Integral de los Residuos
- Banco Mundial What a Waste 3.0
- IPCC AR6 (factores de emisión)
- ISO 31000 (riesgos)
- PMBOK 7 (gestión de proyectos)
- LGPGIR (marco legal federal)
- NOM-083 (sitios de disposición)
- NMX-AA-015 (cuarteo)
- ASF (auditorías)
- CONAPO (proyecciones poblacionales)
- SHCP (tasas de descuento)

Formato Alquimia adaptado de Chicago notes-bibliography como ya documentado en INSTITUTIONAL_RIGOR_AND_VISUAL_NARRATIVE.

---

## Instrucciones para el PM al implementar

1. Construir los componentes reutilizables (Patrones A-F) primero.
2. Implementar M00 completo como prueba del patrón.
3. Implementar M00B con sus 6 secciones.
4. Continuar M01 a M15 en orden.
5. Cada módulo debe pasar verificación visual del founder antes de continuar al siguiente.
6. Cero módulo se da por terminado sin: criterio de completitud verificable + transición al siguiente + citas funcionando + gráficas renderizando solo con datos.

Tiempo estimado por módulo: 1-2 días de trabajo del PM. Total 10 módulos: 15-20 días distribuidos en Sprint 2 y Sprint 3.

---

*MODULES OPERATIONAL SPECS · Validación · Alquimia · 30 mayo 2026*
