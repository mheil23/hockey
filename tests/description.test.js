/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from "vitest";
import { initDescriptionPanel } from "../src/description.js";
import { createInitialState, setSelectedToken } from "../src/state.js";

// Polyfill PointerEvent for jsdom (which does not support it natively)
if (typeof PointerEvent === "undefined") {
  class PointerEvent extends MouseEvent {
    constructor(type, params = {}) {
      super(type, params);
      this.pointerId = params.pointerId || 0;
      this.pointerType = params.pointerType || "";
    }
  }
  globalThis.PointerEvent = PointerEvent;
}

// Minimal SVG + DOM setup to simulate the rink and description panel
function setupDOM() {
  document.body.innerHTML = `
    <svg id="rink" viewBox="0 0 200 85" xmlns="http://www.w3.org/2000/svg">
      <g id="rink-markings"></g>
      <g id="arrows-layer"></g>
      <g id="tokens-layer">
        <g data-token-id="own-0" data-team="own">
          <circle cx="22" cy="56.65" r="0.77"></circle>
          <text>C</text>
        </g>
        <g data-token-id="own-1" data-team="own">
          <circle cx="13.2" cy="80.34" r="0.77"></circle>
          <text>LD</text>
        </g>
      </g>
      <g id="ball-layer"></g>
    </svg>
    <aside class="description-panel" id="description-panel">
      <button class="close-btn" id="description-close-btn">&times;</button>
      <h2 id="description-title"></h2>
      <p id="description-role"></p>
      <div class="attributes" id="description-attributes"></div>
      <p id="description-responsibilities"></p>
    </aside>
  `;
}

