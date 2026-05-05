# Prompts · tareas pendientes + agente futuro (planeación / logística documental)

**Uso:** copiar cada bloque ` ```text ` … ` ``` ` en un chat nuevo con el rol indicado.  
**Sincronía:** alinea con `COLA_Y_ROLES_AGENTES.md` y el append **CSA — Release serio** en `BITACORA_AUDITORIA_PLANEACION.md`.

---

## 0 · Página en Vercel (aclaración rápida)

El plugin Vercel **no sustituye** escribir la UI en el repo: la **landing / páginas** siguen viviendo en `frontend/` (Next.js). Lo que Vercel hace es **construir y servir** ese código cuando conectas el repo y defines **Root Directory** (`frontend`), variables y dominio.

**Si la “página” que falta es la de 17.1** (hero, CTAs demo vs institucional, aviso de privacidad/actividad): eso es **Q-003 · Ejecutor** según `archivos_ejecutados/17_1_publicacion_y_control_de_acceso.md`, no un prompt mágico del plugin.

---

## 1 · Prompts por ítem COLA (pegables)

### Q-001 · Auditor — Cierre Fase 22 vs blueprints `22_0`–`22_6`

```text
Operas como AUDITOR según cursor-rules/AUDITOR.md.
Objetivo: cerrar Q-001 — revisar implementación actual vs blueprints 22_0…22_6 en AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/.
Entrega: tabla PASS/FAIL por blueprint con rutas de código o gaps; si FAIL, prompt quirúrgico por archivo para Ejecutor.
Prohibido: aprobar sin evidencia en repo o sin contradicción explícita vs spec.
```

### Q-002 · Ejecutor — 22.6 server-side `audience` (solo si Auditor lo exige)

```text
Operas como EJECUTOR según cursor-rules/EJECUTOR.md.
Condición: solo si Auditor marcó gap en Q-001 sobre audience server-side.
Objetivo: exponer/validar audiencia en backend según 22_6_evolucion_backend_audience.md sin romper portal ni contratos API.
Entrega: PR + pytest nuevo o extendido (nombre sugerido test_fase22_audience.py) + nota en bitácora.
```

### Q-003 · Ejecutor — 17.1 publicación + control de acceso (+ landing)

```text
Operas como EJECUTOR según cursor-rules/EJECUTOR.md.
Fuente: AJUSTES.ALQUIMIA/archivos_ejecutados/17_1_publicacion_y_control_de_acceso.md + checklist Release serio R1–R3 en BITACORA (append CSA).
Objetivo: (1) Frontend desplegable en Vercel con Root Directory frontend/, NEXT_PUBLIC_API_URL acorde entorno. (2) Backend en runtime estable con TLS y /health. (3) Auth según spec (p. ej. Supabase): middleware rutas sensibles front + JWT en FastAPI en rutas acordadas. (4) Landing 17.1: mensaje consultoría, CTA demo vs institucional, aviso trazabilidad/privacidad.
Entrega: .env.example actualizado, README deploy corto, sin secretos en repo; append en bitácora con URLs staging/prod.
```

### Q-004 · CSA / Navigator — 23.1 geo (solo con orden explícita)

```text
Navigator según cursor-rules/NAVIGATOR.md.
Contexto: 23.1 NO autorizada por Navigator mientras 6–7 CVE/MGN en FAIL salvo orden CSA de riesgo documentada.
Si CSA autoriza: revisar diff propuesto contra 23_integridad_geoespacial_y_capas.md y emitir PASS/FAIL corto en bitácora.
```

### Q-005 · Ejecutor — Fase 24 (release gate E2E + observabilidad)

```text
Operas como EJECUTOR según cursor-rules/EJECUTOR.md.
Fuente: 24_release_gate_e2e_observabilidad.md + checklist Release R4–R5 en bitácora.
Objetivo: (24.A) Un flujo E2E automatizado (Playwright recomendado) contra BASE_URL configurable: /simulator con backend vivo, audiencia mínima. (24.B) Request ID en FastAPI + correlación logs; decisión documentada para errores frontend.
Entrega: scripts en repo + opcional job CI contra staging; Auditor debe poder reproducir.
```

### Q-006 · Aesthete + Ejecutor — Fase 25 tokens / design-as-code

```text
AESTHETE-1 según cursor-rules/AESTHETE-1.md + handoff a Ejecutor.
Objetivo: tabla de tokens (color, tipo, espaciado) versionada y enlazada desde README; Ejecutor integra en Tailwind/theme sin romper NarrativeBridge ni gateway audiencia.
```

### §6.3 · Humano o CI — Lighthouse real

```text
Tarea operativa (humano o runner con Node+Chrome).
En máquina con frontend instalado: configurar LIGHTHOUSE_URL al deployment HTTPS del simulador y ejecutar npm run audit:lighthouse:ci en frontend/ (ver frontend/scripts/README-LIGHTHOUSE.md).
Append en BITACORA: fecha, URL, comando, accessibility score y LCP del JSON generado.
```

