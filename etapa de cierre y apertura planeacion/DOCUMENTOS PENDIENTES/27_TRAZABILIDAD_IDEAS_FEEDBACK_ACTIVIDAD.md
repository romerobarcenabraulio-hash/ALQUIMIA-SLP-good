# 27 · MATRIZ DE TRAZABILIDAD — IDEA → FEEDBACK → ACTIVIDAD
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork)
**Propósito:** Que NINGUNA idea tuya se pierda. Cada idea que planteaste en todo el proceso, con mi feedback que la resuelve/refina y la actividad concreta (doc o issue de Linear) que la materializa. Este doc es el índice de fidelidad; si algo no aparece aquí, no existe en el sistema.

---

## A · ARQUITECTURA Y AGENTES

| # | Tu idea | Mi feedback / solución | Actividad |
|---|---|---|---|
| 1 | Un "ejército" de agentes + agent builders + orchestrator + módulos | No construir cada agente; fábrica declarativa: engine único + specs (dato) + catálogo + learning store | ADR-001; doc 14; ALQ-24, ALQ-22 |
| 2 | Mentalidad predefinida: qué datos necesito ANTES de asumir, basado en estándares | Protocolo de decisión de 8 fases con "compuerta de insumos"; ejemplo del edificio | doc 14 §3; ALQ-24 |
| 3 | Dos caminos: fábrica vs uno-por-uno | Falso binario: fábrica (mecanismo) + specs cuidadosas (política), estadificado | ADR-001 §Decisión |
| 4 | Catálogo NO cerrado; evolucionar como universidades | Tiers: conocimiento/soluciones ABIERTOS, solo acciones irreversibles gobernadas + firewall | ADR-001 rev.1; ALQ-25 |
| 5 | Dos clases: builder backend (fijo) vs Jarvis del cliente (en la entrevista) | Class A (factory) vs Class B (producto, por tenant); aislamiento | ADR-001 rev.1; ALQ-27 |
| 6 | Alcance UNIVERSAL; el sistema se auto-construye + organigrama | Sector-agnóstico porque el patrón es agnóstico; ORG_BUILDER desde la entrevista | doc 23 §1B; ALQ-22 |
| 7 | Voz + comando, un agente por empleado | Modality-agnostic: texto hoy, voz después (Whisper-class + MeloTTS, asequible) | doc 23 §2; ALQ-27 |
| 8 | Evidencia con fotos (ej. camión roto → pedir uno nuevo) | Vision-LLM → JSON con procedencia → propuesta → gate en lo irreversible | doc 23 §3; ALQ-29 |
| 9 | Algoritmo que se auto-actualiza dictado por agentes | Sí, vía tier de conocimiento (con procedencia, gated); evolución sí, auto-mutación ciega no | ADR-001 rev.1; ALQ-26 |

## B · PRODUCTO, MERCADO Y AMBICIÓN

| # | Tu idea | Mi feedback / solución | Actividad |
|---|---|---|---|
| 10 | Consultoría instantánea; "Palantir a nuestros pies" | Out-posicionar, no out-integrar; menos integraciones = accesibilidad; moat = grafo+procedencia | doc 16 §4; doc 24 §1 |
| 11 | Capacidades amplias (layout oficina, cuantificar casa en Excel, cotizaciones, research) | Todas = 1 patrón (intake→determinista→template→procedencia→gate); spec, no producto | doc 22 |
| 12 | Live market & trend research | Capacidad de research → tier de conocimiento, call-on-request + caché, gated | doc 22 §4; ALQ-21 |
| 13 | "Robar y refinar" ideas de apps (finance/analytics) | Roba la IDEA, escribe tu código; línea legal clara; capa unificada que absorbe | doc 21; ALQ-21 |
| 14 | No saturar al cliente con suscripciones | Capa unificada que orquesta y vuelve innecesarias las apps aisladas | doc 16; doc 21 §3 |
| 15 | No somos un MVP cualquiera; alcanzar el mercado actual | Estándar nivel-mercado en el proyecto; milestone Producción/Calidad | Proyecto Linear; ALQ-46, ALQ-47 |
| 16 | Alcance también a gobierno (piloto RSU) | GOV-RSU = piloto + credibilidad; negocio en PyME | doc 08; doc 23 §4 |

## C · EJECUCIÓN, AGENTES DE CÓDIGO Y DISCIPLINA

