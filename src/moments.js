/**
 * Moments Module — Ball Hockey Formations Tool
 *
 * Handles the moments selector dropdown, save, and delete functionality.
 * Wires predefined + user-saved moments, power play/penalty kill auto-overlay,
 * and persistence via StorageAdapter.
 */

import { getPredefinedMoments } from "./data.js";
import { applyMoment, addSavedMoment, deleteSavedMoment, validateSaveName } from "./state.js";
import { KEYS, StorageQuotaExceededError } from "./storage.js";

/**
 * Populates the moment-select dropdown with predefined and user-saved moments.
 * @param {HTMLSelectElement} selectEl
 * @param {AppState} state
 */
function populateMomentDropdown(selectEl, state) {
  selectEl.innerHTML = "";

  // Default empty option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "— Select Moment —";
  selectEl.appendChild(defaultOption);

  // Predefined moments for the current format
  const predefined = getPredefinedMoments(state.format);
  if (predefined.length > 0) {
    const predefinedGroup = document.createElement("optgroup");
    predefinedGroup.label = "Predefined";
    for (const moment of predefined) {
      const option = document.createElement("option");
      option.value = moment.id;
      option.textContent = moment.name;
      predefinedGroup.appendChild(option);
    }
    selectEl.appendChild(predefinedGroup);
  }

  // User-saved moments for the current format
  const userMoments = state.savedMoments.filter((m) => m.format === state.format);
  if (userMoments.length > 0) {
    const userGroup = document.createElement("optgroup");
    userGroup.label = "Saved";
    for (const moment of userMoments) {
      const option = document.createElement("option");
      option.value = moment.id;
      option.textContent = moment.name;
      userGroup.appendChild(option);
    }
    selectEl.appendChild(userGroup);
  }

  // Set selected value if a moment is active
  if (state.activeMomentKey) {
    selectEl.value = state.activeMomentKey;
  }
}

/**
 * Finds a moment by id from predefined moments and user-saved moments.
 * @param {string} momentId
 * @param {AppState} state
 * @returns {object|undefined}
 */
function findMomentById(momentId, state) {
  // Check predefined moments
  const predefined = getPredefinedMoments(state.format);
  const found = predefined.find((m) => m.id === momentId);
  if (found) return found;

  // Check user-saved moments
  return state.savedMoments.find((m) => m.id === momentId);
}

/**
 * Initializes the moments selector dropdown.
 * On change: applies the selected moment, re-renders the rink.
 * Power play/penalty kill moments auto-enable opponent overlay.
 *
 * @param {HTMLElement} svgEl - The SVG rink element (unused here but kept for API consistency)
 * @param {() => AppState} getState - Returns current state
 * @param {(state: AppState) => void} setState - Sets new state
 * @param {() => void} renderAll - Re-renders the entire rink
 */
export function initMomentsSelector(svgEl, getState, setState, renderAll) {
  const selectEl = document.getElementById("moment-select");
  if (!selectEl) return;

  // Initial population
  populateMomentDropdown(selectEl, getState());

  const saveBtn = document.getElementById("moment-save-btn");
  const deleteBtn = document.getElementById("moment-delete-btn");

  function updateButtonVisibility(momentId) {
    const show = momentId && momentId !== "";
    if (saveBtn) saveBtn.style.display = show ? "" : "none";
    if (deleteBtn) deleteBtn.style.display = show ? "" : "none";
  }

  selectEl.addEventListener("change", (e) => {
    const momentId = e.target.value;
    updateButtonVisibility(momentId);
    if (!momentId) return;

    const state = getState();
    const moment = findMomentById(momentId, state);
    if (!moment) return;

    const newState = applyMoment(state, moment);
    setState(newState);
    renderAll();
  });
}

/**
 * Refreshes the moments dropdown with current state.
 * Call this after save/delete operations or format changes.
 * @param {() => AppState} getState
 */
export function refreshMomentsDropdown(getState) {
  const selectEl = document.getElementById("moment-select");
  if (!selectEl) return;
  populateMomentDropdown(selectEl, getState());
}

