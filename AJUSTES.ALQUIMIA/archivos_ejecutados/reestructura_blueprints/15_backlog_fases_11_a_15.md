# 15 Backlog Fases 10.1 A 15

## Propósito

Convertir la reestructura maestra en fases implementables, con backend, frontend, datos, tests, auditoría, criterios de aceptación, riesgos y límites explícitos.

## Alcance

Propone Fase 10.1 y Fases 11 a 15. Estas fases sustituyen la lógica de “agregar más secciones al scroll” por una arquitectura modular guiada por ciudad, decisión, evidencia y exportación.

## Problema Que Corrige

El proyecto ha acumulado capacidades potentes, pero el riesgo es que la plataforma se vuelva una suma de módulos. Este backlog ordena la implementación para que cada nueva capacidad reduzca ambigüedad, no la aumente.

## Decisiones De Producto

- Cada fase debe cerrar con evidencia observable: API, UI, tests y exportación cuando aplique.
- No se acepta cierre por “avance”.
- Las fases rectoras deben ejecutarse con el desglose granular de `16_roadmap_granular_10_1_a_17.md`.
- Una iteración de agente debe tomar una sola subfase salvo que el usuario autorice agrupar.
- Cada fase debe preservar ciudad/municipio/ZM sin mezclar responsabilidades.
- Documentos históricos SLP son contexto, no fuente primaria.
- La calidad se mide por decisión pública defendible, no por cantidad de pantallas.
- La plataforma debe abrir con dos puertas: plan de ciudad para ciudadanía/equipos públicos y circularidad organizacional para empresas/instituciones.
- Cada ciudad debe tener línea base de circularidad RSU actual estimada, con fuente, confianza e incertidumbre.

## Fase 10.1: Navegación Rectora Por Ciudad

Objetivo: romper el scroll largo y crear entrada por ciudad/municipio y módulos.

Backend: endpoints de estado por ciudad y resumen modular.

Frontend: `CityEntryPage`, `DecisionModuleShell`, navegación por roles.

Datos: `PortalEntry`, `CityContext`, `CircularityBaseline`, `UserAudienceMode`, `DecisionModule`.

Tests: selección de entrada cambia journey; selección de ciudad hidrata módulos; cambiar ciudad invalida supuestos; no se mezclan municipios; baseline no aparece como oficial si es estimada.

Auditoría: confirmar que `page.tsx` deja de ser S1-S20 como experiencia primaria.

Criterios: cada módulo responde qué veo, qué decido, qué dato sostiene, qué sigue.

Extensión obligatoria: `PortalEntrySelector` debe ofrecer ciudadano/plan de ciudad y empresa/institución. `CircularityBaselineCard` debe mostrar circularidad RSU actual estimada antes de metas futuras.

Riesgos: crear tabs decorativos sin cambiar arquitectura.

Qué NO hacer: no copiar el scroll dentro de tabs.

## Fase 11: Legal Municipal Expositivo

Objetivo: legal por municipio, con propuestas expositivas y validación jurídica explícita.

Prerrequisito: Fase 11.0 de ingesta de fuentes legales oficiales. Antes de construir diagnostico legal municipal, el sistema debe poder localizar o descargar reglamentos desde fuentes oficiales por municipio, guardar manifest, checksum de bytes cuando exista archivo, fecha de consulta, URL oficial, URL de descarga y estado de validacion. Descargar o localizar un documento no equivale a declararlo vigente ni validado.

Backend: `MunicipalLegalContext`, legislación vigente/anterior/propuesta, bloqueos y rutas.

Frontend: vista por municipio, artículos, obligaciones, límites, acciones de desbloqueo.

Datos: reglamentos por municipio, estado de verificación, jurista requerido.

Tests: ZM nunca desbloquea municipio; documento legal no es oficial; bloqueo muestra acción.

Auditoría: revisar lenguaje de oficialidad.

Criterios: cada municipio tiene diagnóstico independiente.

Riesgos: tratar ZM como municipio.

