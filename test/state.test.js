import { describe, it, expect } from "vitest";
import {
  createInitialState,
  setFormat,
  setOpponentOverlay,
  setOpponentFormation,
  setOpponentTokenPosition,
  setOwnTokenPosition,
  setBallPosition,
  setSelectedToken,
} from "../src/state.js";
import { getFormationById, DEFAULT_FORMATION } from "../src/data.js";

describe("createInitialState", () => {
  it("creates state with correct token count for 4v4", () => {
    const state = createInitialState("4v4");
    expect(state.format).toBe("4v4");
    expect(state.ownTokens).toHaveLength(4);
  });

  it("creates state with correct token count for 5v5", () => {
    const state = createInitialState("5v5");
    expect(state.format).toBe("5v5");
    expect(state.ownTokens).toHaveLength(5);
  });

  it("creates state with correct token count for 6v6", () => {
    const state = createInitialState("6v6");
    expect(state.format).toBe("6v6");
    expect(state.ownTokens).toHaveLength(6);
  });

  it("defaults to 6v6 for invalid format", () => {
    const state = createInitialState("invalid");
    expect(state.format).toBe("6v6");
    expect(state.ownTokens).toHaveLength(6);
  });

  it("applies default formation for format", () => {
    const state = createInitialState("5v5");
    expect(state.activeFormationKey).toBe("5v5-2-1-1");
    expect(state.activeFormationName).toBe("2-1-1");
  });

  it("places ball at center", () => {
    const state = createInitialState("6v6");
    expect(state.ball).toEqual({ nx: 0.5, ny: 0.5 });
  });

  it("disables opponent overlay", () => {
    const state = createInitialState("6v6");
    expect(state.opponentOverlayEnabled).toBe(false);
    expect(state.opponentTokens).toEqual([]);
  });

  it("returns full AppState shape", () => {
    const state = createInitialState("6v6");
    expect(state).toHaveProperty("format");
    expect(state).toHaveProperty("activeFormationKey");
    expect(state).toHaveProperty("activeFormationName");
    expect(state).toHaveProperty("ownTokens");
    expect(state).toHaveProperty("ball");
    expect(state).toHaveProperty("opponentOverlayEnabled");
    expect(state).toHaveProperty("opponentFormationKey");
    expect(state).toHaveProperty("opponentTokens");
    expect(state).toHaveProperty("selectedTokenId");
    expect(state).toHaveProperty("savedMoments");
    expect(state).toHaveProperty("activeMomentKey");
    expect(state).toHaveProperty("activeMomentSnapshot");
    expect(state).toHaveProperty("arrows");
    expect(state).toHaveProperty("drawMode");
    expect(state).toHaveProperty("arrowStyle");
  });

  it("creates tokens with correct shape", () => {
    const state = createInitialState("4v4");
    const token = state.ownTokens[0];
    expect(token).toHaveProperty("id");
    expect(token).toHaveProperty("team", "own");
    expect(token).toHaveProperty("label");
    expect(token).toHaveProperty("nx");
    expect(token).toHaveProperty("ny");
    expect(token).toHaveProperty("formationKey");
    expect(token.id).toBe("own-0");
  });
});