| # | Tu idea | Mi feedback / solución | Actividad |
|---|---|---|---|
| 17 | Prompts muy fáciles (verifica doc, ejecuta) | El rigor vive en el contrato; prompts de una línea | REGLAS §10; cada issue trae su PROMPT |
| 18 | Agentes autónomos, responsables, sin hacer desastre | Firewall reversible/irreversible; anti-desastre Git/Render | REGLAS §2–§4 |
| 19 | Quién hace frontend / quién backend | Codex=backend→Render; Claude Code=frontend→Vercel; nunca mismos archivos | REGLAS §3; cada issue |
| 20 | Auditorías de su código | 4 auditorías + Greptile gate; y auto-auditoría por tarea | ALQ-17,18,19,20; REGLAS §7 |
| 21 | Estándar frontend minimalista McKinsey | Confirmado en repo (FASE8 Minto/McKinsey + AESTHETE-1, WCAG 2.2 AA) | ALQ-16, ALQ-20 |
| 22 | Palomear solo tras pasar auditoría; tarea por tarea | Ciclo: codificar→auto-auditar→corregir→PR→Greptile+CI→palomear | REGLAS §7 |
| 23 | Protocolo explícito hasta main en cada actividad | Footer "HASTA MAIN" en cada issue + protocolo canónico en el proyecto | Proyecto Linear; docs 25 |
| 24 | Dejar a Claude Code trabajando "solo" | Autónomo en reversible; merge/deploy = tu gate; los 2 candados (auto-audit + Greptile/CI) | REGLAS §7; doc 25 |
| 25 | Automatizar Claude Code | Honesto: headless/GitHub Action cobran (crédito Agent SDK, jun-15); usar interactivo+cola ahora | doc 20 §8 |

## D · INFRAESTRUCTURA, HERRAMIENTAS Y COSTO

| # | Tu idea | Mi feedback / solución | Actividad |
|---|---|---|---|
| 26 | Instalar MCPs (Render, Greptile, GitHub) | Conectados Render/Greptile/Vercel/Linear/Stripe; GitHub vía /mcp | doc 20 |
| 27 | No tengo dinero para API (CI pedía Anthropic) | El CI NO usa Anthropic; APIs públicas gratis; LLM diferido | doc 19; doc 24 |
| 28 | ¿Dónde se ejecuta el billing? | Salida=Consola Anthropic (Hito 2); entrada=Stripe (ya listo) | doc 24; doc 19 §6 |
| 29 | Billing de Stripe de la plataforma | Ya cableado en main; test mode gratis ahora; live en Hito 2 | ALQ-35 |
| 30 | Hacer el repo público (CI gratis) | Escaneo de secretos limpio; visibilidad = tu acción en GitHub | ALQ-7 |
| 31 | Memoria/índice; herramientas para que los coders sean rápidos | El cuello es memoria, no tools; Greptile + AGENTS.md/CODEMAP/memory | doc 18; ALQ-8 (hecho) |
| 32 | Carpeta de "archivos viejos / a no tocar" | git mv (nunca borrar), tras OK, post-rebase | ALQ-30 |

## E · ORGANIZACIÓN, ORDEN Y PLAN

| # | Tu idea | Mi feedback / solución | Actividad |
|---|---|---|---|
| 33 | Dirigir la orquesta; tú haces EMPIEZA AQUI | Claude Master orquesta; carpetas pobladas; brief del día | docs 00, BUENOS_DIAS, bitácora |
| 34 | Carpetas como kanban; orden y disciplina | Ciclo de vida del .md; cadencia por hito; tablero vivo | doc 17; _INDICE_ESTADO |
| 35 | Cuándo crear .md según la fase | Mapa de cadencia just-in-time (anti-dispersión) | doc 17 §5 |
| 36 | Diagnóstico RSU de todo México | Motor existe (4 ZMs); escalar por olas a 2,469, cobertura honesta | doc 15; ALQ-9,10,11,12 |
| 37 | Auditoría de arquitectura + datasets/APIs + flujo entrevista→sistema | Inventario + flujo (cada flecha=contrato) + supuestos resueltos | doc 16 |
| 38 | Todo materializado en Linear, de principio a fin | 6 milestones Hito 0→3 + Producción; epics futuros | Proyecto Linear completo |
| 39 | ¿Cuántas actividades para finalizar? | ~90–135 a auto-sostenible; ~150–220 a Hito 3; "finalizar" ≠ marco | doc 26 |
| 40 | No olvidar ninguna idea + feedback + actividad | Este doc 27 (matriz de trazabilidad) | doc 27 |

---

## HUECOS / RIESGOS QUE YO LEVANTÉ (mi feedback proactivo, no idea tuya, pero crítico)
- Repo congelado en rebase → RECON read-only primero (ALQ-5). ✅
- Trabajo del 14-jun perdido (Escenario 2) → construir desde cero (ALQ-13). 
- CI bloqueado por billing de GitHub → repo público (ALQ-7). ← bloqueante operativo AHORA.
- Línea base de tests sin verificar → correr pytest (ALQ-31).
- Deploy de plataforma existente sin issue → ALQ-32.
- 3 entrevistas PyME (definen el módulo) sin dueño → ALQ-33.
- Contador/abogado fiscal (lead largo) → ALQ-34.

