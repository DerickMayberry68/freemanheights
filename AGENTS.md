# AGENTS.md

This repository's working agreement for AI agents (Codex, Cursor, Claude, etc.) is defined in **[`CLAUDE.md`](./CLAUDE.md)**.

The Cursor-specific mirror lives at **[`.cursor/rules/speckit-gating.mdc`](./.cursor/rules/speckit-gating.mdc)**.

## TL;DR

Before editing, creating, deleting, or moving **any** file in this repo, complete the speckit phases for the task **in order**:

1. `speckit.specify`
2. `speckit.plan`
3. `speckit.tasks`
4. `speckit.checklist`
5. `speckit.implement`

There is no exception for "tiny" fixes, typos, formatting, comments, or rename-only refactors. Read-only investigation (Read, Grep, Glob, semantic search, `git status` / `git diff`) is always allowed.

See `CLAUDE.md` for the full policy, allowed/forbidden actions, and per-phase exit criteria.
