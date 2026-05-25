# Adendo de reforma · {{NOMBRE_MUNICIPIO}} · Art. {{ARTICULO}}

**Audiencia:** Cabildo · Jurídico municipal · Dependencia de residuos  
**Municipio:** {{NOMBRE_MUNICIPIO}}, {{NOMBRE_ESTADO}}  
**Instrumento base:** {{REGLAMENTO_NOMBRE}} ({{REGLAMENTO_ANIO}})  
**Perfil municipal:** `/data/municipalities/{{MUNICIPIO_ID_UPPER}}/profile.json`  
**Marco legal:** `/data/municipalities/{{MUNICIPIO_ID_UPPER}}/legal_framework.json`

---

## Pregunta de decisión

¿Autoriza el Cabildo la reforma al artículo {{ARTICULO}} para habilitar separación en origen, cadena de custodia y sanciones proporcionales?

## Contexto municipal

| Campo | Valor canónico |
|-------|----------------|
| Viviendas universo | {{VIVIENDAS}} |
| Generación RSU | {{RSU_TON_DIA}} t/día |
| Concesionario | {{CONCESIONARIO}} |
| Dependencia | {{DEPENDENCIA}} |
| Cabildo apoyo | {{CABILDO_APOYO}} |

> **QHC · Contexto municipal**
> - **Qué:** Datos del perfil POLIS que anclan el adendo al municipio destino, no al modelo SLP.
> - **Cómo:** Verifique cada celda contra `profile.json` antes de integrar el texto al reglamento.
> - **Cuidado:** «Cabildo apoyo» es lectura política, no quorum legal; confirmar con secretaría de ayuntamiento.

## Texto propuesto

> [Redactar adendo específico para {{NOMBRE_MUNICIPIO}}. NO copiar referencias de San Luis Potosí si el municipio destino es otro.]

## Diferencias vs. modelo base SLP

| Elemento | SLP (referencia) | {{NOMBRE_MUNICIPIO}} |
|----------|------------------|----------------------|
| Autoridad inspección | Dirección de Ecología y Aseo Público | {{DEPENDENCIA}} |
| Operador | Red Ambiental | {{CONCESIONARIO}} |
| Reglamento | Aseo Público 2018 | {{REGLAMENTO_NOMBRE}} |

> **QHC · Tabla de diferencias**
> - **Qué:** Contraste explícito entre referencia SLP y el municipio instanciado — evita contaminación cruzada.
> - **Cómo:** Si una fila coincide con SLP, documente por qué (mismo operador/reglamento) en nota al pie.
> - **Cuidado:** SLP es referencia de consultoría, no texto legal aplicable en otros municipios sin adaptación.

## Fuentes mínimas

- [ ] PDF reglamento vigente verificado
- [ ] Perfil municipal completo en `/data/municipalities/{{MUNICIPIO_ID_UPPER}}/profile.json`
- [ ] Validación POLIS: sin contaminación cruzada

## Próximo paso

Tras aprobación del Cabildo, publicar en Periódico Oficial y registrar **Gate G2 (Adenda)** en el plan de implementación.

---

*Plantilla POLIS v1.0 · Estructura LOGOS jurídico-Cabildo · Instanciar con `modules/personalization/template_instantiator.py`*
