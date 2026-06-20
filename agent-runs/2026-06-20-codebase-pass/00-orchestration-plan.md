# Orchestration Plan

## Mode Selection

- Repo: /Users/stephenbrown/Code/OPENSOURCE/ridemeapp
- Branch: dev
- Work mode: full
- Run folder: /Users/stephenbrown/Code/OPENSOURCE/ridemeapp/agent-runs/2026-06-20-codebase-pass
- Verifiable gates: `npm run lint`, `npm run type-check`, `npm run test`, `npm run build`, `git diff --check`, Git remote read, dry-run push.
- Human-decision blockers: product roadmap priority changes, share URL design, Firebase/Vercel secrets, broad architecture rewrites, push/merge conflicts.
- Resume policy: resume from `run-state.md`, `task-queue.md`, current Git state, and any local commits ahead of `origin/dev`; do not infer from memory.

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and checks pass | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop | Lint, typecheck, tests, build, and dependency diagnostics are recorded | Baseline clean or failures classified with ownership |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed backlog and scorecard | Backlog, scorecard, and queue are pushed |
| Execute Fixes and Improvements | Task Queue Loop, Fix Validation Loop, Architecture Fitness Loop, Lean Code Loop | Targeted checks plus lint/typecheck/test/build as relevant | Highest-priority local/verifiable tasks done, deferred, or blocked |
| Package and Dead-Code Cleanup | Package Cleanup Loop, Dead Code Loop | Package/dead-code evidence plus full validation | Safe updates/removals done or deferred |
| Review | Judge Loop | PASS or findings converted to bounded tasks | Review report pushed |
| Stabilization Loop | Stabilization Loop, Judge Loop | Completion criteria pass | Final report ready or real blocker recorded |
| Integrator | Final Completion Gate | Branch clean, synced, pushed, and final checks recorded | Run complete |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | `agent-runs/2026-06-20-codebase-pass/*`, `AGENTS.md`, `spec.md`, `README.md` | Startup planning, resume state, and evidence-backed doc drift fixes |
| T-002 | `agent-runs/2026-06-20-codebase-pass/02-baseline-validation.md` | Baseline command results only |
| T-003 | `agent-runs/2026-06-20-codebase-pass/03-findings-backlog.md`, `task-queue.md` | Evidence-backed backlog and scorecard |
| T-004 | Source/test files named by the selected finding plus execution reports | One focused code fix or lean cleanup batch |
| T-005 | `package.json`, `package-lock.json`, source files proven unused, cleanup reports | Safe package/dead-code cleanup only |
| T-006 | Review/stabilization/final reports and files owned by any in-scope review fix | Endgame validation and cleanup |