### Release serio · Ejecutor — paquete integral (si prefieren un solo chat)

```text
Operas como EJECUTOR según cursor-rules/EJECUTOR.md.
Cerrar checklist R1–R7 del append CSA “Release serio” en BITACORA_AUDITORIA_PLANEACION.md, en orden: deploy front/back → auth → E2E → logs → coordinación con humano para Lighthouse si no hay CI Chrome → DNS/release notes documentados.
No iniciar 23.1 sin orden CSA/Navigator.
```

---

## 2 · Agente futuro: “Planeación + logística documental” (especificación)

Idea: un agente **no sustituye** abogados ni despachos; **produce borradores** de paquete PM / gobierno de proyecto y **diagramas** bajo supuestos declarados, para que **humano + Auditor** los firmen.

### 2.1 Rol sugerido (prompt sistema corto)

```text
Eres un agente de DOCUMENTACIÓN DE PROYECTO Y LOGÍSTICA para iniciativas público-privadas tipo plataforma municipal.
No emitís dictamen legal ni oficialidad gubernamental. Marcás todo lo inferido como SUPUESTO y pedís datos faltantes.
Salidas: Markdown estructurado + tablas + diagramas en Mermaid (o Graphviz textual). Idioma: español institucional mexicano, neutro y revisable.
Si falta información crítica: listá “BLOQUEANTES DE ENTRADA” antes de simular fechas o responsables.
```

### 2.2 Entradas mínimas que debería pedir el agente

- Objetivo del proyecto y **alcance** (qué está dentro / fuera).
- Patrocinador / sponsor y **quién decide** (gobernanza).
- Fecha objetivo o ventana (mes/año).
- Restricciones: presupuesto orden de magnitud, personal disponible, proveedores ya elegidos.
- Lista preliminar de áreas (TI, legal, operaciones campo, comunicación, etc.).

### 2.3 Paquete de salidas “tipo consultoría” (lista ampliable)

| Artefacto | Para qué sirve |
|-----------|----------------|
| Acta de constitución / charter | Misión, alcance alto nivel, criterios de éxito, sponsor |
| Registro de stakeholders + matriz poder/interés | Quién involucrar y cómo |
| RACI o RAM por entregable | Evitar ambigüedad de responsabilidad |
| EDTP / WBS (descomposición trabajo) | Base para cronograma y costos |
| Cronograma (hitos) + **PERT** o **ruta crítica** (texto + Mermaid) | Dependencias y buffer |
| Diagrama de red / dependencias entre paquetes de trabajo | Comunicación con equipo técnico |
| Curva S / loading de recursos (tabla si no hay números) | Picos de carga |
| Plan de riesgos (registro + mitigaciones) | Auditoría y CSA |
| Plan de comunicaciones | Quién dice qué y cuándo |
| Plan de calidad / DoD por fase | Alineado a `17_gobernanza_calidad_riesgo_y_dod.md` si aplica |
| Matriz trazabilidad requisitos ↔ entregables | Para demo “release serio” |
| Documento de supuestos y exclusiones | Blindaje legal de simulación |

### 2.4 Logística (extensión natural del mismo agente)

- Cadena de suministro **informacional** (quién entrega qué dato a quién y cuándo).
- Diagramas de flujo operativo (recolección RSU, centros de acopio) como **modelos**, no como obligación normativa.
- KPIs logísticos orientativos (toneladas, recorridos, tiempos) solo con **fuente o supuesto** explícito.

### 2.5 Límites duros (para Auditor / CSA)

- No inventar **normas** o **obligaciones legales** sin cita verificable.
- No presentar diagramas como **aprobados por autoridad**.
- Fechas y costos: rangos o **TBD** si no hay datos.

---

## 3 · Qué más conviene revisar (además de PERT / red / cronograma)

- **Propiedad intelectual y licencias** del código y contenidos generados por IA.
- **Protección de datos personales** (registro de actividad en 17.1 alineado a aviso de privacidad real).
- **Continuidad operativa**: quién opera el sistema después del lanzamiento (runbooks).
- **Accesibilidad y evidencia §6.3** antes de comunicación amplia (WhatsApp, redes).
- **Navigator / geo**: si el discurso público menciona mapas o límites territoriales, sincronizar con estado 23.1 y CVE/MGN.
- **Supply chain de dependencias** (npm/pypi) y política de actualización (relacionado con CI).

---

## 4 · Siguiente paso recomendado para vos (CSA)

1. Ejecutar en paralelo: **Q-003** (Ejecutor) + configuración Vercel/DNS (humano).  
2. Cuando exista URL estable: **§6.3** + **Q-005**.  
3. Abrir chat aparte con el **prompt §2.1** cuando tengas lista la **lista propia** de documentos obligatorios internos; el agente completará el paquete §2.3 con tus prioridades.