describe("setFormat", () => {
  it("changes format and applies default formation", () => {
    const initial = createInitialState("6v6");
    const state = setFormat(initial, "4v4");
    expect(state.format).toBe("4v4");
    expect(state.ownTokens).toHaveLength(4);
    expect(state.activeFormationKey).toBe("4v4-2-1");
  });

  it("resets ball to center", () => {
    const initial = createInitialState("6v6");
    const modified = { ...initial, ball: { nx: 0.2, ny: 0.8 } };
    const state = setFormat(modified, "5v5");
    expect(state.ball).toEqual({ nx: 0.5, ny: 0.5 });
  });

  it("disables opponent overlay", () => {
    const initial = createInitialState("6v6");
    const modified = {
      ...initial,
      opponentOverlayEnabled: true,
      opponentTokens: [{ id: "opp-0", team: "opp", label: "G", nx: 0.5, ny: 0.1, formationKey: "G" }],
    };
    const state = setFormat(modified, "5v5");
    expect(state.opponentOverlayEnabled).toBe(false);
    expect(state.opponentTokens).toEqual([]);
  });

  it("returns new state object (immutable)", () => {
    const initial = createInitialState("6v6");
    const state = setFormat(initial, "4v4");
    expect(state).not.toBe(initial);
  });

  it("defaults invalid format to 6v6", () => {
    const initial = createInitialState("4v4");
    const state = setFormat(initial, "bogus");
    expect(state.format).toBe("6v6");
    expect(state.ownTokens).toHaveLength(6);
  });

  it("clears arrows on format change", () => {
    const initial = createInitialState("6v6");
    const modified = {
      ...initial,
      arrows: [{ id: "a1", startNx: 0, startNy: 0, endNx: 1, endNy: 1, style: "solid" }],
    };
    const state = setFormat(modified, "4v4");
    expect(state.arrows).toEqual([]);
  });

  it("preserves savedMoments on format change", () => {
    const initial = createInitialState("6v6");
    const moments = [{ id: "m1", name: "Test" }];
    const modified = { ...initial, savedMoments: moments };
    const state = setFormat(modified, "4v4");
    expect(state.savedMoments).toEqual(moments);
  });
});


describe("setOwnTokenPosition", () => {
  it("updates the position of the specified token", () => {
    const state = createInitialState("6v6");
    const tokenId = state.ownTokens[0].id;
    const result = setOwnTokenPosition(state, tokenId, 0.3, 0.7);
    const updated = result.ownTokens.find((t) => t.id === tokenId);
    expect(updated.nx).toBe(0.3);
    expect(updated.ny).toBe(0.7);
  });

  it("clamps nx below 0 to 0", () => {
    const state = createInitialState("6v6");
    const tokenId = state.ownTokens[0].id;
    const result = setOwnTokenPosition(state, tokenId, -0.5, 0.5);
    const updated = result.ownTokens.find((t) => t.id === tokenId);
    expect(updated.nx).toBe(0);
    expect(updated.ny).toBe(0.5);
  });

  it("clamps ny below 0 to 0", () => {
    const state = createInitialState("6v6");
    const tokenId = state.ownTokens[0].id;
    const result = setOwnTokenPosition(state, tokenId, 0.5, -1.2);
    const updated = result.ownTokens.find((t) => t.id === tokenId);
    expect(updated.nx).toBe(0.5);
    expect(updated.ny).toBe(0);
  });

  it("clamps nx above 1 to 1", () => {
    const state = createInitialState("6v6");
    const tokenId = state.ownTokens[0].id;
    const result = setOwnTokenPosition(state, tokenId, 2.5, 0.5);
    const updated = result.ownTokens.find((t) => t.id === tokenId);
    expect(updated.nx).toBe(1);
    expect(updated.ny).toBe(0.5);
  });

  it("clamps ny above 1 to 1", () => {
    const state = createInitialState("6v6");
    const tokenId = state.ownTokens[0].id;
    const result = setOwnTokenPosition(state, tokenId, 0.5, 100);
    const updated = result.ownTokens.find((t) => t.id === tokenId);
    expect(updated.nx).toBe(0.5);
    expect(updated.ny).toBe(1);
  });

  it("does not modify other tokens", () => {
    const state = createInitialState("6v6");
    const tokenId = state.ownTokens[0].id;
    const result = setOwnTokenPosition(state, tokenId, 0.1, 0.1);
    for (let i = 1; i < result.ownTokens.length; i++) {
      expect(result.ownTokens[i].nx).toBe(state.ownTokens[i].nx);
      expect(result.ownTokens[i].ny).toBe(state.ownTokens[i].ny);
    }
  });

  it("returns a new state object (immutable)", () => {
    const state = createInitialState("6v6");
    const tokenId = state.ownTokens[0].id;
    const result = setOwnTokenPosition(state, tokenId, 0.3, 0.7);
    expect(result).not.toBe(state);
    expect(result.ownTokens).not.toBe(state.ownTokens);
  });

  it("leaves state unchanged when tokenId is not found", () => {
    const state = createInitialState("6v6");
    const result = setOwnTokenPosition(state, "nonexistent-id", 0.3, 0.7);
    result.ownTokens.forEach((token, i) => {
      expect(token.nx).toBe(state.ownTokens[i].nx);
      expect(token.ny).toBe(state.ownTokens[i].ny);
    });
  });

  it("clamps both nx and ny simultaneously", () => {
    const state = createInitialState("6v6");
    const tokenId = state.ownTokens[0].id;
    const result = setOwnTokenPosition(state, tokenId, -5, 99);
    const updated = result.ownTokens.find((t) => t.id === tokenId);
    expect(updated.nx).toBe(0);
    expect(updated.ny).toBe(1);
  });

  it("accepts boundary values 0 and 1 without clamping", () => {
    const state = createInitialState("6v6");
    const tokenId = state.ownTokens[0].id;
    const result = setOwnTokenPosition(state, tokenId, 0, 1);
    const updated = result.ownTokens.find((t) => t.id === tokenId);
    expect(updated.nx).toBe(0);
    expect(updated.ny).toBe(1);
  });
});

