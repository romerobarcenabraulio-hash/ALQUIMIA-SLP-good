# 16 Roadmap Granular 10.1 A 17

## Propósito

Desglosar el backlog rector en subfases pequeñas, verificables y entregables. El objetivo no es crear más trabajo: es impedir cierres ambiguos, avances decorativos o implementaciones que se vean bien pero no prueben solución.

## Alcance

Este archivo gobierna la ejecución de Fase 10.1 a Fase 17. Cada subfase tiene objetivo, alcance, archivos probables, evidencia mínima, tests, criterios de cierre, riesgos y prompt quirúrgico.

## Dictamen De Auditoría

Sí es prudente desglosar más.

Razón técnica: las fases rectoras 12, 13, 14 y 15 agrupan demasiados dominios. Si se entregan como una sola fase, un agente puede completar una parte visible y dejar sin resolver contratos, pruebas, exportación, residuos regulados, experiencia empresarial o auditoría real.

Riesgo detectado:

- Fase 12 mezcla educación, UX, timeline, PER, bitácora, advertencias y sanciones.
- Fase 13 mezcla infraestructura, macrogeneradores, mercado, recicladoras, portal empresarial, contenedores y residuos regulados.
- Fase 14 mezcla finanzas, impacto y comparación de escenarios.
- Fase 15 mezcla exportación documental y auditoría de código.
- Fase 16 y 17 aún no estaban convertidas en entregables verificables.

Decisión: mantener las fases rectoras, pero ejecutar por subfases.

## Regla De Cierre

Ninguna subfase se cierra por “implementado”, “compila” o “tests pasan” si no existe prueba de solución.

Prueba de solución significa:

- contrato de datos claro;
- endpoint o función observable cuando aplique;
- componente UI conectado cuando aplique;
- estado de error, vacío y carga;
- tests de caso feliz y caso bloqueado;
- trazabilidad o warning cuando haya datos estimados;
- documentación o prompt actualizado si cambia la arquitectura;
- no romper flujos ya existentes.

## Fase 10.1 - Entrada Del Portal Y Baseline De Circularidad

Objetivo: crear la puerta inicial del producto.

Alcance:

- `PortalEntrySelector`;
- entrada ciudadano/plan de ciudad;
- entrada empresa/institución;
- `CityFirstSelector`;
- `CircularityBaseline` por ciudad;
- etiqueta de confianza e incertidumbre.

Archivos probables:

- `frontend/src/app/simulator/page.tsx`
- `frontend/src/store/simulatorStore.ts`
- `frontend/src/types/index.ts`
- `backend/app/data` o módulo nuevo `/city`

Evidencia mínima:

- se puede elegir entrada;
- se puede elegir ciudad;
- la baseline aparece antes de metas;
- baseline estimada no se muestra como oficial.

Tests:

- entrada ciudadana y empresarial generan journey distinto;
- baseline requiere fuente/confianza;
- cambiar ciudad invalida baseline anterior;
- baseline estimada muestra warning.

Criterio de cierre:

- El usuario sabe “desde dónde entra” y cuál es la circularidad actual estimada antes de tocar parámetros.

Prompt quirúrgico:

```text
Implementa Fase 10.1: PortalEntrySelector + CityFirstSelector + CircularityBaseline. No conviertas esto en landing marketing. Debe cambiar el journey real, hidratar CityContext y mostrar baseline de circularidad RSU actual con fuente, confianza e incertidumbre. Agrega tests para entradas, cambio de ciudad y baseline estimada no oficial.
```

## Fase 10.2 - Navegación Modular Y Shell De Decisión

Objetivo: reemplazar el scroll como arquitectura primaria.

Alcance:

- `DecisionModuleShell`;
- navegación por módulos;
- estado por módulo;
- audiencia activa;
- siguiente acción.

Evidencia mínima:

- el usuario navega por módulo sin recorrer S1-S20;
- cada módulo muestra qué veo, qué decido, qué dato sostiene y qué sigue.

Tests:

- módulo bloqueado muestra causa;
- módulo listo muestra siguiente acción;
- cambiar audiencia cambia etiquetas/documentos destacados, no datos.

Criterio de cierre:

- `page.tsx` deja de ser la experiencia primaria de scroll largo aunque componentes actuales se reutilicen dentro del shell.

Prompt quirúrgico:

```text
Implementa Fase 10.2: DecisionModuleShell y navegación modular. Reutiliza componentes existentes, pero no repliques S1-S20 como tabs decorativos. Cada módulo debe tener estado, decisión, evidencia, bloqueos y siguiente acción.
```

## Fase 11.1 - Legal Municipal Por Municipio

Objetivo: asegurar que legal nunca trate ZM como municipio.

Prerrequisito nuevo: Fase 11.0 - Ingesta De Fuentes Legales Oficiales.

## Fase 11.0 - Ingesta De Fuentes Legales Oficiales

Objetivo: que los agentes y el sistema trabajen con reglamentos municipales localizados desde fuentes oficiales recientes, sin presentarlos como dictamen u oficialidad validada automaticamente.

Alcance:

- registro de fuentes oficiales por municipio;
- descarga o localizacion de PDF/HTML desde sitio municipal, periodico oficial estatal, Orden Juridico Nacional o portal de transparencia;
- manifest por fuente con URL oficial, URL de descarga, fecha de consulta, estado HTTP, tipo de contenido y checksum del archivo descargado cuando exista;
- estado de verificacion: `no_disponible`, `localizado`, `descargado`, `pendiente_validacion_juridica`, `validado_externamente`;
- separacion estricta municipio/ZM;
- trazabilidad hacia ClaimLedger/EvidenceRegistry.

Tests:

- ZM no puede producir una fuente legal municipal unica;
- descarga fallida conserva estado explicito y accion siguiente;
- fuente descargada guarda checksum de bytes, no solo metadatos;
- documento localizado no se marca como vigente/verificado sin validacion competente;
- municipio sin documento queda bloqueado para sanciones, pero no para educacion o simulacion.

Criterio de cierre:

- Cada reglamento tiene fuente, URL, retrieved_at, status, checksum cuando aplique, municipio_id y estado de validacion.
- La plataforma puede distinguir documento localizado/descargado de reglamento vigente validado.
- Ningun texto generado se presenta como dictamen u oficial.

Riesgos:

- asumir que un PDF encontrado es version vigente;
- usar buscadores como fuente de verdad en lugar de localizador;
- mezclar municipios dentro de una ZM;
- marcar `verificado=True` por descarga exitosa.

Prompt quirurgico:

```text
Implementa Fase 11.0: ingesta de fuentes legales oficiales por municipio. No generes dictamen legal. Localiza/descarga reglamentos desde fuentes oficiales configuradas, registra manifest con checksum de bytes, fecha de consulta, estado HTTP, URL oficial y estado de validacion. Una descarga exitosa no equivale a vigencia validada. ZM nunca desbloquea municipio.
```

Alcance:

- `MunicipalLegalContext`;
- legislación vigente;
- legislación anterior si aplica;
- artículos, obligaciones, límites;
- estado de verificación por municipio.

Tests:

- una ZM no desbloquea municipio;
- cada municipio tiene reglamento y estado independiente;
- municipio sin fuente legal queda pendiente de validación por jurista.

Criterio de cierre:

- Querétaro, San Pedro, Cadereyta, Soledad o cualquier municipio puede diferir legalmente dentro de una misma ZM.

Prompt quirúrgico:

```text
Implementa Fase 11.1: Legal municipal independiente por municipio. No uses ZM como entidad legal. Cada municipio debe tener contexto, artículos, obligaciones, límites, fuente y estado de validación.
```

## Fase 11.2 - Propuestas Expositivas Y Ruta De Aprobación

Objetivo: blindar lenguaje legal y desbloqueos.

Alcance:

- documento expositivo;
- propuesta de reforma;
- ruta de aprobación;
- bloqueo jurídico con acción de desbloqueo.

Tests:

- ningún documento generado se marca oficial;
- bloqueo jurídico incluye acción;
- propuesta legal exige validación externa.

Criterio de cierre:

- La plataforma ayuda sin fingir dictamen.

Prompt quirúrgico:

```text
Implementa Fase 11.2: documentos legales expositivos y ruta de aprobación. Todo texto legal debe distinguir propuesta, dictamen y documento oficial. Bloqueo jurídico debe decir pendiente de validación por jurista y sugerir acción.
```

## Fase 12.1 - Educación Ciudadana Y Calculadora Doméstica

Objetivo: explicar separación y generación del hogar sin tecnicismos.

Alcance:

- composición RSU del hogar;
- categorías de separación;
- tipo de predio;
- contenedores domésticos;
- cálculo de generación e impacto.

Tests:

- casa, edificio, condominio y residencial producen recomendaciones distintas;
- cada recomendación tiene lenguaje ciudadano;
- calculadora no usa términos técnicos sin explicación.
- cualquier gráfica o resultado cuantitativo incluye texto de ayuda: qué dice, cómo leerlo y qué no debe inferirse.

Criterio de cierre:

- Una persona de secundaria puede entender qué separar, dónde ponerlo y por qué.
- La calculadora no es caja negra: los cálculos visibles tienen fórmula, fuente y explicación en ayuda o anexo.

Prompt quirúrgico:

```text
Implementa Fase 12.1: educación ciudadana y calculadora doméstica. Debe explicar categorías, tipo de predio, contenedores y generación del hogar con lenguaje claro. No mezcles multas ni legal en esta subfase.
```

## Fase 12.2 - Implementación Espacio-Tiempo

Objetivo: convertir horizonte en ruta territorial.

Alcance:

- “¿En cuántos años quieres que tu ciudad sea circular?”;
- planes 3/5/7;
- zonas 1-5;
- colonias piloto;
- meses/trimestres;
- recalculo de metas.

Tests:

- cambiar horizonte recalcula oleadas;
- zona tiene municipio y colonias;
- meta incompatible genera warning.
- gráficas/timelines explican qué decisión habilitan, supuestos usados y límites de interpretación.

Criterio de cierre:

- El plan se entiende como calendario territorial, no como slider.
- El calendario incluye explicación humana de los cálculos que lo sostienen.

Prompt quirúrgico:

```text
Implementa Fase 12.2: timeline territorial 3/5/7 años con zonas, colonias piloto, meses, trimestres y recalculo de captura/capacidad. No implementes un slider aislado.
```

## Fase 12.3 - Operación PER Y Bitácora

Objetivo: conectar presión, estado y respuesta con operación real.

Alcance:

- rutas;
- camiones;
- frecuencia;
- bitácora;
- eventos operativos;
- PER en lenguaje humano.

Tests:

- ruta requiere municipio, zona, frecuencia y responsable;
- bitácora conserva fecha, evidencia y tipo de evento;
- PER explica presión/estado/respuesta.
- métricas PER o gráficas operativas incluyen texto de ayuda y anexo de cálculo cuando sean cuantitativas.

Criterio de cierre:

- Operador y cabildo entienden qué ocurre mes a mes.

Prompt quirúrgico:

```text
Implementa Fase 12.3: PER operativo, rutas y bitácora. Cada ruta debe tener municipio, zona, colonias, frecuencia, camión y responsable. Cada evento debe tener evidencia y fecha.
```

## Fase 12.4 - Advertencias Educativas Y Sanciones Con Gate Legal

Objetivo: impedir que educación se confunda con multas.

Alcance:

- advertencia educativa;
- inspección;
- sanción propuesta;
- debido proceso;
- gate legal municipal.

Tests:

- advertencia no crea multa;
- sanción requiere base legal validada;
- municipio sin legal validado bloquea sanción pero permite educación.

Criterio de cierre:

- El sistema puede educar sin sancionar indebidamente.

Prompt quirúrgico:

```text
Implementa Fase 12.4: advertencias educativas y sanciones con gate legal. Advertencia educativa no es multa. Sanción solo procede con base legal municipal validada y evidencia.
```

## Fase 13.1 - Infraestructura Y Centros De Acopio

Objetivo: decidir centros por zona, fase y capacidad.

Alcance:

- `InfrastructurePlan`;
- tipos P/M/G;
- ubicación propuesta;
- capacidad por material;
- relación centro-zona-municipio.

Tests:

- centro sin municipio falla;
- capacidad instalada se compara contra flujo capturable;
- ubicación sin validación se marca propuesta.
- cálculo de capacidad, toneladas, cobertura o brecha incluye fórmula, fuente de datos y razón de uso.

Criterio de cierre:

- Cada centro tiene razón territorial, capacidad y estado.
- Cada gráfica de capacidad tiene texto de ayuda y cada cálculo queda anexable.

Prompt quirúrgico:

```text
Implementa Fase 13.1: InfrastructurePlan con centros por zona/municipio/fase, capacidad por material y estado de validación. No presentes ubicaciones como definitivas sin evidencia.
```

