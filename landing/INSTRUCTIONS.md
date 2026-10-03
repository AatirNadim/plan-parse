# Plan-Parse Independent Landing Site & Feature Guide
## Technical Specification & Implementation Instructions

This document specifies the architecture, design contract, page inventory, SVG visual specifications, and step-by-step implementation plan for the standalone **`landing/`** site for `plan-parse`.

---

## 1. Project Overview & Scope

`plan-parse` is an interactive Terraform & OpenTofu execution plan visualizer that transforms dense, multi-thousand-line JSON plans into Cytoscape Directed Acyclic Graphs (DAGs) with transitive blast radius calculation, 2-tier IaC diffing, and graph reduction.

### Key Operational Constraints:
1. **Completely Detached & Independently Hosted**:
   - The landing site lives strictly inside the `landing/` directory in the repository root.
   - It is **not** bundled into or embedded into the Go binary (`pkg/server/server.go`).
   - It maintains its own `package.json`, build pipeline, and static export target.
2. **Distribution & Documentation Gateway**:
   - Serves as the primary public entry point explaining why the tool was needed, its technical accomplishments, and how to use it.
   - Contains direct links to **GitHub Releases** (binary downloads for Linux, macOS, and Windows) and **Docker Hub** (`aatirnadim/plan-parse`).
3. **Dedicated Deep-Dive Feature Pages**:
   - Each major feature has its own independent page featuring a dedicated, zoomed-in SVG diagram mimicking the actual UI styles, annotated with labeled callout badges.
   - A final **Miscellaneous** page documents power-user tools (Command Palette, diagram exports, targeted apply generation, keyboard shortcuts, etc.).
4. **First-Class Theme Engine**:
   - Seamless **Dark Mode** and **Light Mode** toggle, defaulting to the precision dark workbench theme (`#090a0f`).

---

## 2. Design System & Craft Contract (Hybrid Designer Standard)

Adhering to the `/hybrid-designer` and `craft-ui` standards, the landing site follows a **Precision Developer Workbench** aesthetic:

### Color Palette (60-30-10 Rule)
- **Dark Mode (Default)**:
  - Base canvas / background (60%): `#090a0f`
  - Panels, cards, and subpanels (30%): `#0f121a` (cards), `#161b26` (elevated elements), `#232936` (crisp 1px borders)
  - Semantic action accents (10%):
    - Create: Emerald `#10b981` (background: `rgba(16, 185, 129, 0.1)`)
    - Update: Sky `#0ea5e9` (background: `rgba(14, 165, 233, 0.1)`)
    - Delete: Rose `#f43f5e` (background: `rgba(244, 63, 94, 0.1)`)
    - Replace: Amber `#f59e0b` (background: `rgba(245, 158, 11, 0.1)`)
    - Read: Purple `#a855f7` (background: `rgba(168, 85, 247, 0.1)`)
    - No-op: Slate `#64748b` (background: `rgba(100, 116, 139, 0.1)`)
- **Light Mode**:
  - Base canvas (60%): `#f8fafc`
  - Panels, cards, and subpanels (30%): `#ffffff` (cards), `#f1f5f9` (elevated elements), `#e2e8f0` (borders)
  - Text: Primary `#0f172a`, Secondary `#475569`, Muted `#94a3b8`

### Typography
- **Headings & Body UI**: `DM Sans` (clean sans-serif, tight tracking for titles: `tracking-tight`).
- **Code, Metrics, HCL Addresses & Badges**: `DM Mono` (monospace precision).

### Anti-Slop Audit Standards:
- **NO** generic purple/indigo blurry gradient blobs.
- **NO** repetitive equal-width 3-card dumps with empty filler text.
- **NO** un-tracked, generic typography or fake stock illustrations.
- Crisp 1px borders, subtle hover transitions, clear active states, and real Terraform/DAG data fixtures.

---

## 3. Tech Stack & Directory Structure