describe("setBallPosition", () => {
  it("updates ball position", () => {
    const state = createInitialState("6v6");
    const result = setBallPosition(state, 0.2, 0.8);
    expect(result.ball).toEqual({ nx: 0.2, ny: 0.8 });
  });

  it("clamps nx below 0 to 0", () => {
    const state = createInitialState("6v6");
    const result = setBallPosition(state, -0.5, 0.5);
    expect(result.ball.nx).toBe(0);
  });

  it("clamps ny below 0 to 0", () => {
    const state = createInitialState("6v6");
    const result = setBallPosition(state, 0.5, -1);
    expect(result.ball.ny).toBe(0);
  });

  it("clamps nx above 1 to 1", () => {
    const state = createInitialState("6v6");
    const result = setBallPosition(state, 3, 0.5);
    expect(result.ball.nx).toBe(1);
  });

  it("clamps ny above 1 to 1", () => {
    const state = createInitialState("6v6");
    const result = setBallPosition(state, 0.5, 1.5);
    expect(result.ball.ny).toBe(1);
  });

  it("clamps both values simultaneously", () => {
    const state = createInitialState("6v6");
    const result = setBallPosition(state, -10, 50);
    expect(result.ball).toEqual({ nx: 0, ny: 1 });
  });

  it("returns a new state object (immutable)", () => {
    const state = createInitialState("6v6");
    const result = setBallPosition(state, 0.2, 0.8);
    expect(result).not.toBe(state);
    expect(result.ball).not.toBe(state.ball);
  });

  it("does not modify ownTokens", () => {
    const state = createInitialState("6v6");
    const result = setBallPosition(state, 0.2, 0.8);
    expect(result.ownTokens).toEqual(state.ownTokens);
  });

  it("accepts exact boundary values 0 and 1", () => {
    const state = createInitialState("6v6");
    const result = setBallPosition(state, 0, 1);
    expect(result.ball).toEqual({ nx: 0, ny: 1 });
  });
});

describe("setSelectedToken", () => {
  it("sets selectedTokenId to a token id", () => {
    const state = createInitialState("6v6");
    const result = setSelectedToken(state, "own-2");
    expect(result.selectedTokenId).toBe("own-2");
  });

  it("sets selectedTokenId to null (deselect)", () => {
    const state = createInitialState("6v6");
    const selected = setSelectedToken(state, "own-3");
    const result = setSelectedToken(selected, null);
    expect(result.selectedTokenId).toBeNull();
  });

  it("returns a new state object (immutable)", () => {
    const state = createInitialState("6v6");
    const result = setSelectedToken(state, "own-0");
    expect(result).not.toBe(state);
  });

  it("does not modify ownTokens or ball", () => {
    const state = createInitialState("6v6");
    const result = setSelectedToken(state, "own-1");
    expect(result.ownTokens).toEqual(state.ownTokens);
    expect(result.ball).toEqual(state.ball);
  });

  it("can select any token id string", () => {
    const state = createInitialState("6v6");
    const result = setSelectedToken(state, "opp-5");
    expect(result.selectedTokenId).toBe("opp-5");
  });
});


