# 35 · PAISAJE COMPETITIVO + MAPA DE COBERTURA DE ARISTAS
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork) — solución + crítico
**Propósito:** Qué tienen los grandes que no tenemos, qué debemos tener (y hacer mejor), y CÓMO — sin caer en la trampa de querer igualar a todos. Cubrir las aristas, ganar la cuña.

---

## 0. LA VERDAD DURA (léela primero)
"Ser el mejor" NO es tener todos los botones de Slack + Salesforce + Bloomberg + Palantir. Eso es ser **mediocre en todo**. Los mejores ganan **una cuña** (un dolor concreto, hecho insuperablemente bien) y se expanden por adyacencia (tu tesis de niebla, doc 16). Nuestra cuña: **consultoría instantánea, con procedencia, accesible, para quien nadie atiende bien (PyME/municipio).** De cada competidor **absorbemos el slice que sirve al dolor del cliente; NO replicamos su producto entero.**

---

## 1. QUÉ TIENE CADA UNO, SU EDGE, NUESTRA POSICIÓN

| Competidor | Categoría / su edge | Nuestra posición (absorber slice, no replicar) | Cubierto por |
|---|---|---|---|
| **Slack/Teams** | Comms en tiempo real, notificaciones, integraciones | El **Jarvis ES la interfaz** (conversa Y actúa, no solo chatea); notificaciones **inteligentes** (avisa porque cayó la eficiencia, no solo mensajes) | ALQ-27/79/80 (Jarvis) · ALQ-53 (notif) |
| **Salesforce** | CRM + plataforma + automatización (config-heavy, caro) | Nosotros **auto-construimos** (org-builder); tracking/pipeline = un **módulo** por demanda, no un CRM gigante | ALQ-22/56 (fábrica) · módulo on-request |
| **Bloomberg** | Terminal de datos/mercado en tiempo real + analítica (para finanzas, $$$) | Traemos **inteligencia financiera relevante en lenguaje claro** a una PyME; orquestamos datos, no somos vendor de feeds | ALQ-61 (finanzas) · ALQ-62 (mercado) · ALQ-82 (fuentes) |
| **Palantir** | Fusión de datos + situational awareness (grandes, ingenieros FDE) | Versión **ligera, accesible, auto-servida + red** | doc 16, doc 34 (gemelo digital) |
| **Power BI/Tableau** | BI / dashboards | Dashboards + KPIs **con procedencia** integrados al flujo | ALQ-14 (KPI) · cap. analytics doc 29 |
| **Notion/Asana/Monday** | Docs + gestión de trabajo | Planeación/docs/ejecución como **salida del agente**, no app aparte | planning/ + agents/ (repo) |
| **SAP/Oracle ERP** | Sistema central pesado | NO replicar; **niebla** alrededor del dolor, orquestar, descartar uno por uno | tesis doc 16 §4 |
| **DocuSign / contables (CONTPAQi)** | Firma / contabilidad | **Integrar vía conector** (no construir), con gate | ALQ-52 (conectores) · ALQ-42 (fiscal) |

---

## 2. SITUATIONAL AWARENESS (lo que nombraste — ya está cubierto, lo mapeo)
"Render de ops + Jarvis por persona en tiempo real + notificaciones + rastreo + identificar qué mejorar" = situational awareness puro. Cobertura actual:
- **Render de operaciones:** gemelo digital Fase 1 (ALQ-85) / Fase 2 dron-CV (ALQ-86).
- **Jarvis por persona:** ALQ-27 + empatía (ALQ-79) + entrevista (ALQ-80).
- **Notificaciones + rastreo:** ALQ-53 (notif) + audit/procedencia (ALQ-54) + ECA (ALQ-69).
- **Identificar qué mejorar:** capa de juicio (ALQ-65) + recomendación financiera (ALQ-61) + motor ECA (ALQ-69) + análisis (ALQ-62).
→ La situational awareness ya está distribuida en issues. Lo único transversal a confirmar: el **tiempo real**.

---

## 3. GAPS REALES DE ESTE BARRIDO → ISSUES
- **Tiempo real / actualizaciones en vivo:** hoy el modelo es call-on-request + refresh (doc 24). Para "en tiempo real" (presence, push, live updates del situational awareness) hace falta una decisión + capa ligera (eventos/websocket donde importe). Crítica: tiempo real total es caro; hacerlo **selectivo** (solo donde el valor lo exige). → **ALQ-88**.
- **Mapa de paridad competitiva (vivo):** mantener el benchmark de aristas — qué slice de cada competidor absorbemos, qué NO. Hermano del backlog de inteligencia competitiva (ALQ-21). → **ALQ-89**.
- *(Tracking/CRM-lite y BI más profundo = módulos por demanda vía fábrica, no issues forzados ahora — anti-dispersión.)*

---

## 4. QUÉ DEBEMOS HACER MEJOR QUE TODOS (nuestras 5 ventajas, donde SÍ ganamos)
1. **Time-to-value:** de la entrevista al sistema vivo en minutos (ellos: meses/config).
2. **Accesibilidad/precio:** determinista + templates + pocas integraciones.
3. **Procedencia:** cada cifra con fuente — defendible ante gobierno/inversionista.
4. **Red inter-empresa:** el moat que ninguno intra-organización tiene.
5. **Empatía adaptativa:** le habla a cada quien en su registro (ellos: una sola UX para todos).
→ En estas 5 SÍ debemos ser insuperables. En el resto, absorber el slice justo y no más.

---

## 5. CONCLUSIÓN DE SOCIO
No falta nada grande: las aristas están mapeadas y la situational awareness ya vive en issues. Lo que faltaba explícito era (a) la **decisión de tiempo real** (ALQ-88) y (b) el **tracker de paridad competitiva** (ALQ-89). Lo demás es disciplina: **ganar la cuña primero**, absorber slices por adyacencia, y NO intentar ser Slack+Salesforce+Bloomberg+Palantir a la vez. Esa disciplina es lo que nos hace los mejores en lo nuestro.

---

*35 · Paisaje Competitivo y Cobertura · Alquimia Supermind · 17 jun 2026*