---

## F · AMPLIACIÓN (17 jun, tarde)

| # | Tu idea | Mi feedback / solución | Actividad |
|---|---|---|---|
| 41 | Evitar sobrescribir código / bolas de nieve que arruinan el trabajo | Reglas anti-regresión y anti-bola-de-nieve: entender antes de editar, diff atómico, no green→red, no refactor fuera de alcance, backward-compatible, parar si crece | REGLAS §3B; ALQ-58 (CI guard) |
| 42 | Paranoia con calidad consultor + diseñador + McKinsey = garantía | Listón elevado en la mentalidad: "mejor programador + revisor + consultor élite + diseñador, nivel McKinsey/Minto; revisa como si tu reputación dependiera" | REGLAS §1; descripción del proyecto |
| 43 | Navegación frontend fácil como una red social, bajo estándares | Spec de Arquitectura de Información + navegación (nav persistente, mínimos clics, mobile-first, búsqueda, SUS≥80) sobre AESTHETE-1/Nielsen | ALQ-57 |

| 44 | Auditar agentes/modelos: que cada agente sepa construir, calcular ROI/TIR, analizar noticias, redactar correos | Roster + matriz de capacidades + 75 modelos verificados; ROI/TIR/PERT/MonteCarlo YA existen; gaps reales = VAN/payback, noticias, correos, registro de capacidades | doc 29; ALQ-61,62,63,64 |

| 45 | Garantizar juicio/asertividad sin sesgo; "subconsciencia" (no red neuronal); sub-CEO que delega y razona | Capa de juicio COMPUESTA (cálculo+evidencia+campo+memoria+síntesis) + deliberación dialéctica anti-sicofancia + System1/2 sobre NOUS; auditable, no pesos; calibración | ADR-002 (doc 30); ALQ-65,66,67,68 |

| 46 | "Sentido común": enlazar decisión→por qué→acción del backend (Excel, avisar mecánico, facturar); DB equipo/maquinaria; APIs cotización; propuestas/presentaciones; sin sesgo humano ni IA | Motor ECA (evento-condición-acción) con razón anclada a estándar + procedencia, disparador determinista, gate en irreversible, registro gobernado; reusa cron/GapDetector/decision_tree/cotizacion | doc 31; ALQ-69,70,71,72 |

| 47 | Ser crítico/paranoico: qué nos hace fallar, qué NO garantizamos, áreas vulnerables, triggers, datos web/internos, bibliografía | Pre-mortem completo: failure modes por área + qué no garantizamos + decisiones del humano + respuestas a triggers/agentes/web/DBs/bibliografía; top-3 riesgos | doc 32; ALQ-73..78 |

| 48 | Soluciones innovadoras: por qué/para qué/cómo/con quién; superar a Palantir; empatía (leer vocabulario/intelecto/quién habla); entrevista que desmiembra al usuario; no vender hasta probado | Golden circle + tesis vs Palantir + capa de empatía adaptativa (forma sí, verdad no) + motor de entrevista (JTBD/Mom Test/SPIN) + shadow mode + registro de fuentes + secuencia build→test→operar→vender | doc 33; ALQ-79..83 |

| 49 | Datos muy duros: scraping 24/7 de fichas técnicas de equipo certificado; gemelo digital que renderiza operaciones (constructor: retros/excavadoras + dron, estilo Clash of Clans); más info del cliente+web con baja fricción; ligera competencia de Palantir | Motor de ingestión (sobre web_scraper, fuente oficial primero, procedencia) + gemelo digital STAGED (Fase 1 vista 2D ya construible / Fase 2 dron-CV-3D R&D gated) + captura de baja fricción | doc 34; ALQ-84..87 |

| 50 | Cubrir aristas vs competencia (Slack/Salesforce/Bloomberg/Palantir/…); ser los mejores; situational awareness en tiempo real | Mapa de cobertura: absorber el slice de cada uno, NO replicar; ganar la cuña; las 5 ventajas donde sí ganamos; situational awareness ya distribuida en issues; gaps = tiempo real selectivo + tracker de paridad | doc 35; ALQ-88, ALQ-89 |

| 51 | Cost-benefit de qué integrar vs replicar (¿meter un Slack? ¿el cliente contrata datos financieros?); balance aprovechar lo existente vs crear lo replicable | Marco build/integrate/buy (3 preguntas): replicar solo el moat, integrar lo que el cliente ya usa (Slack→su Slack), comprar materia prima nosotros; minimizar suscripciones del cliente | doc 36; ALQ-90 |

