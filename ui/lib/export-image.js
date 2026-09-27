/**
 * export-image.js: High-resolution raster (PNG) and vector (SVG) export for Cytoscape DAG.
 * Uses native Cytoscape canvas renderer with adaptive scaling for PNG,
 * and the 'cytoscape-svg' package dependency for vector SVG generation.
 */

/**
 * Calculates optimal adaptive scale factor for PNG export based on graph bounding box.
 * Ensures small monospace labels remain sharp while staying safely within browser canvas limits.
 *
 * @param {object} cy - Cytoscape core instance
 * @param {number} targetScale - Desired high-DPI scaling factor (default: 2.5)
 * @param {number} maxCanvasDim - Safe canvas threshold (default: 8192px)
 * @returns {number} Clamped adaptive scale
 */
export function calculateAdaptiveScale(cy, targetScale = 2.5, maxCanvasDim = 8192) {
  if (!cy || cy.destroyed()) return 1;

  const bb = cy.elements().boundingBox();
  const maxGraphDim = Math.max(bb.w, bb.h, 1);
  const calculatedMaxScale = maxCanvasDim / maxGraphDim;
  const adaptiveScale = Math.max(1, Math.min(targetScale, calculatedMaxScale));

  return Number(adaptiveScale.toFixed(2));
}

/**
 * Sanitizes a plan name for file downloads.
 */
function sanitizeFileName(planName = "terraform-plan", extension = "png") {
  const base = (planName || "terraform-plan")
    .replace(/\.[^/.]+$/, "") // strip existing extension
    .replace(/[^a-z0-9_-]/gi, "_")
    .replace(/^_+|_+$/g, "") || "terraform-plan";

  return `${base}-graph.${extension}`;
}

/**
 * Triggers a client-side file download via an invisible anchor tag.
 */
function triggerDownload(urlOrBlob, filename) {
  let objectUrl = null;
  const link = document.createElement("a");
  link.download = filename;

  if (urlOrBlob instanceof Blob) {
    objectUrl = URL.createObjectURL(urlOrBlob);
    link.href = objectUrl;
  } else {
    link.href = urlOrBlob;
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (objectUrl) {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

/**
 * Dynamically loads and registers the cytoscape-svg plugin from the npm package dependency.
 */
export async function registerCytoscapeSvgPlugin(cytoscapeInstanceOrCore) {
  if (!cytoscapeInstanceOrCore) return;

  // Check if svg() is already registered
  if (
    typeof cytoscapeInstanceOrCore.svg === "function" ||
    (cytoscapeInstanceOrCore.prototype && typeof cytoscapeInstanceOrCore.prototype.svg === "function")
  ) {
    return;
  }

  if (typeof window === "undefined") return;

  try {
    const mod = await import("cytoscape-svg");
    const cytoscapeSvg = mod.default || mod;

    if (typeof cytoscapeSvg === "function") {
      const targetCore =
        typeof cytoscapeInstanceOrCore === "function"
          ? cytoscapeInstanceOrCore
          : window.cytoscape || cytoscapeInstanceOrCore.constructor;

      if (targetCore) {
        cytoscapeSvg(targetCore);
      }
    }
  } catch (err) {
    console.error("Failed to dynamically import 'cytoscape-svg':", err);
    throw err;
  }
}

/**
 * Exports the active Cytoscape graph visualization as a high-resolution PNG.
 *
 * @param {object} cy - Cytoscape core instance
 * @param {string} [planName] - Optional plan name for the exported filename
 * @param {object} [options] - Export options
 * @returns {Promise<{ success: boolean, scale?: number, filename?: string, error?: string }>}
 */
export async function exportGraphAsPng(cy, planName = "terraform-plan", options = {}) {
  if (!cy || cy.destroyed()) {
    return { success: false, error: "Graph instance is not available" };
  }

  if (cy.elements().length === 0) {
    return { success: false, error: "No graph elements present to export" };
  }

  try {
    // Wait for webfonts to settle
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 300)),
        ]);
      } catch (fontErr) {
        console.warn("Font readiness check warning:", fontErr);
      }
    }

    const targetScale = options.targetScale || 2.5;
    const maxCanvasDim = options.maxCanvasDim || 8192;
    const scale = calculateAdaptiveScale(cy, targetScale, maxCanvasDim);
    const bg = options.bg || "#090a0f";

    const dataUri = cy.png({
      output: "base64uri",
      bg: bg,
      full: true,
      scale: scale,
      maxWidth: maxCanvasDim,
      maxHeight: maxCanvasDim,
    });

    if (!dataUri || dataUri.length < 50) {
      throw new Error("Failed to generate PNG image data");
    }

    const filename = sanitizeFileName(planName, "png");
    triggerDownload(dataUri, filename);

    return { success: true, scale, filename };
  } catch (err) {
    console.error("Export PNG error:", err);
    return { success: false, error: err.message || "Failed to export PNG" };
  }
}

/**
 * Exports the active Cytoscape graph visualization as an SVG using the cytoscape-svg package.
 *
 * @param {object} cy - Cytoscape core instance
 * @param {string} [planName] - Optional plan name for the exported filename
 * @param {object} [options] - Export options
 * @returns {Promise<{ success: boolean, filename?: string, error?: string }>}
 */
export async function exportGraphAsSvg(cy, planName = "terraform-plan", options = {}) {
  if (!cy || cy.destroyed()) {
    return { success: false, error: "Graph instance is not available" };
  }

  if (cy.elements().length === 0) {
    return { success: false, error: "No graph elements present to export" };
  }

  try {
    // Ensure cytoscape-svg plugin is loaded from dependency
    await registerCytoscapeSvgPlugin(cy);

    if (typeof cy.svg !== "function") {
      throw new Error("cytoscape-svg extension could not be registered on Cytoscape instance");
    }

    // Wait for webfonts to settle
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 300)),
        ]);
      } catch (fontErr) {
        console.warn("Font readiness check warning:", fontErr);
      }
    }

    const bg = options.bg || "#090a0f";
    let svgContent = cy.svg({
      full: true,
      bg: bg,
      scale: options.scale || 1,
    });

    if (!svgContent) {
      throw new Error("cytoscape-svg returned empty SVG content");
    }

    if (!svgContent.startsWith("<?xml")) {
      svgContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgContent;
    }

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const filename = sanitizeFileName(planName, "svg");
    triggerDownload(blob, filename);

    return { success: true, filename };
  } catch (err) {
    console.error("Export SVG error:", err);
    return { success: false, error: err.message || "Failed to export SVG" };
  }
}