## Fase 13.2 - Macrogeneradores Municipales

Objetivo: estimar grandes generadores sin doble conteo.

Alcance:

- hoteles, estadios, clubes, universidades, eventos, centros comerciales;
- variables por tipo;
- rango e incertidumbre;
- conexión con rutas e infraestructura.

Tests:

- cada tipo exige variables propias;
- generador temporal no se trata como permanente;
- volumen adicional no se suma dos veces al domiciliario.
- volumen estimado por macrogenerador declara fórmula, fuente, incertidumbre, periodicidad y razón del cálculo.

Criterio de cierre:

- Cada tonelada adicional tiene origen, tipo, fuente y confianza.
- Toda gráfica de aportación adicional explica si el dato es temporal, permanente, estimado u oficial.

Prompt quirúrgico:

```text
Implementa Fase 13.2: macrogeneradores por tipo con variables, fuente, incertidumbre y regla anti-doble conteo. Conecta impacto a rutas, centros y mercado.
```

## Fase 13.3 - Portal Empresarial E Institucional

Objetivo: crear producto para organizaciones.

Alcance:

- `OrganizationalCircularityAssessment`;
- tipo de actividad;
- residuos principales;
- objetivo empresarial;
- acciones 30/60/90;
- reporte organizacional.

Tests:

- hotel, hospital, empresa e industria generan recomendaciones distintas;
- assessment exige ubicación y tipo de actividad;
- reporte distingue RSU de no RSU.

Criterio de cierre:

- El flujo empresarial no es una tabla: entrega guía práctica accionable.

Prompt quirúrgico:

```text
Implementa Fase 13.3: portal empresarial/institucional con OrganizationalCircularityAssessment. Debe entregar acciones 30/60/90, residuos por tipo, objetivos y reporte. No lo entierres dentro de macrogeneradores.
```

## Fase 13.4 - Proveedores Ambientales, Contenedores Y Residuos Regulados

Objetivo: aterrizar circularidad a operación física.

Alcance:

- proveedor ambiental cercano;
- plan de contenedores;
- ubicación sugerida;
- residuos regulados detectados;
- warnings normativos.

Tests:

- residuo regulado activa warning;
- proveedor requerido cuando aplica;
- plan de contenedores distingue flujo interno y disposición.

Criterio de cierre:

- El usuario sabe qué bote poner, dónde, qué separar y con quién disponer.

Prompt quirúrgico:

```text
Implementa Fase 13.4: proveedores ambientales, plan de contenedores y warnings para residuos regulados. No sugieras manejar residuos peligrosos/especiales como RSU ordinario.
```

## Fase 14.1 - Motor Financiero Por Negocio

Objetivo: separar ROI de centros, recicladoras y municipio.

Alcance:

- `BusinessCase`;
- precio con fuente;
- override justificado;
- TIR/VPN/payback por entidad.

Tests:

- TIR declara negocio;
- precio manual exige justificación;
- externalidad no se suma a flujo privado.
- cada output financiero declara qué se calcula, cómo, por qué, cuándo aplica, para quién aplica, fuente, unidad, incertidumbre y límite de uso.

Criterio de cierre:

- Nadie puede confundir rentabilidad privada con beneficio público.
- El modelo técnico-financiero-económico incluye anexo de cálculos con nombre, fórmula, fuente y explicación.

Prompt quirúrgico:

```text
Implementa Fase 14.1: BusinessCase separado por centro de acopio, recicladora y municipio. Cada TIR/VPN/payback debe declarar entidad. Override de precio requiere fuente o justificación.
```

## Fase 14.2 - Monte Carlo, Sensibilidad E Impacto

Objetivo: explicar incertidumbre financiera y ambiental.

Alcance:

- Monte Carlo 2000 simulaciones;
- P10/P50/P90;
- sensibilidad por negocio;
- `ImpactKPI` trazable.

Tests:

- P10/P50/P90 tienen explicación;
- Monte Carlo se liga a negocio;
- ImpactKPI exige fuente, unidad y fórmula.
- cada gráfica incluye texto de ayuda que explique lectura, supuestos, incertidumbre y decisión que habilita.
- existe anexo tabular de cálculos: nombre del cálculo, cálculo/fórmula, fuente de datos y explicación/razón del cálculo.

