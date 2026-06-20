# Agent Report

## Agent

Name: Codex

## Scope

Inspected architecture boundaries, auth/profile writes, Firestore rules, cloud-track persistence, canvas/store lifecycle hotspots, tests, dependency ownership, and lean-code signals. No source code was edited in this phase.

## Inputs

Baseline report, `package.json`, `npm outdated`, `npm audit`, `npm ls`, `src/lib/firebase/users.ts`, `firestore.rules`, `src/lib/firebase/tracks.ts`, `src/stores/linerider-store.ts`, `src/components/linerider/linerider-canvas.tsx`, tests, and source searches.

## Branch and Push

- Branch: dev
- Upstream: origin/dev
- Commit: pending
- Pushed to: pending
- Sync status: clean and synced at `e688bba2ce63f2754be2da8e7f9a46a50692f734` before this report update

## Loop

- Name: Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop
- Goal: Produce an evidence-backed backlog with severity, ownership, and verification.
- Verify gate: every finding has evidence, risk, owned files, proposed fix, and verification.
- Stop condition: backlog is prioritized and the highest-priority executable task is clear.
- Attempt: 1/1
- Result: backlog ready; first execution task selected.

## Run State

- Current phase: Findings Backlog
- Current task: T-003
- Last pushed commit: `e688bba2ce63f2754be2da8e7f9a46a50692f734`
- Next action: Commit/push backlog report, then fix F-001.
- Blockers: None.

## Commands Run

```text
wc -l src/components/linerider/linerider-canvas.tsx src/components/linerider/linerider-app.tsx src/components/linerider/linerider-controls.tsx src/stores/linerider-store.ts src/stores/auth-store.ts src/lib/linerider/physics.ts src/lib/firebase/tracks.ts src/lib/firebase/users.ts
find src -type f \( -name '*.ts' -o -name '*.tsx' \) -maxdepth 5 | xargs wc -l | sort -nr | head -25
rg -n "TODO|FIXME|HACK|console\.|any\b|as unknown|setTimeout|setInterval|requestAnimationFrame|localStorage|sessionStorage|addEventListener|removeEventListener|onAuthStateChanged|getState\(|subscribe\(" src tests firestore.rules storage.rules
rg -n "export \*|export \{|export (type|const|function|class)" src/lib src/components src/hooks src/stores
npm ls --depth=0
npm ls postcss protobufjs vite next
rg -n "hasAll|hasOnly|request.resource.data|createdAt|updatedAt|character" firestore.rules src/lib/firebase/users.ts src/lib/firebase/tracks.ts
rg -n "clearTrack|setFlag|flag" src/stores/linerider-store.ts src/stores/linerider-store.test.ts spec.md AGENTS.md
```

## Findings

