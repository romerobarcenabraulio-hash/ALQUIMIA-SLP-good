# 17 Gobernanza, Calidad, Riesgo Y Definition Of Done

## Propósito

Elevar la ejecución de ALQUIMIA a un estándar profesional de ingeniería de software, dirección de producto, gestión pública, legaltech municipal y economía circular. Este documento define cómo decidir, validar, aceptar o rechazar cada subfase del roadmap.

No agrega funciones por acumulación. Agrega disciplina de ejecución.

## Alcance

Incluye:

- RACI por dominio;
- matriz de dependencias;
- Definition of Done por subfase;
- criterios de no aceptación;
- QA/UAT por audiencia;
- gobernanza de datos;
- observabilidad técnica;
- riesgos de economía circular;
- priorización por impacto/riesgo/esfuerzo;
- controles de seguridad, legalidad y trazabilidad.

## Problema Que Corrige

Un roadmap granular puede seguir fallando si cada agente interpreta “terminado” de forma distinta. La plataforma requiere una regla superior: ningún módulo queda aceptado si no demuestra valor, trazabilidad, seguridad, claridad y coherencia con el sistema completo.

## Principio Rector

Cada entrega debe responder:

```text
¿Qué decisión pública, operativa o empresarial habilita?
¿Qué evidencia la sostiene?
¿Qué riesgo reduce?
¿Qué usuario la entiende?
¿Qué prueba demuestra que funciona?
¿Qué documento o salida produce?
¿Qué no debe prometer?
```

Si una entrega no responde eso, no está terminada.

## RACI Rector

| Dominio | Responsable | Aprueba | Consultado | Informado |
|---|---|---|---|---|
| Ciudad/municipio/ZM | Producto + backend | Arquitecto | Jurídico municipal | Usuario final |
| Legal municipal | Legaltech + backend | Jurista externo/usuario autorizado | Cabildo, municipio | Ciudadanía |
| Educación ciudadana | Producto + UX writing | Producto | Operador, comunicación social | Ciudadanía |
| Operación PER | Backend + operaciones | Operador/concesionario | Jurídico | Cabildo |
| Sanciones | Legaltech + backend | Jurista/autoridad competente | Operador | Ciudadanía |
| Centros de acopio | Ingeniería operativa | Producto | Finanzas, municipio | Cabildo |
| Macrogeneradores | Producto + datos | Arquitecto | Operador, mercado | Municipio |
| Portal empresarial | Producto + mercado | Producto | Proveedor ambiental | Empresa |
| Finanzas | Economista/finanzas | Arquitecto + usuario financiero | Mercado | Cabildo/inversionista |
| Impacto ambiental | Datos + economía circular | Arquitecto | Fuentes oficiales | Cabildo |
| Trazabilidad | Backend + AGORA | Arquitecto | Producto | Todos |
| Documentos | AGORA + editor documental | Producto | Legal, finanzas, operación | Audiencia destino |
| Seguridad | Seguridad/backend | Arquitecto | DevOps | Usuario administrador |
| Release | Release manager | Arquitecto | Producto | Stakeholders |

Regla: si un módulo toca legal, sanciones, residuos regulados o documentos oficiales, debe tener aprobador explícito o quedar en estado `pendiente_validacion`.

## Matriz De Dependencias Críticas

| Entrega | Depende De | Bloquea A |
|---|---|---|
| PortalEntry + CityContext | tipos compartidos | navegación modular |
| CircularityBaseline | fuentes, score de datos | metas y comparaciones |
| Legal municipal | reglamento por municipio | sanciones, documentos legales |
| Ruta de aprobación | legal municipal | memo legal defendible |
| Educación doméstica | composición RSU | campaña ciudadana |
| Timeline territorial | CityContext, municipios | infraestructura, operación |
| Rutas PER | timeline, zonas | bitácora y advertencias |
| Sanciones | legal validado, evidencia | documento operativo sancionatorio |
| Centros de acopio | timeline, captura | ROI, logística, mercado |
| Macrogeneradores | fuentes, anti-doble conteo | infraestructura y mercado |
| Portal empresarial | macrogeneradores, proveedores | reportes organizacionales |
| Residuos regulados | normas/proveedor autorizado | recomendaciones empresariales |
| BusinessCase | precios, CAPEX/OPEX | ROI, Monte Carlo |
| ImpactKPI | proveniencia | reporte ambiental |
| Escenarios | snapshot, warnings | comparación exportable |
| ClaimLedger | datos, KPIs, documentos | exportación defendible |
| ProfessionalPackage | documentos, manifest, ClaimLedger | descarga final |
| Seguridad descarga | package store | lanzamiento |
| Release | test suite, build, docs | salida a usuarios |