| 52 | Dominios de consultoría (ERP, project tracking, eficiencia energética, optimización logística, área de trabajo, programas sociales, ayudar a redactar contrato) — qué tener y cómo | Mapa de dominios qué+cómo (build/integrate/buy); crítica: ERP no construir (integrar), contratos = asistir con abogado-in-loop+disclaimers; cada dominio = módulo por demanda vía registro; muchos seeds ya existen | doc 37; ALQ-91,92,93,94 |

| 53 | Integrarnos a un ERP/SAP y absorber el sistema existente como interfaz que el Jarvis interprete, tipo conector MCP de LLMs | Patrón MCP-style (3 vías: MCP oficial>API>RPA) + capa anti-corrupción → modelo canónico, read libre/write gated, conectores como MCP servers por tenant; absorber sin reemplazar (niebla) | doc 38; ALQ-95 |

| 54 | La integración varía por oficio/empresa (tranquilidad); CRM para algunos oficios; ayudar a migrar info a un ERP fácilmente | Perfil de integración por tenant (descubrir→activar, variabilidad=configuración); CRM-lite=módulo por demanda; asistente de migración a ERP (reverse-ETL gated) = cuña estratégica/caballo de Troya | doc 39; ALQ-96, ALQ-97 |

| 55 | Integrar ERP de un amigo (BIWO), merge de software ya hecho; somos capa de inteligencia/consultoría sobre ERP/CRM; flujo legal (abogado explica→agente arma machote→correo→CRM); orchestrator distribuye FE/BE por usuario | Identidad: Alquimia=inteligencia encima, ERP/CRM=sustrato integrado. BIWO con 3 candados (due diligence, términos, no "arreglarlo"). Flujo legal = spec de ALQ-92. Matiz: orchestrator ensambla, no inventa código | doc 40; ALQ-101, ALQ-92 |

| 56 | Competir con Palantir en serio: ONTOLOGY y su concepto general; web scraping genial + DB on-request con humanos curando + comprar DBs complejas; no limitarme | Ontología = spine semántico (objetos/links/acciones+procedencia) que unifica todo; edge vs Palantir = procedencia nativa + auto-construida + cruza tenants (moat). Data layer: scraping+curación humana on-request+DBs adquiribles | ADR-003 (doc 41); ALQ-102, ALQ-103 |

| 57 | Muchas cosas ya definidas se perdieron en mi memoria; no sobreescribir instrucciones/código; no crear docs redundantes; editar lo que ya tiene la info | Reconciliación: mapa anti-duplicación (mis docs vs FASE*/cursor-rules canónicos) en _INDICE_ESTADO; regla leer-antes-de-crear en doc 17 + REGLAS §3B; ADR-002 defiere a NOUS; ALQ-104 reconciliar antes de construir (anti-sobreescritura de código) | _INDICE_ESTADO (mapa); doc 17; REGLAS §3B; ADR-002 (header); ALQ-104 |

| 58 | 3D/imágenes para tracking de proceso y render de oficinas; ORCHESTRATOR con sentido común que, dado un problema (política pública energía/zonificación/educación/salud), compone solo el servicio vendible (contexto, estudios de campo en orden, estándares, plantillas); 4 fases macro | 3D = ALQ-85/86 (ya cubierto). Orchestrator generador de servicios = EXTIENDE FASE11+SECTOR+field_studies+CATALOGO con registro de playbooks/metodologías por problema. Macro roadmap mapeado a Hitos en _INDICE | ALQ-105; ALQ-85/86; _INDICE (4 fases) |

| 59 | Ponerlo live 24/7 en un servidor; cuándo comprar esos servicios | Timing por evento: free para build (ojo: Postgres free muere a 30d); ~$14/mes Render always-on cuando haya piloto demoable/datos a persistir; Vercel Pro $20 al ir comercial (Hito 2). Piso de hosting se compra temprano; APIs de uso esperan ingreso | doc 24 §3B; ALQ-106 |

| 60 | Repaso de ambigüedades antes de ejecutar | Identificadas 7: keystones abstractos (Profile/Agent Spec), lista irreversible no enumerada, extender-vs-construir, 4 registros borrosos, L0-L3 sin definir, acceso de agentes a docs, alcance Escenario 2 | _INDICE (keystones); ALQ-107 (registros+L0-L3); ALQ-104/23/24/25 |

---

## REGLA DE MANTENIMIENTO
Cada idea nueva tuya entra aquí con su feedback + actividad el mismo día. Si una idea no tiene actividad, no está materializada. Este doc + `_INDICE_ESTADO` + la bitácora son la memoria; Linear es la ejecución.

---

*27 · Matriz de Trazabilidad · Alquimia Supermind · 17 jun 2026*
