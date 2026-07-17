import { describe, it, expect } from "vitest";
import {
  createInitialState,
  addArrow,
  clearArrows,
  setDrawMode,
  setArrowStyle,
} from "../src/state.js";

function makeArrow(id, style = "solid") {
  return {
    id,
    startNx: 0.2,
    startNy: 0.3,
    endNx: 0.7,
    endNy: 0.8,
    style,
  };
}

describe("addArrow", () => {
  it("adds an arrow to an empty arrows array", () => {
    const state = createInitialState("6v6");
    const arrow = makeArrow("a1");
    const result = addArrow(state, arrow);
    expect(result.arrows).toHaveLength(1);
    expect(result.arrows[0]).toEqual(arrow);
  });

  it("returns a new state object (immutable)", () => {
    const state = createInitialState("6v6");
    const result = addArrow(state, makeArrow("a1"));
    expect(result).not.toBe(state);
    expect(result.arrows).not.toBe(state.arrows);
  });

  it("preserves existing arrows when adding a new one", () => {
    const state = createInitialState("6v6");
    const s1 = addArrow(state, makeArrow("a1"));
    const s2 = addArrow(s1, makeArrow("a2", "dashed"));
    expect(s2.arrows).toHaveLength(2);
    expect(s2.arrows[0].id).toBe("a1");
    expect(s2.arrows[1].id).toBe("a2");
  });

  it("silently rejects when at 50 arrows", () => {
    let state = createInitialState("6v6");
    for (let i = 0; i < 50; i++) {
      state = addArrow(state, makeArrow(`a${i}`));
    }
    expect(state.arrows).toHaveLength(50);

    const result = addArrow(state, makeArrow("a50"));
    expect(result).toBe(state); // same reference — unchanged
    expect(result.arrows).toHaveLength(50);
  });

  it("allows adding up to exactly 50 arrows", () => {
    let state = createInitialState("6v6");
    for (let i = 0; i < 50; i++) {
      state = addArrow(state, makeArrow(`a${i}`));
    }
    expect(state.arrows).toHaveLength(50);
  });

  it("preserves token and ball positions", () => {
    const state = createInitialState("6v6");
    const result = addArrow(state, makeArrow("a1"));
    expect(result.ownTokens).toEqual(state.ownTokens);
    expect(result.ball).toEqual(state.ball);
    expect(result.opponentTokens).toEqual(state.opponentTokens);
  });
});

describe("clearArrows", () => {
  it("removes all arrows from state", () => {
    let state = createInitialState("6v6");
    state = addArrow(state, makeArrow("a1"));
    state = addArrow(state, makeArrow("a2"));
    const result = clearArrows(state);
    expect(result.arrows).toEqual([]);
  });

  it("returns a new state object (immutable)", () => {
    let state = createInitialState("6v6");
    state = addArrow(state, makeArrow("a1"));
    const result = clearArrows(state);
    expect(result).not.toBe(state);
  });

  it("preserves own token positions", () => {
    let state = createInitialState("6v6");
    state = addArrow(state, makeArrow("a1"));
    const result = clearArrows(state);
    expect(result.ownTokens).toEqual(state.ownTokens);
  });

  it("preserves ball position", () => {
    let state = createInitialState("6v6");
    state = { ...state, ball: { nx: 0.3, ny: 0.7 } };
    state = addArrow(state, makeArrow("a1"));
    const result = clearArrows(state);
    expect(result.ball).toEqual({ nx: 0.3, ny: 0.7 });
  });

  it("preserves opponent tokens", () => {
    let state = createInitialState("6v6");
    const oppTokens = [
      { id: "opp-0", team: "opp", label: "G", nx: 0.5, ny: 0.08, formationKey: "G" },
    ];
    state = { ...state, opponentTokens: oppTokens, opponentOverlayEnabled: true };
    state = addArrow(state, makeArrow("a1"));
    const result = clearArrows(state);
    expect(result.opponentTokens).toEqual(oppTokens);
  });

  it("works on state that already has empty arrows", () => {
    const state = createInitialState("6v6");
    expect(state.arrows).toEqual([]);
    const result = clearArrows(state);
    expect(result.arrows).toEqual([]);
  });
});

describe("setDrawMode", () => {
  it("enables draw mode", () => {
    const state = createInitialState("6v6");
    expect(state.drawMode).toBe(false);
    const result = setDrawMode(state, true);
    expect(result.drawMode).toBe(true);
  });

  it("disables draw mode", () => {
    const state = createInitialState("6v6");
    const enabled = setDrawMode(state, true);
    const result = setDrawMode(enabled, false);
    expect(result.drawMode).toBe(false);
  });

  it("returns a new state object (immutable)", () => {
    const state = createInitialState("6v6");
    const result = setDrawMode(state, true);
    expect(result).not.toBe(state);
  });

  it("preserves all other state properties", () => {
    let state = createInitialState("6v6");
    state = addArrow(state, makeArrow("a1"));
    const result = setDrawMode(state, true);
    expect(result.ownTokens).toEqual(state.ownTokens);
    expect(result.ball).toEqual(state.ball);
    expect(result.arrows).toEqual(state.arrows);
    expect(result.format).toBe(state.format);
    expect(result.arrowStyle).toBe(state.arrowStyle);
  });
});

describe("setArrowStyle", () => {
  it("sets arrow style to solid", () => {
    const state = createInitialState("6v6");
    const result = setArrowStyle(state, "solid");
    expect(result.arrowStyle).toBe("solid");
  });

  it("sets arrow style to dashed", () => {
    const state = createInitialState("6v6");
    const result = setArrowStyle(state, "dashed");
    expect(result.arrowStyle).toBe("dashed");
  });

  it("returns a new state object (immutable)", () => {
    const state = createInitialState("6v6");
    const result = setArrowStyle(state, "dashed");
    expect(result).not.toBe(state);
  });

  it("preserves all other state properties", () => {
    let state = createInitialState("6v6");
    state = addArrow(state, makeArrow("a1"));
    state = setDrawMode(state, true);
    const result = setArrowStyle(state, "dashed");
    expect(result.ownTokens).toEqual(state.ownTokens);
    expect(result.ball).toEqual(state.ball);
    expect(result.arrows).toEqual(state.arrows);
    expect(result.drawMode).toBe(true);
    expect(result.format).toBe(state.format);
  });

  it("defaults to solid in initial state", () => {
    const state = createInitialState("6v6");
    expect(state.arrowStyle).toBe("solid");
  });
});
