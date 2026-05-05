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

---

## 3b · Prompts nuevos (Q-003 ampliado, Q-007, Q-008, Q-009, Q-010) — 2026-05-05

### Q-003 ampliado · Ejecutor — Backend + landing + auth + gates implícitos + botón Home

```text
Operas como EJECUTOR según cursor-rules/EJECUTOR.md.

Fuentes: archivos_ejecutados/17_1_publicacion_y_control_de_acceso.md + 27_selector_estado_municipio_y_generacion_universal.md (solo ítem botón Home) + checklist Release R1–R3 en BITACORA.

Paquete completo Q-003:

1. BACKEND DEPLOY
   - Preparar backend/ para deploy en Railway o Render (Dockerfile ya existe en backend/).
   - Revisar backend/.env.example y documentar variables obligatorias mínimas para arrancar.
   - Endpoint /health público. CORS habilitado para https://alquimia-slp.vercel.app y cualquier *.vercel.app del proyecto.
   - Documentar URL resultante para NEXT_PUBLIC_API_URL en Vercel.

2. NEXT_PUBLIC_API_URL
   - Cuando exista URL pública del backend, actualizar variable en Vercel (Settings → Environment Variables) y hacer Redeploy.
   - Confirmar que "Failed to fetch" desaparece en /simulator.

3. LANDING 17.1
   - Página de entrada (/) con: hero claro ("Plataforma de consultoría en circularidad municipal"), CTA dual ("Explorar demo" / "Acceder con cuenta institucional"), aviso de qué se registra y qué no es oficial.
   - Estética consultoría senior, sin colores planos, badges de trazabilidad.

4. AUTH MÍNIMO
   - Middleware frontend: rutas /simulator, /hub, /ca-studio protegidas; redirigen a /login si no hay sesión.
   - Backend: validar token en rutas sensibles; /health siempre público.
   - No implementar auth compleja si bloquea el deploy — documenta el gap y deja stub funcional.

5. GATES JURÍDICOS → IMPLÍCITOS (Q-003-UX)
   - Eliminar todos los banners/cards con texto "Gate obligatorio Fase X.X" como elemento visual propio.
   - La lógica de bloqueo se mantiene: si la condición no se cumple, el flujo no avanza.
   - Al usuario solo se muestra la acción necesaria ("Selecciona una ciudad para continuar") sin terminología interna de gates.
   - Buscar en: AdvertenciasGateLegal.tsx, GovernancePanel.tsx, cualquier componente con "GATE OBLIGATORIO" en el JSX.

6. BOTÓN HOME ALQUIMIA
   - El logo/nombre "ALQUIMIA" en el header es siempre un botón.
   - Click → si hay datos activos: modal de confirmación ("¿Regresar al inicio? Guardar / Salir sin guardar / Cancelar").
   - Si no hay datos: navega directo a / (selector de municipio).
   - Implementar en Header.tsx o layout.tsx según estructura actual.

Entrega: PR con código + append en BITACORA con URL backend, CORS verificado, pantalla /login y / funcionales.
No iniciar 23.1 ni Fase 27 completa sin orden CSA/Navigator.
```

---

### Q-007 · Ejecutor — Fase 26: Reglamentos modal + docs descargables SLP completos

