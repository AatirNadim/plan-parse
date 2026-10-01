<p align="center">
  <img src="https://raw.githubusercontent.com/AatirNadim/plan-parse/main/assets/banner.svg" alt="plan-parse banner" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/AatirNadim/plan-parse"><img src="https://img.shields.io/badge/GitHub-AatirNadim%2Fplan--parse-blue?logo=github" alt="GitHub Repo" /></a>
  <img src="https://img.shields.io/badge/architecture-amd64%20%7C%20arm64-blue" alt="Architecture" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <a href="https://github.com/AatirNadim/plan-parse/issues"><img src="https://img.shields.io/badge/issues-welcome-brightgreen" alt="Issues Welcome" /></a>
</p>

# plan-parse

**plan-parse** is an interactive, browser-based visualizer for Terraform and OpenTofu execution plans. It transforms dense JSON plan outputs into clear, hierarchical Cytoscape Directed Acyclic Graphs (DAGs), enabling platform and DevOps engineers to audit infrastructure changes, trace blast radius, and inspect resource diffs before running `terraform apply`.

---

## Key Features

- **Interactive Plan DAG**: Explorable node-edge graph rendered with Cytoscape.js and Klay hierarchical layout.
- **Action Color Coding**: Instant visual distinction for Create (`+`), Update (`~`), Delete (`-`), Replace (`+/-`), and No-Op resources.
- **Blast Radius Analysis**: Trace direct and transitive multi-hop dependency impacts (upstream and downstream) across your infrastructure.
- **2-Tier IaC Diff Viewer**: In-canvas popover inspection and full side-by-side before/after attribute diffs.
- **Targeted Apply Generator**: Quickly generate and copy `terraform apply -target=...` commands for selected resources and entire modules.
- **Search & Command Palette**: Quick filter and navigate nodes using keyboard shortcuts (`⌘K` / `Ctrl+K`).
- **Terraform & OpenTofu Compatible**: Seamlessly parses JSON plan exports from both Terraform and OpenTofu.
- **Self-Contained**: Embedded Next.js UI, compiled Go server, and Terraform CLI bundled into a single lightweight container.

---

## Image Specifications

| Property | Details |
| :--- | :--- |
| **Base Image** | `alpine:3.20` |
| **Architectures** | `linux/amd64`, `linux/arm64` |
| **Security User** | Non-root `appuser:appgroup` (UID/GID `10001`) |
| **Bundled Tool** | HashiCorp Terraform `1.16.2` (`/usr/local/bin/terraform`) |
| **Compatibility** | HashiCorp Terraform JSON plans & OpenTofu JSON plans |
| **Default Port** | `9000` (HTTP) |
| **Endpoints** | `/api/health`, `/api/status`, `/api/graph`, `/api/parse` |
| **Dependencies** | None (no external database or node runtime required) |

---

## Download the Image

Pull the latest multi-arch image from Docker Hub:

```bash
docker pull aatirnadim/plan-parse:latest
```

> **Tip**: For immutable production pipelines, you can also pin to specific commit SHA tags published by CI (e.g. `aatirnadim/plan-parse:<commit-sha>`).

---

## How to Use

### 1. Web Workbench (Ad-hoc Plan Upload)

Launch the server in standalone mode and upload Terraform or OpenTofu plan JSON files directly through the browser:

```bash
docker run -d --name plan-parse -p 9000:9000 aatirnadim/plan-parse:latest
```

Open **[http://localhost:9000](http://localhost:9000)** in your browser to drag and drop your `plan.json`.

---

### 2. Live Terraform Directory Mode (`-dir`)

Run directly against a local Terraform configuration directory. `plan-parse` generates temporary plan files inside the container's `/tmp` directory, making read-only (`:ro`) mounts completely safe:

```bash
docker run --rm -it \
  -p 9000:9000 \
  -v $(pwd):/infra:ro \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -e AWS_REGION=$AWS_REGION \
  aatirnadim/plan-parse:latest -dir /infra -addr 0.0.0.0 -no-browser
```

> **Notes & Tips**:
> - Ensure you have executed `terraform init` locally on your host beforehand so provider plugins are present in `.terraform`.
> - **Cross-Platform Host Notice**: If running on macOS or Windows, local provider plugins in `.terraform` may be Darwin/Windows binaries and won't execute inside the Linux container. In that case, use **Mode 3** below to export the plan JSON on your host, which works seamlessly everywhere.
> - For GCP, mount service credentials via `-v ~/.config/gcloud:/home/appuser/.config/gcloud:ro` or `-e GOOGLE_APPLICATION_CREDENTIALS`. For Azure, supply standard `ARM_*` environment variables.

---

### 3. Pre-Rendered Plan File Mode (`-plan`)

Parse a pre-computed Terraform or OpenTofu plan JSON export. This mode works universally across all host operating systems without requiring cloud credentials inside Docker:

```bash
# 1. Generate binary plan & export to JSON (Terraform or OpenTofu)
terraform plan -out=tfplan
terraform show -json tfplan > plan.json

# (For OpenTofu: tofu plan -out=tfplan && tofu show -json tfplan > plan.json)

# 2. Launch visualizer
docker run --rm -it \
  -p 9000:9000 \
  -v $(pwd)/plan.json:/app/plan.json:ro \
  aatirnadim/plan-parse:latest -plan /app/plan.json -addr 0.0.0.0 -no-browser
```

---

## Issues, Suggestions & Contributing

Encountered an issue or have a feature suggestion?

- **Bug Reports & Feature Requests**: [GitHub Issues](https://github.com/AatirNadim/plan-parse/issues)
- **Discussions & Ideas**: [GitHub Discussions](https://github.com/AatirNadim/plan-parse/discussions)
- **Source Code**: [GitHub Repository](https://github.com/AatirNadim/plan-parse)

Contributions and feedback are always welcome!

---

## License

Distributed under the [MIT License](https://github.com/AatirNadim/plan-parse/blob/main/LICENSE).


