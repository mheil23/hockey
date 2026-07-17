/**
 * Opponent Overlay Controls — Ball Hockey Formations Tool
 *
 * Manages the opponent toggle button and opponent formation dropdown.
 * Remembers the last selected opponent formation per format for re-enable.
 */

import { getFormationsForFormat } from "./data.js";
import { setOpponentOverlay, setOpponentFormation } from "./state.js";

/**
 * Tracks the last opponent formation selected per format.
 * Used to restore the formation when re-enabling the overlay.
 * @type {{ "4v4": string|null, "5v5": string|null, "6v6": string|null }}
 */
const lastOpponentFormation = {
  "4v4": null,
  "5v5": null,
  "6v6": null,
};

/**
 * Populates the opponent formation dropdown with formations for the given format.
 * @param {HTMLSelectElement} selectEl
 * @param {string} format
 */
function populateOpponentFormations(selectEl, format) {
  const formations = getFormationsForFormat(format);

  // Clear existing options
  selectEl.innerHTML = "";

  // Add placeholder option
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "— Opponent —";
  selectEl.appendChild(placeholder);

  // Add formation options
  for (const formation of formations) {
    const option = document.createElement("option");
    option.value = formation.id;
    option.textContent = formation.name;
    selectEl.appendChild(option);
  }
}

/**
 * Updates the UI to reflect the current opponent overlay state.
 * @param {HTMLButtonElement} toggleBtn
 * @param {HTMLSelectElement} selectEl
 * @param {boolean} enabled
 * @param {string|null} formationKey
 */
function updateOpponentUI(toggleBtn, selectEl, enabled, formationKey) {
  toggleBtn.setAttribute("aria-pressed", String(enabled));
  selectEl.disabled = !enabled;

  if (enabled && formationKey) {
    selectEl.value = formationKey;
  } else if (!enabled) {
    selectEl.value = "";
  }
}

/**
 * Initializes the opponent overlay controls.
 * Wires up the toggle button and opponent formation dropdown.
 *
 * @param {function} getState - Returns the current application state
 * @param {function} setState - Updates the application state
 * @param {function} render - Re-renders the rink (tokens, etc.)
 */
export function initOpponentOverlay(getState, setState, render) {
  const toggleBtn = document.querySelector("#opponent-toggle");

  if (!toggleBtn) return;

  // Toggle button click handler
  toggleBtn.addEventListener("click", () => {
    const currentState = getState();
    const isEnabled = currentState.opponentOverlayEnabled;

    if (isEnabled) {
      // Disable overlay
      const newState = setOpponentOverlay(currentState, false);
      setState(newState);
      toggleBtn.setAttribute("aria-pressed", "false");
    } else {
      // Enable overlay: use last remembered formation for this format
      const remembered = lastOpponentFormation[currentState.format];
      const newState = setOpponentOverlay(currentState, true, remembered);
      setState(newState);
      toggleBtn.setAttribute("aria-pressed", "true");
    }

    render();
  });
}

/**
 * Called when the format changes to update opponent overlay UI.
 * Repopulates the opponent formation dropdown and resets the UI to disabled state
 * (since setFormat already disables the overlay in state).
 *
 * @param {string} format - The new format
 */
export function onFormatChange(format) {
  const toggleBtn = document.querySelector("#opponent-toggle");
  const selectEl = document.querySelector("#opponent-formation-select");

  if (!toggleBtn || !selectEl) return;

  populateOpponentFormations(selectEl, format);
  updateOpponentUI(toggleBtn, selectEl, false, null);
}

/**
 * Returns the last remembered opponent formation for a given format.
 * Useful for external modules that need to check this state.
 * @param {string} format
 * @returns {string|null}
 */
export function getLastOpponentFormation(format) {
  return lastOpponentFormation[format] || null;
}

/**
 * Sets the last remembered opponent formation for a given format.
 * Used when restoring state from persistence.
 * @param {string} format
 * @param {string|null} formationKey
 */
export function setLastOpponentFormation(format, formationKey) {
  if (format in lastOpponentFormation) {
    lastOpponentFormation[format] = formationKey;
  }
}