```text
Operas como EJECUTOR según cursor-rules/EJECUTOR.md.
Fuente: 26_reglamentos_fuente_primaria_y_documentacion.md

Este paquete puede correr EN PARALELO con Q-003 (no requiere backend).

1. DATOS DE REGLAMENTOS
   - Crear frontend/src/data/reglamentos.ts con interfaz ReglamentoFuente (ver blueprint 26.A).
   - Poblar con entradas iniciales para SLP, Soledad de Graciano Sánchez, QRO, NL.
   - Para municipios sin URL verificada: estado_verificacion: 'no_localizado' (no omitir la entrada).
   - CSA proveerá las URLs reales de los reglamentos — dejar TODOs claros donde falten.

2. COMPONENTE MODAL/DRAWER
   - Componente ReglamentoModal.tsx: recibe municipio_id + referencia artículo.
   - Muestra: nombre reglamento, año, captura (imagen estática de /public/reglamentos/), enlace al PDF oficial, estado de verificación con badge de color.
   - Accesible: foco atrapado, aria-modal, cierre con Esc. Mobile: drawer desde abajo.
   - Si url_fuente vacía: "Fuente pendiente de localización" + botón "Reportar fuente".

3. INTEGRACIÓN
   - Insertar ícono/enlace de fuente en: MarcoLegal.tsx, AdvertenciasGateLegal.tsx, DiagnosticoJuridico.tsx.
   - Click en ícono → abre ReglamentoModal con el reglamento correspondiente.

4. HUB DE DOCUMENTOS COMPLETO
   - Revisar /hub y listar TODOS los documentos del capítulo SLP que existían antes.
   - Los documentos no generados aún: mostrar con estado "En elaboración" (no ocultar).
   - Botón "Descargar paquete ZIP" con todos los disponibles + README_paquete.md.

Entrega: PR + lista de TODOs con URLs de reglamentos pendientes para que CSA/humano complete.
```

---

### Q-008 · Agente PM — Evaluación del proyecto

```text
[PEGAR PRIMERO EL PROMPT SISTEMA DE AGENTE_PM_DIRECTOR_PROYECTOS.md]

Una vez cargado el contexto, evalúa ALQUIMIA respondiendo la agenda completa (secciones A–F del archivo).

Contexto adicional para tu evaluación:
- Estado actual: frontend en Vercel (alquimia-slp.vercel.app); backend aún local → "Failed to fetch" en prod.
- Q-001 (Auditor Fase 22): HECHO. Q-003 (backend + auth + landing): SIGUIENTE.
- Fases nuevas aprobadas por CSA hoy: 26 (reglamentos fuente), 27 (selector Estado→Municipio nacional), agente jurídico.
- El equipo opera con agentes Cursor (Ejecutor, Auditor, Navigator, Aesthete) + CSA humano.
- No hay cronograma formal aún. No hay acta de constitución. No hay registro de stakeholders formal.

Entrega esperada:
1. Diagnóstico de madurez (1 párrafo).
2. Top 5 riesgos con probabilidad e impacto.
3. Ruta crítica hacia primer municipio cliente real (diagrama Mermaid o tabla de hitos).
4. Lista de artefactos PM faltantes priorizados.
5. 3 insights que el equipo probablemente está ignorando.

Guarda resultados en: AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/planeacion_ejecucion/PM_EVALUACION_INICIAL_2026-05-05.md
```

---

### Q-009 · Ejecutor + Navigator — Fase 27: Selector Estado → Municipio

```text
Operas como EJECUTOR según cursor-rules/EJECUTOR.md.
Fuente: 27_selector_estado_municipio_y_generacion_universal.md
Navigator valida CVE INEGI antes de merge (ver cursor-rules/NAVIGATOR.md §5).

DEPENDENCIA: iniciar solo después de Q-003 resuelto (backend + auth funcionando).

1. CATÁLOGO INEGI
   - Descargar/generar frontend/src/data/estados_municipios.ts desde el catálogo oficial INEGI (Catálogo de Claves de Entidades Federativas, Municipios y Localidades — MGN vigente).
   - Estructura mínima: { cve_ent, cve_mun, nombre_mun, nombre_estado, poblacion_2020? }.
   - Navigator debe confirmar que los CVE son los oficiales antes de usar en prod.

2. SELECTOR UI (dos pasos)
   - Reemplazar CityFirstSelector / SelectorZM por selector Estado → Municipio.
   - Paso 1: lista/dropdown de 32 entidades federativas.
   - Paso 2: lista filtrada de municipios del estado elegido.
   - Header siempre muestra Estado · Municipio activos.

3. LÓGICA DE ESCENARIO
   - Si municipio tiene datos verificados (SLP, QRO, NL): carga escenario real.
   - Si no: genera escenario estimado con parámetros nacionales de referencia (0.86 kg/hab/día SEMARNAT, composición RSU promedio nacional).
   - Banner claro en escenario estimado: "Datos nacionales de referencia — no verificado para este municipio."
   - Tres niveles visuales: verde (verificado), amarillo (estimado), rojo (insuficiente).

4. BOTÓN HOME (si no se hizo en Q-003)
   - Logo ALQUIMIA en header → confirmación → regresa a selector Estado/Municipio.

5. DOCUMENTOS UNIVERSALES
   - Paquete descargable disponible para cualquier municipio seleccionado.
   - Si es estimado: documentos incluyen tabla de supuestos y fuentes.

Entrega: PR + Navigator PASS en bitácora sobre CVE + Auditor confirma disclaimers escenario estimado.
```

