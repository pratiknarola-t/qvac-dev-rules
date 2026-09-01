---
name: qvac-registry-vcpkg
description: Port update and review requirements for qvac-registry-vcpkg
globs: "**/qvac-registry-vcpkg/**"
alwaysApply: false
---

# qvac-registry-vcpkg changes

- **Apply team standards:** Follow the `coding-standards` rule for code, scripts, documentation, and review findings wherever the standard applies.
- **Verify archive hashes:** For every changed port source, verify that the portfile `SHA512` matches the archive downloaded from the exact URL used by vcpkg.
- **Verify git trees:** For every new version database entry, verify that `git-tree` matches the corresponding `ports/<port>` tree at the change being reviewed.
- **Add one version per port per PR:** Each touched port must add exactly one new version database entry with no duplicate `version` and `port-version` pair. A PR should not add more than one port version per port.
- **Keep versions consistent:** Keep each port's `vcpkg.json`, version database entry, `versions/baseline.json`, and applicable dependent `version>=` constraints consistent.
- **Keep shared sources consistent:** Ports that intentionally use the same upstream commit must use the same `REF` and `SHA512`.
- **Test applicable behavior changes:** Add an appropriate test for every behavior added, changed, or fixed in scripts or other executable code.
- **Verify every requirement during review:** Treat each unmet applicable requirement above as a review finding.
