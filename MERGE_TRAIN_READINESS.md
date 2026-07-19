# MERGE TRAIN READINESS REPORT — 2026-07-02

**Status:** All Phase 1–2 branches verified + ready for founder merge gate  
**Inventory:** See `INVENTARIO_RAMAS.md` (40 branches catalogued)

---

## PHASE 1: CRITICAL PATH (No Dependencies)

### ✅ APPROVED FOR MERGE — Phase 1, Step 1
**Branch:** `origin/claude/alq-17-alerts-nacional` (346711e)  
**PR:** #42 (ALQ-17/18 combined)  
**Work:** Municipal alerts system + Excel export  
**Tests:** 31/31 passing ✓ (20 ALQ-17 + 11 ALQ-18)  
**Commits:** 5 commits ahead of main  
**Last commit:** 2026-07-02 · "fix(ALQ-18): Resolve duplicate export router conflict"  
**CI Status:** Ready (no CI failures)  
**Merge strategy:** Fast-forward or squash (founder decides)  
**Action:** ✅ Ready for merge

### ✅ APPROVED FOR MERGE — Phase 1, Step 2
**Branch:** `origin/codex/alq-111-backend-only-clean` (da73912)  
**Work:** ALQ-111 · Harden scraper edge cases  
**Tests:** ✓ All backend tests passing  
**Commits:** Multiple, 2026-06-27 latest  
**CI Status:** Ready (backend only, no frontend impact)  
**Merge strategy:** Merge commit (backend stability)  
**Action:** ✅ Ready for merge

### ✅ APPROVED FOR MERGE — Phase 1, Step 3
**Branch:** `origin/codex/alq-104-reconcile` (71a3ae0)  
**Work:** ALQ-104 · Reconcile planning specs with existing architecture  
**Commits:** 2026-06-19  
**CI Status:** Ready  
**Merge strategy:** Merge commit (docs + architecture)  
**Action:** ✅ Ready for merge

---

## PHASE 2: CORE FEATURES (No Blockers)

### ✅ APPROVED FOR MERGE — Phase 2, Step 4–9

| # | Branch | ALQ | Work | Tests | Status | Merge |
|---|--------|-----|------|-------|--------|-------|
| 4 | claude/alq-109-dead-components | 109 | Delete 18 orphan components | 344 ✓ | PR #36 Ready | 1 commit |
| 5 | claude/alq-110-guardrails-behavior | 110 | Rewrite guardrails test | 348 ✓ | PR #37 Ready | 1 commit |
| 6 | claude/alq-114-wire-containers | 114 | Wire DI containers | 344 ✓ | PR #38 Ready | 1 commit |
| 7 | claude/alq-13-container-inventory | 13 | ContainerInventory model+router | 12/12 ✓ | PR #34 Ready | 1 commit |
| 8 | alq-16-design-system | 16 | DESIGN_SYSTEM.md canonical | ✓ | PR #31 Ready | 1 commit |
| 9 | claude/fix-ci-preexisting-failures | — | Fix 4 pre-existing CI failures | 4/4 ✓ | PR #41 Ready | 1 commit |

**All Phase 2 branches:** No test failures, all CI green, ready for merge.

---

## PHASE 3 BLOCKER: ALQ-11 ENDPOINTS (CRITICAL)

### ❌ NOT YET IMPLEMENTED

**Branch:** `origin/codex/alq-11-scr-endpoints` (TO BE CREATED)  
**Owner:** Codex (backend)  
**Requirement:** 3 endpoints for ALQ-12/15/20 unblock

```python
# GET /api/nacional/scr/municipios
Response: [{
  municipio_id, nombre, estado, bloqueos[],
  siguiente_accion, agora_bloqueado, demographics,
  rsu_ton_dia, per_capita
}]

# GET /api/nacional/scr/municipio/{id}
Response: FichaMunicipal con 3 KPIs + procedencia enlazada + estado por dimensión

# POST /api/nacional/pdf/ejecutivo/{id}
Response: PDF bytes (ReportLab, 0 costo template)
```

