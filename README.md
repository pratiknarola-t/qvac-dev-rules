# agent-rules

One shared set of coding rules and PR-review skills, installed into whichever AI coding
harness you use — with one command.

The same rules, written once, are translated into each harness's native format: Cursor
`.mdc` rules with globs, Claude Code path-scoped rules, and an `AGENTS.md` block for
Codex, OpenCode, Droid and Pi.

## Install

```bash
npx -y github:pratiknarola-t/qvac-dev-rules add
```

It detects the harnesses you have, asks which of them (and which rule packs) to install
for, and writes the files. Run it from the root of the project you want the rules in.

Non-interactive, or to pick targets yourself:

```bash
npx -y github:pratiknarola-t/qvac-dev-rules add --yes
npx -y github:pratiknarola-t/qvac-dev-rules add --agent cursor,claude-code --pack core
npx -y github:pratiknarola-t/qvac-dev-rules add --global          # for all your projects
npx -y github:pratiknarola-t/qvac-dev-rules add --dry-run         # show the plan only
```

## What gets written

| Harness | Rules | Skills | Memory file |
|---|---|---|---|
| `claude-code` | `.claude/rules/<pack>/*.md` | `.claude/skills/` | untouched |
| `cursor` | `.cursor/rules/<pack>/*.mdc` | `.agents/skills/` | untouched |
| `codex` | `.agents/rules/<pack>/*.md` | `.agents/skills/` | `AGENTS.md` |
| `opencode` | `.agents/rules/<pack>/*.md` | `.agents/skills/` | `AGENTS.md` |
| `droid` | `.agents/rules/<pack>/*.md` | `.agents/skills/` | `AGENTS.md` |
| `pi` | `.agents/rules/<pack>/*.md` | `.agents/skills/` | `AGENTS.md` |

Claude Code and Cursor both scope rules to file globs natively, so nothing is added to
`CLAUDE.md`. The other four have no rules directory, so the always-on rules are inlined
into `AGENTS.md` and the path-scoped ones become a table of files to read on demand.

Harnesses that read the same directory share one copy — installing for all six writes
`.agents/skills/` once, not four times.

### Your files are never rewritten

`AGENTS.md` edits live inside a marked block:

```
<!-- BEGIN agent-rules -->
...
<!-- END agent-rules -->
```

Anything outside the block is left alone, and re-running replaces only the block. The
first time it touches an `AGENTS.md` you already had, it asks. `agent-rules remove` puts
everything back, skipping any file you edited yourself.

## Packs

| Pack | Contents |
|---|---|
| `core` | team coding standards, working style, the PR-review engine, and both review skills |
| `qvac` | rules scoped to the qvac monorepo, its packages, the vcpkg registry, and the speech engine |

Install a subset with `--pack core`. Dropping a pack on a later run removes the files it
had installed.

## Skills only

The two review skills are also installable with the standard agent-skills CLI, which
works for 70+ harnesses but installs skills only — no rules, no `AGENTS.md`:

```bash
npx skills add pratiknarola-t/qvac-dev-rules
npx skills add pratiknarola-t/qvac-dev-rules@pr-self-review   # just one
```

| Skill | Use |
|---|---|
| `pr-self-review` | review your own branch before pushing, then fix what is confirmed |
| `pr-review` | review someone else's PR and emit inline comments, never editing code |

## Commands

```
agent-rules add       install rules and skills
agent-rules list      show what is installed here
agent-rules remove    undo a previous install
```

| Option | Meaning |
|---|---|
| `-a, --agent <ids>` | comma-separated: `claude-code`, `cursor`, `codex`, `opencode`, `droid`, `pi` |
| `-p, --pack <ids>` | comma-separated packs |
| `-g, --global` | install for your user instead of this project |
| `--root <dir>` | target directory (default: the current directory) |
| `--dry-run` | print the file plan without writing |
| `-y, --yes` | accept the defaults and never prompt |

An install is recorded in `.agent-rules.json` so `list` and `remove` are exact.

## Developing

`rules/` and `skills/` are the only hand-written content; everything else is generated.

```bash
npm run generate   # refresh this repo's own .claude/, .cursor/, .agents/ and AGENTS.md
npm test           # unit, end-to-end, and a check that the generated output is current
```

Requires Node 20 or newer. No dependencies.
