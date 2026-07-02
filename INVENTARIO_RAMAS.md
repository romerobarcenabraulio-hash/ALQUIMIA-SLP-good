# INVENTARIO DE RAMAS — 2026-07-02

**Fetched:** `git fetch --all --prune`  
**Total branches:** ~40  
**Status:** Main at `a1327fd` (2026-07-02)

## CLAUDE CODE BRANCHES (Frontend) — ALQ-12–20

### 🟢 LISTOS PARA MERGE (PR Draft + Tests ✓ + CI Verde)
1. **claude/alq-17-alerts-nacional** (346711e)
   - ALQ-17: Municipal alerts system
   - ALQ-18: Excel export 
   - PR #42: 31/31 tests ✓ (20 ALQ-17 + 11 ALQ-18)
   - Status: Ready → founder merge

2. **claude/alq-109-dead-components** (27ed7d2)
   - ALQ-109: Delete 18 orphan components
   - PR #36: 344 tests ✓
   - Status: Draft → awaiting founder review

3. **claude/alq-110-guardrails-behavior** (00194e5)
   - ALQ-110: Guardrails behavior-based test rewrite
   - PR #37: 348 tests ✓
   - Status: Draft → awaiting founder review

4. **claude/alq-114-wire-containers** (dfe35dc)
   - ALQ-114: Wire ContainersProvider + ErrorBoundary
   - PR #38: 344 tests ✓
   - Status: Draft → awaiting founder review

5. **claude/alq-13-container-inventory** (33f024b)
   - ALQ-13: ContainerInventory model + service + router
   - PR #34: 12/12 tests ✓
   - Status: Draft → awaiting founder review

6. **alq-16-design-system** (2417da4)
   - ALQ-16: DESIGN_SYSTEM.md canonical
   - PR #31: 293 líneas ✓
   - Status: Draft → awaiting founder review

7. **claude/fix-ci-preexisting-failures** (a8f8ea2)
   - Backend CI: 4 pre-existing test failures fixed
   - PR #41: 4/4 tests ✓
   - Status: Draft → awaiting founder review

8. **claude/wizardly-sagan-sokvq4** (2ecb926)
   - ALQ-20: WCAG 2.2 AA compliance (touch targets, reduced motion, focus-visible)
   - Part of PR #30 (ALQ-12/15/20 combined)
   - Status: In branch, ready

