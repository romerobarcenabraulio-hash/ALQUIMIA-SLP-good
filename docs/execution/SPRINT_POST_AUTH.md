# SPRINT POST AUTH · Ejecucion cerrada para recuperar coherencia del MVP

**Estado:** ejecutable semanal.
**Ventana:** 30 mayo - 5 junio 2026.
**Fuente de verdad:** `FULL_AUDIT.md`, `NAVIGATION_AND_PHILOSOPHY.md`, `WEEK_PLAN_FINAL_AND_LOCK.md`.
**Decision:** no agregar arquitectura nueva; ejecutar seis bloques verificables.

---

## Regla operativa

No avanzar de bloque si el anterior no queda verificado en navegador o por evidencia directa equivalente.

No agregar features fuera de estos seis bloques.

No usar datos ficticios, benchmarks, inferencias o graficas hipoteticas para simular madurez.

---

## Bloque 0 · Verificacion P0 de acceso founder

**Objetivo:** confirmar que el founder puede entrar antes de construir nada mas.

### Alcance

- Verificar `/sign-in`.
- Verificar acceso founder a `/v`.
- Verificar que Twilio/SMS no forma parte del flujo activo.
- Verificar que el acceso no depende de `demo@alquimiaplatform.com` si ese correo no existe.

### No hacer

- No tocar modulos.
- No rehacer auth completo.
- No agregar filtro institucional.

### Cierre binario

`POST_AUTH_BLOCK_0: PASS` solo si:

1. Founder entra en entorno real.
2. Founder llega a `/v`.
3. Puede navegar al menos M00/M00B o equivalente.
4. No hay dependencia activa de SMS/Twilio.

Si no, `POST_AUTH_BLOCK_0: FAIL`.

---

## Bloque 1 · Switcher admin/cliente

**Objetivo:** founder puede alternar entre vista admin/founder y vista cliente sin confundirse ni tocar tenant real por accidente.

### Alcance

- Agregar o verificar un control visible solo para role founder/admin.
- Modo `Founder/Admin`: deja claro que es interno.
- Modo `Cliente`: permite ver la experiencia cliente sin privilegios destructivos.
- Todo cambio de modo debe ser reversible.
- Debe quedar auditado o al menos registrado localmente.

### Reglas

- Cliente real no ve el switcher.
- Partner no existe en este sprint.
- No abrir Plataforma 0 completa.

### Cierre binario

`POST_AUTH_BLOCK_1: PASS` solo si:

1. Founder ve switcher.
2. Usuario no-founder no ve switcher.
3. Founder puede cambiar a vista cliente.
4. No se exponen acciones admin en vista cliente.
5. No se rompe `/v`.

---

## Bloque 2 · Municipio Demo vacio y honesto

**Objetivo:** crear experiencia sandbox navegable, vacia de datos ficticios, alineada con cero invencion.

### Alcance

- Tenant demo: `Municipio Demo · Estado Demo · INEGI DEMO-001`.
- Sin cifras realistas inventadas.
- Sin benchmarks precargados.
- Sin graficas con datos falsos.
- Muestra estructura de modulos y requerimientos documentales.
- Banner visible:
  `Sandbox founder · estructura vacia para demostrar navegacion. No contiene datos reales ni estimados.`

### Cierre binario

`POST_AUTH_BLOCK_2: PASS` solo si:

1. Founder puede seleccionar Municipio Demo.
2. Municipio Demo no contiene datos ficticios.
3. Modulos se ven como estructura vacia con documentos requeridos.
4. No hay SLP hardcodeado en esa experiencia.
5. Banner de sandbox visible.

---

## Bloque 3 · M03B justificacion tecnica restaurada

**Objetivo:** restituir la subseccion de justificacion tecnica de M03B sin convertirla en dictamen ni aprobacion.

### Alcance

- M03B debe mostrar propuesta reglamentaria como borrador.
- Debe incluir justificacion tecnica.
- Debe diferenciar:
  - reglamento vigente;
  - documento pendiente;
  - propuesta;
  - justificacion;
  - revision humana requerida.

### Reglas

- No decir que la reforma esta aprobada.
- No decir que la plataforma dictamina.
- Si falta reglamento vigente, mostrar brecha documental.

### Cierre binario

`POST_AUTH_BLOCK_3: PASS` solo si:

1. M03B contiene justificacion tecnica.
2. Si falta reglamento, se muestra brecha.
3. La propuesta es preliminar.
4. No hay nombres internos de agentes cliente-facing.

---

## Bloque 4 · Revision visual de modulos pilar

**Objetivo:** quitar la sensacion de documento crudo, mezcla vieja y estilos inconsistentes en los modulos principales.

### Modulos

- M00
- M00B
- M01
- M03B
- M04
- M13
- M14
- M15 si existe

### Correcciones permitidas

- Espaciado.
- Jerarquia tipografica.
- Anchos de lectura.
- Headers.
- Banners de brecha.
- Estados vacios.
- CTAs.
- Tokens de color existentes.

### No hacer

- No inventar datos.
- No agregar graficas falsas.
- No reescribir arquitectura.

### Cierre binario

`POST_AUTH_BLOCK_4: PASS` solo si:

1. No hay texto importante pegado a la izquierda como documento crudo.
2. Los estados vacios son claros.
3. Las brechas son visibles.
4. Desktop y mobile son usables.
5. No hay cards dentro de cards en los modulos revisados.

---

## Bloque 5 · Inventario de diagramas existentes

**Objetivo:** decir la verdad sobre diagramas. No construir graficas si no hay datos reales.

### Alcance

Crear o actualizar:

`docs/execution/DIAGRAMS_REALITY_INVENTORY.md`

Debe listar:

- modulo;
- diagrama requerido por la vision;
- existe en codigo si/no;
- datos reales requeridos;
- se puede renderizar hoy sin inventar si/no;
- accion futura.

### Regla

Si no hay datos reales, el diagrama no se renderiza. Se muestra estado vacio o requerimiento documental.

### Cierre binario

`POST_AUTH_BLOCK_5: PASS` solo si:

1. Inventario existe.
2. Ningun diagrama ficticio queda como obligatorio inmediato.
3. Se documenta que los diagramas dinamicos entran cuando haya datos reales.

---

## Bloque 6 · Smoke test final founder/local

**Objetivo:** verificar que el founder puede navegar una hora sin que el producto se rompa o mienta.

### Flujo

1. Entrar.
2. Cambiar vista admin/cliente.
3. Seleccionar Municipio Demo.
4. Abrir M00.
5. Abrir M00B.
6. Ver modulos bloqueados.
7. Abrir M03B si corresponde.
8. Confirmar estados vacios.
9. Confirmar ausencia de datos ficticios.
10. Confirmar ausencia de nombres internos cliente-facing.

### Documento

Crear:

`docs/execution/SPRINT_POST_AUTH_SMOKE_TEST.md`

### Cierre binario

`SPRINT_POST_AUTH: PASS` solo si los seis bloques anteriores estan en PASS.

Si Bloque 0 falla, todo el sprint falla.
Si Bloque 1 o 2 falla, no hay MVP demostrable.
Si Bloque 3-6 falla, el sprint queda `PARTIAL`, no `PASS`.