Qué NO hacer: no generar dictámenes.

## Fase 12: UX, Educación Y Operación Territorial

Objetivo: experiencia ciudadana y operativa: educación, PER, zonas, rutas y calendario.

Backend: `CircularityTimeline`, `TerritorialZone`, `CollectionRoute`, `PERIndicator`.

Frontend: calculadora doméstica, timeline territorial, PER, bitácora y rutas.

Datos: composición hogar, predios, zonas, colonias, camiones, eventos.

Tests: advertencia no es multa; sanción requiere base legal; horizonte recalcula oleadas.

Auditoría: prueba de lectura ciudadana y prueba de cabildo.

Criterios: cualquier ciudadano entiende separación; operador entiende ruta.

Riesgos: lenguaje técnico o sancionador confuso.

Qué NO hacer: no automatizar multas sin debido proceso.

## Fase 13: Infraestructura, Mercado Y Macrogeneradores

Objetivo: conectar centros de acopio, macrogeneradores, precolocación y recicladoras.

Backend: `InfrastructurePlan`, `MacroGeneratorProfile`, `OrganizationalCircularityAssessment`, `MarketPlacement`.

Frontend: mapa de centros, capacidad por material, grandes generadores, portal empresarial/institucional, plan de contenedores, precolocación.

Datos: fuentes por generador, rangos, incertidumbre, compradores, recicladoras, proveedores ambientales, residuos no RSU declarados.

Tests: no double counting; centro sin municipio falla; comprador sin evidencia degrada confianza; residuo regulado activa advertencia y proveedor autorizado requerido.

Auditoría: validar que mercado reduce riesgo, no maquilla ingresos.

Criterios: cada tonelada adicional tiene origen, destino y grado de confianza.

Extensión obligatoria: hoteles, hospitales, empresas, clubes, estadios, zonas turísticas, campus e industria ligera deben poder recibir una guía práctica de circularidad: separación, ubicación de contenedores, proveedor ambiental, alternativa de valorización y bloqueos normativos.

Riesgos: inflar captura con generadores externos.

Qué NO hacer: no sumar macrogeneradores al RSU domiciliario sin etiqueta; no tratar residuos peligrosos/especiales/regulados como RSU ordinario.

## Fase 14: Motor Financiero, Impacto Y Escenarios

Objetivo: separar negocios y permitir comparación defendible de escenarios.

Backend: `BusinessCase`, `PriceReference`, `MonteCarloResult`, `ScenarioComparison`.

Frontend: tabs financieros por negocio, sensibilidad, P10/P50/P90, matriz de escenarios, texto de ayuda por gráfica y anexos de cálculo.

Datos: precios con fuente, overrides, CAPEX/OPEX por negocio, escenarios guardados, fórmula, unidad, fuente, incertidumbre, explicación y límites de uso por output cuantitativo.

Tests: precio manual requiere justificación; TIR declara entidad; escenario conserva proveniencia; cada gráfica tiene texto de ayuda; anexo de cálculos incluye nombre, fórmula, fuente y razón.

Auditoría: revisar que derrama no se mezcle con flujo privado y que el modelo técnico-financiero-económico no sea caja negra.

Criterios: cabildo puede comparar alternativas sin caja negra y auditar qué se calculó, cómo, por qué, cuándo aplica y para quién.

Riesgos: ROI inflado por mezcla de externalidades.

Qué NO hacer: no mostrar una TIR única para todo.

## Fase 15: Exportación Documental Y Auditoría De Código

Objetivo: paquete profesional descargable y auditoría de residuos técnicos.

Backend: `ProfessionalPackage`, manifest, ClaimLedger, assets, descarga, auditoría de código.

Frontend: estado documental, descarga, bloqueos, anexos, revisión de paquete y texto de ayuda para gráficas exportadas.

Datos: documentos por audiencia, oficialidad, estado, fuentes, claims y anexo de cálculos.

