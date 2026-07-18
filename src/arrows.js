/**
 * Arrow Draw Mode Controller — Ball Hockey Formations Tool
 *
 * Handles draw mode toggle, clear arrows, click-to-place arrow drawing,
 * and individual arrow selection/deletion.
 *
 * Draw mode uses click-to-start, click-to-end:
 *  1. First click sets the arrow start point
 *  2. Second click sets the arrow end point and creates the arrow
 *  3. Pressing Escape or toggling draw mode off cancels a pending arrow
 *
 * Clicking an existing arrow (when not in draw mode) selects it.
 * Pressing Delete/Backspace removes the selected arrow.
 */

import { toNormalized } from "./renderer.js";
import {
  addArrow,
  clearArrows,
  setDrawMode,
  setArrowStyle,
} from "./state.js";
import { renderArrows } from "./renderer.js";

// Rink geometry (must match renderer.js viewBox)
const RINK_WIDTH = 200;
const RINK_HEIGHT = 85;

// Minimum arrow length in normalized coords to avoid zero-length arrows
const MIN_ARROW_LENGTH = 0.02;

/**
 * Converts a pointer event's client coordinates to SVG viewBox coordinates.
 */
function clientToSVG(svgEl, e) {
  const ctm = svgEl.getScreenCTM();
  if (ctm) {
    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(ctm.inverse());
    if (svgPt.x >= -10 && svgPt.x <= RINK_WIDTH + 10 &&
        svgPt.y >= -10 && svgPt.y <= RINK_HEIGHT + 10) {
      return { x: svgPt.x, y: svgPt.y };
    }
  }

  // Fallback for CSS-rotated SVG
  const rect = svgEl.getBoundingClientRect();
  const viewBox = svgEl.viewBox && svgEl.viewBox.baseVal;
  const vbW = (viewBox && viewBox.width) || RINK_WIDTH;
  const vbH = (viewBox && viewBox.height) || RINK_HEIGHT;
  const x = (e.clientX - rect.left) * (vbW / rect.width);
  const y = (e.clientY - rect.top) * (vbH / rect.height);
  return { x, y };
}

/**
 * Finds a token element at the pointer event target.
 * Returns the token's normalized center coords if found.
 */
