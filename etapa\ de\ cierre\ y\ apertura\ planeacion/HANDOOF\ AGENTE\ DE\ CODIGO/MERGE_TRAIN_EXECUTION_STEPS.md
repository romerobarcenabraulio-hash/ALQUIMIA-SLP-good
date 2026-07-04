# MERGE TRAIN EXECUTION STEPS — Phase 1-2 (Founder Controlled)

**Status:** All 9 branches verified ready (1,053 tests ✓)  
**Prerequisite:** PR #43 merged to main (establishes AGENTS.md + CLAUDE.md contract)  
**Gate:** Founder approval required for each merge (irreversible per REGLAS §2)

---

## Pre-Merge Checklist

- [ ] PR #43 (chore/repo-setup-permanent-contract) merged to main
- [ ] All branches fetched: `git fetch --all --prune`
- [ ] No uncommitted changes locally
- [ ] Rollback plan reviewed (see §5 below)

---

## PHASE 1: Critical Path (No Dependencies) — ~4 hours

### 1️⃣ Merge `origin/claude/alq-17-alerts-nacional` → main

**Branch:** PR #42 (ALQ-17/18)  
**Tests:** 31/31 passing ✓  
**Impact:** Municipal alerts + Excel export live  

```bash
# Pre-merge verification
git fetch origin claude/alq-17-alerts-nacional
git log origin/main..origin/claude/alq-17-alerts-nacional --oneline

# Merge (founder: choose strategy)
git checkout main
git pull origin main
git merge --no-ff origin/claude/alq-17-alerts-nacional -m "Merge PR #42: ALQ-17/18 (municipal alerts + Excel export)"

# Verify
git log --oneline -n 3
git push origin main

# Post-merge
git branch -d claude/alq-17-alerts-nacional  # local cleanup
```

**Expected commit:** Adds alert subscription service + Excel export builder  
**Rollback:** `git revert -m 1 <merge-commit-sha>`

---

### 2️⃣ Merge `origin/codex/alq-111-backend-only-clean` → main

**Branch:** ALQ-111 (Scraper hardening)  
**Tests:** Backend ✓  
**Impact:** Scraper edge case fixes  

```bash
git fetch origin codex/alq-111-backend-only-clean
git log origin/main..origin/codex/alq-111-backend-only-clean --oneline
git checkout main
git pull origin main
git merge --no-ff origin/codex/alq-111-backend-only-clean -m "Merge ALQ-111: Harden scraper edge cases"
git push origin main
```

**Expected:** 1 commit, backend-only changes  
**Rollback:** `git revert -m 1 <merge-commit-sha>`

---

### 3️⃣ Merge `origin/codex/alq-104-reconcile` → main

**Branch:** ALQ-104 (Architecture reconciliation)  
**Tests:** ✓  
**Impact:** Planning specs aligned with architecture  

```bash
git fetch origin codex/alq-104-reconcile
git log origin/main..origin/codex/alq-104-reconcile --oneline
git checkout main
git pull origin main
git merge --no-ff origin/codex/alq-104-reconcile -m "Merge ALQ-104: Reconcile planning specs with architecture"
git push origin main
```

**Expected:** Documentation + schema updates  
**Rollback:** `git revert -m 1 <merge-commit-sha>`

---

## PHASE 2: Core Features (No Blockers) — ~5.5 hours

### 4️⃣ Merge `origin/claude/alq-109-dead-components` → main

**Branch:** PR #36 (ALQ-109)  
**Tests:** 344 ✓  
**Impact:** 18 orphan components removed  

```bash
git fetch origin claude/alq-109-dead-components
git log origin/main..origin/claude/alq-109-dead-components --oneline
git checkout main
git pull origin main
git merge --no-ff origin/claude/alq-109-dead-components -m "Merge PR #36: ALQ-109 (delete 18 orphan components)"
git push origin main
```

**Expected:** Code cleanup, no feature additions  
**Rollback:** `git revert -m 1 <merge-commit-sha>`

---

### 5️⃣ Merge `origin/claude/alq-110-guardrails-behavior` → main

**Branch:** PR #37 (ALQ-110)  
**Tests:** 348 ✓  
**Impact:** Guardrails test rewritten to behavior-based  

```bash
git fetch origin claude/alq-110-guardrails-behavior
git log origin/main..origin/claude/alq-110-guardrails-behavior --oneline
git checkout main
git pull origin main
git merge --no-ff origin/claude/alq-110-guardrails-behavior -m "Merge PR #37: ALQ-110 (guardrails behavior-based test)"
git push origin main
```

**Expected:** Test refactor, no behavior changes  
**Rollback:** `git revert -m 1 <merge-commit-sha>`

---

### 6️⃣ Merge `origin/claude/alq-114-wire-containers` → main

**Branch:** PR #38 (ALQ-114)  
**Tests:** 344 ✓  
**Impact:** Dependency injection containers wired  

```bash
git fetch origin claude/alq-114-wire-containers
git log origin/main..origin/claude/alq-114-wire-containers --oneline
git checkout main
git pull origin main
git merge --no-ff origin/claude/alq-114-wire-containers -m "Merge PR #38: ALQ-114 (wire ContainersProvider + ErrorBoundary)"
git push origin main
```