---

### Q-010 · Agente Jurídico Legal — Revisión antes de release público

```text
[PEGAR PRIMERO EL PROMPT SISTEMA DE AGENTE_JURIDICO_LEGAL.md]

ACTIVAR ANTES DE: liberar URL a usuarios reales / firmar con cualquier municipio.

Archivos para revisar (pedir al agente que los lea):
- frontend/src/components/simulator/MarcoLegal.tsx
- frontend/src/components/simulator/AdvertenciasGateLegal.tsx
- frontend/src/components/simulator/DiagnosticoJuridico.tsx
- AJUSTES.ALQUIMIA/archivos_ejecutados/17_1_publicacion_y_control_de_acceso.md
- AJUSTES.ALQUIMIA/archivos_ejecutados/03_marco_legal_expositivo.md
- AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/26_reglamentos_fuente_primaria_y_documentacion.md

Cobertura obligatoria:
1. Disclaimers en UI y documentos exportados.
2. Inventario de normas citadas: verificadas vs. desactualizadas.
3. Aviso de privacidad para access_logs (auth 17.1).
4. Borrador de Términos de Uso mínimos.
5. Riesgos legales ⚠️ catalogados por severidad.
6. Recomendaciones para Fase 27 (escenarios estimados nacionales).

Entrega: AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/planeacion_ejecucion/JURIDICO_REVISION_INICIAL_2026-05-05.md
El Auditor firma el documento antes de que sea válido para el equipo.
```

---

---

## Q-011 · Ejecutor — PRES-1 Pulido presentación institucional (PR A / B / C)

> **Cuándo activar:** después de que Q-003-UX esté mergeado (banners gate eliminados) para no pisar trabajo en vuelo.  
> **Fuente:** `PRES-1_pulido_presentacion_institucional.md`  
> **Decisiones Planner requeridas antes de PR B** (ver sección de decisiones pendientes del blueprint).