```
landing/
├── package.json               # Independent package with Next.js 14 & Tailwind CSS
├── next.config.js             # output: 'export', distDir: 'out', trailingSlash: true
├── tailwind.config.js         # Styled with plan-parse workbench color tokens & fonts
├── postcss.config.js
├── public/
│   ├── favicon.ico
│   ├── icon.svg
│   └── images/
│       └── features/          # High-craft dedicated feature SVGs
│           ├── collapsed-nodes.svg
│           ├── blast-radius.svg
│           ├── resource-diff.svg
│           ├── color-grading.svg
│           ├── resource-panel.svg
│           ├── workbench-sidebar.svg
│           └── miscellaneous.svg
├── components/
│   ├── SiteHeader.js          # Persistent nav with branding, features menu, GitHub/Docker links, theme toggle
│   ├── SiteFooter.js          # Navigation links, repo info, release version badge, MIT license
│   ├── FeatureNav.js          # Sticky sidebar or breadcrumb stepper for the 7 feature pages
│   ├── CalloutImage.js        # Interactive SVG wrapper with synced hover/click pin highlights
│   ├── CodeBlock.js           # Copyable terminal commands with syntax highlighting
│   ├── ThemeToggle.js         # Dark / Light theme switcher
│   └── ThemeProvider.js       # localStorage-backed theme state provider
├── lib/
│   ├── features-data.js       # Central metadata dictionary for all feature pages
│   └── use-theme.js           # Theme hook shared with client components
└── app/
    ├── layout.js              # Root HTML wrapper with DM Sans and DM Mono fonts
    ├── globals.css            # Base styles, scrollbars, and Tailwind layers
    ├── page.js                # Home / Landing Page
    └── features/
        ├── collapsed-nodes/page.js
        ├── blast-radius/page.js
        ├── resource-diff/page.js
        ├── color-grading/page.js
        ├── resource-panel/page.js
        ├── workbench-sidebar/page.js
        └── miscellaneous/page.js
```

---

## 4. Page Inventory & Content Breakdown

### Page 1: Home / Landing (`/`)
1. **Site Navigation**:
   - Logo + `PLAN-PARSE` wordmark + version chip (`v0.1.0`).
   - "Features" dropdown navigation linking directly to all 7 feature chapters.
   - Quick anchors: *The Problem*, *Accomplishments*, *Workflow Guide*, *Releases*, *Docker*.
   - GitHub icon & Stars link, Docker Hub badge, and Theme Toggle button.
2. **Hero Segment**:
   - **Headline**: Visual Infrastructure Assurance for Terraform & OpenTofu.
   - **Tagline**: Transform dense, thousands-of-lines terminal plan outputs into an interactive, hierarchical DAG. Eliminate cascading destruction, audit transitive blast radius, and inspect 2-tier resource diffs before applying.
   - **Direct Call-to-Actions (CTAs)**:
     - `Download Release Binary` $\rightarrow$ links to `https://github.com/AatirNadim/plan-parse/releases`
     - Copyable Docker pull snippet: `docker pull aatirnadim/plan-parse:latest`
     - `View on GitHub` button
3. **Problem Statement & Core Accomplishments ("Why It Was Needed")**:
   - Side-by-side contrast grid:
     - *Traditional CLI*: Walls of scrolling terminal text, hidden force-replacements (`+/-`), invisible blast radius, risk of catastrophic outages.
     - *`plan-parse` Solution*: Interactive visual graph, instant blast-radius tracing, 2-tier progressive diffing, single zero-dependency standalone binary, 100% local client-side privacy.
4. **Feature Directory Grid**:
   - Visual preview cards for each of the 7 dedicated features with mini-badges and direct links to their detailed pages.
5. **End-User Workflow Guide ("How to Use plan-parse")**:
   - 4 sequential steps with copyable terminal snippets:
     - Step 1: Export plan JSON (`terraform show -json tfplan > plan.json`)
     - Step 2: Launch via CLI, Docker, or Web Drag-and-Drop
     - Step 3: Audit DAG, isolate blast radius, and review HCL diffs
     - Step 4: Safely apply or generate targeted rollout commands
6. **Download & Docker Hub Reference Card**:
   - Binary platform grid (Linux `amd64`/`arm64`, macOS Intel/Apple Silicon, Windows `amd64`).
   - Ready-to-run Docker bind-mount snippet with explanation of why read-only (`:ro`) mounting is safe.

---

### Page 2: Collapsed Nodes ("Mutations Only") (`/features/collapsed-nodes/`)
- **Zoomed-in Highlight Image**: `collapsed-nodes.svg`
  - Highlighting: Intermediate unchanged node clusters collapsed into compact pills, transitive bridging dashed edges, and the AppHeader toggle button with active collapsed counter.
- **Labeled Callouts**:
  - `①` **Collapsed Cluster Pill**: Indicating count of hidden unchanged resources.
  - `②` **Synthetic Transitive Bridging Edge**: Visual proof that upstream dependency lines remain intact.
  - `③` **Header Toggle & Counter**: Hotkey indicator `[C]` and live collapsed node count.
  - `④` **Mutating Node Focus**: Only nodes with changes (`create`, `update`, `delete`, `replace`) remain expanded.