Criterio de cierre:

- La incertidumbre se entiende y no se maquilla.
- Ningún KPI o gráfica queda sin ayuda textual ni cálculo anexable.

Prompt quirúrgico:

```text
Implementa Fase 14.2: Monte Carlo, sensibilidad e ImpactKPI trazable. P10/P50/P90 deben explicarse para cabildo. Cada KPI requiere fuente, unidad, fórmula, estado de evidencia, texto de ayuda para cualquier gráfica y anexo de cálculo con nombre/fórmula/fuente/explicación.
```

## Fase 14.3 - Comparación De Escenarios

Objetivo: convertir escenarios en herramienta de decisión.

Alcance:

- guardar escenarios;
- conservar supuestos y proveniencia;
- matriz comparativa;
- narrativa de tradeoffs;
- exportación de comparación.

Tests:

- escenario guardado conserva fuentes/warnings;
- comparación muestra diferencias;
- exportación incluye supuestos.
- comparación gráfica incluye texto de ayuda y anexo de cálculos por escenario.

Criterio de cierre:

- Cabildo puede comparar opciones sin caja negra.
- Cada escenario puede explicar qué cambió, por qué cambió el resultado y qué cálculo lo sostiene.

Prompt quirúrgico:

```text
Implementa Fase 14.3: guardar y comparar escenarios con supuestos, fuentes, warnings y narrativa de tradeoffs. Exporta comparación con matriz y explicación.
```

## Fase 15.1 - Exportación Documental Profesional

Objetivo: paquete documental descargable, no archivos sueltos.

Alcance:

- `ProfessionalPackage`;
- documentos por audiencia;
- oficialidad;
- estado;
- bloqueos;
- manifest;
- ZIP profesional.

Tests:

- no `.txt` final;
- documento sin oficialidad falla;
- ZIP contiene manifest, fuentes y ClaimLedger.
- paquete incluye anexo de cálculos con tabla mínima: nombre del cálculo, cálculo/fórmula, fuente de datos y explicación o razón del cálculo.
- toda gráfica exportada incluye texto de ayuda o pie interpretativo.

Criterio de cierre:

- La plataforma permite descargar un paquete defendible.
- El paquete permite auditar el modelo técnico-financiero-económico sin caja negra.

Prompt quirúrgico:

```text
Implementa Fase 15.1: ProfessionalPackage con documentos por audiencia, oficialidad, estado, fuentes, bloqueos, manifest, anexo de cálculos y ZIP descargable. No aceptes .txt como producto final ni gráficas sin texto de ayuda.
```

## Fase 15.2 - Auditoría De Código Muerto Y Residuos Técnicos

Objetivo: limpiar sin destruir.

Alcance:

- rutas no usadas;
- componentes duplicados;
- endpoints obsoletos;
- tipos muertos;
- constantes sin uso;
- funciones decorativas.

Tests:

- build limpio;
- test suite completa;
- reporte de código removido o conservado;
- no se borra funcionalidad sin evidencia.

Criterio de cierre:

- El sistema queda más limpio y más explicable, no solo más pequeño.

Prompt quirúrgico:

```text
Implementa Fase 15.2 como auditoría de código muerto. Detecta y elimina solo con evidencia. No uses git reset ni borres módulos por intuición. Entrega reporte de qué se removió, qué se conservó y por qué.
```

## Fase 16.1 - Seguridad De API Y Configuración

Objetivo: blindar superficie básica antes de lanzamiento.

Alcance:

- variables de entorno;
- CORS;
- autenticación si aplica;
- límites de payload;
- errores sin fuga de secretos;
- headers de seguridad.

Tests:

- API rechaza payload inválido;
- no se exponen secretos;
- CORS no queda abierto sin razón;
- errores son trazables pero no filtran internals.

Criterio de cierre:

- La app no queda expuesta por configuración básica.

Prompt quirúrgico:

```text
Implementa Fase 16.1: hardening básico de API/configuración. Revisa env vars, CORS, payload limits, errores, headers y secretos. Agrega tests de rechazo y no exposición.
```

## Fase 16.2 - Seguridad De Documentos, Descargas Y Datos

Objetivo: proteger paquetes, descargas e inputs.

Alcance:

- autorización de descarga;
- validación de package_id;
- sanitización de nombres de archivo;
- protección contra path traversal;
- expiración o control de acceso;
- logs auditables.