/**
 * Initializes moment save and delete buttons.
 *
 * Save:
 * - Prompts for name, validates, checks for case-insensitive conflicts,
 *   offers overwrite on conflict, persists via StorageAdapter.
 *
 * Delete:
 * - Only works for user-saved moments (not predefined).
 * - Confirms before deleting, persists the change.
 *
 * @param {() => AppState} getState - Returns current state
 * @param {(state: AppState) => void} setState - Sets new state
 * @param {import("./storage.js").StorageAdapter} storage - Storage adapter instance
 * @param {Function} notifyFn - showNotification function
 * @param {Function} confirmFn - showConfirmDialog function
 */
export function initMomentSaveDelete(getState, setState, storage, notifyFn, confirmFn) {
  const saveBtn = document.getElementById("moment-save-btn");
  const deleteBtn = document.getElementById("moment-delete-btn");
  const selectEl = document.getElementById("moment-select");

  // ─── Save Button ──────────────────────────────────────────────────────────

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const name = window.prompt("Enter a name for this moment:");
      if (name === null) return; // User cancelled

      // Validate name
      const validation = validateSaveName(name);
      if (!validation.valid) {
        notifyFn(validation.reason, "error", 5000);
        return;
      }

      const trimmedName = validation.name;
      const state = getState();

      // Check for case-insensitive conflict with existing saved moments
      const existingIndex = state.savedMoments.findIndex(
        (m) => m.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (existingIndex !== -1) {
        const overwrite = await confirmFn(
          `A saved moment named "${state.savedMoments[existingIndex].name}" already exists. Overwrite it?`
        );
        if (!overwrite) return;

        // Remove the existing moment before saving the new one
        const stateAfterDelete = deleteSavedMoment(state, state.savedMoments[existingIndex].id);
        setState(stateAfterDelete);
      }

      // Build the moment object
      const momentObj = {
        id: `user-${Date.now()}`,
        name: trimmedName,
        isPredefined: false,
        format: getState().format,
        ownPositions: getState().ownTokens.map((t) => ({
          label: t.label,
          nx: t.nx,
          ny: t.ny,
        })),
        opponentPositions: getState().opponentOverlayEnabled
          ? getState().opponentTokens.map((t) => ({
              label: t.label,
              nx: t.nx,
              ny: t.ny,
            }))
          : null,
        ballPosition: { nx: getState().ball.nx, ny: getState().ball.ny },
        savedAt: new Date().toISOString(),
      };

      // Add to state
      const updatedState = addSavedMoment(getState(), momentObj);
      setState(updatedState);

      // Persist
      try {
        storage.write(KEYS.savedMoments, updatedState.savedMoments);
      } catch (e) {
        if (e instanceof StorageQuotaExceededError) {
          notifyFn("Save failed: storage quota exceeded.", "error", 5000);
        }
      }

      // Refresh dropdown
      refreshMomentsDropdown(getState);
      notifyFn(`Moment "${trimmedName}" saved.`, "info", 3000);
    });
  }

  // ─── Delete Button ────────────────────────────────────────────────────────

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!selectEl) return;

      const selectedId = selectEl.value;
      if (!selectedId) {
        notifyFn("No moment selected to delete.", "warning", 3000);
        return;
      }

      const state = getState();

      // Check if it's a predefined moment
      const predefined = getPredefinedMoments(state.format);
      const isPredefined = predefined.some((m) => m.id === selectedId);
      if (isPredefined) {
        notifyFn("Predefined moments cannot be deleted.", "warning", 3000);
        return;
      }

      // Check if it's a user-saved moment
      const userMoment = state.savedMoments.find((m) => m.id === selectedId);
      if (!userMoment) {
        notifyFn("Selected moment not found in saved moments.", "warning", 3000);
        return;
      }

      // Confirm deletion
      const confirmed = await confirmFn(
        `Delete saved moment "${userMoment.name}"? This cannot be undone.`
      );
      if (!confirmed) return;

      // Delete from state
      const updatedState = deleteSavedMoment(state, selectedId);
      setState(updatedState);

      // Persist
      try {
        storage.write(KEYS.savedMoments, updatedState.savedMoments);
      } catch (e) {
        if (e instanceof StorageQuotaExceededError) {
          notifyFn("Save failed: storage quota exceeded.", "error", 5000);
        }
      }

      // Refresh dropdown
      refreshMomentsDropdown(getState);
      notifyFn(`Moment "${userMoment.name}" deleted.`, "info", 3000);
    });
  }
}
