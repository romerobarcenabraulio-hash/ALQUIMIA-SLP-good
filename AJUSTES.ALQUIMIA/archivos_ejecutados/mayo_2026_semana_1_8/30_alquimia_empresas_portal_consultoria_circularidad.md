# Fase 30 · ALQUIMIA EMPRESAS — Portal de consultoria de circularidad

**Owner:** CSA  
**Fecha:** 2026-05-07  
**Track:** Independiente de GOV  
**Estado:** `APROBADO PARA ARRANQUE`  

---

## 1) Objetivo del nuevo roadmap

Crear una linea de producto separada para empresas (B2B/B2G), con su propio backlog, release y dominio/subdominio, sin bloquear ni mezclarse con el sprint de cierre de gobierno (`GOV`).

**Principio rector:** el stream `GOV` sigue su ruta regulatoria municipal; `EMPRESAS` corre en paralelo con entregables propios de consultoria circular.

---

## 2) Alcance del Portal EMPRESAS

El portal debe cubrir, como minimo:

1. Diagnostico empresarial de residuos (perfil de generacion por giro SCIAN).
2. Escenario de circularidad por empresa (captura, valorizacion, OPEX/CAPEX, sensibilidad).
3. Ruta de cumplimiento y riesgos (sin sustituir obligaciones legales federales/estatales).
4. Exportables ejecutivos para direccion general (PDF + hoja de calculo).
5. Tablero de seguimiento por fases (hitos, inversiones, retornos, empleo formalizado).

---

## 3) Backlog independiente (Q-E series)

| ID | Item EMPRESAS | Owner | Estado | DoD |
|----|----------------|-------|--------|-----|
| Q-E01 | IA y copy del portal empresas (narrativa consultiva B2B) | Aesthete + Ejecutor | PENDIENTE | Landing empresas separada con CTA unico |
| Q-E02 | Auth empresarial y aislamiento de sesiones | Ejecutor + Auditor | PENDIENTE | Login/rol empresa, rutas protegidas |
| Q-E03 | Perfil de Generacion Estimada RSU (wizard) | Ejecutor + CLC | EN CURSO | Flujo end-to-end con disclaimer legal |
| Q-E04 | Sankey empresarial de flujo de residuos + slider temporal | Ejecutor + Aesthete | PENDIENTE | Sankey por fuente/material/destino y anio |
| Q-E05 | Hitos de implementacion (timeline consultoria) | PD&SA + Ejecutor | PENDIENTE | Roadmap por fase con KPIs acumulados |
| Q-E06 | Modulo financiero empresarial (ROI, payback, sensibilidad) | Ejecutor | PENDIENTE | Escenarios conservador/base/agresivo |
| Q-E07 | Exportables de direccion (PDF ejecutivo + XLS) | Ejecutor | PENDIENTE | Descarga valida en portal empresas |
| Q-E08 | Pricing y paquetes de consultoria (Lite/Pro/Enterprise) | CSA + PM | PENDIENTE | Matriz de alcance, SLA y entregables |
| Q-E09 | Release tecnico independiente en Vercel | Ejecutor + Ops | PENDIENTE | Proyecto Vercel separado y variables propias |
| Q-E10 | Dominio/subdominio propio + DNS + analitica | Humano + Ops | PENDIENTE | Dominio activo con TLS y eventos basicos |

---

## 4) Dominio y despliegue separados

Se define release separado del stream GOV:

- **GOV:** mantener `alquimia-slp.vercel.app` (y su ruta de cierre institucional).
- **EMPRESAS:** crear proyecto aparte en Vercel:
  - Opcion A: `empresas.alquimia.mx` (subdominio recomendado)
  - Opcion B: `alquimia-empresas.mx` (dominio dedicado)

**Regla de oro:** no compartir pipelines de release entre GOV y EMPRESAS.

---

## 5) Arquitectura de streams (sin mezcla)

- `Stream GOV`:
  - backlog Q-00x actual
  - restricciones CLC/Auditor para uso institucional municipal
  - release gate publico gubernamental

- `Stream EMPRESAS`:
  - backlog Q-E0x (este documento)
  - foco consultoria privada y adopcion empresarial
  - release y observabilidad independientes

---

## 6) Reglas de coordinacion CSA

1. Ningun ticket Q-E bloquea por defecto un ticket GOV.
2. Los PRs deben etiquetarse con prefijo de stream: `gov/*` o `empresas/*`.
3. Las decisiones de dominio y analitica se toman por stream.
4. CLC valida disclaimers de empresa, pero sin frenar el cierre operativo GOV salvo riesgo legal critico transversal.

---

## 7) Plan de ejecucion (3 olas)

### OLA E1 (1 semana)
- Q-E01, Q-E02, Q-E03

### OLA E2 (1-2 semanas)
- Q-E04, Q-E05, Q-E06

### OLA E3 (1 semana)
- Q-E07, Q-E08, Q-E09, Q-E10

---

## 8) Criterios de exito del portal EMPRESAS

- Primer flujo completo empresa: alta -> diagnostico -> escenario -> exportable.
- Tiempo de generacion de propuesta: <= 3 minutos.
- Claridad de valor economico (ROI/payback) en pantalla sin dependencia de contexto GOV.
- Dominio/subdominio operativo y rastreable.

