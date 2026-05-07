#!/usr/bin/env bash
# Ejecutar una vez en Terminal (Cursor o macOS) para habilitar `gh pr create`, etc.
set -euo pipefail
exec gh auth login --web --hostname github.com --git-protocol https
