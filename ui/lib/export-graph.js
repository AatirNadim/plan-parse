import C2S from "./canvas2svg";

/**
 * Buffer Cytoscape graph rendering onto a Canvas2Svg vector mock context.
 * Temporarily disables renderer.usePaths to intercept all vector drawing operations
 * directly into SVG tags (<path>, <rect>, <text>), generating pure vector SVG.
 */
export function bufferCanvasSvg(options = {}, cy) {
  if (!cy) return "";

  const renderer = cy.renderer();
  if (!renderer) return "";

  const eles = cy.mutableElements();
  if (!eles || eles.length === 0) {
    const bg = options.bg !== undefined ? options.bg : "#090d16";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="${bg}"/></svg>`;
  }

  // Temporarily disable usePaths so Cytoscape draws via canvas primitive methods (moveTo, lineTo, arc, etc.)
  // rather than opaque native Path2D objects
  const prevUsePaths = renderer.usePaths;
  renderer.usePaths = () => false;

  // Flush path cache so elements don't reuse cached Path2D objects
  cy.elements().forEach((ele) => {
    if (ele._private && ele._private.rscratch) {
      ele._private.rscratch.pathCacheKey = null;
      ele._private.rscratch.pathCache = null;
    }
  });

  try {
    const bb = eles.boundingBox();

    // Handle degenerate bounding boxes gracefully
    const rawW = bb && bb.w > 0 ? bb.w : 800;
    const rawH = bb && bb.h > 0 ? bb.h : 600;
    const rawX1 = bb && !isNaN(bb.x1) ? bb.x1 : 0;
    const rawY1 = bb && !isNaN(bb.y1) ? bb.y1 : 0;

    const padding = typeof options.padding === "number" ? options.padding : 50;
    const scale = typeof options.scale === "number" && options.scale > 0 ? options.scale : 1;
    const bg = options.bg !== undefined ? options.bg : "#090d16";

    const isFull = options.full !== false;

    let width, height;
    if (isFull) {
      width = Math.ceil(rawW * scale + padding * 2 * scale);
      height = Math.ceil(rawH * scale + padding * 2 * scale);
    } else {
      const ctrRect = renderer.findContainerClientCoords
        ? renderer.findContainerClientCoords()
        : [0, 0, 800, 600];
      width = Math.ceil((ctrRect[2] || 800) * scale);
      height = Math.ceil((ctrRect[3] || 600) * scale);
    }

    width = Math.max(width, 100);
    height = Math.max(height, 100);

    const buffCanvas = new C2S({
      width: width,
      height: height,
      document: typeof document !== "undefined" ? document : undefined,
    });

    buffCanvas.clearRect(0, 0, width, height);

    // Draw dark theme background rectangle first if requested
    if (bg && bg !== "transparent") {
      buffCanvas.fillStyle = bg;
      buffCanvas.fillRect(0, 0, width, height);
    }

    const zsortedEles = renderer.getCachedZSortedEles
      ? renderer.getCachedZSortedEles()
      : (renderer.getIndexedElements ? renderer.getIndexedElements() : eles);

    if (isFull) {
      // Translate so diagram content starts with designated padding
      buffCanvas.translate(-rawX1 * scale + padding * scale, -rawY1 * scale + padding * scale);
      buffCanvas.scale(scale, scale);

      renderer.drawElements(buffCanvas, zsortedEles);

      buffCanvas.scale(1 / scale, 1 / scale);
      buffCanvas.translate(rawX1 * scale - padding * scale, rawY1 * scale - padding * scale);
    } else {
      const pan = cy.pan();
      const zoom = cy.zoom();
      const viewScale = scale * zoom;
      const translation = {
        x: (pan.x || 0) * scale,
        y: (pan.y || 0) * scale,
      };

      buffCanvas.translate(translation.x, translation.y);
      buffCanvas.scale(viewScale, viewScale);

      renderer.drawElements(buffCanvas, zsortedEles);

      buffCanvas.scale(1 / viewScale, 1 / viewScale);
      buffCanvas.translate(-translation.x, -translation.y);
    }

    return buffCanvas.getSerializedSvg(true);
  } finally {
    // Restore renderer usePaths and flush path cache
    renderer.usePaths = prevUsePaths;
    cy.elements().forEach((ele) => {
      if (ele._private && ele._private.rscratch) {
        ele._private.rscratch.pathCacheKey = null;
        ele._private.rscratch.pathCache = null;
      }
    });
  }
}

/**
 * Register `cy.svg(options)` extension on Cytoscape.
 */
export function registerSvgExtension(cytoscape) {
  if (!cytoscape) return;
  try {
    cytoscape("core", "svg", function (options) {
      return bufferCanvasSvg(options || {}, this);
    });
  } catch (err) {
    console.warn("registerSvgExtension:", err);
  }
}

/**
 * Compute optimal, safe PNG scale factor based on diagram bounding box.
 * Targets 2x-3x Ultra-HD for small/medium graphs, clamped dynamically
 * so max canvas dimension does not exceed safe browser limit (8192px).
 */
export function getOptimalPngScale(cy, requestedScale = "auto") {
  const MAX_CANVAS_DIM = 8192;
  const MIN_SCALE = 0.5;

  let targetScale = 3;
  if (typeof requestedScale === "number" && requestedScale > 0) {
    targetScale = requestedScale;
  } else if (requestedScale === "3x") {
    targetScale = 3;
  } else if (requestedScale === "2x") {
    targetScale = 2;
  } else if (requestedScale === "1x") {
    targetScale = 1;
  } else {
    // "auto": target 3x Ultra-HD for small/medium graphs
    targetScale = 3;
  }

  if (!cy) return targetScale;

  try {
    const eles = cy.mutableElements();
    const bb = eles.boundingBox();
    const maxGraphDim = Math.max(bb.w || 100, bb.h || 100);

    if (maxGraphDim * targetScale > MAX_CANVAS_DIM) {
      const clamped = MAX_CANVAS_DIM / maxGraphDim;
      return Math.max(MIN_SCALE, Math.floor(clamped * 100) / 100);
    }
    return targetScale;
  } catch (err) {
    return targetScale;
  }
}

/**
 * Helper to trigger browser file download for a given Blob.
 */
export function downloadBlob(blob, filename) {
  if (typeof window === "undefined" || !blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Convert base64 data URI to Blob.
 */
function dataUriToBlob(dataUri) {
  const parts = dataUri.split(",");
  const byteString = atob(parts[1] || parts[0]);
  const mimeString = (parts[0].match(/:(.*?);/) || [])[1] || "image/png";
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

/**
 * Export graph as vector SVG document and trigger download.
 */
export async function exportGraphToSvg(cy, options = {}) {
  if (!cy) throw new Error("Cytoscape instance not available");

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = options.filename || `terraform-dag-${timestamp}.svg`;

  let svgContent = "";
  if (typeof cy.svg === "function") {
    svgContent = cy.svg({
      full: true,
      bg: options.bg || "#090d16",
      padding: typeof options.padding === "number" ? options.padding : 50,
      scale: options.scale || 1,
      ...options,
    });
  } else {
    svgContent = bufferCanvasSvg(
      {
        full: true,
        bg: options.bg || "#090d16",
        padding: typeof options.padding === "number" ? options.padding : 50,
        scale: options.scale || 1,
        ...options,
      },
      cy
    );
  }

  if (!svgContent) {
    throw new Error("Failed to generate SVG diagram content");
  }

  // Prepend XML declaration if not present
  if (!svgContent.startsWith("<?xml")) {
    svgContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgContent;
  }

  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, filename);
  return { filename, blob, svgContent };
}

/**
 * Export graph as high-resolution PNG image and trigger download.
 */
export async function exportGraphToPng(cy, options = {}) {
  if (!cy) throw new Error("Cytoscape instance not available");

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = options.filename || `terraform-dag-${timestamp}.png`;

  const scale =
    options.scale !== undefined
      ? typeof options.scale === "number"
        ? options.scale
        : getOptimalPngScale(cy, options.scale)
      : getOptimalPngScale(cy, "auto");

  const bg = options.bg || "#090d16";

  let blob = null;

  try {
    const pngResult = cy.png({
      full: true,
      scale: scale,
      bg: bg,
      output: "blob-promise",
    });

    if (pngResult && typeof pngResult.then === "function") {
      blob = await pngResult;
    } else if (pngResult instanceof Blob) {
      blob = pngResult;
    }
  } catch (err) {
    console.warn("cy.png blob-promise export failed, falling back to base64uri:", err);
  }

  if (!blob) {
    const dataUri = cy.png({
      full: true,
      scale: scale,
      bg: bg,
      output: "base64uri",
    });

    if (!dataUri) {
      throw new Error("Failed to generate PNG image data");
    }

    blob = dataUriToBlob(dataUri);
  }

  if (!blob) {
    throw new Error("Failed to construct PNG blob");
  }

  downloadBlob(blob, filename);
  return { filename, blob, scale };
}