| ID | Severity | Type | Status | Area | Summary | Evidence | Risk | Effort | Verification | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | P1 | Bug | Open | Auth / Firestore profile | First-time profile creation can fail against deployed rules because the first `setDoc(..., { merge: true })` writes only `uid`, `email`, and `updatedAt`, while rules require `uid`, `email`, and `character` on create. The later defaults write is unreachable if the first write is rejected. | `src/lib/firebase/users.ts` builds partial `profileData`; `firestore.rules` `isValidProfile()` requires `data.keys().hasAll(['uid', 'email', 'character'])` and `data.character in [...]`. | New sign-in/profile creation can fail when rules are deployed. | Small | `npm run lint && npm run type-check && npm run test && npm run build`; inspect profile payload/rules alignment. | Fix in execution phase. |
| F-002 | P2 | Security / Data validation | Open | Firestore rules | Profile and track rules use `hasAll` but not `hasOnly`, so owner clients can write arbitrary extra fields into profile/track documents. | `firestore.rules` profile and track validators call `data.keys().hasAll(...)` and never restrict keys. | Data-shape drift, unexpected future client behavior, and unnecessary stored data. Owner-only scope lowers severity. | Small | Add `hasOnly` allowlists compatible with current client payloads; run validation commands. | Combine with F-001 rules fix. |
| F-003 | P1 | Package update | Open | Dependencies | Dependency diagnostics found advisories in nested `postcss`, `protobufjs`, and `vite`, plus patch/minor drift across Next, Firebase, React, Vitest, Tailwind/PostCSS, Zustand, Lucide, ESLint, and type packages. | `npm audit --audit-level=moderate` reported 4 vulnerabilities; `npm outdated` listed direct package drift; `npm ls postcss protobufjs vite next` identified owners. | Known advisories remain until packages are safely updated or documented as blocked. | Medium | Controlled `npm update`/`npm audit fix` batch, then lint/typecheck/test/build/audit. | Run in package cleanup phase after code fix. |
| F-004 | P3 | Bug | Deferred | Linerider store flags | `clearTrack()` returns early when `segments.length === 0`, so an existing flag on an empty canvas would not be cleared even though docs say clear track clears flags. Existing test covers only non-empty tracks via shared setup. | `src/stores/linerider-store.ts` early return; `spec.md` milestone note says flag cleared on clear track; `linerider-store.test.ts` clear-flag test starts with segments from `beforeEach`. | Minor state inconsistency on an edge workflow. | Small | Add empty-track flag test and clear flag even when no segments exist. | Defer unless stabilization has room after P1/P2 work. |
| F-005 | P2 | Test gap | Deferred | Firestore rules | No automated Firestore rules emulator tests cover profile/track writes, so rules/client mismatches are caught by inspection only. | `find` found no rules test harness; baseline Vitest suite does not execute Firestore rules. | Auth/cloud regressions can slip past local unit tests. | Medium | Add rules-unit harness if Firebase emulator/tooling is approved later. | Defer; avoid adding emulator workflow in this pass. |

## Changes Made

- No source changes in this phase.
- Wrote prioritized findings and selected F-001/F-002 as the first executable task.

## Verification

Checks performed and results: source search, dependency diagnostics, architecture mapping, and targeted file reads completed. Baseline validation from the previous phase passed; this report requires lint before push.

## Architecture and Lean Code Scorecard

| Area | Status | Evidence | Action |
| --- | --- | --- | --- |
| Dependency direction | Pass | Next app routes compose client shell; Firebase helpers are isolated under `src/lib/firebase`; game physics/rendering are under `src/lib/linerider` | No architecture rewrite |
| Module cohesion | Watch | Largest files are `characters.ts`, `linerider-controls.tsx`, `linerider-canvas.tsx`, and `linerider-store.ts`; responsibilities are understandable but hotspots remain | Defer broad splitting |
| Public surface area | Watch | `src/lib/linerider/index.ts` broadly re-exports physics/renderer/characters; no immediate misuse found | Defer until callers need narrowing |
| Data and side-effect flow | Fail | F-001 shows client profile write shape does not satisfy Firestore rules create shape | Fix F-001 |
| Async/cache/resource lifecycle | Watch | RAF/event cleanup and auth subscription cleanup are present; no confirmed leak found | Keep under review |
| Duplication and dead code | Watch | No compiler/lint dead-code failures; F-004 is small state edge | Defer low-risk cleanup |
| Dependency lean-ness | Fail | F-003 audit/outdated findings | Package cleanup phase |
| Testability | Watch | Vitest suite passes, but Firestore rules are not executed locally | Defer F-005 |

## Quality Gate

- Command: `npm run lint`
- Result: Passed
- Notes: Required before pushing this report-only checkpoint.

## Commit-Push Checkpoint

- Status inspected: `git status --short` showed only owned findings run-report files
- Diff checked: `git diff --check` passed
- Files staged: pending
- Dry-run push: pending
- Push: pending
- Post-push sync: pending

## Stabilization

- Cycle: Not started
- Completion criteria status: Not started
- Remaining blockers: None.

## Risks

Firestore rules cannot be fully executed locally without an emulator/rules test harness, so the F-001/F-002 fix will be verified by static alignment plus app lint/typecheck/tests/build.

## Open Questions

- None.

## Recommended Next Step

Fix F-001/F-002 with a small auth/profile and rules patch.