Tests: no `.txt` final; docs sin oficialidad fallan; endpoints de descarga devuelven ZIP con manifest; paquete incluye anexo de cálculos con nombre, fórmula, fuente y explicación; gráficas exportadas tienen texto de ayuda.

Auditoría: buscar código muerto, rutas no usadas, módulos duplicados, residuos de fases previas.

Criterios: paquete descargable, trazable, auditable y sin salidas improvisadas.

Riesgos: dejar código histórico activo o documentos sin evidencia.

Qué NO hacer: no borrar sin auditoría; no ocultar warnings.

## Modelo De Datos Sugerido

El backlog debe consolidar los modelos de los archivos 00 a 14 en un contrato central. Recomendación: crear `platform_contracts` o equivalente con tipos compartidos para entrada de portal, ciudad, municipio, circularidad actual estimada, organización, evidencia, documento, decisión, escenario y paquete.

## Endpoints Sugeridos

Los endpoints deben agruparse por dominio: `/portal`, `/city`, `/legal`, `/education`, `/implementation`, `/infrastructure`, `/operations`, `/organizations`, `/finance`, `/impact`, `/reasoning`, `/scenarios`, `/generate`.

## Componentes Frontend Sugeridos

Usar un `DecisionModuleShell` común con header, evidencia, decisión, riesgos y siguiente paso. Evitar componentes aislados sin contrato.

## Relación Con Código Actual

El código actual ya tiene piezas avanzadas: AGORA, data provenance, legal, market, macros, operations, reasoning, exportación y store. La reestructura no pide empezar de cero; pide reorganizar y endurecer contratos.

## Criterios De Aceptación Generales

- No hay ambigüedad entre ciudad, municipio y ZM.
- Existe baseline de circularidad RSU actual por ciudad con fuente, confianza e incertidumbre.
- Existe entrada empresarial/institucional separada del flujo ciudadano.
- No hay ambigüedad entre propuesta, simulación, dictamen y documento oficial.
- Cada fase tiene tests y evidencia observable.
- Los documentos exportados tienen audiencia, fuentes, estado y bloqueos.
- La UI permite navegar por decisiones, no por scroll acumulado.
- Cada cierre cita la subfase granular completada y su prueba de solución: API, UI, tests, exportación o reporte según aplique.

## Riesgos De Mala Implementación

- Construir muchas pantallas sin resolver contratos.
- Agregar features sin decidir qué problema público corrigen.
- Cerrar fases por número de tests sin revisar experiencia y documentos.
- Cerrar fases rectoras demasiado grandes sin completar subfases críticas.
- Perder la diferencia entre dato oficial, estimado y manual.
- Convertir la entrada empresarial en anexo sin producto real.
- Recomendar manejo de residuos regulados sin distinguir normativa y proveedor autorizado.

## Qué NO Hacer

- No editar código antes de cerrar contrato de fase.
- No usar SLP histórico como fuente primaria.
- No aceptar documentos sin ClaimLedger.
- No permitir que nuevas capacidades aumenten confusión.
- No ocultar incertidumbre de circularidad actual.
- No prometer circularidad empresarial sin plan de contenedores, proveedor/ruta y alternativa material.

## Prompt Final Para Agente Codificador

Implementa el backlog usando `16_roadmap_granular_10_1_a_17.md` como contrato operativo. Ejecuta una subfase por iteración. Antes de codificar cada subfase, crea checklist ejecutable con archivos, contrato de datos, API/UI esperada, tests y criterio de cierre. No cierres por avance: cierra solo con prueba de solución observable. Mantén ciudad/municipio/ZM separados, distingue propuesta/simulación/dictamen/oficial, y conserva proveniencia en cada cálculo, escenario y documento. Agrega desde Fase 10.1 `PortalEntrySelector` y baseline de circularidad RSU actual estimada por ciudad. En Fase 13 agrega portal empresarial/institucional para hoteles, hospitales, empresas, industria, clubes, estadios, campus, zonas turisticas y espacios publicos, distinguiendo RSU de residuos regulados.