### 🟡 BLOQUEADA POR DEPENDENCIA
9. **claude/alq-12-scr-dashboard** (implied, main at a1327fd)
   - ALQ-12: SCR (Sistema de Cobertura Real) dashboard
   - ALQ-15: PDF ejecutivo municipal
   - ALQ-20: WCAG 2.2 AA (in wizardly-sagan-sokvq4)
   - PR #30: 344 + 6 tests ✓
   - **Blocks on:** ALQ-11 endpoints (Codex backend: GET /api/nacional/scr/*)
   - Status: Ready for merge once ALQ-11 endpoints available

### ❌ STALE / OLD SPRINT BRANCHES (pre-June)
- claude/sprint5-module-locking-a1a3f (7ca388b, 2026-06-04)
- claude/brave-tesla-bO6fE (1d96d14, 2026-06-17)
- claude/brave-tesla-bO6fE-sprint4 (1d6ae2a, 2026-06-04)
- claude/sprint5-completion-triggers (44202f1, 2026-06-04)
- claude/sprint6-rbac (00ffcf7, 2026-06-04)
- claude/sprint7-data-persistence (3d6c22f, 2026-06-04)

**Decision:** Obsolete. Keep for git history; don't merge.

---

## CODEX BRANCHES (Backend) — ALQ-11, ALQ-104, ALQ-111

### 🟢 READY FOR MERGE
1. **origin/codex/alq-111-backend-only-clean** (da73912)
   - ALQ-111: Harden scraper edge cases
   - Tests: ✓
   - Status: Ready → founder merge (no frontend impact)

2. **origin/codex/alq-104-reconcile** (71a3ae0)
   - ALQ-104: Reconcile planning specs with existing architecture
   - Tests: ✓
   - Status: Ready → founder merge

### 🟡 CRITICAL FOR ALQ-12 UNBLOCK
3. **origin/codex/alq-111-backend-only-clean** (da73912)
   - ALQ-11 endpoints needed:
     * `GET /api/nacional/scr/municipios` → list of municipios with coverage status
     * `GET /api/nacional/scr/municipio/{id}` → FichaMunicipal with 3 KPIs + data provenance
     * `POST /api/nacional/pdf/ejecutivo/{id}` → PDF bytes (ReportLab, no templates)
   - **Status:** TODO (not yet implemented)
   - **Blocker for:** PR #30 (ALQ-12/15/20) merge

### ❌ STALE / DUPLICATE CODEX BRANCHES
- codex/fix-module-order-risk-control (7d843cb, 2026-06-02)
- codex/fix-module-order-risk-control-v2 (7d843cb, 2026-06-02)
- codex/module-order-guardrail-clean (7d843cb, 2026-06-02)
- codex/backend-bibliography-registry (7d843cb, 2026-06-02)
- codex/module-order-registry-clean (f671baf, 2026-06-02)
- codex/clean-rescue (d932d43, 2026-06-03)
- codex/rescue-consulting-modules (bcfe470, 2026-06-03)
- codex/consulting-module-mvp (2abe53a, 2026-06-02)
- codex/local-consulting-navigation-recovery (94f7525, 2026-06-02)
- codex/stabilize-consulting-navigation-from-main (85f301b, 2026-06-02)
- codex/stabilize-consulting-navigation (54caa4d, 2026-06-01)
- codex/frontend-evidence-demo (54caa4d, 2026-06-01)
- codex/frontend-clean-origin (579d441, 2026-06-18)
- codex/bibliographic-approximation-objects (4a0b59e, 2026-06-02)
- codex/auto-traced-document-integration (a2e6426, 2026-06-02)
- codex/demo-bibliographic-recovery-objects (3b01183, 2026-06-02)
- codex/main-sync-real (0778ef2, 2026-06-02)
- codex/git-sync-risk-register-v2 (3f8c739, 2026-06-02)

**Decision:** All obsolete (same commit hashes repeat, docs/recovery branches from previous rebuild phases). Keep for history; don't merge. Clean up later per ALQ-112.

---

## INFRASTRUCTURE & HOTFIXES

### 🟢 CI FIX BRANCH
1. **origin/fix/ci-postgres-service** (d480d7f)
   - ALQ-107 (implicit): PostgreSQL CI service configuration
   - Replaces 'stakeholder' with canonical terminology per EIDOS check
   - Status: Ready → merge (post ALQ-11)

### 🟡 FOLDER CLEANUP (ALQ-112)
1. **origin/chore/alq-112-ordenar-carpeta** (74f40c1, 2026-06-20)
   - Move referencia/ to _ARCHIVO_VIEJO/
   - Generate FOLDER_MAP.md
   - Status: Ready → merge after current features

### ❌ OLD SPRINT BRANCHES (Infra)
- sprint-14-virtual-scrolling (2b02579, 2026-06-04)
- sprint-15-advanced-filtering (68b4630, 2026-06-04)
- sprint-16-admin-alerts (1aa5745, 2026-06-04)
- sprint-17-payment-system (4804131, 2026-06-04)
- sprint-18-api-optimization (baa1e1a, 2026-06-04)

**Decision:** All obsolete (pre-June sprints). Keep for history; don't merge.

---

## MERGE TRAIN ORDER (ALQ-108 SEQUENCE)

**Gate rule:** Clean merge + CI green → `main` (same day, founder-only)

### PHASE 1: Stabilize Core (No dependencies)
1. ✅ **claude/alq-17-alerts-nacional** (346711e) — PR #42
   - Merge criteria: CI ✓, 31/31 tests ✓, Greptile ✓, founder approval
   - Time estimate: ~2h (merge only)

2. 🔄 **codex/alq-111-backend-only-clean** (da73912)
   - Merge criteria: CI ✓, tests ✓, no frontend impact
   - Time estimate: ~1h

3. 🔄 **codex/alq-104-reconcile** (71a3ae0)
   - Merge criteria: CI ✓, docs reconciled with arch
   - Time estimate: ~1h

### PHASE 2: Core Features (Claude Code)
4. 🔄 **claude/alq-109-dead-components** (27ed7d2) — PR #36
   - Merge criteria: 344 tests ✓, no regressions, founder approval
   - Time estimate: ~1h

5. 🔄 **claude/alq-110-guardrails-behavior** (00194e5) — PR #37
   - Merge criteria: 348 tests ✓, behavior validated
   - Time estimate: ~1h

6. 🔄 **claude/alq-114-wire-containers** (dfe35dc) — PR #38
   - Merge criteria: 344 tests ✓, DI wired
   - Time estimate: ~1h

7. 🔄 **claude/alq-13-container-inventory** (33f024b) — PR #34
   - Merge criteria: 12/12 tests ✓, router functional
   - Time estimate: ~1h

8. 🔄 **alq-16-design-system** (2417da4) — PR #31
   - Merge criteria: DESIGN_SYSTEM.md ✓, no code changes
   - Time estimate: ~30m

9. 🔄 **claude/fix-ci-preexisting-failures** (a8f8ea2) — PR #41
   - Merge criteria: 4/4 CI tests ✓, no regressions
   - Time estimate: ~1h

### PHASE 3: ALQ-11 Endpoints (CODEX CRITICAL BLOCKER)
10. ⏳ **codex/alq-11-scr-endpoints** (TBD)
    - Required endpoints for ALQ-12 unblock:
      * `GET /api/nacional/scr/municipios`
      * `GET /api/nacional/scr/municipio/{id}`
      * `POST /api/nacional/pdf/ejecutivo/{id}`
    - Status: NOT YET IMPLEMENTED
    - Blocker for: PR #30 (ALQ-12/15/20)
    - **Action:** Codex must implement immediately post Phase 2

### PHASE 4: Frontend Main Features (Blocked on Phase 3)
11. ⏳ **claude/alq-12-scr-dashboard** (PR #30)
    - ALQ-12: SCR dashboard
    - ALQ-15: PDF ejecutivo
    - ALQ-20: WCAG 2.2 AA (in wizardly-sagan-sokvq4)
    - Merge criteria: 344 tests ✓, 6 PDF tests ✓, ALQ-11 endpoints ✓, WCAG audit ✓
    - Time estimate: ~2h (merge only, once ALQ-11 ready)
    - **Unblocks:** All downstream features

### PHASE 5: Cleanup & Stabilization
12. 🔄 **chore/alq-112-ordenar-carpeta** (74f40c1)
    - Folder reorganization → FOLDER_MAP.md
    - Time estimate: ~1h

---

## BRANCHES TO DELETE (Post-Merge Cleanup)

After merging, delete these (obsolete):

```bash
# Codex duplicates & old sprints
git branch -D codex/fix-module-order-risk-control
git branch -D codex/fix-module-order-risk-control-v2
git branch -D codex/module-order-guardrail-clean
git branch -D codex/backend-bibliography-registry
git branch -D codex/module-order-registry-clean
git branch -D codex/clean-rescue
... (see full list above under ❌ STALE)

# Old Claude Code sprints
git branch -D claude/sprint5-module-locking-a1a3f
git branch -D claude/brave-tesla-bO6fE
... (see full list above under ❌ STALE)

# Old infra sprints
git branch -D sprint-14-virtual-scrolling
git branch -D sprint-15-advanced-filtering
... (see full list above)
```

---

## Current Status Summary

| Phase | Task | Branch | Tests | Status | ETA |
|-------|------|--------|-------|--------|-----|
| 1 | ALQ-17/18 | claude/alq-17-alerts-nacional | 31/31 ✓ | PR #42 ready | 2h |
| 1 | ALQ-111 | codex/alq-111-backend-only-clean | ✓ | Ready | 1h |
| 1 | ALQ-104 | codex/alq-104-reconcile | ✓ | Ready | 1h |
| 2 | ALQ-109 | claude/alq-109-dead-components | 344 ✓ | PR #36 | 1h |
| 2 | ALQ-110 | claude/alq-110-guardrails-behavior | 348 ✓ | PR #37 | 1h |
| 2 | ALQ-114 | claude/alq-114-wire-containers | 344 ✓ | PR #38 | 1h |
| 2 | ALQ-13 | claude/alq-13-container-inventory | 12/12 ✓ | PR #34 | 1h |
| 2 | ALQ-16 | alq-16-design-system | ✓ | PR #31 | 30m |
| 2 | CI Fix | claude/fix-ci-preexisting-failures | 4/4 ✓ | PR #41 | 1h |
| 3 | ALQ-11 | codex/alq-11-scr-endpoints | — | **TODO** | TBD |
| 4 | ALQ-12/15/20 | claude/alq-12-scr-dashboard | 350 ✓ | PR #30 blocked | 2h (post ALQ-11) |
| 5 | ALQ-112 | chore/alq-112-ordenar-carpeta | ✓ | Ready | 1h |

**Total merge time (sequential):** ~14 hours  
**Parallelizable:** Phase 1 & 2 can merge in parallel if CI permits  
**Critical path:** Phase 3 (ALQ-11) blocks Phase 4  

---

**Generated:** 2026-07-02 UTC  
**By:** Claude Code (merge train inventory)  
**Ref:** RELEVO §2 + ALQ-108 ordering
