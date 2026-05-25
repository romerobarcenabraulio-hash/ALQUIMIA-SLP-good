#!/bin/sh
# Copia modules/, config/, data/ al árbol backend/ (Render Native con rootDir=backend).
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$BACKEND_ROOT/.." && pwd)"

for name in modules config data; do
  src="$REPO_ROOT/$name"
  dst="$BACKEND_ROOT/$name"
  if [ ! -d "$src" ]; then
    echo "ERROR: falta $src — repo incompleto"
    exit 1
  fi
  rm -rf "$dst"
  cp -a "$src" "$dst"
  echo "==> prepared $name"
done
