# Deployment Diagnostic · 2026-06-01

## Decision

`DEPLOYMENT STATUS: NOT FULLY VERIFIED`

The current evidence shows that today's local work is not fully deployed because the primary checkout is not aligned with `origin/main`, and several requested changes still exist only as local or non-main branch state.

## Evidence reviewed

| Check | Evidence | Result |
| --- | --- | --- |
| Primary checkout branch | `git status --short --branch` shows `main...origin/main [ahead 1, behind 5]` | `FAIL`: local `main` diverged from remote `main` |
| Primary local commit | `git log --all` shows `21fda6a3 Fix admin tenant selection in production` on local `main` and `origin/codex/fix-admin-tenant-production`, not on `origin/main` | `FAIL`: this commit is not deployed by a Vercel project tracking `main` |
| Remote main from release copy | `/private/tmp/alquimia-final-release.wUWD3n` reports `HEAD == origin/main == 2ef3e83ad182e9d8d1e9df545bfbb635bcb1c414` | `PASS`: Clerk middleware fix was pushed to `main` |
| Current dirty worktree | `git diff --stat` shows broad uncommitted frontend/backend changes | `FAIL`: uncommitted work cannot be deployed |
| Vercel CLI availability | `which vercel` returned `vercel not found` | `BLOCKED`: deployment status cannot be queried from CLI here |
| Network from sandbox | `curl` to GitHub and `alquimiaplatform.com` failed DNS resolution | `BLOCKED`: live production cannot be verified from this sandbox |
| Local env keys | `.env.local` and `frontend/.env.local` include Clerk keys but do not include `NEXT_PUBLIC_API_URL` | `RISK`: Vercel production builds require `NEXT_PUBLIC_API_URL` per `frontend/next.config.js` |
| Frontend typecheck | `npm run type-check` completed successfully | `PASS` |
| Backend auth tests | `PYTHONPATH=backend backend/.venv/bin/python -m pytest backend/tests/test_auth_accounts.py -q` returned `7 passed` | `PASS` |
| Frontend build | `npm run build` started but produced no final output for more than one minute in this sandbox | `PARTIAL`: build not verified for current dirty state |

## Likely causes

1. `origin/main` is not the same as the primary local checkout.
   - Production deployments usually follow `origin/main`.
   - The current local checkout has one commit ahead of `origin/main` and five commits behind.

2. Several changes from today's work are still uncommitted.
   - The dirty worktree includes auth, admin, platform routes, export ZIP, tenant data, ARCHIVO/document archive, and docs.
   - Vercel cannot deploy uncommitted local changes.

3. The latest verified `main` commit is `2ef3e83a`, which only includes the Clerk middleware scope fix and related auth recovery commits.
   - If the browser still shows `MIDDLEWARE_INVOCATION_FAILED` on `/`, then Vercel is either not yet serving `2ef3e83a`, the build failed, or production env is incomplete.

4. `NEXT_PUBLIC_API_URL` is required for production builds on Vercel.
   - `frontend/next.config.js` throws during Vercel production build if `NEXT_PUBLIC_API_URL` is missing.
   - This value was not present in the local env-key inventory reviewed here. It must exist in Vercel Production env and point to the Render API base URL.

## What must happen before claiming deployed

1. Decide whether `21fda6a3` should merge into `main` or remain on `codex/fix-admin-tenant-production`.
2. Review the dirty worktree and stage only relevant product changes.
3. Run frontend typecheck, tests, and build to completion.
4. Commit and push to `main`.
5. Confirm Vercel Production env includes:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_API_URL`
6. Trigger or wait for Vercel deploy from the new `main` commit.
7. Verify the live site routes:
   - `/`
   - `/sign-in`
   - `/sign-up`
   - `/v`

## Residual blockers in this session

- DNS resolution failed from the sandbox, so GitHub and `alquimiaplatform.com` live checks were not possible here.
- Vercel CLI is not installed, so Vercel deployment status could not be queried from this environment.
- The current frontend build did not produce final output before the sandbox-level review moved on; it must be rerun before commit/push of the dirty worktree.
