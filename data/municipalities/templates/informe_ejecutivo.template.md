# Informe ejecutivo · Valorización RSU · {{NOMBRE_MUNICIPIO}}

**Audiencia:** Cabildo · Presidente municipal · Tesorería  
**Municipio:** {{NOMBRE_MUNICIPIO}}, {{NOMBRE_ESTADO}}  
**Zona metropolitana:** {{ZM_NOMBRE}}  
**Fecha:** {{FECHA}}  
**Perfil:** `/data/municipalities/{{MUNICIPIO_ID_UPPER}}/profile.json`

---

## Pregunta de decisión

¿Autoriza el Cabildo la presentación del programa de valorización de residuos sólidos urbanos (RSU) y el inicio de la ruta reglamentaria correspondiente?

## Síntesis ejecutiva

{{NOMBRE_MUNICIPIO}} genera aproximadamente **{{RSU_TON_DIA}} toneladas/día** de residuos sólidos urbanos (RSU) sobre un universo de **{{VIVIENDAS}} viviendas**. El programa ALQUIMIA propone escalar la separación en origen hacia **{{CENTROS_ACOPIO}} centros de acopio** —puntos municipales donde se reciben fracciones ya separadas— y **{{RECICLADORAS}} plantas de valorización** por giro, con meta de **{{TON_DIA_ANIO_3}} t/día** capturadas en el año 3.

> **QHC · Síntesis del programa**
> - **Qué:** Resume la brecha de generación RSU y la meta operativa del año 3 en toneladas capturadas por día.
> - **Cómo:** Compare la generación actual ({{RSU_TON_DIA}} t/día) con la meta ({{TON_DIA_ANIO_3}} t/día) para dimensionar el salto operativo.
> - **Cuidado:** Son proyecciones del modelo ALQUIMIA, no tonelaje medido en campo; la captura real depende de separación en origen y operación del concesionario.

## Marco operativo local

- **Concesionario / operador:** {{CONCESIONARIO}} (relación: {{RELACION_CONCESIONARIO}})
- **Autoridad municipal:** {{DEPENDENCIA}}
- **Reglamento aplicable:** {{REGLAMENTO_NOMBRE}}
- **Contexto político:** {{PARTIDO}} · {{MESES_RESTANTES}} meses restantes de administración

## Cifras canónicas (coherencia POLIS)

| Indicador | Valor | Fuente |
|-----------|-------|--------|
| Viviendas | {{VIVIENDAS}} | Perfil municipal |
| Centros de acopio | {{CENTROS_ACOPIO}} | Modelo infraestructura |
| Recicladoras | {{RECICLADORAS}} | Catálogo local |
| Ton/día Año 3 | {{TON_DIA_ANIO_3}} | Modelo financiero |

> **QHC · Cifras canónicas**
> - **Qué:** Cuatro indicadores que anclan el expediente: universo habitacional, infraestructura propuesta y meta de captura.
> - **Cómo:** Cada fila debe coincidir con el perfil municipal y el modelo financiero; desviaciones >5% requieren reconciliación POLIS.
> - **Cuidado:** «Recicladoras» aquí son plantas de valorización por giro, no centros de acopio ni puntos de recolección domiciliaria.

## Precios locales de materiales (MXN/kg)

| Material | Precio |
|----------|--------|
| PET | {{PRECIO_PET}} |
| Papel/cartón | {{PRECIO_PAPEL}} |
| Vidrio | {{PRECIO_VIDRIO}} |
| Aluminio | {{PRECIO_ALUMINIO}} |

> **QHC · Precios de materiales**
> - **Qué:** Precios de referencia por kilogramo que alimentan el modelo de ingresos por valorización.
> - **Cómo:** Multiplique toneladas capturadas por fracción × precio/kg × 1,000 para estimar ingreso bruto anual por material.
> - **Cuidado:** Precios de mercado spot, no contratos firmados; sensibilidad ±15% puede mover el payback más que el CAPEX.

## Próximo paso

Tras aprobación de este informe, el **Gate G1 (Cabildo)** habilita la presentación formal del paquete reglamentario. Debe existir quorum y acuerdo de minuta antes de avanzar a G2 (adenda de concesión).

---

*Documento generado desde plantilla POLIS · Estructura LOGOS Cabildo · Verificar coherencia con `python -m modules.personalization.cli coherence`.*
