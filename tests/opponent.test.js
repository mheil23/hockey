/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { initOpponentOverlay, onFormatChange, getLastOpponentFormation, setLastOpponentFormation } from "../src/opponent.js";
import { createInitialState, setOpponentOverlay, setOpponentFormation } from "../src/state.js";

function setupDOM() {
  document.body.innerHTML = `
    <button id="opponent-toggle" type="button" aria-pressed="false">Opponent</button>
  `;
}

describe("initOpponentOverlay", () => {
  let state;
  let rendered;

  function getState() {
    return state;
  }
  function setState(newState) {
    state = newState;
  }
  function render() {
    rendered = true;
  }

  beforeEach(() => {
    setupDOM();
    state = createInitialState("6v6");
    rendered = false;
    // Reset remembered formations
    setLastOpponentFormation("4v4", null);
    setLastOpponentFormation("5v5", null);
    setLastOpponentFormation("6v6", null);
  });

  it("toggle enables opponent overlay and updates aria-pressed", () => {
    initOpponentOverlay(getState, setState, render);
    const toggleBtn = document.querySelector("#opponent-toggle");

    toggleBtn.click();

    expect(toggleBtn.getAttribute("aria-pressed")).toBe("true");
    expect(state.opponentOverlayEnabled).toBe(true);
    expect(state.opponentTokens.length).toBeGreaterThan(0);
    expect(rendered).toBe(true);
  });

  it("toggle disables opponent overlay and updates aria-pressed", () => {
    initOpponentOverlay(getState, setState, render);
    const toggleBtn = document.querySelector("#opponent-toggle");

    // Enable first
    toggleBtn.click();
    rendered = false;

    // Disable
    toggleBtn.click();

    expect(toggleBtn.getAttribute("aria-pressed")).toBe("false");
    expect(state.opponentOverlayEnabled).toBe(false);
    expect(state.opponentTokens.length).toBe(0);
    expect(rendered).toBe(true);
  });
});

describe("getLastOpponentFormation / setLastOpponentFormation", () => {
  beforeEach(() => {
    setLastOpponentFormation("4v4", null);
    setLastOpponentFormation("5v5", null);
    setLastOpponentFormation("6v6", null);
  });

  it("returns null when no formation has been set", () => {
    expect(getLastOpponentFormation("6v6")).toBe(null);
  });

  it("stores and retrieves per-format formation", () => {
    setLastOpponentFormation("6v6", "6v6-overload");
    setLastOpponentFormation("4v4", "4v4-1-2");

    expect(getLastOpponentFormation("6v6")).toBe("6v6-overload");
    expect(getLastOpponentFormation("4v4")).toBe("4v4-1-2");
    expect(getLastOpponentFormation("5v5")).toBe(null);
  });

  it("ignores invalid format keys", () => {
    setLastOpponentFormation("invalid", "some-formation");
    expect(getLastOpponentFormation("invalid")).toBe(null);
  });
});
