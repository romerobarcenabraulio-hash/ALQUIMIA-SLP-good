# LINEAMIENTO TÉCNICO OPERATIVO RSU-01
## Sistema de separación en cinco fracciones para vivienda y condominios

**trace:** CLC-010-LINEAMIENTO-TECNICO  
**Fuente:** Sección 8 del Capítulo San Luis Potosí (pp. 36-39)  
**Emite:** Dirección de Aseo Público / Dirección de Ecología — con base en Art. 21 Bis fracción II y Art. 37 Bis párrafo final  
**Naturaleza:** Documento ejecutivo derivado. NO es artículo del reglamento. Detalla sin crear nuevas obligaciones ni sanciones.  
**Estado:** `[BORRADOR PARA REVISIÓN Y EMISIÓN OFICIAL]`

---

> **Nota CLC:** este lineamiento es el "manual de operación" que hace ejecutables los artículos del reglamento. La Dirección lo emite mediante acuerdo administrativo, no requiere aprobación de Cabildo. Puede actualizarse sin reformar el reglamento. Es aplicable en todas las ciudades sin cambios de fondo — solo se ajusta el nombre de la Dirección emisora.

---

## LT-01 — Estándar de las cinco fracciones

Cada fracción se define con precisión, incluyendo ejemplos de residuos **permitidos** y **no permitidos**. Este estándar es **único municipal** y obligatorio para todos los residenciales y edificios incorporados al sistema.

| Fracción | Qué incluye | Qué NO incluye | Color contenedor |
|---|---|---|---|
| **1 — Plásticos y polímeros** (PET, HDPE, LDPE, PP) | Botellas PET · envases de alimentos · bolsas plásticas limpias | Unicel / EPS · plásticos con residuos orgánicos adheridos | 🟡 **Amarillo** |
| **2 — Vidrio** (transparente, verde, ámbar) | Botellas · frascos | Vidrio templado · espejos · focos · cristal Pyrex | ⬜ **Blanco** |
| **3 — Metales ligeros** (aluminio, hojalata, lámina) | Latas de aluminio · latas de conserva · papel aluminio limpio | Aerosoles presurizados · baterías | 🩶 **Gris** |
| **4 — Papel y cartón** | Periódicos · revistas · cajas de cartón · papel de oficina | Papel encerado · papel térmico · papel con orgánicos · pañales | 🔵 **Azul** |
| **5 — Materia orgánica** | Restos de frutas/verduras · cáscaras de huevo · residuos de jardín · café y té | Huesos grandes · aceite de cocina · residuos de origen animal crudo | 🟢 **Verde** |

*Colores conforme a lineamientos SEMARNAT vigentes.*

---

## LT-02 — Dimensionamiento de contenedores por tamaño de hogar

Los volúmenes son **parámetros de diseño**, no medidas comerciales cerradas. El diseño físico (alto, ancho, fondo, modularidad) se definirá en diseño industrial respetando estos volúmenes mínimos.

| Fracción | Hogar chico (1-2 pers.) | Hogar mediano (3-4 pers.) | Hogar grande (5+ pers.) |
|---|---|---|---|
| Plásticos | 15 L | 25 L | 40 L |
| Vidrio | 8 L | 12 L | 18 L |
| Metales | 5 L | 8 L | 12 L |
| Papel / cartón | 15 L | 25 L | 40 L |
| Orgánicos | 10 L | 18 L | 30 L |

---

## LT-03 — Modelos de recolección A y B

### Modelo A — Centro de acopio condominial
- **Aplicación:** condominios con área disponible **≥ 15 m²** con acceso vehicular
- **Descripción:** área física dedicada con contenedores diferenciados, báscula verificada y señalización. El vehículo recolector atiende en el punto de acopio según calendario municipal.
- **Requisitos mínimos del área:** piso firme · techo o cubierta · acceso para vehículo de carga · iluminación · drenaje de lixiviados (fracción orgánica)

### Modelo B — Recolección interna programada
- **Aplicación:** condominios sin espacio suficiente para centro de acopio (< 15 m²)
- **Descripción:** el vehículo recolector entra al residencial en días y horarios asignados por fracción. La administración coordina con el concesionario.

*La asignación de modelo se realiza mediante la **Cédula de Evaluación de Idoneidad Residencial** (documento 04 del repositorio técnico).*

### Variantes para edificios verticales