- **Structured Details**:
  - *The Problem*: Real-world enterprise plans contain 200+ resources where only 3 are changing. Looking at all 200 causes cognitive overload.
  - *The Algorithm*: Deterministic DAG reduction that prunes no-op nodes while computing transitive closure edges between surviving mutated nodes.
  - *How to Use*: Toggle via header button, Command Palette (`⌘K`), or keyboard shortcut `C`.

---

### Page 3: Blast Radius Analysis & Subgraph Isolation (`/features/blast-radius/`)
- **Zoomed-in Highlight Image**: `blast-radius.svg`
  - Highlighting: Selected target node with animated pulse, amber/purple dependency paths, the on-canvas Blast Radius HUD pill, and the Subgraph Isolation toolbar.
- **Labeled Callouts**:
  - `①` **Blast Radius HUD**: Direct vs. transitive vs. mutating casualty counts.
  - `②` **Subgraph Isolation Button**: Dedicated toggle to filter out the rest of the graph (`[B]`).
  - `③` **Depth Filter Stepper**: `1-hop` (direct only), `2-hop`, or `All` transitive dependencies.
  - `④` **Mutating Only Filter**: Filter to hide read-only or no-op casualties and focus solely on destructive side-effects.
- **Structured Details**:
  - *The Problem*: Modifying a security group or base VPC parameter often triggers cascading re-creations across RDS, ECS, or Lambda without the engineer realizing.
  - *Under the Hood*: Breadth-first transitive graph traversal tracking upstream dependencies (`depends_on`) and downstream references (`referenced_by`).
  - *SRE Use Case*: Verifying that modifying a database subnet group does not force an unexpected RDS cluster recreation.

---

### Page 4: 2-Tier Progressive IaC Resource Diff (`/features/resource-diff/`)
- **Zoomed-in Highlight Image**: `resource-diff.svg`
  - Highlighting: Dual-view composite showing Tier 1 (`NodePopover` card anchored to node) alongside Tier 2 (`NodeDiffModal` with line gutters and syntax highlighting).
- **Labeled Callouts**:
  - `①` **Tier 1 Quick Popover**: Action badge, delta counters (`+N added`, `~N modified`, `-N removed`), and `(forces replacement)` warning.
  - `②` **Tier 2 Unified HCL Diff**: Terminal-style HCL diff with sticky line numbers and colored block additions/removals.
  - `③` **Side-by-Side (Split) View**: Dual-column comparison between Current State (`before`) and Planned State (`after`).
  - `④` **Attributes JSON Matrix**: Searchable tabular property matrix with "Changed Only" filter toggle.
- **Structured Details**:
  - *The Problem*: Engineers need fast surface-level answers for small updates, but line-by-line verification for complex structural refactors.
  - *Keyboard Flow*: Press `Space` to toggle Tier 1; press `D` or click "Inspect Deep Diff" to open Tier 2; press `Tab` to cycle diff tabs.

---

### Page 5: Color Grading & Visual Grammar (`/features/color-grading/`)
- **Zoomed-in Highlight Image**: `color-grading.svg`
  - Highlighting: A cluster of resources demonstrating each action state, container module enclosures, and dependency edge styling.
- **Labeled Callouts**:
  - `①` **Action Tokens**:
    - Emerald `#10b981`: `+ CREATE`
    - Sky `#0ea5e9`: `~ UPDATE`
    - Rose `#f43f5e`: `- DELETE`
    - Amber `#f59e0b`: `± REPLACE` (critical destructive action)
    - Purple `#a855f7`: `DATA / READ`
    - Slate `#64748b`: `= NO-OP`
  - `②` **Compound Module Containers**: Bounding box showing parent module hierarchy.
  - `③` **Dependency Edges**: Directional arrows representing explicit and implicit Terraform references.
- **Structured Details**:
  - *The Purpose*: Instant visual comprehension across large architectures without needing to read attribute text.

---

### Page 6: Dedicated Resource Panel (Inspector) (`/features/resource-panel/`)
- **Zoomed-in Highlight Image**: `resource-panel.svg`
  - Highlighting: The right slide-over inspector showing the Attribute Diff tab, Lineage navigation buttons, and Raw JSON view.
- **Labeled Callouts**:
  - `①` **Resource Header & Copy Address**: One-click clipboard copy for exact Terraform resource addresses.
  - `②` **Attribute Diff View**: Before/after line comparisons with syntax highlighting.
  - `③` **Lineage Navigation**: Clickable chips for upstream `Depends On` and downstream `Referenced By` that re-center the canvas on the related node.
  - `④` **Raw JSON Definition**: Full inspectable Terraform schema representation.
- **Structured Details**:
  - *Docked Ergonomics*: Toggled globally via `]` key without obstructing the main DAG canvas.

---

