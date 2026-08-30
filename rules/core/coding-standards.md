---
name: coding-standards
description: Team coding standards - English only, small single-purpose functions, no comments, named constants, tests for every behavior change
alwaysApply: true
---

# Team coding standards

- **Language:** All text in code (names, messages, docs) must be in English only.
- **Verbs are actions:** Verbs represent actions; each action is a separate function. Do not pile logic into one place.
- **No comments:** Code must be clear enough to read without comments. If you need a comment to explain it, refactor instead adding or using functions.
- **No large functions:** Refactor large functions into smaller ones for readability and testability.
- **Loops in separate functions:** Loops (for, while, do-while, etc.) are actions; put each in its own function. This also makes them easier to test and mock.
- **No hardcoded values:** Use named constants, config, or parameters instead of magic numbers or strings in the middle of logic.
- **Act, don't ask:** A task description is authorization to change the code it describes. Make routine judgment calls yourself. Ask only when an action is destructive or outward-facing, or when two readings of the request lead to materially different work.
- **Commits:** Only humans do commits. The assistant must not run git commit or push.
- **No emojis:** Do not use emojis in responses, code, or comments.
- **No Asana ticket names:** Never add Asana ticket names or references anywhere, including code comments, documentation, and `CHANGELOG.md`.
- **Keep touched comments fresh:** When you touch code, remove or update any nearby comments that are stale, inconsistent with the code, or too verbose.
- **Test every behavior change:** For every behavior that is added, changed, or fixed, add a test at the appropriate level (unit, integration, or end-to-end).
