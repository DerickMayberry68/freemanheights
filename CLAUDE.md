# CLAUDE.md — Working Agreement for AI Assistants

This file is the canonical operating contract for any AI assistant (Claude, Cursor, Codex, etc.) working in this repository. **Read it before doing anything else.**

---

## 1. Hard Rule: No Code Edits Without the Speckit Flow

**You MUST NOT edit, create, delete, or move any file in this repo (except this file when explicitly asked) until ALL of the following speckit phases have been completed for the current task:**

1. `speckit.specify`
2. `speckit.plan`
3. `speckit.tasks`
4. `speckit.checklist`
5. `speckit.implement`

If the user asks for a change without going through these steps, **stop and run them first**, in order, with the user. Do not "just make a small fix" or "edit a single line." There is no exception for trivial changes, typos, comments, formatting, or rename-only refactors.

### Allowed without speckit
- Read-only investigation (Read, Grep, Glob, Semantic Search, Git status/log/diff).
- Answering questions, explaining code, summarizing files.
- Running non-mutating shell commands (`git status`, `git diff`, `npm ls`, `dart analyze`, `flutter doctor`, etc.).
- Editing **only this file (`CLAUDE.md`)** when the user explicitly asks to update the working agreement.

### Forbidden without speckit
- Any `Write`, `StrReplace`, `EditNotebook`, `Delete`, file move, or generated-code commit.
- `git add`, `git commit`, `git push`, `git stash pop` against working tree changes you authored.
- Running scripts that mutate the database, deploy, or change branch state (e.g. `npm run build` for release, `flutter build`, `supabase db push`, `vercel deploy`).
- Auto-fixing lint/format issues on files outside the active speckit task scope.

---

## 2. The Speckit Phases

Run the phases in order. Do not skip ahead. Each phase has a clear exit criterion.

### 2.1 `speckit.specify` — What & Why
- Describe the user problem in plain language.
- Capture the desired behavior, not the implementation.
- List explicit non-goals.
- Identify affected user flows / screens / data.
- **Exit:** user has agreed on the spec.

### 2.2 `speckit.plan` — How
- Identify components, files, and data touched.
- List trade-offs and the chosen approach with a one-sentence rationale.
- Note risks (data, auth, network, cost) and migration / backfill needs.
- Outline test strategy.
- **Exit:** user has agreed on the plan.

### 2.3 `speckit.tasks` — Break it down
- Decompose the plan into ordered, ≤ 1-hour tasks.
- Each task names the file(s) it will touch and the acceptance signal.
- Tasks must be independently reviewable.
- **Exit:** task list is approved.

### 2.4 `speckit.checklist` — Pre-flight
- Confirm:
  - Branch is clean / on the right branch.
  - Latest committed code has been fetched and reconciled before implementation:
    - Run `git fetch --all --prune`.
    - Compare local and upstream with `git rev-list --left-right --count HEAD...origin/<branch>`.
    - If behind, pull/rebase before implementation approval.
    - If local changes exist, use a safe preserve-first workflow such as `git pull --rebase --autostash`, then resolve any conflicts before new edits.
    - Re-run relevant checklist/build checks after conflict resolution.
  - Required env vars are present (e.g. `frontend/.env`, `mobile/lib/config/app_config.dart`).
  - Migrations / seed data exist for tables touched.
  - Linter / type-check is green before changes.
  - Backout plan is documented (revert commit / migration down).
- **Exit:** checklist items pass.

### 2.5 `speckit.implement` — Make the change
- Implement only the approved tasks.
- Stop and re-enter `speckit.plan` if scope grows.
- Run linters / analyzers / tests for affected files (`ReadLints`, `dart analyze`, `npm run build` smoke if relevant).
- Summarize what changed, what was tested, and what was intentionally **not** changed.
- Commit only when the user says so. Never push unless asked.

---

## 3. Repository-Specific Conventions

These complement the speckit rules; they do **not** override them.

- Default branch is **`master`** (not `main`).
- Frontend env is **`frontend/.env`** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`); never commit it.
- Mobile Supabase keys live in `mobile/lib/config/app_config.dart` and must match the frontend project.
- Database changes go through `supabase/migrations/NNN_*.sql`; do not edit historical migrations.
- Test data for transport/bus features is in `mobile/seed_transport.sql`; keep it idempotent.
- Don't reformat or "tidy" unrelated files in a speckit task.
- Don't add comments that just narrate code; only document non-obvious intent.
- When in doubt, ask before editing.

---

## 4. If You Get a Direct Edit Request

Reply with something like:

> Per `CLAUDE.md` I can't edit files until we complete the speckit phases. Want me to start with `speckit.specify` for this change?

Then drive the user through the phases. Do not "preview the diff" by writing it to disk.

---

_Last updated: speckit checklist now requires git sync before implementation._