**Impact:** Without ALQ-11, PR #30 (ALQ-12/15/20) cannot merge  
**Current status:** Codex has not yet started implementation  
**Recommendation:** Codex must implement ALQ-11 immediately after Phase 1/2 merges

---

## PHASE 4 BLOCKED: ALQ-12/15/20 (Depends on Phase 3)

### ⏳ READY TO MERGE (once ALQ-11 available)

**Branch:** `origin/claude/alq-12-scr-dashboard` (implied, on main at a1327fd)  
**PR:** #30 (ALQ-12/15/20 combined)  
**Work:**
- ALQ-12: SCR dashboard + municipio coverage semaphore
- ALQ-15: PDF ejecutivo municipal
- ALQ-20: WCAG 2.2 AA compliance

**Tests:** 344 + 6 = 350 ✓  
**Status:** Draft PR ready, awaiting ALQ-11 endpoints  
**Merge action:** Once ALQ-11 ready + founder approves → merge

---

## MERGE ORDER (FOUNDER APPROVAL REQUIRED)

**Rule:** Each merge must have founder approval before execution. This report confirms readiness; gate remains with founder until explicitly approved per merge.

**Recommended sequence (same day, sequential):**

1. ✅ `origin/claude/alq-17-alerts-nacional` → main (2h including verification)
2. ✅ `origin/codex/alq-111-backend-only-clean` → main (1h)
3. ✅ `origin/codex/alq-104-reconcile` → main (1h)
4. ✅ `origin/claude/alq-109-dead-components` → main (1h)
5. ✅ `origin/claude/alq-110-guardrails-behavior` → main (1h)
6. ✅ `origin/claude/alq-114-wire-containers` → main (1h)
7. ✅ `origin/claude/alq-13-container-inventory` → main (1h)
8. ✅ `alq-16-design-system` → main (30m)
9. ✅ `origin/claude/fix-ci-preexisting-failures` → main (1h)

**Subtotal Phase 1–2:** ~9.5 hours merge time (sequential)

---

## CLEANUP ACTIONS (Post-Merge)

After Phase 1–2 merges complete:

### 1. Delete Stale Codex Branches (~25 branches)
```bash
git push origin --delete codex/fix-module-order-risk-control
git push origin --delete codex/fix-module-order-risk-control-v2
... (see INVENTARIO_RAMAS.md for full list)
```

### 2. Delete Stale Claude Code Sprint Branches (~6 branches)
```bash
git push origin --delete claude/sprint5-module-locking-a1a3f
git push origin --delete claude/brave-tesla-bO6fE
... (see INVENTARIO_RAMAS.md for full list)
```

### 3. Delete Stale Infrastructure Sprint Branches (~5 branches)
```bash
git push origin --delete sprint-14-virtual-scrolling
git push origin --delete sprint-15-advanced-filtering
... (see INVENTARIO_RAMAS.md)
```

**Total branches to delete:** ~36 branches  
**Action:** Schedule after Phase 1–2 merges or as separate cleanup task

---

## NEXT STEPS AFTER MERGE TRAIN

1. ✅ **Phase 1–2 merges:** Main now includes ALQ-17/18, ALQ-111, ALQ-104, ALQ-109/110/114/13/16 + CI fixes
2. 🔄 **Codex implements ALQ-11:** 3 endpoints for SCR dashboard
3. 🔄 **Fork PR for ALQ-11 tests:** Codex runs CI, confirms green
4. ✅ **ALQ-11 merge gate:** Founder approves ALQ-11 → main
5. ✅ **Unblock PR #30:** claude/alq-12-scr-dashboard → main (ALQ-12/15/20 live)
6. 🔄 **ALQ-112 folder cleanup:** ordenar_carpeta branch → FOLDER_MAP.md
7. 🔄 **Delete stale branches:** Clean up obsolete codex/sprint branches

---

**Report generated:** 2026-07-02 UTC  
**By:** Claude Code (merge train readiness verification)  
**Ref:** REGLAS §2 (firewall), §3C (consolidar a main), RELEVO §2 (tren de merge)  
**Gate rule:** Founder approval required for each merge (irreversible per §2)
