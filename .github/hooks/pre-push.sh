#!/usr/bin/env bash
# Hook local opcional — copiar a .git/hooks/pre-push y hacer chmod +x
# Uso: cp .github/hooks/pre-push.sh .git/hooks/pre-push && chmod +x .git/hooks/pre-push

set -e
echo "🔍 Pre-push: verificando antes de enviar a origin…"

# 1. Symlinks rotos en public/
broken=$(find frontend/public -type l ! -exec test -e {} \; -print 2>/dev/null)
if [ -n "$broken" ]; then
  echo "❌ Symlinks rotos en frontend/public/ — elimina o reemplaza con archivos reales:"
  echo "$broken"
  exit 1
fi

# 2. .next/ no debe estar trackeado
tracked=$(git ls-files frontend/.next/ | head -3)
if [ -n "$tracked" ]; then
  echo "❌ frontend/.next/ está en git. Ejecuta: git rm -r --cached frontend/.next/"
  exit 1
fi

# 3. TypeScript limpio
echo "🔍 TypeScript check…"
(cd frontend && node node_modules/typescript/bin/tsc --noEmit)

echo "✅ Pre-push OK — enviando"
