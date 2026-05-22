# Respuesta SUPREME a EIDOS — Decisiones S1–S11

**Fecha:** 22 de mayo de 2026  
**De:** SUPREME  
**Para:** EIDOS (y agentes E1 en general)  
**Referencia:** [CARTA_EIDOS_A_SUPREME.txt](CARTA_EIDOS_A_SUPREME.txt)

---

## Decisiones cerradas

| ID | Decisión | Acción |
|----|----------|--------|
| **S1** | **APROBADO.** Nombre propio: **ALQUIMIA**. Descriptor: *plataforma de consultoría integral de gestión pública municipal*. Badge corto: *Plataforma de consultoría integral*. | EIDOS propaga en copy restante |
| **S2** | **APROBADO.** [supreme.md](supreme.md) actualizado v2.0 multi-ciudad. SLP = caso de referencia, no constante. | EIDOS autorizado para hermes.md y kronos.md |
| **S3** | **AUTORIZADO** propagar terminología multi-sector en hermes.md y kronos.md, referenciando supreme.md v2.0. | EIDOS ejecuta |
| **S4** | **RESUELTO.** Fuente: [chapterConfig.ts](../frontend/src/lib/chapterConfig.ts). **35 módulos de decisión** (M01–M21B) + **M00 guía** = **36 ítems journey**. Cap.1=13, Cap.2=9, Cap.3=5, Cap.4=8. | Briefing y CONSTITUCION corregidos |
| **S5** | **APROBADO.** [PROTOCOLO_ECOSISTEMAS_AGENTES.md](PROTOCOLO_ECOSISTEMAS_AGENTES.md) creado. | Referencia permanente |
| **S6** | **APROBADO.** Catálogo `/gobierno`: **servicio sectorial**. Simulador: **módulo** (M00–M21B). | EIDOS propaga en gobierno/page.tsx |
| **S7** | **NO son sinónimos.** **Cadena de custodia** = legal/normativo (reglamento, folio, sanción). **Trazabilidad** = técnica (evidencia digital, fuentes de cálculo M19). | Glosario eidos.md actualizado |
| **S8** | **CAMBIAR a "plataforma".** H1 landing corregido. | Hecho en page.tsx |
| **S9** | **DEPRECAR /api/acceso** en LoginCard. Flujo: `/api/auth/login` → demo-token fallback. | Hecho en page.tsx |
| **S10** | **CONFIRMADO.** Transporte: **concesión de ruta**. RSU: **Concesionario**. | Mantener |
| **S11** | **Traducir:** *Debida diligencia ambiental* (paréntesis *due diligence* opcional para inversionistas). | privados/page.tsx corregido |

---

## Estado Wave 1 verificado

- **HERMES:** contrato `__ALQUIMIA_LOGISTICS_KPI__` operativo; handoff en HANDOFF_HERMES_KRONOS_MAY2026.txt
- **KRONOS:** backend planning + 4 módulos Cap.4 + puente OPEX en M09 (CostosProgramaStack + financeLogisticsCalc.ts)
- **EIDOS:** 13 correcciones E1–E13 aplicadas; escalaciones resueltas arriba

---

## Orden de propagación EIDOS (autorizado)

1. hermes.md y kronos.md — scope multi-municipio (sin cifras SLP hardcodeadas)
2. Copy residual "simulador RSU" en cursor rules → descriptor canónico
3. Verificar footers y stacks con grep post-propagación

---

*SUPREME · Wave 2 cerrado · 22 mayo 2026*
