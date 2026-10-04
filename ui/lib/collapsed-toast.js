/**
 * Collapsed DAG notification toast specification, text constants, and display predicates.
 */

export const COLLAPSED_TOAST_LINE_1 = "the graph is collapsed by default, you can toggle it here";
export const COLLAPSED_TOAST_LINE_2 = "and you can pass the cli option collapsed as false";
export const COLLAPSED_TOAST_PREFIX = "the graph is collapsed by default, you can toggle it ";
export const COLLAPSED_TOAST_ACTION = "here";
export const COLLAPSED_TOAST_DISMISS = "×";
export const COLLAPSED_TOAST_TEXT = `${COLLAPSED_TOAST_LINE_1}\n${COLLAPSED_TOAST_LINE_2}`;
export const COLLAPSED_CLI_COMMAND = "./plan-parse -collapsed=false ./plan.json";

/**
 * Generates the copyable CLI command to launch plan-parse uncollapsed.
 *
 * @param {string} [planName] - Optional plan filename or path
 * @returns {string} CLI command string
 */
export function getCollapsedCliCommand(planName) {
  if (
    !planName ||
    typeof planName !== "string" ||
    planName.trim() === "" ||
    planName.trim() === "CLI Session Plan"
  ) {
    return COLLAPSED_CLI_COMMAND;
  }
  const trimmed = planName.trim();
  let cleanPlanName =
    trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.startsWith("/")
      ? trimmed
      : `./${trimmed}`;
  if (cleanPlanName.includes(" ") && !cleanPlanName.startsWith('"') && !cleanPlanName.startsWith("'")) {
    cleanPlanName = `"${cleanPlanName}"`;
  }
  return `./plan-parse -collapsed=false ${cleanPlanName}`;
}

/**
 * Determines whether the collapsed notification toast should be visible.
 *
 * Rules:
 * - Only visible when CLI option collapsed is true.
 * - Only visible when current graph is collapsed (isCollapsed is true).
 * - Only visible when a graph is loaded (hasGraph is true).
 * - Hidden if dismissed by user (isDismissed is true).
 * - Hidden when graph is uncollapsed (e.g. user toggles it off via 'here', header button, or key 'C').
 * - Hidden if CLI option collapsed was false.
 *
 * @param {Object} params
 * @param {boolean} [params.cliOptionCollapsed=true] - Whether CLI option started/specified collapsed
 * @param {boolean} [params.isCollapsed=true] - Whether view is currently collapsed
 * @param {boolean} [params.hasGraph=false] - Whether a graph is loaded
 * @param {boolean} [params.isDismissed=false] - Whether user has dismissed the toast
 * @returns {boolean}
 */
export function shouldShowCollapsedToast({
  cliOptionCollapsed = true,
  isCollapsed = true,
  hasGraph = false,
  isDismissed = false,
} = {}) {
  if (!cliOptionCollapsed) return false;
  if (!isCollapsed) return false;
  if (!hasGraph) return false;
  if (isDismissed) return false;
  return true;
}
