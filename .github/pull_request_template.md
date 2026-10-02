## Description

Please include a summary of the change, motivation, and context. If this PR introduces a new visual component, DAG algorithm, or CLI behavior, explain its architecture and intended operation.

---

## Related Issue(s)

Fixes #(issue number)
Closes #(issue number)

---

## Type of Change

Please mark the relevant option(s) with an `x`:

- [ ] 🐛 **Bug fix** (non-breaking change resolving an unexpected defect)
- [ ] ✨ **New feature** (non-breaking change adding new capability or visual tool)
- [ ] 💥 **Breaking change** (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 **Documentation** (updates to docs, diagrams, or comments)
- [ ] ⚡ **Performance improvement** (optimizations to graph rendering, parsing, or memory)
- [ ] ♻️ **Refactoring** (code restructure with no functional changes)
- [ ] 🧪 **Testing** (adding missing tests or test fixtures)
- [ ] 🔧 **Chore / Build** (changes to CI workflows, dependencies, or tooling)

---

## Affected Component(s)

- [ ] `pkg/core` (Parser engine, schema validator, DAG generator)
- [ ] `pkg/runner` (Terraform/OpenTofu CLI execution, error classification)
- [ ] `pkg/server` (HTTP REST router, static asset embedding)
- [ ] `ui` (Developer Workbench Next.js frontend, Cytoscape canvas, inspectors)
- [ ] `testdata` (Test infrastructure fixtures)
- [ ] `.github` (CI/CD workflows, issue templates)

---

## How Has This Been Tested?

Please describe the tests you ran to verify your changes. Include details of your test environment:
- [ ] Go backend tests (`make test` or `go test -v ./...`)
- [ ] Frontend unit tests (`cd ui && pnpm test`)
- [ ] Manual verification with sample plan (`./plan-parse -plan testdata/plan.json`)
- [ ] Manual verification with local Terraform directory (`./plan-parse -dir testdata`)
- [ ] Cross-browser testing (Chrome / Firefox / Safari)

---

## Visual Changes (if applicable)

If your changes affect the UI or visual DAG canvas, please attach before & after screenshots or a quick screen recording:

| Before | After |
| :---: | :---: |
| *(Image or N/A)* | *(Image or N/A)* |

---

## Contributor Checklist

- [ ] I have read the [CONTRIBUTING.md](CONTRIBUTING.md) guide.
- [ ] I have adhered to the [Code of Conduct](CODE_OF_CONDUCT.md).
- [ ] My code follows the Go and TypeScript/React style guidelines of this project.
- [ ] I have performed a self-review of my own code.
- [ ] I have commented hard-to-understand or algorithmically dense code blocks.
- [ ] I have updated relevant documentation or READMEs where applicable.
- [ ] My changes pass `golangci-lint run ./...` with zero errors.
- [ ] I have added automated tests that verify my fix or new feature.
- [ ] All new and existing tests pass locally (`make test`).
- [ ] I have verified that no sensitive credentials or private infrastructure tokens are included in test fixtures or logs.
