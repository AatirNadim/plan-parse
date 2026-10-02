# Getting Support for plan-parse

Welcome! If you need assistance with `plan-parse`, we have several channels to help answer your questions, troubleshoot unexpected behavior, and discuss infrastructure visualization strategies.

---

## 1. Documentation & Architecture Guides

Before asking a question, consider reviewing the comprehensive documentation included in this repository:

* [Main Project README](README.md): System architecture, installation, CLI usage, and container deployment.
* [Go Backend & Architecture (`pkg/`)](pkg/README.md): Internal Go architecture and module coordination.
* [Core Parser Engine (`pkg/core/`)](pkg/core/README.md): Plan schemas, DAG generation, and resource mapping.
* [Programmatic Runner (`pkg/runner/`)](pkg/runner/README.md): Terraform execution lifecycle and error categorization.
* [HTTP Server Package (`pkg/server/`)](pkg/server/README.md): REST endpoints and embedded static assets.
* [Developer Workbench UI (`ui/`)](ui/README.md): Next.js components, Cytoscape styling, and state management.
* [Sample Infrastructure (`testdata/`)](testdata/README.md): Reference multi-tier AWS plan fixtures.

---

## 2. Asking Questions & Community Discussions

For general usage questions, configuration help, or architectural discussions:

* **GitHub Discussions**: Visit [plan-parse Discussions](https://github.com/AatirNadim/plan-parse/discussions) to ask questions, share how you use `plan-parse` in your CI/CD pipelines, or propose broad ideas.
* Please avoid opening GitHub Issues for general support questions or usage queries. Reserving issues for bugs and feature requests helps keep the tracker focused.

---

## 3. Reporting Bugs or Requesting Features

* **Bug Reports**: If you've found a defect or unexpected behavior, check [existing issues](https://github.com/AatirNadim/plan-parse/issues?q=is%3Aissue) first, then submit a [Bug Report](https://github.com/AatirNadim/plan-parse/issues/new?template=bug_report.yml).
* **Feature Requests**: If you'd like to suggest an improvement, submit a [Feature Request](https://github.com/AatirNadim/plan-parse/issues/new?template=feature_request.yml).
* Refer to [CONTRIBUTING.md](CONTRIBUTING.md) for full details on our issue lifecycle and label taxonomy.

---

## 4. Security Concerns

For security vulnerability disclosures, please refer to our [Security Policy](SECURITY.md) and report them privately to [aatir.nadim@gmail.com](mailto:aatir.nadim@gmail.com) rather than through public issues.
