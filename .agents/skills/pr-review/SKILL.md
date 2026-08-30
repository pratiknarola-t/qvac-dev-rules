---
name: pr-review
description: Review someone else's pull request and produce inline review comments. Comments only — it never edits, fixes, or pushes code. Use when reviewing a PR, given a PR link, or writing code-review feedback.
---

# PR review

Review another person's PR and output findings as inline comments ready to post. This
skill **only provides comments** — it never modifies, fixes, or pushes code. To review and
fix your own branch, use `pr-self-review` instead.

## Load first

- The installed rules whose path scope the diff touches, and the always-on coding
  standards.
- The `pr-review-core` rule — triage, lens selection, adversarial verification, and the
  cost rules. This skill follows that engine; it does not restate it.

## Inputs

- Required: a PR number, PR URL, or branch name. If missing, ask for it.
- Optional: reviewer notes seeding focus areas.
- Get the diff: `gh pr diff <num>` (PR) or `git diff main...<branch>` (branch). If empty,
  report "No changes to review" and stop.

## Workflow

1. **Triage** the diff (core Step A). For Tier 0 mechanical PRs (e.g. a version bump),
   run only the single applicable rule checklist — do not fan out lenses.
2. **Find** — Tier 1: one general reviewer pass. Tier 2: fan out the selected lenses
   (core Step B). Each lens is read-only.
3. **Verify** surviving High/Medium findings (core Step C). Drop what does not survive.
4. **Emit comments** in the format below, ordered most severe first.
5. After the list, offer to post the comments. Do not post without explicit confirmation,
   and never edit the code under review.

## Required analyses

Apply the applicable rules as review checks, without restating them here: every installed
rule whose path scope the diff touches, plus the always-on coding standards. Each unmet
applicable requirement becomes a finding. In addition, always check test coverage: every
behavior-changing hunk needs a corresponding test; if none exists, name the function,
branch, or edge case left untested and the test to add. Formatting, docs, comments, and
behavior-preserving renames do not require new tests.

## Comment style

- One entry per finding, self-contained so it can be pasted directly as an inline comment
  without extra context.
- Line numbers refer to the PR head, on the after side of the diff. For added lines, point
  at the new line and quote the anchored code so the location is unambiguous.
- State the issue, why it matters, and the concrete suggested change. Do not reference other
  comments unless they are also being posted.
- Casual but professional. Bullets over prose. No praise padding, no "LGTM but". Land the
  finding directly. Use suggestion blocks only for mechanical fixes.

## Output format

For each finding:

```
**[<severity>]<source tag> `<file path>` — line <n>** (`<anchored code>`)

> <comment: the issue, why it matters, and the concrete suggested change>
```

- Severity is required and is exactly one of: `critical`, `medium`, `low`, or `nit`.
- Use `[coding-standards]` immediately after the severity only when the finding comes from
  the team coding standards. Use the matching rule name as the source tag for other rules.
- Do not add headings or summaries around the findings.

## Guardrails

- Comments only. Never edit, fix, stage, commit, or push any code in the PR under review,
  and never modify the reviewer's local working tree.
- Do not invent findings to fill the list. "No issues" is a valid result — report it and
  stop rather than padding with nits or hunches.
- Review only the changed lines and the code they directly break; do not audit adjacent
  systems the PR does not reach.
- Do not run any command that writes to the repo or the remote.
