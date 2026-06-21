# 39 · VARIABILIDAD DE INTEGRACIÓN POR OFICIO + ASISTENTE DE MIGRACIÓN A ERP
**Fecha:** 18 jun 2026
**Autor:** Claude Master (Cowork)
**Propósito:** Dar tranquilidad sobre la variabilidad de integración (cambia por oficio/empresa) y abordar la idea nueva: ayudar a las empresas a **migrar info a un ERP** de manera sencilla.

---

## 1. LA TRANQUILIDAD: variabilidad = configuración, no caos
Cada cliente usa cosas distintas (SAP, Excel, un CRM, WhatsApp, nada). No se resuelve a mano caso por caso. En el onboarding se genera un **PERFIL DE INTEGRACIÓN por tenant**:
```
LISTENER (ALQ-80) descubre: ¿qué sistemas/herramientas ya usa el cliente?
   → SECTOR/ORCHESTRATOR mapea: qué CONECTORES (ALQ-95) y qué MÓDULOS (ALQ-56) activar
   → la empresa queda integrada según SU realidad, sin construir desde cero
```
La variabilidad la absorben los **tres registros**: conectores (ALQ-95), módulos (ALQ-56), y la decisión build/integrate/buy (ALQ-90). Onboardear cualquier oficio = **descubrir → activar**, no programar a medida. **Esa es la paz mental.** → **ALQ-96**.

---

## 2. "CRM para algunos oficios" — matiz
NO construimos un CRM-producto (no competimos con Salesforce). PERO un **tracking ligero específico del oficio** (CRM-lite) generado por la fábrica cuando ese oficio lo necesita, SÍ. Es un módulo por demanda (ya en doc 35/37), instanciado vía spec — no un producto aparte. La variabilidad (qué campos/flujo por oficio) = la spec del módulo, registrada.

---

## 3. IDEA NUEVA — ASISTENTE DE MIGRACIÓN A ERP (la cuña estratégica)
Patrón **inverso** de la integración: en vez de *leer* de un ERP, ayudamos al cliente a **ordenarse y migrar** hacia uno.
```
Desorden del cliente (Excel/papel/sistemas viejos)
   → EXTRACCIÓN + LIMPIEZA + estructura (con procedencia, validación de intake ALQ-76)
   → MODELO CANÓNICO (Company Profile, ALQ-23)
   → MAPEO al schema del ERP destino (capa anti-corrupción inversa, ALQ-95)
   → VALIDACIÓN + VISTA PREVIA
   → ESCRITURA al ERP = GATED (ALQ-50) + cutover controlado
```
**Por qué es estratégica:**
- **Dolor real y enorme** de la PyME ("quiero ordenarme / pasar a un sistema serio, pero migrar es un infierno"). Candidato fuerte para las entrevistas (ALQ-33).
- **Caballo de Troya / niebla:** les ayudas a migrar y, en el proceso, te vuelves la capa inteligente que de verdad usan.
- **Reusa** lo que ya tenemos: digestión de datos con procedencia, modelo canónico, anti-corrupción, gate.

**Honestidad de consultor (crítica):** migrar datos NO es trivial — limpieza, mapeo, validación, cutover, casos borde. Es un **módulo/servicio de alto valor, build-by-demand**, no algo que se prende solo. Empezar acotado (un tipo de dato / un ERP destino) y crecer. → **ALQ-97**.

---

## 4. CÓMO ABORDAR LA IDEA (recomendación)
1. **No la construyas especulativa.** Métela como **candidata fuerte** en las entrevistas PyME (ALQ-33): si el dolor #1 resulta ser "estoy en Excel y quiero ordenarme", ESTE es tu primer módulo y tu cuña de entrada.
2. Si se elige, arranca **acotada**: un dominio de datos (ej. clientes o inventario) → un ERP/sistema destino común en MX. Prueba el patrón, luego generaliza.
3. Todo bajo las reglas ya fijadas: procedencia, validación de intake, escritura gated, build/integrate/buy.

---

## 5. ISSUES
- **ALQ-96** Perfil de integración por tenant (onboarding descubre sistemas → activa conectores/módulos). La pieza que da la tranquilidad.
- **ALQ-97** Asistente de migración a ERP (reverse-ETL: limpiar→canónico→mapear→validar→escribir gated). Build-by-demand; candidata de cuña para entrevistas.

---

*39 · Variabilidad de Integración + Migración a ERP · Alquimia Supermind · 18 jun 2026*
