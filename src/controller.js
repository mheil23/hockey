/**
 * Controller — Ball Hockey Formations Tool
 *
 * Event hub that handles user interactions, calls pure state mutations,
 * triggers re-renders, and manages persistence.
 */

import { createInitialState, setFormat } from "./state.js";
import { renderRink, renderTokens, renderBall, renderArrows } from "./renderer.js";
import { StorageAdapter, KEYS, StorageQuotaExceededError } from "./storage.js";
import { initDescriptionPanel } from "./description.js";
import { initMomentsSelector, initMomentSaveDelete, refreshMomentsDropdown } from "./moments.js";
import { initArrowMode } from "./arrows.js";
import { initResetHandler, initExportHandler } from "./reset-export.js";
import { initDragHandlers } from "./drag.js";
import { initOpponentOverlay, onFormatChange } from "./opponent.js";

// ─── Module-level state ─────────────────────────────────────────────────────────

/** @type {AppState} */
let state;

/** @type {StorageAdapter} */
let storage;

/** @type {SVGElement} */
let svgEl;

// ─── Notification System ────────────────────────────────────────────────────────

/**
 * Displays a notification banner to the user.
 * @param {string} message - The message to display
 * @param {"info"|"error"|"warning"} type - Notification type
 * @param {number} [duration=5000] - Duration in ms (0 = persistent until dismissed)
 */
export function showNotification(message, type = "info", duration = 5000) {
  const area = document.getElementById("notification-area");
  if (!area) return;

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.setAttribute("role", "alert");

  // Allow click to dismiss
  notification.addEventListener("click", () => notification.remove());

  area.appendChild(notification);

  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }
}

// ─── Confirmation Dialog ────────────────────────────────────────────────────────

/**
 * Shows a confirmation dialog and returns a promise that resolves to true/false.
 * Uses the <dialog> element (#confirm-dialog) if available, falls back to window.confirm.
 * @param {string} message - The message to display
 * @returns {Promise<boolean>}
 */
export function showConfirmDialog(message) {
  const dialog = document.getElementById("confirm-dialog");
  const messageEl = document.getElementById("confirm-dialog-message");
  const confirmBtn = document.getElementById("confirm-dialog-confirm");
  const cancelBtn = document.getElementById("confirm-dialog-cancel");

  if (!dialog || !messageEl || !confirmBtn || !cancelBtn) {
    return Promise.resolve(window.confirm(message));
  }

  messageEl.textContent = message;

  return new Promise((resolve) => {
    function cleanup() {
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      dialog.removeEventListener("close", onClose);
      dialog.close();
    }

    function onConfirm() {
      cleanup();
      resolve(true);
    }

    function onCancel() {
      cleanup();
      resolve(false);
    }

    function onClose() {
      cleanup();
      resolve(false);
    }

    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
    dialog.addEventListener("close", onClose);

    dialog.showModal();
  });
}

// ─── Safe Storage Write ─────────────────────────────────────────────────────────

/**
 * Writes to storage with error handling for quota exceeded.
 * @param {string} key
 * @param {*} value
 */
function safeStorageWrite(key, value) {
  try {
    storage.write(key, value);
  } catch (e) {
    if (e instanceof StorageQuotaExceededError) {
      showNotification("Save failed: storage quota exceeded.", "error", 5000);
    }
  }
}

// ─── Render Helpers ─────────────────────────────────────────────────────────────

/**
 * Re-renders the full rink: markings, arrows, tokens, and ball.
 */
function renderAll() {
  renderRink(svgEl, state.format);
  renderArrows(svgEl, state.arrows);
  renderTokens(svgEl, state.ownTokens, state.opponentTokens);
  renderBall(svgEl, state.ball);
}

// ─── Format Selector ────────────────────────────────────────────────────────────

/**
 * Initializes the format selector (#format-select).
 * On change: setFormat → re-render all → persist → update formation dropdown.
 */
function initFormatSelector() {
  const formatSelect = document.getElementById("format-select");
  if (!formatSelect) return;

  // Set initial value from state
  formatSelect.value = state.format;

  formatSelect.addEventListener("change", (e) => {
    const newFormat = e.target.value;
    state = setFormat(state, newFormat);
    renderAll();
    safeStorageWrite(KEYS.format, state.format);
    onFormatChange(newFormat);
    refreshMomentsDropdown(() => state);
  });
}

// ─── Bootstrap ──────────────────────────────────────────────────────────────────

/**
 * Entry point — loads persisted data, initializes state, triggers initial render,
 * sets up all event handlers.
 */
export function bootstrap() {
  // Get the SVG element
  svgEl = document.getElementById("rink");
  if (!svgEl) return;

  // Initialize storage
  storage = new StorageAdapter();

  // Load persisted data
  const persisted = storage.loadAll();

  // Determine initial format (persisted or default 6v6)
  const initialFormat = persisted.format || "6v6";

  // Create initial state
  state = createInitialState(initialFormat);

  // Restore saved moments if any
  if (persisted.savedMoments.length > 0) {
    state = { ...state, savedMoments: persisted.savedMoments };
  }

  // Show notification if storage is unavailable
  if (!storage.isAvailable()) {
    showNotification(
      "Storage unavailable. Your work will not be saved.",
      "warning",
      0
    );
  }

  // Show notification if some data was discarded
  if (persisted.discardedCount > 0) {
    showNotification(
      "Some saved data could not be loaded and was discarded.",
      "error",
      5000
    );
  }

  // Initial render
  renderAll();

  // Initialize event handlers
  initFormatSelector();
  initDescriptionPanel(svgEl, () => state, (newState) => { state = newState; });
  initMomentsSelector(svgEl, () => state, (newState) => { state = newState; }, renderAll);
  initMomentSaveDelete(() => state, (newState) => { state = newState; }, storage, showNotification, showConfirmDialog);
  initArrowMode(svgEl, () => state, (newState) => { state = newState; });
  initResetHandler(() => state, (newState) => { state = newState; }, renderAll, showConfirmDialog);
  initExportHandler(() => state, svgEl, showNotification);
  initDragHandlers(svgEl, () => state, (newState) => { state = newState; renderAll(); });
  initOpponentOverlay(() => state, (newState) => { state = newState; }, renderAll);
}

// Wire bootstrap to DOMContentLoaded
document.addEventListener("DOMContentLoaded", bootstrap);