```text
Operas SOLO como EJECUTOR según cursor-rules/EJECUTOR.md.

CONTEXTO:
- Aesthete detectó tres bloques de ruido cognitivo e inconsistencia visual/editorial en la landing, el simulador (audiencia ciudadano) y la página /aprende.
- Fuente del spec: AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/PRES-1_pulido_presentacion_institucional.md
- Riesgo: BAJO — solo copy condicional, clases Tailwind, iconos Lucide y React. Sin tocar API, motor de cálculo, legal interno ni geografía.
- Dependencia: Q-003-UX debe estar mergeado primero.

ORDEN DE ENTREGA: PR A → PR B → PR C (cada uno revisable solo).

─────────────────────────────────────────
PR A · Landing  frontend/src/app/page.tsx
─────────────────────────────────────────

① Mensaje "no dictamen / no dictamen oficial": encontrar todas las ocurrencias con redacción similar y reducirlas a UNA sola frase de alta jerarquía, visible antes del primer scroll. El resto de repeticiones: mover dentro de un <details> o sección colapsada "Límites del análisis".

② Franja de cifras nacionales:
   [DECISIÓN PLANNER — confirmar antes de codear]
   Opción A: mantener 4 cifras, bajar jerarquía tipográfica (text-sm, font-normal), añadir línea serif encima "Órdenes de magnitud ilustrativos".
   Opción B: mostrar 2 cifras; las otras 2 dentro de expansión "Referencias ilustrativas".

③ Tarjetas "Una sola plataforma": reemplazar emojis por iconos Lucide. Sugerencias: Recycle, BarChart2, FileText, Globe. Mantener texto exactamente igual.

④ Botones CTA: unificar a UNA sola frase en toda la página.
   [DECISIÓN PLANNER — confirmar antes de codear]
   Opción: "simulador con datos ilustrativos" / "escenario de referencia" / la que el Planner apruebe.

⑤ Footer CTA verde: fusionar su mensaje con el del hero para evitar duplicidad de urgencia. No eliminar el footer — solo alinear tono.

Criterios de aceptación PR A:
- [ ] Mensaje "no dictamen" aparece una sola vez de forma prominente antes del fold.
- [ ] Cero emojis en el bloque de módulos/tarjetas.
- [ ] Botones CTA usan la misma frase en toda la página.
- [ ] npm run lint y tsc --noEmit pasan sin errores nuevos.

─────────────────────────────────────────
PR B · Simulador ciudadano  SectionHero.tsx + Header.tsx
─────────────────────────────────────────

① Hero interno: buscar frases tipo "plan completo con un clic", "obtén todo en un paso" o equivalentes que prometan ejecutabilidad inmediata. Reemplazar por "paquete de trabajo por módulos" o frase equivalente que el Planner apruebe.

② Kicker de audiencia: leer audience del simulatorStore. Para audience === 'citizen': mostrar kicker antes del h1 — "Vista ciudadana · análisis orientativo". Para 'official' y 'entrepreneur': no mostrar ese kicker.

③ Header sticky KPIs (RSU / ingreso / CO₂ / empleos):
   [DECISIÓN PLANNER — confirmar antes de codear]
   Opción A (ocultar): cuando audience === 'citizen' y no hay baseline válida, no renderizar la tira KPI.
   Opción B (atenuar): renderizar con opacity-40, pointer-events-none, tooltip "Disponibles tras captura de baseline".

Criterios de aceptación PR B:
- [ ] Vista ciudadano no tiene frase que prometa ejecutabilidad inmediata.
- [ ] Kicker de audiencia visible SOLO para 'citizen'.
- [ ] KPIs siguen la decisión Planner cuando no hay baseline válida.
- [ ] Otras audiencias no se afectan.
- [ ] npm run lint y tsc --noEmit pasan.

─────────────────────────────────────────
PR C · Aprende  frontend/src/app/aprende/page.tsx
─────────────────────────────────────────

① Reemplazar encabezados "Sección 1", "Sección 2", etc. por kickers temáticos según el contenido real de cada sección. Ejemplos sugeridos: "Qué es el RSU y por qué importa", "Qué pasa después del bote", "Cómo se evalúa una propuesta circular". Ajustar al contenido real.

② Listas con ✓ / ✗: reemplazar por iconos Lucide CheckCircle / XCircle con aria-label="cumple" / aria-label="no cumple". Si el Planner prefiere sin símbolo decorativo: usar párrafo con bullet • y negrita inicial. Contenido textual idéntico al original.

Criterios de aceptación PR C:
- [ ] Ningún encabezado visible dice "Sección N" con número ordinal.
- [ ] Listas usan iconos Lucide accesibles o tipografía pura.
- [ ] Contenido textual idéntico al original.
- [ ] npm run lint y tsc --noEmit pasan.

─────────────────────────────────────────
RESTRICCIONES GLOBALES
─────────────────────────────────────────
- No tocar: API, motor de cálculo, lógica de baseline, contenido normativo, archivos geo.
- No iniciar 23.1.
- No duplicar trabajo de Q-006 (tokens) — usar clases Tailwind existentes.
- Aesthete puede revisar diff de copy antes del merge; mencionar en PR description.
- Auditor verifica que ningún cambio de copy debilite disclaimers legales ya aprobados.

ENTREGA:
- Tres PRs separados (A, B, C) o uno por PR si el equipo lo prefiere — lo que el CSA indique.
- Append en BITACORA: PR A/B/C mergeados, URL staging verificada por Aesthete.
```

---

## 4 · Siguiente paso recomendado para vos (CSA)

1. Ejecutar en paralelo: **Q-003** (Ejecutor) + configuración Vercel/DNS (humano).  
2. Cuando exista URL estable: **§6.3** + **Q-005**.  
3. Abrir chat aparte con el **prompt §2.1** cuando tengas lista la **lista propia** de documentos obligatorios internos; el agente completará el paquete §2.3 con tus prioridades.
