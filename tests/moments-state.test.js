import { describe, it, expect } from "vitest";
import {
  createInitialState,
  applyMoment,
  addSavedMoment,
  deleteSavedMoment,
  validateSaveName,
} from "../src/state.js";
import { PREDEFINED_MOMENTS } from "../src/data.js";

describe("applyMoment", () => {
  const centerFaceoff = PREDEFINED_MOMENTS.find(
    (m) => m.id === "moment-center-faceoff"
  );

  it("sets own tokens from moment ownPositions", () => {
    const state = createInitialState("6v6");
    const result = applyMoment(state, centerFaceoff);

    expect(result.ownTokens).toHaveLength(centerFaceoff.ownPositions.length);
    result.ownTokens.forEach((token, i) => {
      expect(token.label).toBe(centerFaceoff.ownPositions[i].label);
      expect(token.nx).toBe(centerFaceoff.ownPositions[i].nx);
      expect(token.ny).toBe(centerFaceoff.ownPositions[i].ny);
      expect(token.team).toBe("own");
      expect(token.id).toBe(`own-${i}`);
    });
  });

  it("sets ball position from moment ballPosition", () => {
    const state = createInitialState("6v6");
    const result = applyMoment(state, centerFaceoff);

    expect(result.ball).toEqual({
      nx: centerFaceoff.ballPosition.nx,
      ny: centerFaceoff.ballPosition.ny,
    });
  });

  it("enables opponent overlay and creates opponent tokens when opponentPositions is non-null", () => {
    const state = createInitialState("6v6");
    const result = applyMoment(state, centerFaceoff);

    expect(result.opponentOverlayEnabled).toBe(true);
    expect(result.opponentTokens).toHaveLength(
      centerFaceoff.opponentPositions.length
    );
    result.opponentTokens.forEach((token, i) => {
      expect(token.label).toBe(centerFaceoff.opponentPositions[i].label);
      expect(token.nx).toBe(centerFaceoff.opponentPositions[i].nx);
      expect(token.ny).toBe(centerFaceoff.opponentPositions[i].ny);
      expect(token.team).toBe("opp");
      expect(token.id).toBe(`opp-${i}`);
    });
  });

  it("does not change opponent state when opponentPositions is null", () => {
    const momentNoOpponents = {
      id: "test-moment",
      name: "Test",
      ownPositions: [{ label: "G", nx: 0.5, ny: 0.92 }],
      opponentPositions: null,
      ballPosition: { nx: 0.5, ny: 0.5 },
    };
    const state = createInitialState("6v6");
    const result = applyMoment(state, momentNoOpponents);

    expect(result.opponentOverlayEnabled).toBe(false);
    expect(result.opponentTokens).toEqual([]);
  });

  it("stores a deep-copied snapshot as activeMomentSnapshot", () => {
    const state = createInitialState("6v6");
    const result = applyMoment(state, centerFaceoff);

    expect(result.activeMomentSnapshot).toEqual(centerFaceoff);
    // Verify it's a deep copy (not same reference)
    expect(result.activeMomentSnapshot).not.toBe(centerFaceoff);
    expect(result.activeMomentSnapshot.ownPositions).not.toBe(
      centerFaceoff.ownPositions
    );
  });

  it("sets activeMomentKey to moment.id", () => {
    const state = createInitialState("6v6");
    const result = applyMoment(state, centerFaceoff);

    expect(result.activeMomentKey).toBe("moment-center-faceoff");
  });

  it("returns new state object (immutable)", () => {
    const state = createInitialState("6v6");
    const result = applyMoment(state, centerFaceoff);

    expect(result).not.toBe(state);
  });

  it("snapshot is not affected by later state mutations", () => {
    const state = createInitialState("6v6");
    const result = applyMoment(state, centerFaceoff);

    // Mutate a token in the result
    const mutated = {
      ...result,
      ownTokens: result.ownTokens.map((t) => ({ ...t, nx: 0.1, ny: 0.1 })),
    };

    // Original snapshot should be unchanged
    expect(result.activeMomentSnapshot.ownPositions[0].nx).toBe(
      centerFaceoff.ownPositions[0].nx
    );
    expect(mutated.activeMomentSnapshot.ownPositions[0].nx).toBe(
      centerFaceoff.ownPositions[0].nx
    );
  });
});