| Variante | Aplicación | Descripción | Complejidad |
|---|---|---|---|
| **V1** | Edificios ≤ 5 pisos | Cuarto de acopio en planta baja. Residentes bajan residuos separados. | ● Baja |
| **V2** | Edificios ≥ 6 pisos con elevador ≥ 1,000 kg | Personal recolecta en cada piso y traslada al centro de acopio en PB vía elevador de carga. | ●● Media |
| **V3** | Proyectos nuevos con diseño especializado | Sistema de ductos (chutes) dual/múltiple por fracción. Requiere mantenimiento documentado y ventilación mecánica. | ●●● Alta |

*La asignación de variante se realiza mediante la **Cédula de Idoneidad para Edificios** (documento 05 del repositorio técnico).*

---

## LT-04 — Frecuencias mínimas de recolección

| Fracción | Frecuencia mínima | Justificación |
|---|---|---|
| **Orgánicos** | **3 veces/semana** (máx. 48 h en contenedor) | Higiene, vectores, olores — no puede acumularse más de 48 horas |
| **Plásticos** | 1 vez/semana | Volumen alto, bajo riesgo sanitario |
| **Papel / cartón** | 1 vez/semana | Proteger de humedad — deteriora el valor del material |
| **Vidrio** | 1 vez/quincenal | Bajo volumen, sin degradación temporal |
| **Metales** | 1 vez/quincenal | Bajo volumen, sin degradación temporal |

> El Municipio fija estos estándares **mínimos**. El concesionario diseña rutas operativas dentro de ellos y puede superar la frecuencia mínima cuando el volumen lo justifique.

---

## LT-05 — Sistema digital de trazabilidad y documentación de incumplimientos

### Arquitectura del flujo

```
CAMPO (inspector / personal recolección)
  Fotografía + GPS + fecha/hora automáticos
  Tipo de falta: [no separar | contenedor incorrecto | horario | obstrucción]
  Folio único por incidencia
  Identificación del condominio / administración
         ↓
PLATAFORMA MUNICIPAL (sistema digital — titularidad: Municipio)
  Validación por Dirección de Aseo / Ecología
  Si procede: folio sancionador
  Notificación al responsable
         ↓
TABLERO KPIs (Promotor/Gestor)
  Folios emitidos · advertencias · multas · pagos
  Tasa de reincidencia por condominio
  Ajustes operativos de rutas y calendarios
```

### Titularidad y operación

| Rol | Actor | Función |
|---|---|---|
| **Titular del sistema** | Municipio | El sistema es propiedad y control municipal |
| **Captura de campo** | Concesionario + personal supervisión | Alimentan el sistema con evidencia fotográfica |
| **Validación y sanción** | Dirección de Aseo / Ecología | Revisan evidencia, emiten folio, ejecutan sanción |
| **Administración técnica** | Promotor/Gestor (PMO) | Operan el sistema, garantizan integridad de datos y disponibilidad para auditoría |

### Datos mínimos por registro de incidencia

- Fotografía geolocalizada con fecha y hora automáticas del sistema
- Tipo de falta (catálogo: no separar / contenedor incorrecto / horario / obstruir supervisión)
- Folio único por incidencia
- Identificación del condominio y administración responsable
- Nivel de sanción aplicable (Aviso / Advertencia / Multa)
- Estado del expediente (abierto / en plazo de corrección / cerrado / multa emitida)

### Protección de datos

La evidencia fotográfica no debe capturar datos biométricos ni imágenes de personas de forma identificable. Si se capturan involuntariamente, deben anonimizarse antes de su uso en expediente, conforme a la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados (LGPDPPSO).

---

## LT-06 — Responsabilidad sobre contenedores

| Aspecto | Responsable |
|---|---|
| **Estándar y diseño** (fracciones, colores, volúmenes) | Municipio (este lineamiento) |
| **Provisión en zona piloto** | Municipio **o** concesionario, según contrato/adenda |
| **Uso, resguardo y mantenimiento básico** | Administración condominial (Art. 21 Bis, fracción II) |
| **CAPEX de contenedores para condominios** | NO es obligación implícita de los residenciales, salvo acuerdo expreso en asamblea condominial |

---

> **NOTA DE EMISIÓN:** este lineamiento técnico entra en vigor cuando la Dirección competente lo emita formalmente mediante acuerdo administrativo publicado en la Gaceta Municipal. No requiere aprobación de Cabildo, pero sí firma del Director de Aseo Público o Ecología. Su vigencia es indefinida; puede actualizarse sin reformar el reglamento.

> **NOTA DE NO VINCULANCIA:** borrador consultivo CLC-ALQUIMIA. No produce efectos jurídicos en su estado actual.