function findTokenAtTarget(target, state) {
  let el = target;
  while (el && el.nodeType === 1) {
    if (el.hasAttribute && el.hasAttribute("data-token-id")) {
      const tokenId = el.getAttribute("data-token-id");
      const allTokens = [...state.ownTokens, ...state.opponentTokens];
      const token = allTokens.find((t) => t.id === tokenId);
      if (token) {
        return { nx: token.nx, ny: token.ny };
      }
      return null;
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * Finds an arrow path element at the click target.
 * Returns the arrow id if found.
 */
function findArrowAtTarget(target) {
  let el = target;
  while (el && el.nodeType === 1) {
    if (el.hasAttribute && el.hasAttribute("data-arrow-id")) {
      return el.getAttribute("data-arrow-id");
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * Initializes draw mode controls and click-based arrow drawing.
 *
 * @param {SVGSVGElement} svgEl - The root SVG element
 * @param {() => object} getState - Function returning current app state
 * @param {(newState: object) => void} setState - Function to update app state
 */
export function initArrowMode(svgEl, getState, setState) {
  const drawToggleBtn = document.getElementById("draw-mode-toggle");
  const arrowStyleSelect = document.getElementById("arrow-style-select");
  const clearArrowsBtn = document.getElementById("clear-arrows-btn");

  let pendingStart = null; // { nx, ny } — first click recorded
  let selectedArrowId = null;

  function updateClearBtnVisibility() {
    if (clearArrowsBtn) {
      clearArrowsBtn.style.display = getState().arrows.length > 0 ? "" : "none";
    }
  }

  function highlightArrow(arrowId) {
    // Remove previous highlight
    const prev = svgEl.querySelector("#arrows-layer path.selected");
    if (prev) prev.classList.remove("selected");

    if (arrowId) {
      const path = svgEl.querySelector(`#arrows-layer path[data-arrow-id="${arrowId}"]`);
      if (path) {
        path.classList.add("selected");
        path.setAttribute("stroke", "#ff6600");
        path.setAttribute("stroke-width", "2.5");
      }
    }
    selectedArrowId = arrowId;
  }

  function deselectArrow() {
    if (selectedArrowId) {
      const path = svgEl.querySelector(`#arrows-layer path[data-arrow-id="${selectedArrowId}"]`);
      if (path) {
        path.classList.remove("selected");
        path.setAttribute("stroke", "#000000");
        path.setAttribute("stroke-width", "1.5");
      }
      selectedArrowId = null;
    }
  }

  function cancelPending() {
    pendingStart = null;
    // Remove any visual indicator of pending start
    const indicator = svgEl.querySelector("#arrow-start-indicator");
    if (indicator) indicator.remove();
  }

  function showStartIndicator(nx, ny) {
    // Remove existing
    const existing = svgEl.querySelector("#arrow-start-indicator");
    if (existing) existing.remove();

    const x = nx * RINK_WIDTH;
    const y = ny * RINK_HEIGHT;
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("id", "arrow-start-indicator");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "2");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "#ff6600");
    circle.setAttribute("stroke-width", "0.8");
    circle.setAttribute("stroke-dasharray", "2,1");
    const layer = svgEl.querySelector("#arrows-layer");
    if (layer) layer.appendChild(circle);
  }

  // --- Draw mode toggle ---
  if (drawToggleBtn) {
    drawToggleBtn.addEventListener("click", () => {
      const current = getState();
      const newState = setDrawMode(current, !current.drawMode);
      setState(newState);
      drawToggleBtn.setAttribute("aria-pressed", String(newState.drawMode));

      // Cancel any pending arrow when toggling off
      if (!newState.drawMode) {
        cancelPending();
        deselectArrow();
      }
    });
  }

  // --- Arrow style selector (kept for internal use, hidden from UI) ---
  if (arrowStyleSelect) {
    arrowStyleSelect.addEventListener("change", (e) => {
      const current = getState();
      const newState = setArrowStyle(current, e.target.value);
      setState(newState);
    });
  }

  // --- Clear arrows button ---
  if (clearArrowsBtn) {
    clearArrowsBtn.addEventListener("click", () => {
      const current = getState();
      const newState = clearArrows(current);
      setState(newState);
      renderArrows(svgEl, newState.arrows);
      clearArrowsBtn.style.display = "none";
      deselectArrow();
      cancelPending();
    });
  }

  // --- Click-based drawing and arrow selection ---
  svgEl.addEventListener("click", (e) => {
    const current = getState();

    if (current.drawMode) {
      // --- DRAW MODE: click-to-start, click-to-end ---
      deselectArrow();

      // Determine click position
      const tokenPos = findTokenAtTarget(e.target, current);
      let clickNx, clickNy;

      if (tokenPos) {
        clickNx = tokenPos.nx;
        clickNy = tokenPos.ny;
      } else {
        const svgPt = clientToSVG(svgEl, e);
        const norm = toNormalized(svgPt.x, svgPt.y, {
          width: RINK_WIDTH,
          height: RINK_HEIGHT,
        });
        clickNx = norm.nx;
        clickNy = norm.ny;
      }

      if (!pendingStart) {
        // First click — set start
        pendingStart = { nx: clickNx, ny: clickNy };
        showStartIndicator(clickNx, clickNy);
      } else {
        // Second click — create arrow
        const dx = clickNx - pendingStart.nx;
        const dy = clickNy - pendingStart.ny;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length >= MIN_ARROW_LENGTH) {
          const arrow = {
            id: `arrow-${Date.now()}-${Math.random()}`,
            startNx: pendingStart.nx,
            startNy: pendingStart.ny,
            endNx: clickNx,
            endNy: clickNy,
            style: current.arrowStyle,
          };

          const newState = addArrow(current, arrow);
          setState(newState);
          renderArrows(svgEl, newState.arrows);
          updateClearBtnVisibility();
        }

        cancelPending();
      }
    } else {
      // --- NOT IN DRAW MODE: check if clicking an arrow to select it ---
      const arrowId = findArrowAtTarget(e.target);
      if (arrowId) {
        if (selectedArrowId === arrowId) {
          deselectArrow();
        } else {
          deselectArrow();
          highlightArrow(arrowId);
        }
      } else {
        deselectArrow();
      }
    }
  });

  // --- Keyboard: Escape cancels pending, Delete/Backspace removes selected arrow ---
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      cancelPending();
      deselectArrow();
    }

    if ((e.key === "Delete" || e.key === "Backspace") && selectedArrowId) {
      // Don't delete if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
        return;
      }

      const current = getState();
      const newArrows = current.arrows.filter((a) => a.id !== selectedArrowId);
      const newState = { ...current, arrows: newArrows };
      setState(newState);
      renderArrows(svgEl, newState.arrows);
      updateClearBtnVisibility();
      selectedArrowId = null;
      e.preventDefault();
    }
  });
}