**Expected:** DI infrastructure setup  
**Rollback:** `git revert -m 1 <merge-commit-sha>`

---

### 7️⃣ Merge `origin/claude/alq-13-container-inventory` → main

**Branch:** PR #34 (ALQ-13)  
**Tests:** 12/12 ✓  
**Impact:** ContainerInventory model + router live  

```bash
git fetch origin claude/alq-13-container-inventory
git log origin/main..origin/claude/alq-13-container-inventory --oneline
git checkout main
git pull origin main
git merge --no-ff origin/claude/alq-13-container-inventory -m "Merge PR #34: ALQ-13 (ContainerInventory model + router)"
git push origin main
```

**Expected:** ORM model, service, FastAPI router  
**Rollback:** `git revert -m 1 <merge-commit-sha>`

---

### 8️⃣ Merge `origin/alq-16-design-system` → main

**Branch:** PR #31 (ALQ-16)  
**Tests:** N/A (documentation)  
**Impact:** DESIGN_SYSTEM.md canonical reference  

```bash
git fetch origin alq-16-design-system
git log origin/main..origin/alq-16-design-system --oneline
git checkout main
git pull origin main
git merge --no-ff origin/alq-16-design-system -m "Merge PR #31: ALQ-16 (DESIGN_SYSTEM.md canonical)"
git push origin main
```

**Expected:** Design tokens, accessibility guidelines, editorial standards  
**Rollback:** `git revert -m 1 <merge-commit-sha>`

---

### 9️⃣ Merge `origin/claude/fix-ci-preexisting-failures` → main

**Branch:** PR #41 (ALQ-107)  
**Tests:** 4/4 ✓  
**Impact:** 4 pre-existing backend CI failures fixed  

```bash
git fetch origin claude/fix-ci-preexisting-failures
git log origin/main..origin/claude/fix-ci-preexisting-failures --oneline
git checkout main
git pull origin main
git merge --no-ff origin/claude/fix-ci-preexisting-failures -m "Merge PR #41: Fix 4 pre-existing backend CI failures"
git push origin main
```

**Expected:** Backend test fixes (deterministic, no regressions)  
**Rollback:** `git revert -m 1 <merge-commit-sha>`

---

## Post Phase 1-2: Next Steps

### Verify All Merged
```bash
git log origin/main --oneline -n 10
git branch -r | grep -E "alq-17|alq-111|alq-104|alq-109|alq-110|alq-114|alq-13|alq-16|fix-ci" | wc -l
# Expected: 9 branches merged (all should be tracking origin/main now)
```

### Codex Parallel Work: ALQ-11 Endpoints
While Phase 1-2 merges, Codex implements ALQ-11:
- `GET /api/nacional/scr/municipios` (municipio list with coverage)
- `GET /api/nacional/scr/municipio/{id}` (FichaMunicipal detail)
- `POST /api/nacional/pdf/ejecutivo/{id}` (PDF export)

### Unblock Phase 4: ALQ-12/15/20
Once ALQ-11 endpoints live:
- Merge PR #30 (ALQ-12/15/20) → main
- Activates SCR dashboard + PDF ejecutivo + WCAG 2.2 AA

### Phase 5: Cleanup (ALQ-112)
- Merge `origin/chore/alq-112-ordenar-carpeta` → main
- Delete 36 stale branches (old sprints, codex duplicates)

---

## 🚨 Rollback Strategy (If Merge Conflicts / Failures)

Each merge creates a separate commit with `--no-ff`. If a merge fails:

1. **Identify conflict/failure:**
   ```bash
   git status
   ```

2. **Abort merge (safe, reversible):**
   ```bash
   git merge --abort
   ```

3. **Diagnose:**
   - Check if branch is stale (run `git fetch --all --prune` again)
   - Verify CI on the branch (check GitHub Actions)
   - Review PR comments for known issues

4. **Skip branch if needed:**
   - Document why (e.g., "conflict with Phase 1 changes")
   - Move to next branch
   - Report to founder

5. **Full rollback (if multiple merges need reversal):**
   ```bash
   git revert -m 1 <merge-commit-sha>  # Reverts ONE merge
   git push origin main
   ```

---

## Monitoring Checklist

After each merge:
- [ ] GitHub Actions "checks" job passes (or known pre-existing failure)
- [ ] Vercel preview deploys successfully
- [ ] No new test failures (vs. main before merge)
- [ ] Branch protection rules satisfied (if any)

---

## Timeline

**Phase 1:** ~4 hours (steps 1-3)  
**Phase 2:** ~5.5 hours (steps 4-9)  
**Total:** ~9.5 hours sequential  
**Parallel:** Codex starts ALQ-11 immediately after Phase 1-2 begins

---

## Final Status

✅ **Merge train ready for execution**  
🔒 **Founder gate:** Each merge requires founder decision  
📋 **Tracking:** Linear ALQ-108 "Tren de merge"  
🎯 **Goal:** main reflects real work. Zero stale branches post-merge.

---

**Generated:** 2026-07-02 (Claude Code)  
**Ref:** REGLAS §2 (firewall), §3C (consolidate to main), RELEVO §2 (merge train)  
**Contact:** Linear ALQ-108 for updates
