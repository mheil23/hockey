/**
 * State Model — Ball Hockey Formations Tool
 *
 * Pure state mutation functions. No side effects.
 * Every function returns a new state object (immutable).
 */

import { getFormationById, DEFAULT_FORMATION } from "./data.js";

/**
 * Builds own-team tokens from a formation's positions array.
 * @param {object} formation - A PresetFormation object
 * @returns {PositionToken[]}
 */
function buildOwnTokens(formation) {
  return formation.positions.map((pos, index) => ({
    id: `own-${index}`,
    team: "own",
    label: pos.label,
    nx: pos.nx,
    ny: pos.ny,
    formationKey: pos.key,
  }));
}

/**
 * Creates the initial application state for a given format.
 * Applies the default formation for the format.
 * @param {"4v4"|"5v5"|"6v6"} format
 * @returns {AppState}
 */
export function createInitialState(format) {
  const validFormats = ["4v4", "5v5", "6v6"];
  const safeFormat = validFormats.includes(format) ? format : "6v6";
  const defaultFormationId = DEFAULT_FORMATION[safeFormat];
  const formation = getFormationById(defaultFormationId);
  const ownTokens = buildOwnTokens(formation);

  return {
    format: safeFormat,
    activeFormationKey: formation.id,
    activeFormationName: formation.name,
    ownTokens,
    ball: { nx: 0.5, ny: 0.5 },
    opponentOverlayEnabled: false,
    opponentFormationKey: null,
    opponentTokens: [],
    selectedTokenId: null,
    savedMoments: [],
    activeMomentKey: null,
    activeMomentSnapshot: null,
    arrows: [],
    drawMode: false,
    arrowStyle: "solid",
  };
}

/**
 * Updates the format, applies the default formation for the new format,
 * resets ball to center, and disables opponent overlay.
 * @param {AppState} state
 * @param {"4v4"|"5v5"|"6v6"} format
 * @returns {AppState}
 */
export function setFormat(state, format) {
  const validFormats = ["4v4", "5v5", "6v6"];
  const safeFormat = validFormats.includes(format) ? format : "6v6";
  const defaultFormationId = DEFAULT_FORMATION[safeFormat];
  const formation = getFormationById(defaultFormationId);
  const ownTokens = buildOwnTokens(formation);

  return {
    ...state,
    format: safeFormat,
    activeFormationKey: formation.id,
    activeFormationName: formation.name,
    ownTokens,
    ball: { nx: 0.5, ny: 0.5 },
    opponentOverlayEnabled: false,
    opponentFormationKey: null,
    opponentTokens: [],
    selectedTokenId: null,
    activeMomentKey: null,
    activeMomentSnapshot: null,
    arrows: [],
  };
}

/**
 * Applies a situational moment to the state.
 * Sets own token positions, ball position, and optionally opponent positions.
 * Stores a deep-copied snapshot of the moment.
 * @param {AppState} state
 * @param {object} moment - A SituationalMoment object
 * @returns {AppState}
 */
export function applyMoment(state, moment) {
  const ownTokens = moment.ownPositions.map((pos, index) => ({
    id: `own-${index}`,
    team: "own",
    label: pos.label,
    nx: pos.nx,
    ny: pos.ny,
    formationKey: pos.label,
  }));

  const ball = { nx: moment.ballPosition.nx, ny: moment.ballPosition.ny };

  let opponentOverlayEnabled = state.opponentOverlayEnabled;
  let opponentTokens = state.opponentTokens;
  let opponentFormationKey = state.opponentFormationKey;

  if (moment.opponentPositions != null) {
    opponentOverlayEnabled = true;
    opponentTokens = moment.opponentPositions.map((pos, index) => ({
      id: `opp-${index}`,
      team: "opp",
      label: pos.label,
      nx: pos.nx,
      ny: pos.ny,
      formationKey: pos.label,
    }));
    opponentFormationKey = null;
  }

  const activeMomentSnapshot = JSON.parse(JSON.stringify(moment));

  return {
    ...state,
    ownTokens,
    ball,
    opponentOverlayEnabled,
    opponentTokens,
    opponentFormationKey,
    activeMomentKey: moment.id,
    activeMomentSnapshot,
  };
}

/**
 * Appends a saved moment to the savedMoments array (immutably).
 * @param {AppState} state
 * @param {object} moment - The moment to save
 * @returns {AppState}
 */
export function addSavedMoment(state, moment) {
  return {
    ...state,
    savedMoments: [...state.savedMoments, moment],
  };
}

/**
 * Removes a user-saved moment by id. Ignores predefined moments.
 * @param {AppState} state
 * @param {string} momentId - The id of the moment to delete
 * @returns {AppState}
 */
export function deleteSavedMoment(state, momentId) {
  const moment = state.savedMoments.find((m) => m.id === momentId);
  if (!moment || moment.isPredefined === true) {
    return state;
  }

  return {
    ...state,
    savedMoments: state.savedMoments.filter((m) => m.id !== momentId),
  };
}

/**
 * Validates a save name for a situational moment.
 * - Trims input
 * - Must be 1-50 characters after trimming
 * - Only alphanumeric, spaces, hyphens, and parentheses allowed
 * @param {string} name
 * @returns {{ valid: true, name: string } | { valid: false, reason: string }}
 */
export function validateSaveName(name) {
  const trimmed = (name || "").trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: "Name cannot be empty" };
  }

  if (trimmed.length > 50) {
    return { valid: false, reason: "Name must be 50 characters or fewer" };
  }

  const validPattern = /^[a-zA-Z0-9 \-()]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      reason:
        "Name can only contain letters, numbers, spaces, hyphens, and parentheses",
    };
  }

  return { valid: true, name: trimmed };
}