describe("setOpponentOverlay", () => {
  it("enables overlay with default formation for current format", () => {
    const initial = createInitialState("6v6");
    const state = setOpponentOverlay(initial, true);
    expect(state.opponentOverlayEnabled).toBe(true);
    expect(state.opponentFormationKey).toBe("6v6-standard");
    expect(state.opponentTokens).toHaveLength(6);
  });

  it("enables overlay with specified formation key", () => {
    const initial = createInitialState("6v6");
    const state = setOpponentOverlay(initial, true, "6v6-2-1-2");
    expect(state.opponentOverlayEnabled).toBe(true);
    expect(state.opponentFormationKey).toBe("6v6-2-1-2");
    expect(state.opponentTokens).toHaveLength(6);
  });

  it("mirrors opponent nx coordinates horizontally", () => {
    const initial = createInitialState("6v6");
    const state = setOpponentOverlay(initial, true, "6v6-standard");
    const formation = getFormationById("6v6-standard");

    state.opponentTokens.forEach((token, i) => {
      expect(token.nx).toBeCloseTo(1 - formation.positions[i].nx);
      expect(token.ny).toBe(formation.positions[i].ny);
    });
  });

  it("opponent tokens have correct ids and team", () => {
    const initial = createInitialState("6v6");
    const state = setOpponentOverlay(initial, true);
    state.opponentTokens.forEach((token, i) => {
      expect(token.id).toBe(`opp-${i}`);
      expect(token.team).toBe("opp");
    });
  });

  it("disabling overlay removes all opponent tokens", () => {
    const initial = createInitialState("6v6");
    const enabled = setOpponentOverlay(initial, true);
    const state = setOpponentOverlay(enabled, false);
    expect(state.opponentOverlayEnabled).toBe(false);
    expect(state.opponentFormationKey).toBeNull();
    expect(state.opponentTokens).toEqual([]);
  });

  it("returns state unchanged for invalid formation key", () => {
    const initial = createInitialState("6v6");
    const state = setOpponentOverlay(initial, true, "nonexistent");
    expect(state).toBe(initial);
  });

  it("returns new state object (immutable)", () => {
    const initial = createInitialState("6v6");
    const state = setOpponentOverlay(initial, true);
    expect(state).not.toBe(initial);
  });

  it("uses default formation for 4v4 format", () => {
    const initial = createInitialState("4v4");
    const state = setOpponentOverlay(initial, true);
    expect(state.opponentFormationKey).toBe("4v4-2-1");
    expect(state.opponentTokens).toHaveLength(4);
  });

  it("uses default formation for 5v5 format", () => {
    const initial = createInitialState("5v5");
    const state = setOpponentOverlay(initial, true);
    expect(state.opponentFormationKey).toBe("5v5-2-1-1");
    expect(state.opponentTokens).toHaveLength(5);
  });

  it("preserves own tokens when enabling overlay", () => {
    const initial = createInitialState("6v6");
    const state = setOpponentOverlay(initial, true);
    expect(state.ownTokens).toEqual(initial.ownTokens);
  });
});

