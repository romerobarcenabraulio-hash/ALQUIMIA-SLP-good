# 40 · IDENTIDAD DE PRODUCTO (capa de inteligencia sobre ERP/CRM) + caso BIWO
**Fecha:** 18 jun 2026 · **Autor:** Claude Master (Cowork) · *(conciso a propósito)*

---

## 1. LA IDENTIDAD, CRISTALIZADA
Alquimia **NO es** el ERP/CRM. Es la **capa de inteligencia que se fusiona con ellos**: análisis de datos + consejería + automatización + **consultoría embebida** + red. El ERP/CRM (BIWO o el que sea) es el **sustrato integrado**; nuestro valor vive **encima**.
- Cuando decimos "módulo", a veces es un slice de CRM o ERP **según la acción** — pero lo entregamos por **integración + nuestra inteligencia**, no convirtiéndonos en vendor de ERP/CRM.
- Esto nos pone como competencia de Palantir y de los que venden "agentes a la medida": ellos automatizan; nosotros automatizamos **+ aconsejamos con procedencia + conectamos en red**.
- Coherente con build/integrate/buy (doc 36): ERP/CRM = **integrar**; la inteligencia = **replicar** (es el moat).

## 2. CASO BIWO (ERP de un conocido) — integrar, con candados
Atajo válido: BIWO como sustrato ERP + Alquimia aporta planeación/comms/análisis encima. Antes de casarnos (crítica de socio, ALQ-101):
1. **Due diligence técnica** (schema, API, seguridad). Si está crudo → integrar SOLO vía capa anti-corrupción (doc 38) para no importar su deuda.
2. **Términos por escrito** con el dueño (IP, revenue, separación) ANTES de construir.
3. **No "arreglar BIWO".** Nuestro fuerte es la capa, no pulir su ERP. El merge sí; ser sus programadores de planta, no.

## 3. FLUJO LEGAL (spec confirmada, ALQ-92)
Abogado explica tipo de contrato/reglamento → agente construye el **machote al estilo del abogado** → ajustes → dispara correo (gated) → se trabaja en **CRM de proyectos/clientes**. Mismo patrón por oficio. El sistema asiste; el abogado firma.

## 4. MATIZ: el ORCHESTRATOR "distribuye", no inventa código
El ORCHESTRATOR **compone/configura** la experiencia por usuario desde specs (fábrica + org-builder ALQ-22 + perfil de integración ALQ-96 + RBAC ALQ-51). **Ensambla lo que existe; no genera de la nada todo el código.** Los componentes se construyen una vez; el orquestador los reparte por rol/tenant. (Importante para no prometer magia.)

## 5. ENCAJE
RSU (hoy): tracking de proceso + logística + Gantt, sobre el motor existente — tus observaciones aplican aquí. Legal/CRM/BIWO/migración = **futuro** (Hito 2/3, build-by-demand). Issues: ALQ-92 (legal), ALQ-101 (BIWO), ALQ-93/97 (project tracking / migración), ALQ-95/96 (integración).

---

*40 · Identidad de Producto + BIWO · Alquimia Supermind · 18 jun 2026*
