/**
 * target-command.js
 * Targeted Terraform Apply / Plan command generator.
 *
 * SREs frequently need to apply specific resources or modules first to resolve
 * stuck states, staged rollouts, or critical migrations.
 *
 * Supports:
 * - Single resource or module target commands
 * - Transitive upstream dependency resolution in topological execution order
 * - Single-line and multi-line command formatting
 * - Plan vs Apply selection and flags (-auto-approve, -var-file)
 * - Safe clipboard copy with fallback
 */

/**
 * Checks whether a node is a valid Terraform target.
 * Terraform targets can be:
 * - Managed resources: e.g. aws_instance.web or module.compute.local_file.key
 * - Data sources: e.g. data.aws_ami.ubuntu or module.vpc.data.aws_subnet.selected
 * - Modules: e.g. module.vpc or module.compute
 *
 * Variables, outputs, locals, file containers, and root basename are NOT valid targets.
 *
 * @param {Object} node - Cytoscape node data object or full node object
 * @returns {boolean}
 */
export function isTargetableNode(node) {
  if (!node) return false;
  const data = node.data || node;
  const id = data.id || "";
  const type = data.type || "";
  const classes = node.classes || data.classes || "";

  // Explicit untargetable types
  if (
    type === "variable" ||
    type === "locals" ||
    type === "file" ||
    type === "basename" ||
    type === "output"
  ) {
    return false;
  }

  // ID-based heuristics
  if (
    id === "root" ||
    id.startsWith("var.") ||
    id.startsWith("local.") ||
    id.startsWith("output.") ||
    id === "terraform.workspace" ||
    id.endsWith(".tf")
  ) {
    return false;
  }

  // Container paths with slashes that aren't modules (e.g. module.vpc/main.tf/aws_vpc)
  if (id.includes("/")) {
    return false;
  }

  // Targetable types
  if (type === "resource" || type === "data" || type === "module") {
    return true;
  }

  // Classes check
  if (
    classes.includes("resource-name") ||
    classes.includes("data-name") ||
    classes.includes("module")
  ) {
    return true;
  }

  // Address pattern check (e.g. module.foo or aws_instance.bar)
  if (id.startsWith("module.") || id.includes(".")) {
    return true;
  }

  return false;
}

/**
 * Extracts the clean Terraform target address for a node.
 * Returns null if the node cannot be resolved to a valid target.
 *
 * @param {Object} node - Node data object or full node
 * @returns {string|null}
 */
export function getNodeTargetAddress(node) {
  if (!node) return null;
  const data = node.data || node;
  const id = data.id || "";

  if (isTargetableNode(data)) {
    return id;
  }

  // If node is an intermediate container under a module (e.g. module.compute/unknown file/local_file)
  if (id.startsWith("module.") && id.includes("/")) {
    const modulePart = id.split("/")[0];
    if (modulePart && modulePart.startsWith("module.")) {
      return modulePart;
    }
  }

  return null;
}

/**
 * Computes all targetable upstream dependencies for a target node in topological execution order.
 * In this graph's schema, directed edges point from dependent (source) to prerequisite (target).
 * Therefore, outgoing edges from `nodeId` represent direct dependencies.
 *
 * @param {string} nodeId - Target node ID to find upstream dependencies for
 * @param {Object} graphData - Full graph payload { nodes: [...], edges: [...] }
 * @param {Object} [options]
 * @param {boolean} [options.transitive=true] - Whether to follow dependencies recursively
 * @returns {Array<Object>} List of targetable upstream node objects in topological order (dependencies first)
 */