describe("setOpponentFormation", () => {
  it("applies new formation to opponent with mirrored positions", () => {
    const initial = createInitialState("6v6");
    const enabled = setOpponentOverlay(initial, true);
    const state = setOpponentFormation(enabled, "6v6-2-1-2");
    const formation = getFormationById("6v6-2-1-2");

    expect(state.opponentFormationKey).toBe("6v6-2-1-2");
    expect(state.opponentTokens).toHaveLength(formation.positions.length);
    state.opponentTokens.forEach((token, i) => {
      expect(token.nx).toBeCloseTo(1 - formation.positions[i].nx);
      expect(token.ny).toBe(formation.positions[i].ny);
      expect(token.label).toBe(formation.positions[i].label);
    });
  });

  it("returns state unchanged if overlay is not enabled", () => {
    const initial = createInitialState("6v6");
    const state = setOpponentFormation(initial, "6v6-2-1-2");
    expect(state).toBe(initial);
  });

  it("returns state unchanged for unknown formation id", () => {
    const initial = createInitialState("6v6");
    const enabled = setOpponentOverlay(initial, true);
    const state = setOpponentFormation(enabled, "nonexistent");
    expect(state).toBe(enabled);
  });

  it("generates correct opp-N ids", () => {
    const initial = createInitialState("6v6");
    const enabled = setOpponentOverlay(initial, true);
    const state = setOpponentFormation(enabled, "6v6-1-3-1");
    state.opponentTokens.forEach((token, i) => {
      expect(token.id).toBe(`opp-${i}`);
      expect(token.team).toBe("opp");
    });
  });

  it("returns new state object (immutable)", () => {
    const initial = createInitialState("6v6");
    const enabled = setOpponentOverlay(initial, true);
    const state = setOpponentFormation(enabled, "6v6-overload");
    expect(state).not.toBe(enabled);
  });
});

describe("setOpponentTokenPosition", () => {
  it("updates the position of a specific opponent token", () => {
    const initial = createInitialState("6v6");
    const enabled = setOpponentOverlay(initial, true);
    const state = setOpponentTokenPosition(enabled, "opp-0", 0.3, 0.7);
    const token = state.opponentTokens.find((t) => t.id === "opp-0");
    expect(token.nx).toBe(0.3);
    expect(token.ny).toBe(0.7);
  });

  it("clamps nx and ny to [0, 1] range", () => {
    const initial = createInitialState("6v6");
    const enabled = setOpponentOverlay(initial, true);

    const state = setOpponentTokenPosition(enabled, "opp-0", -0.5, 1.5);
    const token = state.opponentTokens.find((t) => t.id === "opp-0");
    expect(token.nx).toBe(0);
    expect(token.ny).toBe(1);
  });

  it("clamps large positive values to 1", () => {
    const initial = createInitialState("6v6");
    const enabled = setOpponentOverlay(initial, true);

    const state = setOpponentTokenPosition(enabled, "opp-1", 2.0, 3.0);
    const token = state.opponentTokens.find((t) => t.id === "opp-1");
    expect(token.nx).toBe(1);
    expect(token.ny).toBe(1);
  });

  it("does not affect other opponent tokens", () => {
    const initial = createInitialState("6v6");
    const enabled = setOpponentOverlay(initial, true);
    const originalTokens = [...enabled.opponentTokens];
    const state = setOpponentTokenPosition(enabled, "opp-2", 0.8, 0.2);

    state.opponentTokens.forEach((token, i) => {
      if (token.id !== "opp-2") {
        expect(token.nx).toBe(originalTokens[i].nx);
        expect(token.ny).toBe(originalTokens[i].ny);
      }
    });
  });

  it("returns state unchanged for unknown token id", () => {
    const initial = createInitialState("6v6");
    const enabled = setOpponentOverlay(initial, true);
    const state = setOpponentTokenPosition(enabled, "opp-99", 0.5, 0.5);
    expect(state).toBe(enabled);
  });

  it("returns new state object (immutable)", () => {
    const initial = createInitialState("6v6");
    const enabled = setOpponentOverlay(initial, true);
    const state = setOpponentTokenPosition(enabled, "opp-0", 0.4, 0.6);
    expect(state).not.toBe(enabled);
  });

  it("allows position at exact boundaries (0 and 1)", () => {
    const initial = createInitialState("6v6");
    const enabled = setOpponentOverlay(initial, true);
    const state = setOpponentTokenPosition(enabled, "opp-0", 0, 1);
    const token = state.opponentTokens.find((t) => t.id === "opp-0");
    expect(token.nx).toBe(0);
    expect(token.ny).toBe(1);
  });
});
