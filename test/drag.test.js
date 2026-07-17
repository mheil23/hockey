/**
 * Unit tests for drag interactions (src/drag.js)
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { initDragHandlers } from "../src/drag.js";
import { createInitialState, setOpponentOverlay } from "../src/state.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Creates a minimal SVG element with the expected structure for testing.
 */
function createSVGElement() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 44 103");
  document.body.appendChild(svg);

  // Create layer groups
  const layers = ["rink-markings", "arrows-layer", "tokens-layer", "ball-layer"];
  for (const id of layers) {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("id", id);
    svg.appendChild(g);
  }

  // Mock getScreenCTM to return an identity-like matrix that maps
  // clientX/clientY directly to SVG coordinates (for simplicity in tests)
  // We'll simulate a 44x103 viewBox displayed in a 440x1030 pixel area
  const mockMatrix = {
    a: 10, b: 0, c: 0, d: 10, e: 0, f: 0,
    inverse() {
      return { a: 0.1, b: 0, c: 0, d: 0.1, e: 0, f: 0 };
    },
  };

  svg.getScreenCTM = () => mockMatrix;

  // Mock createSVGPoint
  svg.createSVGPoint = () => ({
    x: 0,
    y: 0,
    matrixTransform(matrix) {
      return {
        x: this.x * matrix.a + this.y * matrix.c + matrix.e,
        y: this.x * matrix.b + this.y * matrix.d + matrix.f,
      };
    },
  });

  // Mock setPointerCapture and releasePointerCapture
  svg.setPointerCapture = vi.fn();
  svg.releasePointerCapture = vi.fn();

  return svg;
}

/**
 * Creates a token group element inside the tokens-layer.
 */
function addTokenToSVG(svg, tokenId, team) {
  const layer = svg.querySelector("#tokens-layer");
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("data-token-id", tokenId);
  g.setAttribute("data-team", team);

  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("cx", "22");
  circle.setAttribute("cy", "51.5");
  circle.setAttribute("r", "0.77");
  g.appendChild(circle);
  layer.appendChild(g);
  return g;
}

/**
 * Creates a ball element inside the ball-layer.
 */
function addBallToSVG(svg) {
  const layer = svg.querySelector("#ball-layer");
  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("data-element", "ball");
  circle.setAttribute("cx", "22");
  circle.setAttribute("cy", "51.5");
  circle.setAttribute("r", "0.5");
  layer.appendChild(circle);
  return circle;
}

/**
 * Creates a PointerEvent-like event.
 * jsdom doesn't support PointerEvent, so we use Event with pointer properties.
 */
function createPointerEvent(type, { clientX = 0, clientY = 0, pointerId = 1, target = null } = {}) {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  });
  event.clientX = clientX;
  event.clientY = clientY;
  event.pointerId = pointerId;
  event.preventDefault = vi.fn();
  return event;
}

