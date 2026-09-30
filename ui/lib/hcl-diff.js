/**
 * Precision HCL and Attribute Diff Engine for Terraform plan changes.
 * Computes granular diff entries, summary delta statistics, and authentic
 * Terraform CLI-style HCL diff syntax representations.
 */

/**
 * Formats a value as clean HCL representation.
 * @param {*} val
 * @param {number} indent
 * @returns {string}
 */
export function formatHclValue(val, indent = 0) {
  if (val === null) return "null";
  if (val === undefined) return "null";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return JSON.stringify(val);

  const spaces = " ".repeat(indent);
  const innerSpaces = " ".repeat(indent + 2);

  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    const items = val.map((item) => `${innerSpaces}${formatHclValue(item, indent + 2)},`).join("\n");
    return `[\n${items}\n${spaces}]`;
  }

  if (typeof val === "object") {
    const keys = Object.keys(val);
    if (keys.length === 0) return "{}";
    const entries = keys
      .sort()
      .map((k) => `${innerSpaces}${k} = ${formatHclValue(val[k], indent + 2)}`)
      .join("\n");
    return `{\n${entries}\n${spaces}}`;
  }

  return String(val);
}

/**
 * Determines whether a key path triggers resource replacement.
 * @param {object} changeDetails
 * @param {string} key
 * @returns {boolean}
 */
export function isPathForcesReplacement(changeDetails, key) {
  if (!changeDetails) return false;
  const actions = changeDetails.actions || [];
  const isReplaceAction = actions.length > 1 || actions.includes("replace");

  // Check replace_paths if provided by terraform-json
  if (Array.isArray(changeDetails.replace_paths)) {
    for (const p of changeDetails.replace_paths) {
      if (Array.isArray(p) && p[0] === key) {
        return true;
      }
    }
  }

  return isReplaceAction;
}

/**
 * Computes deep attribute diff items between before and after states.
 * @param {object} changeDetails
 * @returns {Array<object>}
 */
export function computeAttributeDiff(changeDetails) {
  if (!changeDetails) return [];

  const before = changeDetails.before || {};
  const after = changeDetails.after || {};
  const afterUnknown = changeDetails.after_unknown || {};
  const beforeSensitive = changeDetails.before_sensitive || {};
  const afterSensitive = changeDetails.after_sensitive || {};

  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();

  return allKeys.map((key) => {
    const bVal = before[key];
    const aVal = after[key];

    const isAdded = bVal === undefined && aVal !== undefined;
    const isRemoved = bVal !== undefined && aVal === undefined;
    const isModified = bVal !== undefined && aVal !== undefined && JSON.stringify(bVal) !== JSON.stringify(aVal);
    const isSame = bVal !== undefined && aVal !== undefined && !isModified;

    const isUnknown = Boolean(afterUnknown[key]);
    const isSensitive = Boolean(beforeSensitive[key] || afterSensitive[key]);
    const forcesReplacement = (isModified || isAdded) && isPathForcesReplacement(changeDetails, key);

    return {
      key,
      before: bVal,
      after: aVal,
      isAdded,
      isRemoved,
      isModified,
      isSame,
      isUnknown,
      isSensitive,
      forcesReplacement,
    };
  });
}

/**
 * Computes high-level diff metrics and top modified highlights for a node.
 * @param {object} node
 * @returns {{
 *   action: string,
 *   addedCount: number,
 *   modifiedCount: number,
 *   removedCount: number,
 *   sameCount: number,
 *   totalChanges: number,
 *   forcesReplacement: boolean,
 *   topChanges: Array<object>,
 *   extraChangesCount: number
 * }}
 */
export function getDiffSummary(node) {
  const changeDetails = node?.changeDetails || node?.data?.changeDetails;
  const action = (node?.change || node?.data?.change || "no-op").toLowerCase();
  const diffEntries = computeAttributeDiff(changeDetails);

  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;
  let sameCount = 0;
  let forcesReplacement = action === "replace";

  diffEntries.forEach((entry) => {
    if (entry.isAdded) addedCount++;
    else if (entry.isModified) modifiedCount++;
    else if (entry.isRemoved) removedCount++;
    else if (entry.isSame) sameCount++;

    if (entry.forcesReplacement) {
      forcesReplacement = true;
    }
  });

  const changedEntries = diffEntries
    .filter((e) => !e.isSame)
    .sort((a, b) => {
      if (a.forcesReplacement && !b.forcesReplacement) return -1;
      if (!a.forcesReplacement && b.forcesReplacement) return 1;
      if (a.isModified && !b.isModified) return -1;
      if (!a.isModified && b.isModified) return 1;
      if (a.isAdded && !b.isAdded) return -1;
      if (!a.isAdded && b.isAdded) return 1;
      return a.key.localeCompare(b.key);
    });

  const topChanges = changedEntries.slice(0, 3).map((e) => {
    let summaryText = "";
    if (e.isModified) {
      const bStr = e.isSensitive ? "(sensitive)" : formatHclValue(e.before);
      const aStr = e.isUnknown ? "(known after apply)" : e.isSensitive ? "(sensitive)" : formatHclValue(e.after);
      summaryText = `${bStr} → ${aStr}`;
    } else if (e.isAdded) {
      summaryText = e.isUnknown ? "(known after apply)" : e.isSensitive ? "(sensitive)" : formatHclValue(e.after);
    } else if (e.isRemoved) {
      summaryText = e.isSensitive ? "(sensitive)" : formatHclValue(e.before);
    }

    return {
      key: e.key,
      symbol: e.isAdded ? "+" : e.isRemoved ? "-" : "~",
      type: e.isAdded ? "add" : e.isRemoved ? "remove" : "modify",
      summaryText,
      forcesReplacement: e.forcesReplacement,
    };
  });

  const extraChangesCount = Math.max(0, changedEntries.length - 3);

  return {
    action,
    addedCount,
    modifiedCount,
    removedCount,
    sameCount,
    totalChanges: addedCount + modifiedCount + removedCount,
    forcesReplacement,
    topChanges,
    extraChangesCount,
  };
}

