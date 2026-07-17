/**
 * Reset & Export — Ball Hockey Formations Tool
 *
 * Handles the reset action (with confirmation dialog) and PNG export.
 */

import { applyMoment, clearArrows, setOpponentOverlay, setOpponentFormation } from "./state.js";
import { getFormationById } from "./data.js";

/**
 * Generates the export filename based on current state.
 * Format: ballhockey-{system-name}-{YYYY-MM-DD}.png
 * @param {AppState} state
 * @returns {string}
 */
export function generateExportFilename(state) {
  // Determine system name
  let systemName = state.activeFormationName || state.activeMomentKey || "custom";
  // Lowercase, replace spaces with hyphens
  systemName = systemName.toLowerCase().replace(/\s+/g, "-");

  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  return `ballhockey-${systemName}-${dateStr}.png`;
}

/**
 * Initializes the reset button handler.
 * On click: shows confirmation dialog, and if confirmed, resets the rink
 * to formation/moment defaults and clears arrows.
 *
 * @param {function} getState - Returns the current application state
 * @param {function} setState - Updates the application state
 * @param {function} render - Re-renders the full rink
 * @param {function} showConfirmDialog - Shows a confirmation dialog, returns Promise<boolean>
 */
export function initResetHandler(getState, setState, render, showConfirmDialog) {
  const resetBtn = document.getElementById("reset-btn");
  if (!resetBtn) return;

  resetBtn.addEventListener("click", async () => {
    const confirmed = await showConfirmDialog(
      "Reset all positions to defaults? This will clear all arrows and undo any manual adjustments."
    );

    if (!confirmed) return;

    let state = getState();

    // If there's an active moment snapshot, re-apply that moment
    if (state.activeMomentSnapshot && state.activeMomentKey) {
      state = applyMoment(state, state.activeMomentSnapshot);
    } else {
      // Otherwise re-apply the current formation from data
      const formation = getFormationById(state.activeFormationKey);
      if (formation) {
        const ownTokens = formation.positions.map((pos, index) => ({
          id: `own-${index}`,
          team: "own",
          label: pos.label,
          nx: pos.nx,
          ny: pos.ny,
          formationKey: pos.key,
        }));
        state = { ...state, ownTokens };
      }
      // Reset ball to center
      state = { ...state, ball: { nx: 0.5, ny: 0.5 } };
    }

    // Clear all arrows
    state = clearArrows(state);

    // If opponent overlay is active, re-apply the opponent formation with mirrored defaults
    if (state.opponentOverlayEnabled && state.opponentFormationKey) {
      state = setOpponentFormation(state, state.opponentFormationKey);
    } else if (state.opponentOverlayEnabled) {
      // Re-apply default opponent overlay
      state = setOpponentOverlay(state, true);
    }

    setState(state);
    render();
  });
}

/**
 * Initializes the export button handler.
 * On click: serializes SVG → canvas → PNG blob → triggers download.
 *
 * @param {function} getState - Returns the current application state
 * @param {SVGElement} svgEl - The rink SVG element
 * @param {function} showNotification - Shows a notification message
 */
export function initExportHandler(getState, svgEl, showNotification) {
  const exportBtn = document.getElementById("export-btn");
  if (!exportBtn) return;

  exportBtn.addEventListener("click", async () => {
    try {
      const state = getState();

      // Serialize the SVG to an XML string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgEl);

      // Create a Blob from the SVG string
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      // Load SVG into an Image
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      // Determine canvas dimensions (min 1200px on longest dimension)
      const svgWidth = svgEl.viewBox.baseVal.width || 44;
      const svgHeight = svgEl.viewBox.baseVal.height || 103;
      const aspectRatio = svgWidth / svgHeight;

      let canvasWidth, canvasHeight;
      if (svgHeight >= svgWidth) {
        // Height is longest dimension
        canvasHeight = Math.max(1200, svgHeight);
        canvasWidth = Math.round(canvasHeight * aspectRatio);
      } else {
        canvasWidth = Math.max(1200, svgWidth);
        canvasHeight = Math.round(canvasWidth / aspectRatio);
      }

      // Draw onto canvas
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      // Clean up the object URL
      URL.revokeObjectURL(url);

      // Convert to PNG blob and trigger download
      canvas.toBlob((blob) => {
        if (!blob) {
          showNotification("Export failed. Please try again.", "error");
          return;
        }

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = generateExportFilename(state);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }, "image/png");
    } catch (err) {
      showNotification("Export failed. Please try again.", "error");
    }
  });
}