export function getUpstreamDependencies(nodeId, graphData, options = {}) {
  if (!nodeId || !graphData || !Array.isArray(graphData.nodes) || !Array.isArray(graphData.edges)) {
    return [];
  }

  const { transitive = true } = options;

  // Build node lookup map
  const nodeMap = new Map();
  for (const n of graphData.nodes) {
    const data = n.data || n;
    if (data && data.id) {
      nodeMap.set(data.id, data);
    }
  }

  // Build adjacency list: node -> array of nodes it directly depends on (outgoing targets)
  const adj = new Map();
  for (const edge of graphData.edges) {
    const edgeData = edge.data || edge;
    const src = edgeData.source;
    const tgt = edgeData.target;
    if (!src || !tgt) continue;

    if (!adj.has(src)) {
      adj.set(src, []);
    }
    adj.get(src).push(tgt);
  }

  // Traversal to collect all upstream node IDs
  const visited = new Set();
  const upstreamOrder = [];

  function dfs(currId) {
    if (visited.has(currId)) return;
    visited.add(currId);

    const neighbors = adj.get(currId) || [];
    for (const nextId of neighbors) {
      if (nextId === nodeId) continue; // Cycle guard back to root

      if (transitive) {
        if (!visited.has(nextId)) {
          dfs(nextId);
        }
      } else {
        visited.add(nextId);
      }

      // Add to ordering in topological fashion (dependencies first)
      if (!upstreamOrder.includes(nextId) && nextId !== nodeId) {
        upstreamOrder.push(nextId);
      }
    }
  }

  dfs(nodeId);

  // Filter to targetable nodes and map to full node objects
  const result = [];
  const seenAddresses = new Set();

  for (const id of upstreamOrder) {
    const nodeObj = nodeMap.get(id);
    if (!nodeObj) continue;

    const address = getNodeTargetAddress(nodeObj);
    if (address && address !== nodeId && !seenAddresses.has(address)) {
      seenAddresses.add(address);
      result.push({
        id: address,
        label: nodeObj.label || address,
        type: nodeObj.type,
        change: nodeObj.change || "no-op",
        resourceType: nodeObj.resourceType,
        module: nodeObj.module,
      });
    }
  }

  return result;
}

/**
 * Generates a complete Terraform target command.
 *
 * @param {string} targetAddress - Primary target address (e.g. "module.vpc.aws_route_table.public")
 * @param {Object} [options]
 * @param {string} [options.command='apply'] - 'apply' or 'plan'
 * @param {boolean} [options.includeUpstream=false] - Whether to include upstream dependencies
 * @param {Array<string>} [options.upstreamAddresses=[]] - List of upstream target addresses
 * @param {boolean} [options.autoApprove=false] - Include -auto-approve flag (apply only)
 * @param {string} [options.format='single-line'] - 'single-line' or 'multi-line'
 * @param {string} [options.varFile] - Optional -var-file flag argument
 * @returns {string} Formatted CLI bash command
 */
export function generateTargetCommand(targetAddress, options = {}) {
  if (!targetAddress) return "";

  const {
    command = "apply",
    includeUpstream = false,
    upstreamAddresses = [],
    autoApprove = false,
    format = "single-line",
    varFile = "",
  } = options;

  const cmdType = command === "plan" ? "plan" : "apply";

  // Build ordered target list (upstream prerequisites first, then target node)
  const targets = [];
  if (includeUpstream && Array.isArray(upstreamAddresses)) {
    for (const addr of upstreamAddresses) {
      if (addr && addr !== targetAddress && !targets.includes(addr)) {
        targets.push(addr);
      }
    }
  }
  if (!targets.includes(targetAddress)) {
    targets.push(targetAddress);
  }

  const flags = [];

  if (autoApprove && cmdType === "apply") {
    flags.push("-auto-approve");
  }

  if (varFile && typeof varFile === "string" && varFile.trim() !== "") {
    flags.push(`-var-file="${varFile.trim()}"`);
  }

  for (const t of targets) {
    flags.push(`-target="${t}"`);
  }

  if (format === "multi-line") {
    const lines = [`terraform ${cmdType}`];
    for (const flag of flags) {
      lines.push(`  ${flag}`);
    }
    return lines.join(" \\\n");
  }

  // Single-line default
  return `terraform ${cmdType} ${flags.join(" ")}`.trim();
}

/**
 * Copies text to the clipboard with modern navigator.clipboard and fallback.
 *
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if copy was successful
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  // 1. Try modern async Clipboard API
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, attempting execCommand fallback:", err);
    }
  }

  // 2. Fallback to hidden textarea with execCommand
  if (typeof document !== "undefined") {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      textArea.style.left = "-9999px";
      textArea.setAttribute("readonly", "");
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (fallbackErr) {
      console.error("execCommand fallback failed:", fallbackErr);
      return false;
    }
  }

  return false;
}