/**
 * Generates formatted HCL-like diff lines matching the official Terraform CLI style with line gutters.
 * @param {object} node
 * @returns {{
 *   rawHcl: string,
 *   lines: Array<{
 *     lineNum: number,
 *     type: "comment" | "header" | "add" | "remove" | "modify" | "same" | "brace",
 *     symbol: string,
 *     prefix: string,
 *     text: string,
 *     forcesReplacement?: boolean
 *   }>
 * }}
 */
export function generateHclDiff(node) {
  const address = node?.id || node?.data?.id || "resource";
  const resourceType = node?.resourceType || node?.data?.resourceType || "resource";
  const resourceName = node?.resourceName || node?.data?.resourceName || "this";
  const action = (node?.change || node?.data?.change || "no-op").toLowerCase();
  const changeDetails = node?.changeDetails || node?.data?.changeDetails;
  const diffEntries = computeAttributeDiff(changeDetails);

  const lines = [];
  let currentLine = 1;

  // Action header comment
  let actionComment = `# ${address} will be updated in-place`;
  let actionSymbol = "~";
  if (action === "create") {
    actionComment = `# ${address} will be created`;
    actionSymbol = "+";
  } else if (action === "delete") {
    actionComment = `# ${address} will be destroyed`;
    actionSymbol = "-";
  } else if (action === "replace") {
    actionComment = `# ${address} must be replaced`;
    actionSymbol = "±";
  } else if (action === "no-op" || action === "noop") {
    actionComment = `# ${address} has no planned changes`;
    actionSymbol = " ";
  }

  lines.push({
    lineNum: currentLine++,
    type: "comment",
    symbol: " ",
    prefix: "  ",
    text: actionComment,
  });

  // Resource opening block
  lines.push({
    lineNum: currentLine++,
    type: "header",
    symbol: actionSymbol,
    prefix: `${actionSymbol} `,
    text: `resource "${resourceType}" "${resourceName}" {`,
  });

  if (diffEntries.length === 0) {
    lines.push({
      lineNum: currentLine++,
      type: "comment",
      symbol: " ",
      prefix: "    ",
      text: "# (no attribute changes recorded)",
    });
  } else {
    diffEntries.forEach((entry) => {
      const { key, before, after, isAdded, isRemoved, isModified, isSame, isUnknown, isSensitive, forcesReplacement } = entry;
      const replaceSuffix = forcesReplacement ? " # forces replacement" : "";

      if (isAdded) {
        const valStr = isUnknown ? "(known after apply)" : isSensitive ? "(sensitive value)" : formatHclValue(after, 4);
        lines.push({
          lineNum: currentLine++,
          type: "add",
          symbol: "+",
          prefix: "+   ",
          text: `  ${key.padEnd(22)} = ${valStr}${replaceSuffix}`,
          forcesReplacement,
        });
      } else if (isRemoved) {
        const valStr = isSensitive ? "(sensitive value)" : formatHclValue(before, 4);
        lines.push({
          lineNum: currentLine++,
          type: "remove",
          symbol: "-",
          prefix: "-   ",
          text: `  ${key.padEnd(22)} = ${valStr}`,
        });
      } else if (isModified) {
        const bStr = isSensitive ? "(sensitive value)" : formatHclValue(before, 4);
        const aStr = isUnknown ? "(known after apply)" : isSensitive ? "(sensitive value)" : formatHclValue(after, 4);
        lines.push({
          lineNum: currentLine++,
          type: "modify",
          symbol: "~",
          prefix: "~   ",
          text: `  ${key.padEnd(22)} = ${bStr} -> ${aStr}${replaceSuffix}`,
          forcesReplacement,
        });
      } else if (isSame) {
        const valStr = isSensitive ? "(sensitive value)" : formatHclValue(before, 4);
        lines.push({
          lineNum: currentLine++,
          type: "same",
          symbol: " ",
          prefix: "    ",
          text: `  ${key.padEnd(22)} = ${valStr}`,
        });
      }
    });
  }

  // Closing brace
  lines.push({
    lineNum: currentLine++,
    type: "brace",
    symbol: " ",
    prefix: "  ",
    text: "}",
  });

  const rawHcl = lines.map((l) => `${l.symbol} ${l.text}`).join("\n");

  return {
    rawHcl,
    lines,
  };
}