describe("initDragHandlers", () => {
  let svg;
  let state;
  let getState;
  let setState;

  beforeEach(() => {
    document.body.innerHTML = "";
    svg = createSVGElement();
    state = createInitialState("6v6");
    getState = () => state;
    setState = (newState) => { state = newState; };
  });

  it("should export initDragHandlers as a function", () => {
    expect(typeof initDragHandlers).toBe("function");
  });

  it("should not crash when initialized", () => {
    expect(() => initDragHandlers(svg, getState, setState)).not.toThrow();
  });

  describe("token drag", () => {
    it("should update token position on drag", () => {
      initDragHandlers(svg, getState, setState);
      const tokenEl = addTokenToSVG(svg, "own-0", "own");

      const startPos = state.ownTokens[0];
      expect(startPos).toBeDefined();

      // Simulate pointerdown on token
      const downEvent = createPointerEvent("pointerdown", {
        clientX: 220,
        clientY: 515,
        pointerId: 1,
      });
      Object.defineProperty(downEvent, "target", { value: tokenEl.querySelector("circle") });
      svg.dispatchEvent(downEvent);

      // Simulate pointermove to new position (clientX=300 → svgX=30, clientY=600 → svgY=60)
      const moveEvent = createPointerEvent("pointermove", {
        clientX: 300,
        clientY: 600,
        pointerId: 1,
      });
      svg.dispatchEvent(moveEvent);

      // Check token was moved — normalized coords: 30/44 ≈ 0.6818, 60/103 ≈ 0.5825
      const movedToken = state.ownTokens.find((t) => t.id === "own-0");
      expect(movedToken.nx).toBeCloseTo(30 / 200, 3);
      expect(movedToken.ny).toBeCloseTo(60 / 85, 3);
    });

    it("should clamp token position at boundary on drag outside rink", () => {
      initDragHandlers(svg, getState, setState);
      const tokenEl = addTokenToSVG(svg, "own-0", "own");

      // pointerdown
      const downEvent = createPointerEvent("pointerdown", {
        clientX: 220,
        clientY: 515,
        pointerId: 1,
      });
      Object.defineProperty(downEvent, "target", { value: tokenEl.querySelector("circle") });
      svg.dispatchEvent(downEvent);

      // Move far outside (negative coordinates → SVG coords will be negative)
      const moveEvent = createPointerEvent("pointermove", {
        clientX: -100,
        clientY: -200,
        pointerId: 1,
      });
      svg.dispatchEvent(moveEvent);

      const movedToken = state.ownTokens.find((t) => t.id === "own-0");
      expect(movedToken.nx).toBe(0);
      expect(movedToken.ny).toBe(0);
    });

    it("should finalize position on pointerup", () => {
      initDragHandlers(svg, getState, setState);
      const tokenEl = addTokenToSVG(svg, "own-0", "own");

      // pointerdown
      const downEvent = createPointerEvent("pointerdown", {
        clientX: 220,
        clientY: 515,
        pointerId: 1,
      });
      Object.defineProperty(downEvent, "target", { value: tokenEl.querySelector("circle") });
      svg.dispatchEvent(downEvent);

      // Move
      const moveEvent = createPointerEvent("pointermove", {
        clientX: 300,
        clientY: 600,
        pointerId: 1,
      });
      svg.dispatchEvent(moveEvent);

      // pointerup
      const upEvent = createPointerEvent("pointerup", {
        clientX: 300,
        clientY: 600,
        pointerId: 1,
      });
      svg.dispatchEvent(upEvent);

      expect(svg.releasePointerCapture).toHaveBeenCalledWith(1);

      // Further move should not affect state
      const afterMoveEvent = createPointerEvent("pointermove", {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
      });
      svg.dispatchEvent(afterMoveEvent);

      const token = state.ownTokens.find((t) => t.id === "own-0");
      // Should still be at the position from before pointerup
      expect(token.nx).toBeCloseTo(30 / 200, 3);
      expect(token.ny).toBeCloseTo(60 / 85, 3);
    });
  });

  describe("ball drag", () => {
    it("should update ball position on drag", () => {
      initDragHandlers(svg, getState, setState);
      const ballEl = addBallToSVG(svg);

      // pointerdown on ball
      const downEvent = createPointerEvent("pointerdown", {
        clientX: 220,
        clientY: 515,
        pointerId: 1,
      });
      Object.defineProperty(downEvent, "target", { value: ballEl });
      svg.dispatchEvent(downEvent);

      // Move ball (clientX=110 → svgX=11, clientY=300 → svgY=30)
      const moveEvent = createPointerEvent("pointermove", {
        clientX: 110,
        clientY: 300,
        pointerId: 1,
      });
      svg.dispatchEvent(moveEvent);

      expect(state.ball.nx).toBeCloseTo(11 / 200, 3);
      expect(state.ball.ny).toBeCloseTo(30 / 85, 3);
    });

    it("should clamp ball position at boundary", () => {
      initDragHandlers(svg, getState, setState);
      const ballEl = addBallToSVG(svg);

      // pointerdown
      const downEvent = createPointerEvent("pointerdown", {
        clientX: 220,
        clientY: 515,
        pointerId: 1,
      });
      Object.defineProperty(downEvent, "target", { value: ballEl });
      svg.dispatchEvent(downEvent);

      // Move far outside (large positive values → beyond rink)
      const moveEvent = createPointerEvent("pointermove", {
        clientX: 5000,
        clientY: 20000,
        pointerId: 1,
      });
      svg.dispatchEvent(moveEvent);

      expect(state.ball.nx).toBe(1);
      expect(state.ball.ny).toBe(1);
    });
  });

  describe("pointercancel", () => {
    it("should revert token to start position on pointercancel", () => {
      initDragHandlers(svg, getState, setState);
      const tokenEl = addTokenToSVG(svg, "own-0", "own");

      const originalNx = state.ownTokens[0].nx;
      const originalNy = state.ownTokens[0].ny;

      // pointerdown
      const downEvent = createPointerEvent("pointerdown", {
        clientX: 220,
        clientY: 515,
        pointerId: 1,
      });
      Object.defineProperty(downEvent, "target", { value: tokenEl.querySelector("circle") });
      svg.dispatchEvent(downEvent);

      // Move away
      const moveEvent = createPointerEvent("pointermove", {
        clientX: 300,
        clientY: 700,
        pointerId: 1,
      });
      svg.dispatchEvent(moveEvent);

      // Verify position changed
      const movedToken = state.ownTokens.find((t) => t.id === "own-0");
      expect(movedToken.nx).not.toBeCloseTo(originalNx, 1);

      // pointercancel — should revert
      const cancelEvent = createPointerEvent("pointercancel", {
        pointerId: 1,
      });
      svg.dispatchEvent(cancelEvent);

      const revertedToken = state.ownTokens.find((t) => t.id === "own-0");
      expect(revertedToken.nx).toBeCloseTo(originalNx, 5);
      expect(revertedToken.ny).toBeCloseTo(originalNy, 5);
    });

    it("should revert ball to start position on pointercancel", () => {
      initDragHandlers(svg, getState, setState);
      const ballEl = addBallToSVG(svg);

      const originalNx = state.ball.nx;
      const originalNy = state.ball.ny;

      // pointerdown
      const downEvent = createPointerEvent("pointerdown", {
        clientX: 220,
        clientY: 515,
        pointerId: 1,
      });
      Object.defineProperty(downEvent, "target", { value: ballEl });
      svg.dispatchEvent(downEvent);

      // Move away
      const moveEvent = createPointerEvent("pointermove", {
        clientX: 100,
        clientY: 200,
        pointerId: 1,
      });
      svg.dispatchEvent(moveEvent);

      // pointercancel
      const cancelEvent = createPointerEvent("pointercancel", { pointerId: 1 });
      svg.dispatchEvent(cancelEvent);

      expect(state.ball.nx).toBeCloseTo(originalNx, 5);
      expect(state.ball.ny).toBeCloseTo(originalNy, 5);
    });
  });

  describe("drawMode disables drag", () => {
    it("should not initiate drag when drawMode is active", () => {
      state = { ...state, drawMode: true };
      initDragHandlers(svg, getState, setState);
      const tokenEl = addTokenToSVG(svg, "own-0", "own");

      const originalNx = state.ownTokens[0].nx;
      const originalNy = state.ownTokens[0].ny;

      // Attempt pointerdown
      const downEvent = createPointerEvent("pointerdown", {
        clientX: 220,
        clientY: 515,
        pointerId: 1,
      });
      Object.defineProperty(downEvent, "target", { value: tokenEl.querySelector("circle") });
      svg.dispatchEvent(downEvent);

      // setPointerCapture should NOT be called
      expect(svg.setPointerCapture).not.toHaveBeenCalled();

      // Move should not update position
      const moveEvent = createPointerEvent("pointermove", {
        clientX: 300,
        clientY: 600,
        pointerId: 1,
      });
      svg.dispatchEvent(moveEvent);

      const token = state.ownTokens.find((t) => t.id === "own-0");
      expect(token.nx).toBe(originalNx);
      expect(token.ny).toBe(originalNy);
    });
  });

  describe("opponent token drag", () => {
    it("should update opponent token position on drag", () => {
      // Enable opponent overlay first
      state = setOpponentOverlay(state, true);

      initDragHandlers(svg, getState, setState);
      const tokenEl = addTokenToSVG(svg, "opp-0", "opp");

      const originalNx = state.opponentTokens[0].nx;

      // pointerdown
      const downEvent = createPointerEvent("pointerdown", {
        clientX: 220,
        clientY: 200,
        pointerId: 1,
      });
      Object.defineProperty(downEvent, "target", { value: tokenEl.querySelector("circle") });
      svg.dispatchEvent(downEvent);

      // Move
      const moveEvent = createPointerEvent("pointermove", {
        clientX: 150,
        clientY: 400,
        pointerId: 1,
      });
      svg.dispatchEvent(moveEvent);

      const movedToken = state.opponentTokens.find((t) => t.id === "opp-0");
      expect(movedToken.nx).toBeCloseTo(15 / 200, 3);
      expect(movedToken.ny).toBeCloseTo(40 / 85, 3);
    });
  });
});
