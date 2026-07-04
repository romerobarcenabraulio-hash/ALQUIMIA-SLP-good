# PLAN CONTINUACION · ADMIN LIMPIO Y VISTA CLIENTE POR MUNICIPIO PREPARADO

**Estado:** Addendum operativo post-rescate · agregado al plan
**Fecha:** 3 junio 2026
**Ruta de implementacion primaria:** `/admin`, `/perfil`, `/v`, `/p`, `/e`
**Fuente:** instruccion post-rescate para continuar separando admin, cliente y preparacion municipal

## Summary

Continuar el rescate separando definitivamente el **Admin Operativo** de la **Vista Cliente Consultiva**.

Terminos canonicos:

- **Admin Operativo:** donde el founder administra municipios, tenants, usuarios, documentos, reglamentos, bibliografia, gates y exports.
- **Vista Cliente:** lo que vera el funcionario municipal.
- **Previsualizacion Cliente:** modo dentro de admin para ver un municipio como cliente sin contaminar la experiencia real.
- **Municipio Preparado:** municipio con expediente minimo habilitado, especialmente reglamento identificado o cargado.

Regla central:

**El admin selecciona y prepara municipios; el cliente consume una consultoria limpia del municipio asignado.**

## Key Changes

- Depurar `/admin` para que sea el centro de mando.
- Sacar de `/v`, `/p`, `/e` cualquier logica operativa que pertenezca a admin.
- Crear estado claro de municipio:
  - `sin_preparar`;
  - `reglamento_identificado`;
  - `reglamento_cargado`;
  - `bibliografia_minima`;
  - `listo_para_cliente`;
  - `en_cliente`.
- Admin puede seleccionar cualquier municipio del catalogo INEGI.
- Admin puede preparar municipios antes de que exista cliente formal.
- Cliente no selecciona cualquier municipio; ve solo el suyo.
- Admin puede usar "Previsualizar como cliente" para revisar la experiencia final.

## Implementation Changes

### 1. Admin Como Command Center

Reestructurar `/admin` en cuatro zonas claras:

1. **Tabla maestra**
   - municipio;
   - estado;
   - clave INEGI;
   - tenant;
   - usuario principal;
   - etapa;
   - estado reglamento;
   - bibliografia;
   - documentos;
   - proxima accion.

2. **Preparacion municipal**
   - buscar municipio por INEGI;
   - crear expediente preliminar;
   - vincular reglamento existente;
   - subir reglamento si falta;
   - correr bibliografia/research cache;
   - marcar como municipio preparado.

3. **Operacion tenant**
   - usuarios;
   - documentos solicitados;
   - gates;
   - exports;
   - pagos/facturacion si aplica;
   - auditoria.

4. **Previsualizacion**
   - boton "Ver como cliente";
   - abre `/v?tenant_id=...&preview=client`;
   - sin permitir edicion desde la vista cliente;
   - con banner interno solo para admin.

### 2. Municipio Preparado

Definir contrato minimo:

```ts
type MunicipalityPreparationStatus =
  | 'sin_preparar'
  | 'reglamento_identificado'
  | 'reglamento_cargado'
  | 'bibliografia_minima'
  | 'listo_para_cliente'
  | 'en_cliente'
```

Criterios:

- `sin_preparar`: existe en INEGI, pero sin expediente ALQUIMIA.
- `reglamento_identificado`: hay fuente oficial o catalogo.
- `reglamento_cargado`: PDF local/subido disponible.
- `bibliografia_minima`: hay evidencia nacional/estatal/comparable suficiente para calculo trazable.
- `listo_para_cliente`: puede mostrarse diagnostico preliminar sin inventar.
- `en_cliente`: municipio vinculado a tenant/usuario real.

Reglamento sigue siendo el unico bloqueo formal para plan/declaratoria.

### 3. Modulos Mezclados

Clasificar modulos actuales en tres grupos:

- **Cliente**
  - diagnostico;
  - propuesta;
  - planeacion;
  - ejecucion/control;
  - mapas;
  - graficas;
  - evidencia;
  - citas;
  - export consultivo.

