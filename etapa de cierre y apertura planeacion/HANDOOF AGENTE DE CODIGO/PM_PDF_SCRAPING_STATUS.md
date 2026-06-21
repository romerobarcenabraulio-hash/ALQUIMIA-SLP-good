# PM BRIEF · Inventario de PDFs, extracción de datos y diagnóstico del web scraping

**Fecha:** 19 junio 2026
**De:** founder (Braulio)
**Para:** Project Manager
**Asunto:** qué está pasando con los documentos subidos y por qué el scraping no nos está acelerando como debería

---

## Qué necesito de ti con este documento

Dos entregables concretos:

1. **Un inventario completo** de todos los PDFs que hemos subido al proyecto, mapeando para cada uno: qué dato contiene, si ya se extrajo, y a qué módulo/campo de la plataforma alimenta (o debería alimentar).
2. **Un diagnóstico del web scraping**: por qué no está avanzando y qué se necesita para arreglarlo. Tengo una hipótesis fuerte de la causa raíz, abajo.

---

## PARTE 1 · Inventario de PDFs subidos

### Lo que sabemos que está cargado en el proyecto

Categoría A — **Normas GRI (estándares internacionales), ~30 PDFs en español.** Son los estándares de reporte de sostenibilidad. Ejemplos: GRI 1 Fundamentos, GRI 2 Contenidos Generales, GRI 3 Temas Materiales, GRI 101 Biodiversidad, GRI 201 Desempeño económico, GRI 203 Impactos económicos indirectos, GRI 204 Prácticas de abastecimiento, GRI 302 Energía, GRI 303 Agua y efluentes, GRI 305 Emisiones, GRI 306 Residuos (2020) y GRI 306 Efluentes y residuos (2016), GRI 308 Evaluación ambiental de proveedores, GRI 401-418 (serie social), etc.
- **Uso en la plataforma:** son la base normativa que los agentes citan. NO son datos de un municipio; son el marco de cumplimiento. Deben vivir en un catálogo de estándares consultable, no mezclados con datos de tenant.

Categoría B — **Documento de licitación / contrato** (`AC_0001_0007_00174536_000001.pdf` u similares). Documento institucional, probablemente de un municipio o concesión.
- **Uso:** dato del cliente (categoría 1, la más fuerte). Alimenta M03 (capacidad institucional) y M03B (reforma).

Categoría C — **Documentos del Periódico Oficial / iniciativas publicadas** (ej. la norma de Nuevo León que mencionamos).
- **Uso:** Modo B — obligaciones municipales derivadas. Alimenta el catálogo de iniciativas.

### Lo que necesito que hagas (cómo construir el inventario)

Para cada PDF en el proyecto y en Drive, llenar esta tabla:

| Archivo | Tipo (norma / dato cliente / iniciativa / otro) | ¿Texto extraíble? (sí/no/parcial) | Dato clave que contiene | Módulo/campo destino | Estado (extraído / pendiente / falla) |
|---|---|---|---|---|---|

Regla de clasificación al llenarla: si el PDF es una **norma** (GRI, NOM, ISO), va al catálogo de estándares. Si es un **documento de un municipio** (reglamento, licitación, cuenta pública), es dato del cliente y alimenta un módulo específico. Si es una **iniciativa publicada** (Periódico/Diario Oficial), alimenta el catálogo de iniciativas (Modo B).

---

## PARTE 2 · Por qué el web scraping no nos está acelerando

### La causa raíz más probable (verificar primero esto)

**Los PDFs de los Periódicos Oficiales y del Diario Oficial de la Federación mexicanos rompen la extracción de texto estándar.** La herramienta común (`pdftotext`) falla con ellos porque usan codificación de fuentes tipo CID. Resultado: el scraper baja el PDF correctamente, pero cuando intenta leerlo, devuelve texto basura o vacío. Es decir: **el problema probablemente NO es el scraping (la descarga), es la extracción (la lectura).** Por eso "parece que no funciona" aunque esté trayendo archivos.

### La solución conocida (que el equipo debe implementar)

Para esos PDFs de gobierno, NO usar extracción de texto directa. El flujo que sí funciona:
1. Rasterizar el PDF a imágenes con `pdftoppm -jpeg -r 150` (convierte cada página en imagen).
2. Leer las imágenes con OCR / lectura de imagen.
3. De ahí extraer el texto y los claims.

Asumir este patrón para TODOS los documentos de Periódico Oficial / Diario Oficial. Es un caso conocido y reproducible, no un bug aleatorio.

### El checklist de diagnóstico del scraping (en orden)

Pídele al equipo verificar, en este orden, y reportar dónde se rompe:

1. **¿Descarga?** ¿El scraper baja el PDF y lo guarda? (revisar logs del scheduler — DOF, SEMARNAT, COFEMER, INEGI, ASF). Si falla aquí, es la fuente caída o el selector cambió.
2. **¿Extrae?** ¿El texto que saca del PDF es legible o es basura/vacío? **Aquí es donde sospecho que se rompe** (el problema CID de arriba).
3. **¿Clasifica?** Si extrae bien, ¿identifica los claims y los clasifica por jerarquía de datos?
4. **¿Aplica?** ¿El dato extraído llega a un módulo/campo de la plataforma, o se queda en una tabla que nadie ve?
5. **¿Alerta?** Cuando entra un documento nuevo que afecta a un municipio existente, ¿se dispara una alerta? (este es el verdadero valor de "política viva" — si no existe, es la mejora de mayor impacto).

### Por qué esto nos debería hacer avanzar a pasos agigantados

Si el scraping + extracción + aplicación funcionan de punta a punta, cada documento público que entra **alimenta solo** el diagnóstico de los municipios afectados, sin captura manual. Hoy probablemente se rompe en el paso 2 (extracción) o el paso 4 (aplicación), y por eso se siente estancado. Arreglar esos dos pasos es lo que destraba la velocidad.

---

## Resumen de acciones para el PM

1. Construir el inventario de PDFs con la tabla de la Parte 1.
2. Verificar la hipótesis CID: tomar un PDF del Periódico Oficial y ver si la extracción devuelve basura. Si sí, implementar el flujo rasterizar→OCR.
3. Correr el checklist de diagnóstico del scraping (5 pasos) y reportar en qué paso exacto se rompe.
4. Confirmar si existe la alerta de "documento nuevo afecta a tenant existente". Si no, marcarla como la siguiente prioridad.
5. Reportar de vuelta: inventario lleno + el paso exacto donde el scraping se rompe + qué se necesita para arreglarlo.

---

*PM BRIEF · Alquimia · 19 junio 2026*
