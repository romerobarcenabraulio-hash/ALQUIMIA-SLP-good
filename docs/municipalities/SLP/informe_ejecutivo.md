# Informe ejecutivo · Valorización RSU · San Luis Potosí

**Audiencia:** Cabildo · Presidente municipal · Tesorería  
**Municipio:** San Luis Potosí, San Luis Potosí  
**Zona metropolitana:** Zona Metropolitana San Luis Potosí  
**Fecha:** 2026-05-25  
**Perfil:** `/data/municipalities/SLP/profile.json`

---

## Pregunta de decisión

¿Autoriza el Cabildo la presentación del programa de valorización de residuos sólidos urbanos (RSU) y el inicio de la ruta reglamentaria correspondiente?

## Síntesis ejecutiva

San Luis Potosí genera aproximadamente **839.58 toneladas/día** de residuos sólidos urbanos (RSU) sobre un universo de **224,000 viviendas**. El programa ALQUIMIA propone escalar la separación en origen hacia **18 centros de acopio** —puntos municipales donde se reciben fracciones ya separadas— y **5 plantas de valorización** por giro, con meta de **725.76 t/día** capturadas en el año 3.

> **QHC · Síntesis del programa**
> - **Qué:** Resume la brecha de generación RSU y la meta operativa del año 3 en toneladas capturadas por día.
> - **Cómo:** Compare 839.58 t/día (generación) con 725.76 t/día (meta año 3) para dimensionar el salto operativo requerido.
> - **Cuidado:** Son proyecciones del modelo ALQUIMIA, no tonelaje medido en campo; la captura real depende de separación en origen y operación del concesionario.

## Marco operativo local

- **Concesionario / operador:** Red Ambiental (relación: neutral)
- **Autoridad municipal:** Dirección de Ecología y Aseo Público
- **Reglamento aplicable:** Reglamento de Aseo Público del Municipio de San Luis Potosí
- **Contexto político:** Coalición municipal vigente · 14 meses restantes de administración

## Cifras canónicas (coherencia POLIS)

| Indicador | Valor | Fuente |
|-----------|-------|--------|
| Viviendas | 224,000 | Perfil municipal |
| Centros de acopio | 18 | Modelo infraestructura |
| Recicladoras | 5 | Catálogo local |
| Ton/día Año 3 | 725.76 | Modelo financiero |

> **QHC · Cifras canónicas**
> - **Qué:** Cuatro indicadores que anclan el expediente: universo habitacional, infraestructura propuesta y meta de captura.
> - **Cómo:** Cada fila debe coincidir con el perfil municipal y el modelo financiero; desviaciones >5% requieren reconciliación POLIS.
> - **Cuidado:** «Recicladoras» aquí son plantas de valorización por giro, no centros de acopio ni puntos de recolección domiciliaria.

## Precios locales de materiales (MXN/kg)

| Material | Precio |
|----------|--------|
| PET | 5.5 |
| Papel/cartón | 2.5 |
| Vidrio | 2.3 |
| Aluminio | 15.1 |

> **QHC · Precios de materiales**
> - **Qué:** Precios de referencia por kilogramo que alimentan el modelo de ingresos por valorización.
> - **Cómo:** Multiplique toneladas capturadas por fracción × precio/kg × 1,000 para estimar ingreso bruto anual por material.
> - **Cuidado:** Precios de mercado spot, no contratos firmados; sensibilidad ±15% puede mover el payback más que el CAPEX.

## Próximo paso

Tras aprobación de este informe, el **Gate G1 (Cabildo)** habilita la presentación formal del paquete reglamentario. Debe existir quorum y acuerdo de minuta antes de avanzar a G2 (adenda de concesión).

---

*Documento instanciado POLIS · Estructura LOGOS Cabildo · Verificar coherencia con `python -m modules.personalization.cli coherence`.*
