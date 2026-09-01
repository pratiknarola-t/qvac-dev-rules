# Working in this repository

This repository is the source of a shared ruleset that installs into several AI coding
harnesses. `rules/` and `skills/` are the only places content is written by hand.

Everything under `.claude/`, `.cursor/`, `.agents/` and `AGENTS.md` is **generated**.
Editing those directly is wasted work: the next `npm run generate` overwrites it, and
`npm test` fails until the committed output matches the source again.

## Where to make a change

| To change | Edit |
|---|---|
| a rule's wording or scope | `rules/<pack>/<name>.md` |
| a skill | `skills/<pack>/<name>/SKILL.md` |
| which paths a harness gets | `src/harnesses.mjs` |
| how a rule is rendered for a harness | `src/render.mjs` |
| the CLI surface | `src/cli.mjs` |

After any change to `rules/` or `skills/`, run `npm run generate` and commit the
regenerated output alongside the source change.

## Checks

```
npm test              # unit, end-to-end, and the generated-output sync check
npm run generate      # refresh the committed harness output
```

The team coding standards in `.claude/rules/core/` apply to this repository's own code.
