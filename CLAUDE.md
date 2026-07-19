# CLAUDE CODE — EXECUTION REFERENCE

**Reference document for Claude Code agent operations in this repository.**

This file points to the master execution contract:

## Master Contract

→ **Read `AGENTS.md` (this repo root)** for the permanent execution rules (v1.3).

The contract in AGENTS.md subsumes all individual prompts. It defines:
- **Mentalidad** (§1): autonomous, responsible, rigorous, critical
- **Firewall** (§2): reversible vs. irreversible actions — the line that prevents 95% of disasters
- **Anti-disaster in GitHub** (§3): branching, PR, merge rules
- **Anti-regression** (§3B): understand before editing, no ball-of-snow
- **Consolidate to main constantly** (§3C): short-lived branches, same-day merges
- **Task cycle with self-audit** (§7–§7B): code → audit → fix → PR → (controller merges) → next
- **Linear as bitacora** (§8C): one issue = one task = one PR; all comms live in Linear
- **Where files go** (§8B): code in backend/frontend; specs in `etapa de cierre/DOCUMENTOS PENDIENTES/`; handoffs in `HANDOOF AGENTE DE CODIGO/`

## Minimal Prompt Template

The founder can write in one line:

> "Lee las REGLAS y `[DOC]`. Ejecuta `[TAREA]`. Reporta."

The agent loads AGENTS.md, understands the contract, reads the specified doc, executes, and reports.

## Setup (One-Time)

This file and AGENTS.md replace all prior prompt documents. Read them once; they're permanent.

## Current Merge Train & Immediate Tasks

See `RELEVO_CLAUDE_CODE_02jul.md` (stored in `etapa de cierre y apertura planeacion/HANDOOF AGENTE DE CODIGO/`) for:
1. Inventory of ~30 branches (ALQ-108 order)
2. Merge train execution (clean + green CI → main, same day)
3. Folder cleanup (ALQ-112 → FOLDER_MAP.md)
4. Frontend specs in dependency order

---

**Version:** 1.3 · 2026-07-02  
**Applies to:** Claude Code (all versions)  
**Supersedes:** All prior relevo docs and individual task prompts.
