#!/usr/bin/env bash
# Render Native (sin Docker): instalar deps del backend.
set -euo pipefail
cd "$(dirname "$0")/backend"
bash scripts/prepare_monorepo.sh
pip install -r requirements.txt