## Definition Of Done General

Una subfase está terminada solo si cumple:

- contrato de datos definido o actualizado;
- API, función o estado observable cuando aplique;
- UI conectada cuando aplique;
- estados de carga, vacío, error y bloqueo;
- tests unitarios o de integración;
- prueba de caso bloqueado;
- warnings y proveniencia cuando haya estimaciones;
- no rompe flujos existentes;
- documentación de cierre o prompt actualizado;
- criterios de no aceptación revisados.

## Definition Of Done Por Tipo De Entrega

### Backend

- endpoint o servicio con contrato claro;
- validación de inputs;
- errores explícitos;
- tests de caso feliz, inválido y bloqueo;
- no hardcodear datos como verdad universal;
- logging suficiente sin exponer secretos.

### Frontend

- componente conectado a datos reales o estado explícito;
- no mock silencioso;
- estados loading/empty/error;
- responsive básico;
- no depende de scroll total;
- copy claro por audiencia.

### Datos

- fuente, fecha, tipo, confianza y caducidad;
- fallback declarado;
- override manual justificado;
- score de datos actualizado;
- no mezclar oficial, benchmark y manual.

### Modelo Técnico-Financiero-Económico

- todo output cuantitativo declara qué calcula, cómo lo calcula, por qué se calcula así, cuándo aplica, para quién aplica y qué decisión habilita;
- cada cálculo tiene unidad, fórmula, fuente/proveniencia, fecha del dato, confianza, incertidumbre o rango cuando aplique y límites de uso;
- toda gráfica, matriz o visualización cuantitativa incluye texto de ayuda que explique qué dice, cómo leerla, supuestos, límites y qué no debe inferirse;
- todo paquete o vista de cierre incluye anexo de cálculos en tabla mínima: `nombre_del_calculo`, `formula_o_calculo`, `fuente_de_datos`, `explicacion_o_razon`;
- no se acepta KPI, ROI, TIR, VPN, payback, CO2e, CAPEX/OPEX, tonelaje, empleo, ahorro, impacto fiscal o escenario sin trazabilidad y explicación;
- no se mezcla beneficio público, externalidad, flujo privado, ahorro municipal e ingreso de negocio en un mismo resultado sin separación explícita.

### Legal

- municipio explícito;
- fuente legal;
- oficialidad declarada;
- bloqueo jurídico con acción;
- propuesta distinguida de dictamen;
- no sancionar sin base legal validada.

### Finanzas

- negocio declarado;
- unidad de precio;
- fuente de precio;
- sensibilidad por negocio;
- externalidades separadas de flujo privado;
- TIR/VPN/payback con entidad económica.
- anexo de cálculos con fórmula, fuente y razón para cada KPI financiero principal;
- texto de ayuda en toda gráfica financiera o de sensibilidad.

### Documentos

- audiencia;
- nivel de oficialidad;
- estado;
- fuentes;
- ClaimLedger;
- bloqueos;
- acción de desbloqueo;
- formato final profesional, no `.txt`.
- anexo de cálculos cuando el documento incluya resultados cuantitativos;
- gráficas con texto de ayuda o pie interpretativo.

### Seguridad

- validación de payload;
- control de acceso cuando aplique;
- sanitización de archivos;
- prevención de path traversal;
- errores sin secretos;
- CORS y headers revisados.

## Criterios De No Aceptación

Se rechaza una entrega si:

- solo compila pero no demuestra flujo;
- solo tiene UI sin contrato de datos;
- usa mocks sin etiqueta;
- oculta warnings;
- mezcla municipio y ZM;
- marca documentos legales como oficiales;
- mezcla ROI privado con derrama pública;
- trata residuos regulados como RSU ordinario;
- genera documentos sin fuentes;
- exporta `.txt` como producto final;
- rompe descarga o generación documental;
- no tiene prueba de caso bloqueado;
- depende de explicación verbal para entenderse.

## QA/UAT Por Audiencia

| Audiencia | Prueba De Usuario |
|---|---|
| Ciudadanía | entiende qué separar, dónde poner contenedores y por qué importa |
| Cabildo | identifica decisión requerida, costo, riesgo y beneficio |
| Jurídico | distingue vigente, anterior, propuesta, dictamen y oficial |
| Operador | entiende ruta, frecuencia, bitácora, advertencia y evidencia |
| Concesionario | identifica cambios operativos y obligaciones |
| Empresa | obtiene plan de contenedores, proveedor/ruta y alternativa circular |
| Inversionista/recicladora | ve volumen, pureza, precio, riesgo y retorno |
| Administrador técnico | puede levantar, probar, exportar y auditar |

Cada UAT debe tener resultado: `aprobado`, `aprobado_con_observaciones`, `rechazado`.

## Gobernanza De Datos

Cada fuente debe tener:

- `fuente_id`;
- origen;
- fecha;
- tipo: oficial, API, benchmark, manual, estimado;
- confianza;
- caducidad;
- responsable;
- fallback permitido;
- KPIs afectados;
- documentos afectados.

Reglas:

- dato caducado no bloquea todo, pero degrada confianza;
- dato manual exige justificación;
- dato estimado no se presenta como oficial;
- si un precio cambia, cambia o se justifica la referencia;
- si una fuente desaparece, se conserva snapshot con advertencia.

## Observabilidad Técnica

Debe existir observabilidad mínima para:

- simulación;
- data provenance;
- generación documental;
- render profesional;
- descarga de ZIP;
- errores de API;
- jobs fallidos;
- intentos de descarga inválidos;
- warnings críticos.

Se recomienda registrar:

```text
event_type
city_id
municipio_id
package_id
scenario_id
module_id
status
duration_ms
warnings_count
error_code
```

Nunca registrar secretos, tokens, documentos sensibles completos ni datos personales innecesarios.

## Riesgos De Economía Circular

| Riesgo | Control |
|---|---|
| Volatilidad de precios | sensibilidad y PriceReference |
| Falta de comprador | MarketPlacement con confianza |
| Baja pureza de material | KPIs de contaminación y educación |
| Doble conteo | reglas por fuente y generador |
| Logística más cara que valorización | BusinessCase separado |
| Infraestructura sobredimensionada | capacidad vs flujo capturable |
| Residuos regulados mal clasificados | warning normativo y proveedor autorizado |
| Dependencia de concesionario | fase de negociación y pactos |
| Rechazo ciudadano | educación, UAT y comunicación clara |
| Documento no defendible | ClaimLedger y oficialidad |

## Priorización

Cada subfase debe puntuarse antes de ejecutar:

```text
prioridad = impacto_decision + reduccion_riesgo + dependencia_desbloqueada - esfuerzo
```

Escala 1 a 5:

- impacto_decision;
- reduccion_riesgo;
- dependencia_desbloqueada;
- esfuerzo.

Primero se ejecuta lo que desbloquea arquitectura:

1. PortalEntry + CityContext + baseline.
2. Navegación modular.
3. Legal municipal.
4. Timeline territorial.
5. Infraestructura y operación.
6. Finanzas separadas.
7. Documentos/exportación.
8. Seguridad.
9. Release.

## Herramientas Que Conviene Desarrollar Más

Estas herramientas sí ameritan mayor desarrollo porque reducen riesgo sistémico:

1. `QualityGateEngine`: valida si una subfase puede cerrarse.
2. `EvidenceRegistry`: catálogo central de fuentes, caducidad y confianza.
3. `ClaimLedgerViewer`: vista humana de claims, fuentes y bloqueos.
4. `DocumentReadinessScore`: mide si un paquete puede exportarse como defendible.
5. `ScenarioIntegrityChecker`: verifica supuestos, warnings y proveniencia antes de comparar.
6. `RegulatedWasteGuard`: detecta residuos no RSU y exige proveedor/norma.
7. `ReleaseReadinessChecklist`: checklist vivo de lanzamiento.