describe("addSavedMoment", () => {
  it("appends moment to savedMoments array", () => {
    const state = createInitialState("6v6");
    const moment = { id: "user-1", name: "My Moment", isPredefined: false };
    const result = addSavedMoment(state, moment);

    expect(result.savedMoments).toHaveLength(1);
    expect(result.savedMoments[0]).toBe(moment);
  });

  it("does not mutate original state", () => {
    const state = createInitialState("6v6");
    const moment = { id: "user-1", name: "My Moment", isPredefined: false };
    const result = addSavedMoment(state, moment);

    expect(result).not.toBe(state);
    expect(state.savedMoments).toHaveLength(0);
  });

  it("preserves existing moments when adding a new one", () => {
    const state = createInitialState("6v6");
    const moment1 = { id: "user-1", name: "First", isPredefined: false };
    const moment2 = { id: "user-2", name: "Second", isPredefined: false };

    const state1 = addSavedMoment(state, moment1);
    const state2 = addSavedMoment(state1, moment2);

    expect(state2.savedMoments).toHaveLength(2);
    expect(state2.savedMoments[0]).toBe(moment1);
    expect(state2.savedMoments[1]).toBe(moment2);
  });
});

describe("deleteSavedMoment", () => {
  it("removes a user-saved moment by id", () => {
    const state = {
      ...createInitialState("6v6"),
      savedMoments: [
        { id: "user-1", name: "First", isPredefined: false },
        { id: "user-2", name: "Second", isPredefined: false },
      ],
    };
    const result = deleteSavedMoment(state, "user-1");

    expect(result.savedMoments).toHaveLength(1);
    expect(result.savedMoments[0].id).toBe("user-2");
  });

  it("ignores predefined moments — returns state unchanged", () => {
    const state = {
      ...createInitialState("6v6"),
      savedMoments: [
        { id: "predefined-1", name: "Predefined", isPredefined: true },
        { id: "user-1", name: "User Saved", isPredefined: false },
      ],
    };
    const result = deleteSavedMoment(state, "predefined-1");

    expect(result).toBe(state);
    expect(result.savedMoments).toHaveLength(2);
  });

  it("returns state unchanged when moment id is not found", () => {
    const state = {
      ...createInitialState("6v6"),
      savedMoments: [{ id: "user-1", name: "First", isPredefined: false }],
    };
    const result = deleteSavedMoment(state, "nonexistent");

    expect(result).toBe(state);
  });

  it("does not mutate original state", () => {
    const state = {
      ...createInitialState("6v6"),
      savedMoments: [{ id: "user-1", name: "First", isPredefined: false }],
    };
    const result = deleteSavedMoment(state, "user-1");

    expect(result).not.toBe(state);
    expect(state.savedMoments).toHaveLength(1);
    expect(result.savedMoments).toHaveLength(0);
  });
});

describe("validateSaveName", () => {
  it("accepts valid alphanumeric name", () => {
    const result = validateSaveName("My Formation 1");
    expect(result).toEqual({ valid: true, name: "My Formation 1" });
  });

  it("accepts name with hyphens and parentheses", () => {
    const result = validateSaveName("Power-Play (5v4)");
    expect(result).toEqual({ valid: true, name: "Power-Play (5v4)" });
  });

  it("trims whitespace from input", () => {
    const result = validateSaveName("  My Name  ");
    expect(result).toEqual({ valid: true, name: "My Name" });
  });

  it("rejects empty string", () => {
    const result = validateSaveName("");
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("rejects whitespace-only string", () => {
    const result = validateSaveName("   ");
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("rejects name longer than 50 characters", () => {
    const longName = "a".repeat(51);
    const result = validateSaveName(longName);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("accepts name exactly 50 characters", () => {
    const exactName = "a".repeat(50);
    const result = validateSaveName(exactName);
    expect(result).toEqual({ valid: true, name: exactName });
  });

  it("accepts single character name", () => {
    const result = validateSaveName("A");
    expect(result).toEqual({ valid: true, name: "A" });
  });

  it("rejects name with special characters", () => {
    const result = validateSaveName("My@Formation!");
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("rejects name with underscores", () => {
    const result = validateSaveName("my_formation");
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("rejects null/undefined input gracefully", () => {
    const result = validateSaveName(null);
    expect(result.valid).toBe(false);

    const result2 = validateSaveName(undefined);
    expect(result2.valid).toBe(false);
  });
});
