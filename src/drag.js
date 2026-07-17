/**
 * Drag Interactions — Ball Hockey Formations Tool
 *
 * Handles pointer-based drag interactions for tokens and ball on the SVG rink.
 * Uses the Pointer Events API for unified mouse + touch handling.
 */

import { toNormalized } from "./renderer.js";
import {
  setOwnTokenPosition,
  setOpponentTokenPosition,
  setBallPosition,
} from "./state.js";

// Rink geometry (must match renderer.js viewBox)
const RINK_WIDTH = 200;
const RINK_HEIGHT = 85;

/**
 * Converts a pointer event's client coordinates to SVG viewBox coordinates.
 * Uses getScreenCTM().inverse() to accurately map screen position to SVG space.
 * @param {SVGSVGElement} svgEl - The root SVG element
 * @param {PointerEvent} e - The pointer event
 * @returns {{ x: number, y: number }} SVG-space coordinates
 */
function clientToSVG(svgEl, e) {
  const pt = svgEl.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svgEl.getScreenCTM();
  if (!ctm) {
    return { x: 0, y: 0 };
  }
  const svgPt = pt.matrixTransform(ctm.inverse());
  return { x: svgPt.x, y: svgPt.y };
}

/**
 * Finds the token group or ball element that is the drag target.
 * Walks up from the event target to find an element with data-token-id or data-element="ball".
 * @param {EventTarget} target - The event target element
 * @returns {{ type: "token", id: string, team: string } | { type: "ball" } | null}
 */
function identifyDragTarget(target) {
  let el = target;
  while (el && el.nodeType === 1) {
    if (el.hasAttribute && el.hasAttribute("data-token-id")) {
      return {
        type: "token",
        id: el.getAttribute("data-token-id"),
        team: el.getAttribute("data-team"),
      };
    }
    if (el.hasAttribute && el.getAttribute("data-element") === "ball") {
      return { type: "ball" };
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * Initializes drag handlers on the SVG rink element.
 * Supports dragging own-team tokens, opponent tokens, and the ball.
 * Disables drag when drawMode is active.
 *
 * @param {SVGSVGElement} svgEl - The root SVG element
 * @param {() => object} getState - Function returning current app state
 * @param {(newState: object) => void} setState - Function to update app state (triggers re-render)
 */
export function initDragHandlers(svgEl, getState, setState) {
  let dragging = null; // { type, id?, team?, startNx, startNy, pointerId }

  /**
   * Prevent default touch behaviors (zoom/scroll) during drag.
   * The SVG already has touch-action: none in CSS, but this provides additional safety.
   */
  svgEl.addEventListener("touchstart", (e) => {
    if (dragging) {
      e.preventDefault();
    }
  }, { passive: false });

  svgEl.addEventListener("touchmove", (e) => {
    if (dragging) {
      e.preventDefault();
    }
  }, { passive: false });

  // --- Pointer Events ---

  svgEl.addEventListener("pointerdown", (e) => {
    // Do not initiate drag if draw mode is active
    const state = getState();
    if (state.drawMode) {
      return;
    }

    const target = identifyDragTarget(e.target);
    if (!target) {
      return;
    }

    // Save start position for cancel/revert
    let startNx, startNy;
    if (target.type === "token") {
      const allTokens = [...state.ownTokens, ...state.opponentTokens];
      const token = allTokens.find((t) => t.id === target.id);
      if (!token) return;
      startNx = token.nx;
      startNy = token.ny;
    } else if (target.type === "ball") {
      startNx = state.ball.nx;
      startNy = state.ball.ny;
    }

    dragging = {
      ...target,
      startNx,
      startNy,
      pointerId: e.pointerId,
    };

    svgEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  svgEl.addEventListener("pointermove", (e) => {
    if (!dragging || dragging.pointerId !== e.pointerId) {
      return;
    }

    // Convert pointer position to SVG coordinates
    const svgPt = clientToSVG(svgEl, e);

    // Convert to normalized (clamped to [0,1])
    const { nx, ny } = toNormalized(svgPt.x, svgPt.y, {
      width: RINK_WIDTH,
      height: RINK_HEIGHT,
    });

    const state = getState();
    let newState;

    if (dragging.type === "token") {
      if (dragging.team === "own") {
        newState = setOwnTokenPosition(state, dragging.id, nx, ny);
      } else {
        newState = setOpponentTokenPosition(state, dragging.id, nx, ny);
      }
    } else if (dragging.type === "ball") {
      newState = setBallPosition(state, nx, ny);
    }

    if (newState) {
      setState(newState);
    }

    e.preventDefault();
  });

  svgEl.addEventListener("pointerup", (e) => {
    if (!dragging || dragging.pointerId !== e.pointerId) {
      return;
    }

    svgEl.releasePointerCapture(e.pointerId);
    dragging = null;
    e.preventDefault();
  });

  svgEl.addEventListener("pointercancel", (e) => {
    if (!dragging || dragging.pointerId !== e.pointerId) {
      return;
    }

    // Revert to start-of-drag position
    const state = getState();
    let newState;

    if (dragging.type === "token") {
      if (dragging.team === "own") {
        newState = setOwnTokenPosition(
          state,
          dragging.id,
          dragging.startNx,
          dragging.startNy
        );
      } else {
        newState = setOpponentTokenPosition(
          state,
          dragging.id,
          dragging.startNx,
          dragging.startNy
        );
      }
    } else if (dragging.type === "ball") {
      newState = setBallPosition(state, dragging.startNx, dragging.startNy);
    }

    if (newState) {
      setState(newState);
    }

    svgEl.releasePointerCapture(e.pointerId);
    dragging = null;
  });
}