Tests:

- package_id malicioso falla;
- descarga ajena no procede si hay auth;
- ZIP no incluye rutas externas;
- nombres de archivo se sanitizan.

Criterio de cierre:

- Exportación profesional no abre huecos de seguridad.

Prompt quirúrgico:

```text
Implementa Fase 16.2: seguridad de paquetes y descargas. Valida package_id, sanitiza filenames, evita path traversal y controla acceso. Agrega tests de intentos maliciosos.
```

## Fase 17.1 - Release Candidate Local/Docker

Objetivo: comprobar que todo corre integrado.

Alcance:

- Docker build;
- backend;
- frontend;
- rutas principales;
- generación documental;
- descarga;
- smoke tests.

Tests:

- `docker compose up` o equivalente corre;
- rutas críticas responden;
- UI carga;
- paquete se genera y descarga.

Criterio de cierre:

- Un tercero puede levantar la app y recorrer flujo mínimo sin intervención verbal.

Prompt quirúrgico:

```text
Implementa Fase 17.1: release candidate local/Docker. Verifica build, backend, frontend, rutas críticas, generación documental y descarga. Entrega comandos exactos y resultados.
```

## Fase 17.2 - Checklist De Lanzamiento

Objetivo: preparar salida controlada.

Alcance:

- variables requeridas;
- dominios;
- almacenamiento;
- monitoreo básico;
- backups;
- límites conocidos;
- guía de operación.

Tests:

- checklist completo;
- variables faltantes detectadas;
- healthcheck;
- guía de rollback.

Criterio de cierre:

- El lanzamiento no depende de memoria oral.

Prompt quirúrgico:

```text
Implementa Fase 17.2: checklist de lanzamiento con env vars, healthchecks, almacenamiento, monitoreo básico, backups, límites conocidos y rollback. No lances sin checklist reproducible.
```

## Matriz De Prueba De Solución

| Subfase | API observable | UI observable | Tests | Exportación | Riesgo principal |
|---|---:|---:|---:|---:|---|
| 10.1 | Sí | Sí | Sí | No | entrada decorativa |
| 10.2 | Parcial | Sí | Sí | No | tabs sin arquitectura |
| 11.1 | Sí | Sí | Sí | No | ZM como municipio |
| 11.2 | Sí | Sí | Sí | Sí | documento legal falso-oficial |
| 12.1 | Parcial | Sí | Sí | Sí | texto técnico incomprensible |
| 12.2 | Sí | Sí | Sí | Sí | horizonte aislado |
| 12.3 | Sí | Sí | Sí | Sí | operación sin responsable |
| 12.4 | Sí | Sí | Sí | Sí | multas sin base legal |
| 13.1 | Sí | Sí | Sí | Sí | centros sin territorio |
| 13.2 | Sí | Sí | Sí | Sí | doble conteo |
| 13.3 | Sí | Sí | Sí | Sí | portal empresarial superficial |
| 13.4 | Sí | Sí | Sí | Sí | residuos regulados tratados como RSU |
| 14.1 | Sí | Sí | Sí | Sí | ROI mezclado |
| 14.2 | Sí | Sí | Sí | Sí | incertidumbre maquillada |
| 14.3 | Sí | Sí | Sí | Sí | escenarios sin supuestos |
| 15.1 | Sí | Sí | Sí | Sí | documentos sin manifest |
| 15.2 | No | No | Sí | Reporte | borrar sin evidencia |
| 16.1 | Sí | No | Sí | No | configuración insegura |
| 16.2 | Sí | Parcial | Sí | Sí | descarga vulnerable |
| 17.1 | Sí | Sí | Sí | Sí | integración rota |
| 17.2 | Sí | No | Sí | No | lanzamiento oral/no reproducible |

## Prompt Maestro Para Agente Codificador

```text
Lee primero README_REESTRUCTURA.md, 15_backlog_fases_11_a_15.md y 16_roadmap_granular_10_1_a_17.md. Ejecuta una sola subfase por iteración. Antes de editar, crea checklist con archivos, contrato de datos, API/UI esperada, tests y criterio de cierre. No cierres por compilar: cierra por prueba de solución observable. Mantén ciudad/municipio/ZM separados, distingue propuesta/simulación/dictamen/oficial, conserva proveniencia y no trates residuos regulados como RSU.
```
