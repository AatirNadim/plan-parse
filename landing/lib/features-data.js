export const FEATURES = [
  {
    id: "collapsed-nodes",
    slug: "collapsed-nodes",
    title: "Collapsed Nodes (Mutations Only)",
    navTitle: "Collapsed Nodes",
    badge: "DAG Reduction",
    hotkey: "C",
    tagline: "Deterministic DAG pruning that collapses hundreds of unchanged resources into synthetic bridging edges.",
    svgFile: "/images/features/collapsed-nodes.svg",
    callouts: [
      {
        pin: 1,
        title: "Collapsed Cluster Pill",
        description: "Condenses intermediate unchanged clusters into a single pill indicating the exact count of hidden no-op resources.",
      },
      {
        pin: 2,
        title: "Synthetic Transitive Bridging Edge",
        description: "Computes transitive closure edges so upstream dependency lines between surviving mutating nodes remain mathematically intact.",
      },
      {
        pin: 3,
        title: "Header Toggle & Live Counter",
        description: "Dedicated workbench toolbar button showing live collapsed counts with hotkey accelerator indicator [C].",
      },
      {
        pin: 4,
        title: "Mutating Node Focus",
        description: "Keeps only resources with active mutations (create, update, delete, replace) prominently expanded and rendered.",
      },
    ],
    theProblem: {
      title: "The Signal-to-Noise Paradox",
      description: "Real-world enterprise Terraform configurations frequently govern 300+ resources across multiple modules. When a pull request modifies just 3 resources, reviewing the complete unreduced plan requires panning across a massive sea of unchanged nodes. Engineers miss critical changes simply due to cognitive exhaustion.",
    },
    theAlgorithm: {
      title: "Transitive Closure DAG Reduction",
      description: "plan-parse runs a deterministic graph contraction algorithm directly on the client canvas. It isolates all nodes where change action equals 'no-op', identifies their connected boundary components, replaces interior subgraphs with synthetic summary pills, and recalculates transitive dependency arcs so graph connectivity is never severed.",
    },
    howToUse: [
      {
        step: "1",
        label: "Press Hotkey 'C'",
        detail: "Instantly toggle between the complete architecture DAG and the reduced mutations-only view.",
      },
      {
        step: "2",
        label: "Click Toolbar Toggle",
        detail: "Use the top header 'Mutations Only' button to view active collapsed cluster counts.",
      },
      {
        step: "3",
        label: "Use Command Palette",
        detail: "Press ⌘K or Ctrl+K and type 'Toggle Mutations Only' to switch views without lifting hands from keyboard.",
      },
    ],
    scenario: {
      title: "Enterprise SRE Scenario",
      description: "A staging environment plan has 240 managed resources across VPC, EKS, RDS, and IAM. An engineer updates 1 security group rule. Collapsing nodes reduces graph complexity from 240 nodes to 4 nodes, instantly exposing the 3 downstream resources affected by the rule change.",
    },
  },
  {
    id: "blast-radius",
    slug: "blast-radius",
    title: "Blast Radius Analysis & Subgraph Isolation",
    navTitle: "Blast Radius",
    badge: "Risk Mitigation",
    hotkey: "B",
    tagline: "Transitive BFS impact graph traversal revealing every resource placed at risk before running apply.",
    svgFile: "/images/features/blast-radius.svg",
    callouts: [
      {
        pin: 1,
        title: "Blast Radius HUD Pill",
        description: "On-canvas floating HUD breaking down direct casualties, transitive casualties, and destructive replacements in real time.",
      },
      {
        pin: 2,
        title: "Subgraph Isolation Mode",
        description: "Dedicated toggle ([B]) that dims or removes all unrelated infrastructure to focus purely on the impacted dependency cascade.",
      },
      {
        pin: 3,
        title: "Depth Filter Stepper",
        description: "Interactive stepper switching between 1-hop direct dependencies, 2-hop intermediate links, and full transitive closure.",
      },
      {
        pin: 4,
        title: "Mutating Only Filter",
        description: "Filters out read-only and no-op downstream observers, isolating only resources undergoing destructive or stateful alterations.",
      },
    ],
    theProblem: {
      title: "Hidden Cascading Re-creations",
      description: "In Terraform, changing an attribute on a low-level primitive (such as an AWS Subnet CIDR, Security Group, or KMS Key) often forces replacement (`+/-`). Because dependent services bind to the resource's physical ID, the replacement cascades downstream, tearing down databases and Kubernetes node groups without warning.",
    },
    theAlgorithm: {
      title: "Bidirectional Breadth-First Traversal",
      description: "When a node is selected, plan-parse conducts a bidirectional BFS traversal along both explicit `depends_on` arcs and implicit HCL expression references. It indexes parents and children, classifies casualties by severity, and animates high-voltage signal paths across the DAG.",
    },
    howToUse: [
      {
        step: "1",
        label: "Select Any Mutating Node",
        detail: "Click a node on the canvas to immediately activate the Blast Radius HUD and signal paths.",
      },
      {
        step: "2",
        label: "Press 'B' to Isolate",
        detail: "Filter canvas rendering down to the exact subgraph of casualties affected by the selected node.",
      },
      {
        step: "3",
        label: "Adjust Hop Stepper",
        detail: "Step through 1-hop, 2-hop, or full transitive depth to inspect immediate vs distant ripple effects.",
      },
    ],
    scenario: {
      title: "Production Outage Prevention",
      description: "An engineer refactors a shared database subnet group name. Standard terminal output showed 1 replacement. Blast Radius reveals 2 production RDS clusters, 4 read replicas, and 12 ECS tasks would be destroyed and recreated during deployment.",
    },
  },
  {
    id: "resource-diff",
    slug: "resource-diff",
    title: "2-Tier Progressive IaC Resource Diff",
    navTitle: "2-Tier Diff",
    badge: "Precision Inspection",
    hotkey: "Space / D",
    tagline: "Instant contextual popovers paired with full-bleed side-by-side HCL and attribute matrix diffing.",
    svgFile: "/images/features/resource-diff.svg",
    callouts: [
      {
        pin: 1,
        title: "Tier 1 Quick Popover",
        description: "Node-anchored modal displaying change summary badges (+N added, ~N modified, -N removed) and forces replacement warnings.",
      },
      {
        pin: 2,
        title: "Tier 2 Unified HCL Diff",
        description: "Terminal-accurate syntax highlighted HCL diff with sticky line gutters and colored block additions/removals.",
      },
      {
        pin: 3,
        title: "Side-by-Side (Split) View",
        description: "Synchronized dual-pane diff contrasting Current State (before) directly against Planned State (after).",
      },
      {
        pin: 4,
        title: "Attributes JSON Matrix",
        description: "Searchable tabular property inspector with a 'Changed Only' filter toggle for rapid parameter auditing.",
      },
      {
        pin: 5,
        title: "AST Source Filepath Recovery",
        description: "Pinpoints exact .tf source files and line numbers via AST inspection, with clear provenance badges distinguishing local workspace resolution from standalone plan fallback ('unknown file').",
      },
    ],
    theProblem: {
      title: "The Terminal Diff Compromise",
      description: "Engineers are forced to choose between truncated summary tables that hide crucial details, or scrolling through 8,000 lines of JSON plan diffs where critical replacement flags are lost in dense text blocks.",
    },
    theAlgorithm: {
      title: "Progressive Disclosure & AST Recovery Engine",
      description: "plan-parse implements a two-tier inspection architecture paired with AST code recovery. Terraform plan JSON omits source filenames; when run in a workspace, plan-parse correlates .terraform/modules/modules.json and HCL ASTs to recover exact file paths (e.g. main.tf:15). In standalone plan uploads, unmapped items cleanly fallback to an 'unknown file' compound container with transparent provenance tooltips.",
    },
    howToUse: [
      {
        step: "1",
        label: "Press 'Space' for Tier 1",
        detail: "Hover or select any node and press Space to open the quick delta summary popover.",
      },
      {
        step: "2",
        label: "Press 'D' for Tier 2",
        detail: "Press D or click 'Deep Diff' to launch the full-screen modal with split HCL comparisons.",
      },
      {
        step: "3",
        label: "Press 'Tab' to Switch Tabs",
        detail: "Cycle seamlessly between Unified Diff, Split View, and the Attributes Matrix.",
      },
    ],
    scenario: {
      title: "IAM Policy Mutation Audit",
      description: "A security policy change alters 4 out of 160 statements. Instead of reading through 500 lines of unformatted JSON, the Tier 2 split view flags the 4 modified ARN statements with color-coded additions and deletions.",
    },
  },
  {
    id: "color-grading",
    slug: "color-grading",
    title: "Color Grading & Visual Grammar",
    navTitle: "Color Grading",
    badge: "Visual Grammar",
    hotkey: "Visual Tokens",
    tagline: "Rigorous 60-30-10 color grammar delivering instant architectural clarity without reading text.",
    svgFile: "/images/features/color-grading.svg",
    callouts: [
      {
        pin: 1,
        title: "Semantic Action Tokens",
        description: "Emerald for Create (+), Sky for Update (~), Rose for Delete (-), Amber for Replace (±), Purple for Read, and Slate for No-op.",
      },
      {
        pin: 2,
        title: "Compound Module Containers",
        description: "Visual module bounding hulls depicting nested encapsulation and logical grouping boundaries.",
      },
      {
        pin: 3,
        title: "Directional Dependency Edges",
        description: "High-contrast vector arrows illustrating explicit provider references and implicit dependency hierarchies.",
      },
    ],
    theProblem: {
      title: "Monochromatic Visual Clutter",
      description: "Standard graph visualizations treat every node identically or use arbitrary randomized color palettes, forcing reviewers to read every single label to understand what is being created, modified, or destroyed.",
    },
    theAlgorithm: {
      title: "Semantic Action Token Contract",
      description: "Every visual asset in plan-parse strictly adheres to standard action colors: Emerald (#10b981) for creation, Sky (#0ea5e9) for in-place modifications, Rose (#f43f5e) for destruction, Amber (#f59e0b) for destructive re-creation, and Purple (#a855f7) for data source lookups.",
    },
    howToUse: [
      {
        step: "1",
        label: "Scan at High Zoom",
        detail: "Identify destructive amber and rose nodes from a birds-eye overview before zooming in.",
      },
      {
        step: "2",
        label: "Filter by Action",
        detail: "Use sidebar action pills to instantly highlight or isolate all resources sharing an action token.",
      },
      {
        step: "3",
        label: "Toggle Theme Seamlessly",
        detail: "Color tokens maintain calibrated contrast and luminosity across both Dark and Light themes.",
      },
    ],
    scenario: {
      title: "Rapid Architecture Review",
      description: "During a high-stakes release sync, the team lead zooms out to view the entire infrastructure. A single bright amber node immediately flags an unexpected RDS recreation that would have triggered a 30-minute outage.",
    },
  },
  {
    id: "resource-panel",
    slug: "resource-panel",
    title: "Dedicated Resource Panel (Inspector)",
    navTitle: "Resource Panel",
    badge: "Docked Inspector",
    hotkey: "]",
    tagline: "Docked right slide-over inspector providing deep attribute diffs, lineage navigation, and raw schema views.",
    svgFile: "/images/features/resource-panel.svg",
    callouts: [
      {
        pin: 1,
        title: "Resource Address & Copy Header",
        description: "Full Terraform HCL address with one-click copy icon for instant CLI targeting.",
      },
      {
        pin: 2,
        title: "Attribute Diff View",
        description: "Real-time before/after property inspection with colorized syntax highlighting and change markers.",
      },
      {
        pin: 3,
        title: "Lineage Navigation Chips",
        description: "Interactive chips for upstream 'Depends On' and downstream 'Referenced By' that pan the DAG directly to related nodes.",
      },
      {
        pin: 4,
        title: "Raw JSON Schema View",
        description: "Full raw schema inspector displaying exact plan JSON structures with syntax highlighting.",
      },
    ],
    theProblem: {
      title: "Context Switching and Lost Graph Focus",
      description: "Reviewers constantly jump between graph visualizations, IDE windows, and terminal tabs to cross-reference resource configurations, losing their location and mental model in the graph.",
    },
    theAlgorithm: {
      title: "Non-Intrusive Docked Inspection",
      description: "The Resource Panel docks cleanly to the right side of the canvas without occluding nodes. It tracks canvas selection in real time and offers bidirectional lineage navigation chips that automatically center the DAG on upstream or downstream dependencies.",
    },
    howToUse: [
      {
        step: "1",
        label: "Toggle with ']' Key",
        detail: "Press ']' at any time to expand or collapse the right inspector drawer.",
      },
      {
        step: "2",
        label: "Click Lineage Chips",
        detail: "Click any upstream dependency chip to immediately center the canvas on that node.",
      },
      {
        step: "3",
        label: "Copy Address",
        detail: "Click the address chip to copy the exact resource string for use in targeted apply commands.",
      },
    ],
    scenario: {
      title: "Complex Multi-Tier Dependency Audit",
      description: "While auditing a Kubernetes cluster rollout, clicking through lineage chips allows an SRE to traverse from an Ingress Controller up through Load Balancer, Subnets, and IAM roles in seconds.",
    },
  },
  {
    id: "workbench-sidebar",
    slug: "workbench-sidebar",
    title: "Workbench Sidebar & Ingestion Dropzone",
    navTitle: "Workbench Sidebar",
    badge: "Navigation & Intake",
    hotkey: "[",
    tagline: "Left docked hierarchy tree, real-time fuzzy search, action filtering, and local drag-and-drop plan ingestion.",
    svgFile: "/images/features/workbench-sidebar.svg",
    callouts: [
      {
        pin: 1,
        title: "Real-Time Resource Search",
        description: "Instant fuzzy filtering across thousands of resources by address, resource type, or module path.",
      },
      {
        pin: 2,
        title: "Action Filter Pills",
        description: "One-click toggle pills to isolate specific mutations (Create, Update, Delete, Replace, or All).",
      },
      {
        pin: 3,
        title: "Module Hierarchy Tree",
        description: "Collapsible nested tree reflecting the exact module hierarchy of your Terraform project.",
      },
      {
        pin: 4,
        title: "Drag-and-Drop Ingestion Zone",
        description: "100% local, client-side preflight plan schema validator accepting files up to 50MB with zero network egress.",
      },
      {
        pin: 5,
        title: "Source Filepath & AST Provenance",
        description: "CLI workspace mode extracts AST line numbers and source files; standalone browser uploads cleanly structure unmapped resources under 'unknown file'.",
      },
    ],
    theProblem: {
      title: "Cumbersome Plan Loading & Dense Hierarchies",
      description: "Engineers need to quickly load plans from their local machines without setting up complex servers, leaking sensitive credentials over the internet, or getting lost in massive module structures.",
    },
    theAlgorithm: {
      title: "Zero-Transmission Client-Side Ingestion & Dual Modes",
      description: "plan-parse parses Terraform plan JSON entirely in client-side Web Workers—credentials and configurations never leave localhost. It bridges dual ingestion modes: CLI workspace mode (resolving AST line numbers and source files) and Standalone Plan mode (structuring unmapped resources under 'unknown file' while maintaining full blast radius DAG integrity).",
    },
    howToUse: [
      {
        step: "1",
        label: "Drag & Drop plan.json",
        detail: "Drag your exported plan file onto the browser window or use the sidebar dropzone.",
      },
      {
        step: "2",
        label: "Search & Filter",
        detail: "Type in the search bar or click action pills to quickly filter the tree and canvas.",
      },
      {
        step: "3",
        label: "Toggle with '[' Key",
        detail: "Collapse the sidebar with '[' whenever you want maximum canvas screen real estate.",
      },
    ],
    scenario: {
      title: "Air-Gapped Infrastructure Verification",
      description: "A financial institution runs plan-parse on isolated local machines. Engineers verify multi-cloud migration plans without any cloud API egress or security compliance concerns.",
    },
  },
  {
    id: "miscellaneous",
    slug: "miscellaneous",
    title: "Power-User Utilities & Workstation Tools",
    navTitle: "Power Tools",
    badge: "Workstation Ergonomics",
    hotkey: "⌘K / ?",
    tagline: "Command palette, retina diagram exports, targeted apply generators, and diagnostic CLI error handling.",
    svgFile: "/images/features/miscellaneous.svg",
    callouts: [
      {
        pin: 1,
        title: "Global Command Palette (⌘K)",
        description: "Keyboard-first switcher to jump to any node, run actions, switch themes, and execute commands.",
      },
      {
        pin: 2,
        title: "High-DPI Diagram Export",
        description: "Export the full canvas as a Retina 2.5x raster PNG or infinite-zoom vector SVG for PR reviews.",
      },
      {
        pin: 3,
        title: "Targeted Apply Generator",
        description: "One-click generation of exact `terraform apply -target=\"...\"` commands for isolated deployments.",
      },
      {
        pin: 4,
        title: "Keyboard Shortcuts Cheat Sheet (?)",
        description: "Comprehensive quick-reference modal documenting all workstation navigation hotkeys.",
      },
      {
        pin: 5,
        title: "Precision Theme Engine (T)",
        description: "Seamless toggle between Dark Workbench (#090a0f) and High-Contrast Light Mode (#f8fafc).",
      },
      {
        pin: 6,
        title: "Diagnostic CLI Error Classifier",
        description: "Intelligent error classifier pinpointing permission, authentication, and configuration failures.",
      },
    ],
    theProblem: {
      title: "Context Switching in High-Velocity Workflows",
      description: "Power users need hotkey ergonomics, easy artifact sharing for PR descriptions and post-mortems, and instant targeted commands without memorizing complex CLI flags.",
    },
    theAlgorithm: {
      title: "Workstation-Grade Tooling Suite",
      description: "Built with Cytoscape SVG exporters, fuzzy matching algorithms in the Command Palette, and automated dependency aggregation for targeted applies.",
    },
    howToUse: [
      {
        step: "1",
        label: "Open Palette (⌘K)",
        detail: "Access all workbench features and search all resources with instant keyboard input.",
      },
      {
        step: "2",
        label: "Export Architecture Diagram",
        detail: "Export high-resolution SVG or Retina PNG diagrams to paste directly into GitHub Pull Requests.",
      },
      {
        step: "3",
        label: "Generate Targeted Apply",
        detail: "Select nodes or modules and copy the exact targeting CLI syntax with all required dependencies.",
      },
    ],
    scenario: {
      title: "Pull Request Architecture Reviews",
      description: "Before applying a major migration, an engineer exports a high-res SVG of the blast radius and pastes the targeted apply command into the PR, giving reviewers complete visual confidence.",
    },
  },
];

export function getFeatureBySlug(slug) {
  return FEATURES.find((f) => f.slug === slug);
}

export function getAdjacentFeatures(currentSlug) {
  const index = FEATURES.findIndex((f) => f.slug === currentSlug);
  if (index === -1) return { prev: null, next: null };
  const prev = index > 0 ? FEATURES[index - 1] : null;
  const next = index < FEATURES.length - 1 ? FEATURES[index + 1] : null;
  return { prev, next };
}