### Page 7: Workbench Sidebar & Ingestion (`/features/workbench-sidebar/`)
- **Zoomed-in Highlight Image**: `workbench-sidebar.svg`
  - Highlighting: The docked left sidebar showing the hierarchical resource tree, search input, action filter pills, and the drag-and-drop plan ingestion zone.
- **Labeled Callouts**:
  - `①` **Real-Time Resource Search**: Instant text filtering by address, type, or resource name.
  - `②` **Action Filter Pills**: Quick filter buttons (`all`, `create`, `update`, `delete`, `replace`).
  - `③` **Module Hierarchy Tree**: Nested folding tree grouping resources by module paths.
  - `④` **Drag-and-Drop Ingestion Dropzone**: Client-side preflight schema validation supporting files up to 50MB.
- **Structured Details*:
  - *Docked Ergonomics*: Toggled globally via `[` key; handles client-side plan parsing with zero network transmission.

---

### Page 8: Miscellaneous Power-User Utilities (`/features/miscellaneous/`)
- **Zoomed-in Highlight Image**: `miscellaneous.svg`
  - Highlighting: Composite multi-window illustration showing the Command Palette (`⌘K`), Retina Export menu, Targeted Apply Card, and Theme Switcher.
- **Labeled Callouts**:
  - `①` **Global Command Palette (`⌘K` / `Ctrl+K`)**: Fast fuzzy switcher to jump to any resource, trigger collapse, toggle blast radius, or switch themes.
  - `②` **High-DPI Diagram Export**: Export full DAG as Retina PNG (up to 2.5x raster) or infinite-zoom vector SVG.
  - `③` **Targeted Apply Generator**: Automatically generates copyable `terraform apply -target="..."` commands for isolated resources or whole modules.
  - `④` **Keyboard Shortcuts Cheat Sheet (`?`)**: Full modal dialog listing all workstation hotkeys.
  - `⑤` **Theme Engine**: Precision dark mode and high-contrast light mode toggle (`T`).
  - `⑥` **Diagnostic CLI Errors**: Human-readable error classification (`INITIALIZATION_REQUIRED`, `AUTHENTICATION`, `VERSION_INCOMPATIBILITY`, `PERMISSION`, `CONFIGURATION`).

---

## 5. High-Craft SVG Visual Specifications

All SVGs will be created in `landing/public/images/features/` with:
- `viewBox="0 0 960 540"` (16:9 widescreen presentation ratio).
- Vector accuracy matching Cytoscape nodes (rounded rects, font sizes, colors, and line widths).
- Embedded circular numbered callout pins (`<g class="callout-pin">`) with glowing borders and numbered text (`1`, `2`, `3`, `4`).
- Leader lines connecting callout pins to target UI widgets.
- Responsive scaling: SVGs render crisply from mobile screens up to 4K displays.

---

## 6. Implementation Phasing

1. **Phase 1: Project Scaffolding & Setup**
   - Initialize `landing/package.json` with Next.js 14, Tailwind CSS, PostCSS.
   - Configure `landing/next.config.js` with `output: 'export'`.
   - Setup `landing/tailwind.config.js` with the exact color tokens, dark theme `#090a0f`, and fonts.
   - Implement root `layout.js`, `ThemeProvider.js`, and `use-theme.js`.

2. **Phase 2: Core Shared Components**
   - Build `SiteHeader.js` (Navigation, Features dropdown, GitHub/Docker links, Theme toggle).
   - Build `SiteFooter.js` (Links, metadata, license).
   - Build `FeatureNav.js` (Sub-navigation bar & pagination for feature pages).
   - Build `CalloutImage.js` (Interactive SVG wrapper connecting pins to details).
   - Build `CodeBlock.js` (Copyable terminal snippets).

3. **Phase 3: High-Fidelity SVG Visual Assets**
   - Draft and generate the 7 dedicated SVG diagrams in `landing/public/images/features/`.
   - Ensure color grading, callout pins, and typography match the real workbench interface.

4. **Phase 4: Home / Landing Page Implementation**
   - Implement `landing/app/page.js` with Hero, Problem/Solution matrix, Feature Directory cards, 4-step Workflow Guide, and Release/Docker download hubs.

5. **Phase 5: Dedicated Feature Pages Implementation**
   - Build the 7 independent feature pages under `landing/app/features/*/page.js`.
   - Implement cross-page sequential navigation (`← Previous | Next →`).

6. **Phase 6: Static Export Verification & QA**
   - Execute `pnpm run build` inside `landing/` to verify zero build errors and successful static export into `landing/out/`.
   - Audit Dark and Light themes across all pages.
   - Verify all GitHub Releases, Docker Hub, and internal feature links.
