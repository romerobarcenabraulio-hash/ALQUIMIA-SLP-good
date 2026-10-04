# PROMPTS DE RELEVO — 3 agentes · 20 jun 2026

**Orden de ejecución:** el agente de CARPETA corre solo y PRIMERO (mueve/borra archivos → colisiona con rebases). Mergear su PR → los otros dos hacen `git pull origin main` y arrancan.

---

## 1 · AGENTE DE CARPETA (limpieza — rama propia, sin lógica de código)
```
Lee REGLAS_DE_EJECUCION_AGENTES.md y los issues ALQ-112 y ALQ-30.
Ejecuta SOLO orden de archivos: aplica la clasificación keep/archive/delete de ALQ-112,
crea _ARCHIVO_VIEJO/ y /referencia/, mueve lo indicado, y genera FOLDER_MAP.md en la raíz (1 línea por carpeta).
Reglas: 1 sola rama, NO toques backend/ frontend/ docs/ ni AJUSTES PARA FINIQUITAR (solo muévelos si el ticket lo dice, sin abrir su contenido).
ARCHIVAR es autónomo; BORRAR definitivo requiere mi OK — déjalo listado en el PR, no lo ejecutes.
Reporta lista de qué moviste, qué propones borrar, y abre 1 PR.
```

## 2 · CLAUDE CODE (retoma frontend)
```
Lee REGLAS_DE_EJECUCION_AGENTES.md, frontend/DESIGN_SYSTEM.md y los issues ALQ-109 y ALQ-110.
Antes de empezar: git pull origin main (ya entró la limpieza de carpeta).
Ejecuta: (1) ALQ-109 — auditoría vivos/muertos: lista cada page de app/ y componente de components/, marca huérfanos (nadie los importa) y cifras hardcoded; entrega "N muertos seguros de borrar / M vivos", NO borres a ojo.
(2) ALQ-110 — diagnóstico guardrails/EIDOS: di cuáles tests protegen comportamiento real y cuáles solo persiguen strings literales, con ejemplos; recomienda reescribir-validar-comportamiento o quitar.
NO más PRs de "fix guardrail test" hasta esa decisión. ui-ux-pro-max solo asiste; manda DESIGN_SYSTEM + AESTHETE-1.
Reporta con la lista y la recomendación. 1 PR por entregable.
```

## 3 · CODEX (retoma backend)
```
Lee REGLAS_DE_EJECUCION_AGENTES.md y el issue ALQ-111.
Antes de empezar: git pull origin main.
Ejecuta: (1) inventario de PDFs subidos (norma GRI / dato cliente / iniciativa) con la tabla de PM_PDF_SCRAPING_STATUS.md: archivo, tipo, ¿texto extraíble?, dato clave, módulo destino, estado.
(2) Verifica la hipótesis CID con un PDF de Periódico Oficial/DOF: si pdftotext devuelve basura, implementa el flujo pdftoppm -jpeg -r 150 → OCR → claims.
(3) Corre el checklist de 5 pasos (descarga→extrae→clasifica→aplica→alerta) y reporta el paso exacto donde se rompe.
Procedencia obligatoria (source+fecha+método, nada inventado). NO merge a main (gate mío). Reporta con la tabla llena + el paso roto + 1 PR.
```

*Handoff · Alquimia · 20 jun 2026*
