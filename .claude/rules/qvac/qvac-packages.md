---
paths:
  - "**/qvac/packages/**"
---

# qvac/packages changes

## Versioning

- **Version bumps go in their own PR:** Never bump the version together with other features or changes.
- **Version bump PR consistency:** In the version bump PR, verify consistency between `vcpkg-configuration.json`, `CHANGELOG.md`, and `package.json`.

## CHANGELOG.md

- **When to add an entry:** For every change that affects the published NPM package (updated dependencies, added/fixed/changed/removed prebuild features, modified JS layer, etc.), add a concise entry under the `[Unreleased]` tag.
- **When not to add an entry:** For changes that do not affect the published NPM package (benchmarks, unit/integration tests, GitHub workflows, files untracked by NPM, etc.), do not modify `CHANGELOG.md`.
- **Keep entries relevant and concise:** Only describe things relevant to consumers of the published NPM package. Avoid verbose entries and details users cannot access or do not need.

## README.md

- **Keep it current:** When a change makes existing `README.md` information stale, update it.
- **Document API and functionality:** Add or update documentation explaining new or changed public API and functionality.
- **Add an example script for new features:** For a completely new feature (e.g. a new model, or a new way of operating such as streaming), add a new example script in the package's `examples/` folder and reference it in `README.md`.

## vcpkg

- **Prefer port version updates:** In `vcpkg-configuration.json`, only update the `baseline` field when absolutely necessary (e.g. adding a new port to `qvac-registry-vcpkg`). Otherwise, update only the respective port version in `vcpkg.json`.

## Linting

- **Run linters:** Ensure both C++ and JS linting were run.
