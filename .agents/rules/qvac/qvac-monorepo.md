# qvac monorepo changes

## Pull requests

- **Open from a monorepo branch, never a fork:** Every PR against the qvac monorepo must be opened from a branch in the monorepo (`tetherto/qvac`), not from a fork.
- **Check the PR source first, before any review:** The first step in reviewing any qvac PR is to confirm it was opened from a monorepo branch. If it was opened from a fork, stop immediately: do not review the changes, and ask the author to reopen the PR from a branch in the monorepo.

## Documentation

- **Keep both README levels current:** When a change affects documented behavior, setup, public functionality, supported features, examples, or usage, update both the root `README.md` and every affected package's `README.md`.
- **Verify documentation during review:** For every review, check whether the root `README.md` and each affected package `README.md` remain accurate and complete. Treat missing applicable updates as review findings.

## Related rules

- **Apply package-specific rules:** For changes under `qvac/packages/**`, also read and follow the `qvac-packages` rule.
