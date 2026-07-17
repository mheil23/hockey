/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { initArrowMode } from "../src/arrows.js";
import { createInitialState } from "../src/state.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function setupDOM() {
  document.body.innerHTML = `
    <button id="draw-mode-toggle" aria-pressed="false">Draw</button>
    <select id="arrow-style-select">
      <option value="solid">Solid</option>
      <option value="dashed">Dashed</option>
    </select>
    <button id="clear-arrows-btn">Clear Arrows</button>
    <svg id="rink" viewBox="0 0 200 85" xmlns="${SVG_NS}">
      <g id="rink-markings"></g>
      <g id="arrows-layer"></g>
      <g id="tokens-layer"></g>
      <g id="ball-layer"></g>
    </svg>
  `;
  return document.getElementById("rink");
}

describe("initArrowMode — draw mode toggle", () => {
  let state;
  let svgEl;

  beforeEach(() => {
    svgEl = setupDOM();
    state = createInitialState("6v6");
  });

  it("toggles drawMode on button click", () => {
    initArrowMode(svgEl, () => state, (s) => { state = s; });
    const btn = document.getElementById("draw-mode-toggle");

    btn.click();
    expect(state.drawMode).toBe(true);
    expect(btn.getAttribute("aria-pressed")).toBe("true");

    btn.click();
    expect(state.drawMode).toBe(false);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("updates aria-pressed attribute correctly", () => {
    initArrowMode(svgEl, () => state, (s) => { state = s; });
    const btn = document.getElementById("draw-mode-toggle");

    expect(btn.getAttribute("aria-pressed")).toBe("false");
    btn.click();
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("initArrowMode — arrow style selector", () => {
  let state;
  let svgEl;

  beforeEach(() => {
    svgEl = setupDOM();
    state = createInitialState("6v6");
    initArrowMode(svgEl, () => state, (s) => { state = s; });
  });

  it("changes arrowStyle on select change", () => {
    const select = document.getElementById("arrow-style-select");
    select.value = "dashed";
    select.dispatchEvent(new Event("change"));
    expect(state.arrowStyle).toBe("dashed");
  });

  it("changes arrowStyle back to solid", () => {
    const select = document.getElementById("arrow-style-select");
    select.value = "dashed";
    select.dispatchEvent(new Event("change"));
    select.value = "solid";
    select.dispatchEvent(new Event("change"));
    expect(state.arrowStyle).toBe("solid");
  });
});

describe("initArrowMode — clear arrows button", () => {
  let state;
  let svgEl;

  beforeEach(() => {
    svgEl = setupDOM();
    state = createInitialState("6v6");
    // Pre-populate with arrows
    state = {
      ...state,
      arrows: [
        { id: "a1", startNx: 0.1, startNy: 0.2, endNx: 0.5, endNy: 0.6, style: "solid" },
        { id: "a2", startNx: 0.3, startNy: 0.4, endNx: 0.8, endNy: 0.9, style: "dashed" },
      ],
    };
    initArrowMode(svgEl, () => state, (s) => { state = s; });
  });

  it("clears all arrows on click", () => {
    const btn = document.getElementById("clear-arrows-btn");
    btn.click();
    expect(state.arrows).toEqual([]);
  });

  it("preserves token and ball positions after clearing", () => {
    const tokensBefore = state.ownTokens;
    const ballBefore = state.ball;
    const btn = document.getElementById("clear-arrows-btn");
    btn.click();
    expect(state.ownTokens).toEqual(tokensBefore);
    expect(state.ball).toEqual(ballBefore);
  });
});

describe("initArrowMode — draw gestures", () => {
  let state;
  let svgEl;

  beforeEach(() => {
    svgEl = setupDOM();
    state = createInitialState("6v6");
    state = { ...state, drawMode: true };

    // Polyfill pointer capture methods not available in jsdom
    svgEl.setPointerCapture = () => {};
    svgEl.releasePointerCapture = () => {};

    // Mock getScreenCTM for coordinate conversion
    svgEl.getScreenCTM = () => ({
      inverse: () => ({
        a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
      }),
    });
    svgEl.createSVGPoint = () => ({
      x: 0,
      y: 0,
      matrixTransform(m) {
        return { x: this.x * (m.a || 1) + (m.e || 0), y: this.y * (m.d || 1) + (m.f || 0) };
      },
    });

    initArrowMode(svgEl, () => state, (s) => { state = s; });
  });

  // PointerEvent polyfill for jsdom
  function createPointerEvent(type, props) {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, { clientX: 0, clientY: 0, pointerId: 0, ...props });
    return event;
  }

  it("does not create arrows when draw mode is off", () => {
    state = { ...state, drawMode: false };
    svgEl.dispatchEvent(createPointerEvent("pointerdown", {
      clientX: 10, clientY: 20, pointerId: 1,
    }));
    svgEl.dispatchEvent(createPointerEvent("pointerup", {
      clientX: 30, clientY: 80, pointerId: 1,
    }));
    expect(state.arrows).toEqual([]);
  });

  it("does not create arrow when start equals end (zero length)", () => {
    svgEl.dispatchEvent(createPointerEvent("pointerdown", {
      clientX: 10, clientY: 20, pointerId: 1,
    }));
    svgEl.dispatchEvent(createPointerEvent("pointerup", {
      clientX: 10, clientY: 20, pointerId: 1,
    }));
    expect(state.arrows).toEqual([]);
  });
});
