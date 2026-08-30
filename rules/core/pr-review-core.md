---
name: pr-review-core
description: Shared PR-review engine - triage tiers, lens selection, adversarial verification, and the cost rules. Loaded by the pr-review and pr-self-review skills.
alwaysApply: false
---

# PR review core

Shared engine for reviewing a set of changes. Both `pr-self-review` (own PR, may fix)
and `pr-review` (others' PR, comments only) load this. It decides how much review a
change deserves so simple PRs stay cheap and risky PRs get real scrutiny.

The controlling idea: **spend subagents in proportion to risk.** Triage first, fan out
only when the change earns it, verify only what matters.

## Step A — Triage (no subagents)

Read the touched paths and the diff stat only. Do not spawn anything yet. Classify the
change into exactly one tier.

- **Tier 0 — Mechanical.** Version bumps, `CHANGELOG.md`-only edits, docs/markdown-only,
  formatting/whitespace, lockfile-only, comment-only, and registry version-database or
  portfile hash bumps. No fan-out. Run the single applicable rule checklist inline and
  emit findings directly.
- **Tier 1 — Focused.** Logic confined to one package or module, roughly under 200
  changed lines, no public API surface and no security-sensitive path. One inline
  general reviewer pass. No fan-out. Verify only High findings.
- **Tier 2 — Broad.** Multiple packages, public API/ABI change, security-sensitive paths,
  concurrency, roughly over 200 changed lines, or anything you cannot confidently place
  in Tier 0 or 1. Fan out the selected lenses (Step B).

Tie-break: when unsure between two tiers, choose the lower one and record why in one line.
Escalate only if the cheaper pass surfaces something that warrants it.

Applicable rule checklists by touched path: load every installed rule whose path scope the
diff touches, plus the always-on coding standards. Each unmet applicable requirement is a
finding — do not restate the rules here, apply them from their source files.

## Step B — Lens selection (Tier 2 only)

Spawn a lens subagent only when its trigger is present. Record every lens you skip and
why, in one line each.

- **correctness** — always, for Tier 2.
- **security** — code touching auth/authz, input parsing, (de)serialization, filesystem,
  network, process spawning, crypto, secrets, templating, or SQL. Skip for docs, config,
  or test-only changes.
- **performance** — loops or allocations on hot paths, large-data handling, blocking I/O
  in async code, or new dependencies affecting startup/bundle size. Skip otherwise.
- **consistency** — changes spanning more than one package/addon, or introducing a pattern
  that must match sibling code. Skip for single-file changes.

Never spawn a lens with no trigger. Prefer one broad reviewer over several narrow ones
when triage is uncertain.

Each lens runs read-only and reports findings only — it never edits code. Lens prompt
template:

```
Review these changes in <repo>. Get the diff with: <diff-command>.
Focus ONLY on <lens> issues. For each finding report: severity, file:line, what is wrong,
why it matters, and a concrete failure path (input -> code path -> wrong result).
If none, reply exactly: "No <lens> issues identified." Do NOT edit code.
```

## Step C — Adversarial verification (budgeted)

- Verify **High and Medium** findings only. Never verify Low/nit.
- **Tier 0/1:** no separate verify pass. The single pass must still attach a concrete
  failure path to each High/Medium finding.
- **Tier 2:** one skeptic per Medium finding, two per High. The skeptic's job is to
  **refute** the finding with a concrete counter-path. Drop the finding unless it survives
  (for High, it survives only if it is not refuted by a majority).
- A finding with no concrete failure path (input → code path → wrong result) cannot be
  High. Downgrade it to Medium or drop it.

Skeptic prompt template:

```
A reviewer claims: <finding, with file:line and reasoning>.
Try to REFUTE it. Find a concrete reason it is NOT a real problem (guarded elsewhere,
unreachable input, intended behavior, already tested). Default to "refuted" if you cannot
build a solid case that it is real. Reply: verdict (real|refuted) + one-line reason.
```

## Severity tiers

- **critical / High** — almost-certain bug, security issue, data corruption, gitflow
  blocker, CI failure, or a break to existing behavior. Requires a concrete failure path.
- **Medium** — likely bug, non-obvious caveat, missing test on a risky path, or a subtle
  behavior change.
- **Low / nit** — style, minor doc drift, optional ergonomic improvement.

## Cost rules

- Triage and lens selection cost zero subagents.
- Concurrent lenses capped at 4. Verify skeptics capped at 2 per finding.
- No fan-out and no separate verify pass for Tier 0 and Tier 1.
- Model tiering: run triage and the first pass on a cheaper model; run verification and
  synthesis on the strongest available model.

## Guardrails

- Do not invent findings to fill a section. "No issues" is a valid and expected result;
  report it plainly rather than padding with nits or hunches.
- Do not expand scope beyond the diff. Review only the changed lines and the code they
  directly break. Do not map or audit adjacent systems the change does not reach.
- Do not spawn subagents for Tier 0 or Tier 1. If you find yourself launching lenses for
  a version bump or a doc edit, stop — that is a triage error.
- Assert a bug only with a concrete failure path. Without one, raise it as a question, not
  a finding, and never as High.
- Stay inside the declared tier's budget. Reaching a higher tier's cost requires an
  explicit escalation reason, stated in one line.