- **Admin**
  - documentos faltantes;
  - uploads;
  - gates;
  - tenant IDs;
  - usuarios;
  - readiness;
  - QA;
  - audit log;
  - bibliografia operativa.

- **Cuarentena**
  - renderers genericos;
  - modulos feos de reemplazo;
  - vistas duplicadas;
  - componentes que muestran solo brechas sin calculo o visualizacion util.

Cierre: ningun modulo admin aparece en navegacion cliente.

### 4. Vista Cliente Limpia

En `/v`, `/p`, `/e`:

- cliente ve solo su municipio;
- no ve selector INEGI;
- no ve tenant ID;
- no ve documentos faltantes como navegacion;
- no ve gates internos;
- no ve admin readiness;
- no ve modulos tecnicos desordenados.

Si ve:

- Diagnostico;
- Propuesta;
- Planeacion;
- Ejecucion/control;
- mapas y graficas;
- calculos trazables;
- fuente, metodo, alcance, confianza;
- limites metodologicos.

### 5. Admin Puede Moverse Libremente

Admin debe poder:

- buscar cualquier municipio INEGI;
- abrir municipios preparados;
- crear tenant desde municipio;
- vincular usuario;
- revisar reglamento;
- cargar bibliografia;
- previsualizar cliente;
- volver al admin sin perder contexto.

La navegacion admin no depende de `/v`; `/v` es solo preview/cliente.

### 6. Depuracion

Eliminar o aislar:

- `StageWorkspace` como renderer;
- document gap UI dentro de cliente;
- status "Brecha documental" en nav cliente;
- selector de tenant dentro de cliente;
- componentes que duplican modulos legacy;
- copy de "simulador" en cliente;
- nombres internos de agentes.

Conservar:

- `renderDecisionModule`;
- mapas;
- encuesta;
- PDF/adendos;
- Sankey;
- escenarios;
- mercado/materiales;
- logistica;
- costos;
- riesgos;
- exports;
- bibliografia.

## Test Plan

- Admin:
  - puede filtrar INEGI;
  - puede seleccionar municipio sin cliente;
  - puede marcar municipio preparado;
  - puede vincular tenant;
  - puede previsualizar como cliente.
- Cliente:
  - no ve selector INEGI;
  - no ve documentos faltantes en navegacion;
  - no ve tenant IDs;
  - ve solo su municipio;
  - ve modulos consultivos ordenados.
- Evidence:
  - municipio con reglamento cargado permite plan/declaratoria;
  - municipio sin reglamento permite diagnostico preliminar, no declaratoria;
  - bibliografia comparable alimenta contexto/calculo, no verdad municipal.
- Cleanup:
  - `/v`, `/p`, `/e` no importan `StageWorkspace`;
  - `/v`, `/p`, `/e` no importan `DocumentGapBanner`;
  - modulos legacy utiles siguen importados por `renderDecisionModule`;
  - no quedan modulos genericos feos como renderer cliente.

## Assumptions

- "Parte de cliente" se llamara **Vista Cliente**.
- "Verlo como cliente desde admin" se llamara **Previsualizacion Cliente**.
- "Municipio preparado" significa municipio listo para mostrar diagnostico preliminar trazable.
- Admin puede preparar municipios antes de tener cliente formal.
- Cliente nunca escoge libremente municipios cross-tenant.

## Ubicacion En El Plan Actual

Este addendum se inserta dentro de:

- **Bloque B · Plataforma 0/backoffice**, como criterio especifico de admin operativo y preparacion municipal.
- **Bloque D · Separacion de journeys `/v`, `/p`, `/e`**, como regla de que cliente no selecciona municipio ni ve herramientas admin.
- **Fase post-rescate actual**, despues de cortar contaminacion cliente y antes de reordenar `/admin` como command center completo.

Prioridad inmediata:

1. Formalizar `MunicipalityPreparationStatus`.
2. Reordenar `/admin` en tabla maestra, preparacion municipal, operacion tenant y previsualizacion.
3. Conectar boton "Previsualizar como cliente" con `/v?tenant_id=...&preview=client`.
4. Mantener `/perfil` como lugar de pendientes personales/documentales del funcionario.
