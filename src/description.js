/**
 * Description Panel — Ball Hockey Formations Tool
 *
 * Handles token click → show position description panel behavior.
 * Distinguishes click from drag (movement < 5px threshold).
 * Exports initDescriptionPanel for controller bootstrap.
 */

import { getDescriptionById } from "./data.js";
import { setSelectedToken } from "./state.js";

/**
 * Initializes the description panel behavior.
 * On token click (not drag, not draw mode):
 *   - Looks up position description
 *   - Populates the panel elements
 *   - Shows the panel
 * On close button or outside click:
 *   - Hides the panel
 *   - Clears selectedTokenId
 *
 * @param {SVGElement} svgEl - The root SVG rink element
 * @param {() => object} getState - Returns current app state
 * @param {(newState: object) => void} setState - Updates the app state
 */
export function initDescriptionPanel(svgEl, getState, setState) {
  const panel = document.getElementById("description-panel");
  const titleEl = document.getElementById("description-title");
  const roleEl = document.getElementById("description-role");
  const attributesEl = document.getElementById("description-attributes");
  const responsibilitiesEl = document.getElementById("description-responsibilities");
  const closeBtn = document.getElementById("description-close-btn");

  if (!panel || !titleEl || !roleEl || !attributesEl || !responsibilitiesEl || !closeBtn) {
    return;
  }

  // Track pointer start position to distinguish click from drag
  let pointerStartX = null;
  let pointerStartY = null;
  let pointerTokenId = null;

  /**
   * Shows the description panel for a given token.
   * @param {string} tokenId - The token id (e.g. "own-0")
   */
  function showDescription(tokenId) {
    const currentState = getState();

    // Find the token in own or opponent tokens
    const token =
      currentState.ownTokens.find((t) => t.id === tokenId) ||
      currentState.opponentTokens.find((t) => t.id === tokenId);

    if (!token) return;

    // Look up description by formationKey
    const description = getDescriptionById(token.formationKey);
    if (!description) return;

    // Populate panel elements
    titleEl.textContent = description.positionName;
    roleEl.textContent = description.roleDescription;

    // Render key attributes as tag elements
    attributesEl.innerHTML = "";
    for (const attr of description.keyAttributes) {
      const tag = document.createElement("span");
      tag.className = "attribute-tag";
      tag.textContent = attr;
      attributesEl.appendChild(tag);
    }

    responsibilitiesEl.textContent = description.responsibilities;

    // Update state with selected token
    setState(setSelectedToken(currentState, tokenId));

    // Show panel
    panel.classList.add("visible");
  }

  /**
   * Hides the description panel and clears selection.
   */
  function hideDescription() {
    panel.classList.remove("visible");
    const currentState = getState();
    setState(setSelectedToken(currentState, null));
  }

  // ─── Pointer events on tokens layer ──────────────────────────────────────────

  svgEl.addEventListener("pointerdown", (e) => {
    // Find the token group from the event target
    const tokenGroup = e.target.closest("[data-token-id]");
    if (!tokenGroup) {
      pointerTokenId = null;
      return;
    }

    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    pointerTokenId = tokenGroup.getAttribute("data-token-id");
  });

  svgEl.addEventListener("pointerup", (e) => {
    if (pointerTokenId === null || pointerStartX === null) {
      pointerTokenId = null;
      return;
    }

    const currentState = getState();

    // Don't show description in draw mode
    if (currentState.drawMode) {
      pointerTokenId = null;
      pointerStartX = null;
      pointerStartY = null;
      return;
    }

    // Calculate movement distance
    const dx = e.clientX - pointerStartX;
    const dy = e.clientY - pointerStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only treat as click if movement was < 5px
    if (distance < 5) {
      showDescription(pointerTokenId);
    }

    // Reset tracking
    pointerTokenId = null;
    pointerStartX = null;
    pointerStartY = null;
  });

  // ─── Close button ─────────────────────────────────────────────────────────────

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    hideDescription();
  });

  // ─── Click outside panel to dismiss ───────────────────────────────────────────

  document.addEventListener("pointerdown", (e) => {
    if (!panel.classList.contains("visible")) return;

    // Check if the click is outside the panel and not on a token
    const isInsidePanel = panel.contains(e.target);
    const isOnToken = e.target.closest("[data-token-id]");

    if (!isInsidePanel && !isOnToken) {
      hideDescription();
    }
  });
}