describe("Description Panel", () => {
  let state;
  let svgEl;

  function getState() {
    return state;
  }

  function setState(newState) {
    state = newState;
  }

  beforeEach(() => {
    setupDOM();
    // 6v6 standard: own-3 has formationKey "C"
    state = createInitialState("6v6");
    svgEl = document.getElementById("rink");
    initDescriptionPanel(svgEl, getState, setState);
  });

  it("shows the description panel when a token is clicked (pointer down + up with < 5px movement)", () => {
    const tokenGroup = svgEl.querySelector('[data-token-id="own-0"]');
    const panel = document.getElementById("description-panel");

    // Simulate pointerdown on the token
    const downEvent = new PointerEvent("pointerdown", {
      clientX: 100,
      clientY: 200,
      bubbles: true,
    });
    tokenGroup.querySelector("circle").dispatchEvent(downEvent);

    // Simulate pointerup at same position (no movement)
    const upEvent = new PointerEvent("pointerup", {
      clientX: 100,
      clientY: 200,
      bubbles: true,
    });
    svgEl.dispatchEvent(upEvent);

    // Panel should be visible
    expect(panel.classList.contains("visible")).toBe(true);
  });

  it("populates title, role, attributes, and responsibilities from position description", () => {
    const tokenGroup = svgEl.querySelector('[data-token-id="own-0"]');

    // The first token in 6v6-standard has formationKey "G" (goalie)
    // Let's find which token has "C" formationKey
    // In 6v6-standard: own-0=G, own-1=LD, own-2=RD, own-3=C, own-4=LW, own-5=RW
    // Our DOM only has own-0 and own-1 — own-0 maps to "G" in state

    const downEvent = new PointerEvent("pointerdown", {
      clientX: 100,
      clientY: 200,
      bubbles: true,
    });
    tokenGroup.querySelector("circle").dispatchEvent(downEvent);

    const upEvent = new PointerEvent("pointerup", {
      clientX: 100,
      clientY: 200,
      bubbles: true,
    });
    svgEl.dispatchEvent(upEvent);

    const titleEl = document.getElementById("description-title");
    const roleEl = document.getElementById("description-role");
    const attributesEl = document.getElementById("description-attributes");
    const responsibilitiesEl = document.getElementById("description-responsibilities");

    // own-0 maps to "G" (Goalie) in 6v6-standard formation
    expect(titleEl.textContent).toBe("Goalie");
    expect(roleEl.textContent.length).toBeGreaterThan(20);
    expect(attributesEl.children.length).toBeGreaterThanOrEqual(1);
    expect(attributesEl.children.length).toBeLessThanOrEqual(5);
    expect(responsibilitiesEl.textContent.length).toBeGreaterThan(20);

    // Each attribute should be a .attribute-tag span
    for (const child of attributesEl.children) {
      expect(child.className).toBe("attribute-tag");
    }
  });

  it("sets selectedTokenId in state when a token is clicked", () => {
    const tokenGroup = svgEl.querySelector('[data-token-id="own-0"]');

    const downEvent = new PointerEvent("pointerdown", {
      clientX: 100,
      clientY: 200,
      bubbles: true,
    });
    tokenGroup.querySelector("circle").dispatchEvent(downEvent);

    const upEvent = new PointerEvent("pointerup", {
      clientX: 100,
      clientY: 200,
      bubbles: true,
    });
    svgEl.dispatchEvent(upEvent);

    expect(state.selectedTokenId).toBe("own-0");
  });

  it("does NOT show description if pointer moved >= 5px (drag)", () => {
    const tokenGroup = svgEl.querySelector('[data-token-id="own-0"]');
    const panel = document.getElementById("description-panel");

    const downEvent = new PointerEvent("pointerdown", {
      clientX: 100,
      clientY: 200,
      bubbles: true,
    });
    tokenGroup.querySelector("circle").dispatchEvent(downEvent);

    // Simulate pointerup with significant movement (>= 5px)
    const upEvent = new PointerEvent("pointerup", {
      clientX: 106,
      clientY: 200,
      bubbles: true,
    });
    svgEl.dispatchEvent(upEvent);

    expect(panel.classList.contains("visible")).toBe(false);
  });

  it("does NOT show description in draw mode", () => {
    state = { ...state, drawMode: true };
    const tokenGroup = svgEl.querySelector('[data-token-id="own-0"]');
    const panel = document.getElementById("description-panel");

    const downEvent = new PointerEvent("pointerdown", {
      clientX: 100,
      clientY: 200,
      bubbles: true,
    });
    tokenGroup.querySelector("circle").dispatchEvent(downEvent);

    const upEvent = new PointerEvent("pointerup", {
      clientX: 100,
      clientY: 200,
      bubbles: true,
    });
    svgEl.dispatchEvent(upEvent);

    expect(panel.classList.contains("visible")).toBe(false);
  });

  it("hides the panel when close button is clicked", () => {
    const tokenGroup = svgEl.querySelector('[data-token-id="own-0"]');
    const panel = document.getElementById("description-panel");
    const closeBtn = document.getElementById("description-close-btn");

    // First, show the panel
    tokenGroup.querySelector("circle").dispatchEvent(
      new PointerEvent("pointerdown", { clientX: 100, clientY: 200, bubbles: true })
    );
    svgEl.dispatchEvent(
      new PointerEvent("pointerup", { clientX: 100, clientY: 200, bubbles: true })
    );
    expect(panel.classList.contains("visible")).toBe(true);

    // Click close button
    closeBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(panel.classList.contains("visible")).toBe(false);
    expect(state.selectedTokenId).toBeNull();
  });

  it("hides the panel when clicking outside the panel", () => {
    const tokenGroup = svgEl.querySelector('[data-token-id="own-0"]');
    const panel = document.getElementById("description-panel");

    // First, show the panel
    tokenGroup.querySelector("circle").dispatchEvent(
      new PointerEvent("pointerdown", { clientX: 100, clientY: 200, bubbles: true })
    );
    svgEl.dispatchEvent(
      new PointerEvent("pointerup", { clientX: 100, clientY: 200, bubbles: true })
    );
    expect(panel.classList.contains("visible")).toBe(true);

    // Click outside (on body, which is outside panel and not a token)
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { clientX: 500, clientY: 500, bubbles: true })
    );

    expect(panel.classList.contains("visible")).toBe(false);
    expect(state.selectedTokenId).toBeNull();
  });

  it("does NOT hide panel when clicking inside the panel", () => {
    const tokenGroup = svgEl.querySelector('[data-token-id="own-0"]');
    const panel = document.getElementById("description-panel");

    // Show the panel
    tokenGroup.querySelector("circle").dispatchEvent(
      new PointerEvent("pointerdown", { clientX: 100, clientY: 200, bubbles: true })
    );
    svgEl.dispatchEvent(
      new PointerEvent("pointerup", { clientX: 100, clientY: 200, bubbles: true })
    );
    expect(panel.classList.contains("visible")).toBe(true);

    // Click inside the panel
    panel.dispatchEvent(
      new PointerEvent("pointerdown", { clientX: 200, clientY: 300, bubbles: true })
    );

    expect(panel.classList.contains("visible")).toBe(true);
  });

  it("leaves token positions unchanged when panel is dismissed", () => {
    const tokenGroup = svgEl.querySelector('[data-token-id="own-0"]');
    const closeBtn = document.getElementById("description-close-btn");

    // Record positions before
    const positionsBefore = state.ownTokens.map((t) => ({ nx: t.nx, ny: t.ny }));

    // Show panel
    tokenGroup.querySelector("circle").dispatchEvent(
      new PointerEvent("pointerdown", { clientX: 100, clientY: 200, bubbles: true })
    );
    svgEl.dispatchEvent(
      new PointerEvent("pointerup", { clientX: 100, clientY: 200, bubbles: true })
    );

    // Dismiss panel
    closeBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // Positions unchanged
    const positionsAfter = state.ownTokens.map((t) => ({ nx: t.nx, ny: t.ny }));
    expect(positionsAfter).toEqual(positionsBefore);
  });
});
