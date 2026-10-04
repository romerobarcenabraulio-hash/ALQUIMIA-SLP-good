#!/usr/bin/env bash
# ALQ-112 · Ordenar carpeta alquimia-slp (estructura keep/archive/referencia)
# SEGURO: solo mueve (git mv, reversible) y rmdir de dirs VACÍOS.
# NO borra ningún archivo con contenido. Los duplicados " 2" se LISTAN para tu OK.
set -euo pipefail

REPO="/Users/braulioromerobarcena/Documents/alquimia-slp"
cd "$REPO"

# --- guardas ---
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Hay cambios sin commitear (¿Claude Code trabajando?). Haz commit/stash o mergea su PR ANTES de correr esto. Abortando."
  exit 1
fi
git checkout main
git pull origin main
git checkout -b chore/alq-112-ordenar-carpeta

mkdir -p "_ARCHIVO_VIEJO" "referencia"

# helper: mueve tracked con git mv, untracked con mv
mv_to () {
  dest="$1"; shift
  for it in "$@"; do
    [ -e "$it" ] || { echo "  skip (no existe): $it"; continue; }
    if git ls-files --error-unmatch "$it" >/dev/null 2>&1; then
      git mv "$it" "$dest"/ 2>/dev/null || mv "$it" "$dest"/
    else
      mv "$it" "$dest"/
    fi
    echo "  ✓ $it  ->  $dest/"
  done
}

echo "== 1) DATA/REFERENCIA -> referencia/ =="
mv_to referencia \
  "ADENDOS: LEGAL" "ESTANDARES INTERNACIONALES" "FRONTEND DEFINITIVO" \
  "REGLAMENTOS DE ASEO PUBBLICO" "fuentes de calculo" \
  "Investigacion_Precios_RSU_SLP.xlsx" "Tabla_Maestra_Fuentes_CapituloSLP.docx" \
  "Alquimia_Supermind_Maestro_v4_DEFINITIVO.docx"
shopt -s nullglob
for d in SLP*contexto* ; do git mv "$d" referencia/ 2>/dev/null || mv "$d" referencia/; echo "  ✓ $d -> referencia/"; done

echo "== 2) VIEJOS -> _ARCHIVO_VIEJO/ =="
mv_to _ARCHIVO_VIEJO \
  "AJUSTES POST-RESCATE" "AJUSTES.ALQUIMIA" "audit_visual_maqueta" "backups" \
  "COLA_Y_ROLES_AGENTES.md" "DEPLOYMENT 2.md" \
  "alquimia_cierre_y_arranque.md" "alquimia_hoja_de_ruta.md" "alquimia_prompts_agentes.md"
for f in IMPLEMENTATION_PLAN*.md SPRINT_EXECUTION_PLAN_V2*.md "listado de observaciones"* ; do
  [ -e "$f" ] && { git mv "$f" _ARCHIVO_VIEJO/ 2>/dev/null || mv "$f" _ARCHIVO_VIEJO/; echo "  ✓ $f -> _ARCHIVO_VIEJO/"; }
done

echo "== 3) PM_*.md -> planeación =="
mv_to "etapa de cierre y apertura planeacion/HANDOOF AGENTE DE CODIGO" PM_PDF_SCRAPING_STATUS.md PM_REVIEW_DESMADRE.md

echo "== 4) scripts sueltos -> scripts/ =="
mv_to scripts capture_audit.js capture_audit.py

echo "== 5) rmdir de dirs VACÍOS (basura) =="
for d in "--build" "up" "service-account.json" ".tmp_validation" ; do
  if [ -d "$d" ] && [ -z "$(ls -A "$d" 2>/dev/null)" ]; then rmdir "$d" && echo "  ✓ rmdir $d"; fi
done

echo "== 6) LISTA de candidatos a BORRAR (requieren tu OK; NO se borran aquí) =="
{
  echo "# Candidatos a borrar — revisa y borra tú con git rm. Generado $(date +%F)"
  echo "## Duplicados Mac ' 2.':"; find . -name '* 2.*' 2>/dev/null | grep -vE '/(\.git|node_modules|\.venv|_ARCHIVO_VIEJO)/' | sort
  echo "## Temporales / basura:"; find . \( -name '~\$*' -o -name '.DS_Store' -o -name 'alquimia_ci.db' \) 2>/dev/null | grep -vE '/\.git/'
} > _ARCHIVO_VIEJO/DELETE_CANDIDATES.txt
echo "  -> _ARCHIVO_VIEJO/DELETE_CANDIDATES.txt  ($(grep -c '/' _ARCHIVO_VIEJO/DELETE_CANDIDATES.txt) líneas)"

echo "== 7) FOLDER_MAP.md =="
cat > FOLDER_MAP.md <<'MAP'
# FOLDER_MAP — alquimia-slp
Mapa de la carpeta. 1 línea por entrada. (ALQ-112)

## Código (producto)
- backend/        API FastAPI + SQLAlchemy + Alembic
- frontend/       App React/Vite
- agents/         Agentes (orchestrator, Jarvis, ejecutores)
- modules/        Módulos del sistema
- system/         Núcleo/plataforma
- data/           Datos/seed del sistema
- scripts/        Scripts de utilidad
- config/ compose/ changelog/ phase-rules/   Config, docker, changelog, reglas de fase

## Docs canónicos (fuente de verdad)
- docs/                       Arquitectura (FASE*) y specs
- cursor-rules/               Contratos de agentes (AESTHETE-1, roles, protocolos)
- AJUSTES PARA FINIQUITAR/    Specs canónicos (agent spec, learning, automation)
- etapa de cierre y apertura planeacion/   Planeación viva (PM): pendientes, ejecutados, handoffs

## Referencia / data externa
- referencia/   Normas (GRI), reglamentos de aseo, contexto SLP, fuentes de cálculo, frontend definitivo, xlsx/docx maestros

## Archivo (histórico, NO usar)
- _ARCHIVO_VIEJO/   Rondas de ajuste viejas, planes superados, backups. DEPRECADO.

## Generado / ignorado (no tocar)
- .venv-pdf/ .pytest_cache/ node_modules/ .playwright-browsers/ .vercel/ .obsidian/ .cursor/ .claude/ codex-marketplaces/ plugins/
MAP
echo "  ✓ FOLDER_MAP.md"

git add -A
echo ""
echo "================ LISTO (sin commitear) ================"
echo "Revisa:   git status   y   cat _ARCHIVO_VIEJO/DELETE_CANDIDATES.txt"
echo "Si todo bien:"
echo "  git commit -m 'chore(ALQ-112): ordenar carpeta — referencia/, _ARCHIVO_VIEJO/, FOLDER_MAP'"
echo "  git push -u origin chore/alq-112-ordenar-carpeta   # luego abre PR"
echo "Para BORRAR los duplicados (cuando des OK): usa la lista de DELETE_CANDIDATES.txt con git rm."