No todas deben hacerse al inicio, pero deben estar previstas como componentes de calidad.

## Modelo De Datos Sugerido

```ts
interface QualityGateResult {
  subfase: string
  estado: 'aprobado' | 'aprobado_con_observaciones' | 'rechazado'
  evidencias: string[]
  bloqueos: string[]
  pruebas_requeridas: string[]
  criterios_no_cumplidos: string[]
}

interface DataGovernanceRecord {
  fuente_id: string
  origen: string
  tipo: 'oficial' | 'api' | 'benchmark' | 'manual' | 'estimado'
  fecha: string
  caduca_en?: string
  confianza: number
  responsable?: string
  kpis_afectados: string[]
  documentos_afectados: string[]
}
```

## Endpoints Sugeridos

- `POST /quality/gate`
- `GET /quality/subphase/{id}`
- `GET /data-governance/sources`
- `GET /documents/{package_id}/readiness`
- `POST /scenarios/{scenario_id}/integrity-check`
- `POST /organizations/regulated-waste-guard`
- `GET /release/readiness`

## Componentes Frontend Sugeridos

- `QualityGatePanel`
- `DefinitionOfDoneChecklist`
- `DataGovernanceTable`
- `DocumentReadinessBadge`
- `ScenarioIntegrityPanel`
- `RegulatedWasteGuardBanner`
- `ReleaseReadinessPanel`

## Relación Con Código Actual

El sistema ya tiene piezas de proveniencia, ClaimLedger, exportación, operaciones, macros y documentos. Esta gobernanza no reemplaza esas piezas: las convierte en criterios de aceptación y control de calidad.

## Criterios De Aceptación

- Cada subfase tiene DoD verificable.
- Cada cierre puede aprobarse o rechazarse con evidencia.
- Las fuentes tienen gobernanza mínima.
- Los documentos no se exportan como defendibles sin ClaimLedger.
- Los residuos regulados activan guardas.
- Seguridad y release tienen checklist reproducible.

## Riesgos De Mala Implementación

- Convertir gobernanza en burocracia sin automatizar.
- Crear checklists que nadie ejecuta.
- Aceptar módulos por estética.
- No registrar bloqueos.
- No vincular calidad con documentos/exportación.

## Qué NO Hacer

- No cerrar subfases por intuición.
- No aceptar “tests pasan” como prueba única.
- No pedir perfección abstracta sin criterio verificable.
- No bloquear todo por una fuente estimada; degradar confianza cuando proceda.
- No usar gobernanza para frenar producto: usarla para hacerlo defendible.

## Prompt Final Para Agente Auditor

```text
Actúa como auditor senior de ingeniería de software, dirección de producto, legaltech municipal, seguridad aplicativa, economía circular y gestión pública. Audita ALQUIMIA usando README_REESTRUCTURA.md, 15_backlog_fases_11_a_15.md, 16_roadmap_granular_10_1_a_17.md y 17_gobernanza_calidad_riesgo_y_dod.md.

No aceptes avance por estética, cantidad de tests o afirmaciones del agente. Exige prueba de solución: contrato de datos, API/función observable, UI conectada, estados de error/carga/vacío, tests de caso feliz y bloqueado, trazabilidad, seguridad, exportación o reporte según aplique.

Entrega:
1. Dictamen por subfase: aprobado, aprobado con observaciones o rechazado.
2. Hallazgos críticos con archivo/línea cuando aplique.
3. Riesgos sistémicos: ciudad/municipio/ZM, legal/oficialidad, datos/proveniencia, ROI, residuos regulados, exportación, seguridad y release.
4. Acciones obligatorias antes de continuar.
5. Prompt quirúrgico para el siguiente agente codificador.

No uses documentos históricos SLP como fuente de verdad. Solo sirven como contexto. El código actual manda sobre suposiciones técnicas; los datos oficiales/provenance mandan sobre narrativa; y ningún documento legal generado por la plataforma debe presentarse como dictamen u oficial sin validación competente.
```