/**
 * Builds opponent-team tokens from a formation's positions array,
 * mirroring the ny coordinate vertically (ny = 1 - originalNy).
 * @param {object} formation - A PresetFormation object
 * @returns {PositionToken[]}
 */
function buildOpponentTokens(formation) {
  return formation.positions.map((pos, index) => ({
    id: `opp-${index}`,
    team: "opp",
    label: pos.label,
    nx: 1 - pos.nx,
    ny: pos.ny,
    formationKey: pos.key,
  }));
}

/**
 * Enables or disables the opponent overlay on the rink.
 * When enabling, uses the provided formationKey or the default formation
 * for the current format, and mirrors positions vertically.
 * When disabling, removes all opponent tokens.
 * @param {AppState} state
 * @param {boolean} enabled
 * @param {string} [formationKey] - formation id to use for opponent (optional when enabling)
 * @returns {AppState}
 */
export function setOpponentOverlay(state, enabled, formationKey) {
  if (!enabled) {
    return {
      ...state,
      opponentOverlayEnabled: false,
      opponentFormationKey: null,
      opponentTokens: [],
    };
  }

  const resolvedFormationKey =
    formationKey || DEFAULT_FORMATION[state.format];
  const formation = getFormationById(resolvedFormationKey);
  if (!formation) {
    return state;
  }

  const opponentTokens = buildOpponentTokens(formation);

  return {
    ...state,
    opponentOverlayEnabled: true,
    opponentFormationKey: formation.id,
    opponentTokens,
  };
}

/**
 * Applies a new formation to the opponent team with mirrored ny coordinates.
 * Only works when opponent overlay is enabled.
 * @param {AppState} state
 * @param {string} formationId
 * @returns {AppState}
 */
export function setOpponentFormation(state, formationId) {
  if (!state.opponentOverlayEnabled) {
    return state;
  }

  const formation = getFormationById(formationId);
  if (!formation) {
    return state;
  }

  const opponentTokens = buildOpponentTokens(formation);

  return {
    ...state,
    opponentFormationKey: formation.id,
    opponentTokens,
  };
}

/**
 * Updates an opponent token's position, clamping nx and ny to [0, 1].
 * @param {AppState} state
 * @param {string} tokenId
 * @param {number} nx
 * @param {number} ny
 * @returns {AppState}
 */
export function setOpponentTokenPosition(state, tokenId, nx, ny) {
  const clampedNx = Math.max(0, Math.min(1, nx));
  const clampedNy = Math.max(0, Math.min(1, ny));

  const index = state.opponentTokens.findIndex((t) => t.id === tokenId);
  if (index === -1) {
    return state;
  }

  const opponentTokens = state.opponentTokens.map((token) =>
    token.id === tokenId
      ? { ...token, nx: clampedNx, ny: clampedNy }
      : token
  );

  return {
    ...state,
    opponentTokens,
  };
}

/**
 * Adds an arrow to the state if the current count is below 50.
 * If 50 arrows already exist, returns state unchanged (silently rejects).
 * @param {AppState} state
 * @param {{ id: string, startNx: number, startNy: number, endNx: number, endNy: number, style: "solid"|"dashed" }} arrow
 * @returns {AppState}
 */
export function addArrow(state, arrow) {
  if (state.arrows.length >= 50) {
    return state;
  }
  return {
    ...state,
    arrows: [...state.arrows, arrow],
  };
}

/**
 * Removes all arrows from the state while preserving token and ball positions.
 * @param {AppState} state
 * @returns {AppState}
 */
export function clearArrows(state) {
  return {
    ...state,
    arrows: [],
  };
}

/**
 * Toggles draw mode on or off.
 * @param {AppState} state
 * @param {boolean} enabled
 * @returns {AppState}
 */
export function setDrawMode(state, enabled) {
  return {
    ...state,
    drawMode: enabled,
  };
}

/**
 * Sets the arrow style for newly drawn arrows.
 * @param {AppState} state
 * @param {"solid"|"dashed"} style
 * @returns {AppState}
 */
export function setArrowStyle(state, style) {
  return {
    ...state,
    arrowStyle: style,
  };
}

/**
 * Clamps a value to the [0, 1] range.
 * @param {number} value
 * @returns {number}
 */
function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

/**
 * Updates the position of a specific own-team token by its id.
 * Coordinates are clamped to [0, 1].
 * @param {AppState} state
 * @param {string} tokenId
 * @param {number} nx
 * @param {number} ny
 * @returns {AppState}
 */
export function setOwnTokenPosition(state, tokenId, nx, ny) {
  const clampedNx = clamp01(nx);
  const clampedNy = clamp01(ny);

  const ownTokens = state.ownTokens.map((token) =>
    token.id === tokenId ? { ...token, nx: clampedNx, ny: clampedNy } : token
  );

  return {
    ...state,
    ownTokens,
  };
}

/**
 * Updates the ball position. Coordinates are clamped to [0, 1].
 * @param {AppState} state
 * @param {number} nx
 * @param {number} ny
 * @returns {AppState}
 */
export function setBallPosition(state, nx, ny) {
  return {
    ...state,
    ball: { nx: clamp01(nx), ny: clamp01(ny) },
  };
}

/**
 * Sets the currently selected token id (or null to deselect).
 * @param {AppState} state
 * @param {string|null} tokenId
 * @returns {AppState}
 */
export function setSelectedToken(state, tokenId) {
  return {
    ...state,
    selectedTokenId: tokenId,
  };
}
