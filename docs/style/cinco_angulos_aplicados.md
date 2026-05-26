# Cinco ángulos de entrada · ejemplos aplicados (LOGOS)

Rotación obligatoria en bloques QHC del simulador. Dos gráficas **contiguas en el mismo módulo** no usan el mismo ángulo.

Definición completa en `cursor-rules/logos.md` y sesión LOGOS 2026-05-25.

---

## 1. Entrada por la cifra

**Gráfica:** `volumen-rsu` (M01)

> **Qué:** Cientos de toneladas al día y decenas de millones al año: ahí empieza la derrama del programa. RSU total = población × kg/hab/día; lo vendible = captura × (1 − merma) × precio × 365.

**Por qué funciona:** Abre con magnitud que el Cabildo puede repetir; la fórmula viene después, no antes.

---

## 2. Entrada por el método

**Gráfica:** `m13-monte-carlo-tir` (M13)

> **Qué:** Monte Carlo nació donde las fórmulas cerradas no alcanzan: demasiadas variables interactuando. ALQUIMIA corre 2 000 escenarios; en cada uno, precios de PET, aluminio, papel y la trayectoria de captura se sortean en rangos realistas. Salida: distribución de TIR con percentiles 10/50/90 — cuánto resiste el proyecto a la incertidumbre real del mercado.

**Por qué funciona:** Legitima la herramienta antes del número; evita sonar a nota al pie de ingeniería.

---

## 3. Entrada por el contraste

**Gráfica:** `m13-tornado-vpn` (M13)

> **Qué:** WACC y la captura del año 1 suelen encabezar el ranking; PET y vidrio, mucho menos. La tornado revela la jerarquía de palancas ante ±20%: vigilar costo de capital y arranque de campaña en residenciales rinde más que afinar contratos material por material.

**Por qué funciona:** Pone dos palancas en tensión con cifras de orden de magnitud; el lector sabe qué vigilar primero.

---

## 4. Entrada por la implicación

**Gráfica:** `m13-rejilla-stress` (M13 — **patrón canónico**)

> **Qué:** La rejilla contrasta choques de volumen y precios respecto al caso base. Mayoría verde: estructura aguanta shocks coordinados; predominio rojo: priorizar contratos indexados o coberturas simples antes de Cabildo.

**Por qué funciona:** Cierra en decisión operativa o de financiamiento, no en definición de ejes.

---

## 5. Entrada por la pregunta

**Gráfica:** `m05-risk-matrix` (M10)

> **Qué:** ¿Dónde se concentran los rojos antes del Cabildo? Doce riesgos en probabilidad × impacto con color PMBOK.

**Por qué funciona:** La pregunta orienta la lectura de la matriz; el usuario busca celdas, no lee ejes en abstracto.

---

## Tabla de rotación (muestra M13 — orden UI)

| Orden en pantalla | chart_id | Ángulo |
|-------------------|----------|--------|
| 1 | `m13-waterfall-valor` | Cifra |
| 2 | `m13-monte-carlo-tir` | Método |
| 3 | `m13-tornado-vpn` | Contraste |
| 4 | `m13-cashflow` | Implicación |
| 5 | `m13-rejilla-stress` | Pregunta / implicación (canónico rejilla) |

## Ritmo y cadencia (recordatorio)

- Alternar longitud de oración (corta · larga · muy breve)
- Empezar a veces con cifra, no con artículo
- Frases nominales permitidas («Holgura cero.»)
- Sin triplicación de adjetivos
- Verbo activo; sustantivos concretos (VPN, TIR, WACC — no «el indicador»)

## Regeneración

El catálogo se genera con rotación automática de ángulos:

```bash
node frontend/scripts/logos-chart-briefs.mjs
```

Revisar manualmente entradas M13 y cualquier gráfica nueva antes de merge.
