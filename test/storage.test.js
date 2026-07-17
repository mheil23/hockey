/**
 * Unit tests for StorageAdapter (src/storage.js)
 *
 * Tests cover:
 * - isAvailable() detection
 * - read() and write() with key prefix
 * - loadAll() validation and corrupt data handling
 * - StorageQuotaExceededError
 * - SecurityError handling for private browsing / iframe
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { StorageAdapter, StorageQuotaExceededError, KEYS } from "../src/storage.js";

// Mock localStorage
function createMockLocalStorage() {
  const store = {};
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) delete store[key];
    }),
    _store: store,
  };
}

describe("StorageAdapter", () => {
  let mockStorage;
  let originalLocalStorage;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    originalLocalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  describe("isAvailable()", () => {
    it("returns true when localStorage is accessible", () => {
      const adapter = new StorageAdapter();
      expect(adapter.isAvailable()).toBe(true);
    });

    it("returns false when localStorage throws SecurityError", () => {
      mockStorage.setItem.mockImplementation(() => {
        const err = new DOMException("Access denied", "SecurityError");
        throw err;
      });
      const adapter = new StorageAdapter();
      expect(adapter.isAvailable()).toBe(false);
    });

    it("caches the availability result", () => {
      const adapter = new StorageAdapter();
      adapter.isAvailable();
      adapter.isAvailable();
      // setItem called once for the test key only
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe("KEYS", () => {
    it("uses bhf.v1.* prefix for all keys", () => {
      expect(KEYS.format).toBe("bhf.v1.format");
      expect(KEYS.savedMoments).toBe("bhf.v1.savedMoments");
      expect(KEYS.opponentState).toBe("bhf.v1.opponentState");
    });
  });

  describe("read(key)", () => {
    it("returns value from localStorage", () => {
      mockStorage._store["bhf.v1.format"] = '"6v6"';
      const adapter = new StorageAdapter();
      expect(adapter.read(KEYS.format)).toBe('"6v6"');
    });

    it("returns null for non-existent key", () => {
      const adapter = new StorageAdapter();
      expect(adapter.read(KEYS.format)).toBe(null);
    });

    it("returns null when storage is unavailable", () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new DOMException("Access denied", "SecurityError");
      });
      const adapter = new StorageAdapter();
      expect(adapter.read(KEYS.format)).toBe(null);
    });
  });

  describe("write(key, value)", () => {
    it("JSON.stringifies and stores value", () => {
      const adapter = new StorageAdapter();
      adapter.write(KEYS.format, "5v5");
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "bhf.v1.format",
        '"5v5"'
      );
    });

    it("stores arrays as JSON", () => {
      const adapter = new StorageAdapter();
      const moments = [{ id: "m1", name: "Test" }];
      adapter.write(KEYS.savedMoments, moments);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "bhf.v1.savedMoments",
        JSON.stringify(moments)
      );
    });

    it("throws StorageQuotaExceededError on quota exceeded", () => {
      const adapter = new StorageAdapter();
      // First call to setItem succeeds (for isAvailable test)
      // Subsequent calls throw QuotaExceededError
      let callCount = 0;
      mockStorage.setItem.mockImplementation((key, value) => {
        callCount++;
        if (callCount > 1) {
          const err = new DOMException("Quota exceeded", "QuotaExceededError");
          throw err;
        }
        mockStorage._store[key] = value;
      });
      expect(() => adapter.write(KEYS.format, "6v6")).toThrow(
        StorageQuotaExceededError
      );
    });

    it("does nothing when storage is unavailable", () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new DOMException("Access denied", "SecurityError");
      });
      const adapter = new StorageAdapter();
      // Should not throw
      adapter.write(KEYS.format, "6v6");
    });
  });

  describe("loadAll()", () => {
    it("returns defaults when storage is empty", () => {
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result).toEqual({
        format: null,
        savedMoments: [],
        opponentState: null,
        discardedCount: 0,
      });
    });

    it("loads valid format", () => {
      mockStorage._store[KEYS.format] = '"4v4"';
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.format).toBe("4v4");
      expect(result.discardedCount).toBe(0);
    });

    it("discards invalid format and increments discardedCount", () => {
      mockStorage._store[KEYS.format] = '"3v3"';
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.format).toBe(null);
      expect(result.discardedCount).toBe(1);
    });

    it("discards corrupt format JSON", () => {
      mockStorage._store[KEYS.format] = "not-json{{{";
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.format).toBe(null);
      expect(result.discardedCount).toBe(1);
    });

    it("loads valid savedMoments", () => {
      const moments = [
        {
          id: "m1",
          name: "Test Moment",
          ownPositions: [
            { label: "G", nx: 0.5, ny: 0.92 },
            { label: "C", nx: 0.5, ny: 0.5 },
          ],
        },
      ];
      mockStorage._store[KEYS.savedMoments] = JSON.stringify(moments);
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.savedMoments).toHaveLength(1);
      expect(result.savedMoments[0].id).toBe("m1");
      expect(result.discardedCount).toBe(0);
    });

    it("discards invalid moment entries but keeps valid ones", () => {
      const moments = [
        {
          id: "m1",
          name: "Valid",
          ownPositions: [{ label: "G", nx: 0.5, ny: 0.92 }],
        },
        { id: "", name: "Bad ID", ownPositions: [] }, // invalid: empty id
        { id: "m3", name: "No Positions", ownPositions: [] }, // invalid: empty ownPositions
        null, // invalid
      ];
      mockStorage._store[KEYS.savedMoments] = JSON.stringify(moments);
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.savedMoments).toHaveLength(1);
      expect(result.savedMoments[0].id).toBe("m1");
      expect(result.discardedCount).toBe(3);
    });

    it("discards savedMoments if not a JSON array", () => {
      mockStorage._store[KEYS.savedMoments] = '{"not": "array"}';
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.savedMoments).toEqual([]);
      expect(result.discardedCount).toBe(1);
    });

    it("discards corrupt savedMoments JSON", () => {
      mockStorage._store[KEYS.savedMoments] = "[invalid json";
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.savedMoments).toEqual([]);
      expect(result.discardedCount).toBe(1);
    });

    it("loads valid opponentState", () => {
      const oppState = { formationKey: "6v6-standard", enabled: true };
      mockStorage._store[KEYS.opponentState] = JSON.stringify(oppState);
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.opponentState).toEqual(oppState);
      expect(result.discardedCount).toBe(0);
    });

    it("discards opponentState if not an object", () => {
      mockStorage._store[KEYS.opponentState] = '"just a string"';
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.opponentState).toBe(null);
      expect(result.discardedCount).toBe(1);
    });

    it("discards opponentState if array", () => {
      mockStorage._store[KEYS.opponentState] = "[1,2,3]";
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.opponentState).toBe(null);
      expect(result.discardedCount).toBe(1);
    });

    it("discards corrupt opponentState JSON", () => {
      mockStorage._store[KEYS.opponentState] = "{bad json";
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.opponentState).toBe(null);
      expect(result.discardedCount).toBe(1);
    });

    it("never throws even with all corrupt data", () => {
      mockStorage._store[KEYS.format] = "{{bad";
      mockStorage._store[KEYS.savedMoments] = "[[bad";
      mockStorage._store[KEYS.opponentState] = "bad!!";
      const adapter = new StorageAdapter();
      expect(() => adapter.loadAll()).not.toThrow();
      const result = adapter.loadAll();
      expect(result.discardedCount).toBe(3);
    });

    it("returns defaults when storage is unavailable", () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new DOMException("Access denied", "SecurityError");
      });
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result).toEqual({
        format: null,
        savedMoments: [],
        opponentState: null,
        discardedCount: 0,
      });
    });

    it("validates ownPositions entries have proper fields", () => {
      const moments = [
        {
          id: "m1",
          name: "Bad Position",
          ownPositions: [{ label: "G", nx: "not a number", ny: 0.5 }],
        },
      ];
      mockStorage._store[KEYS.savedMoments] = JSON.stringify(moments);
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.savedMoments).toHaveLength(0);
      expect(result.discardedCount).toBe(1);
    });
  });

  describe("StorageQuotaExceededError", () => {
    it("extends Error", () => {
      const err = new StorageQuotaExceededError();
      expect(err).toBeInstanceOf(Error);
    });

    it("has correct name", () => {
      const err = new StorageQuotaExceededError();
      expect(err.name).toBe("StorageQuotaExceededError");
    });

    it("has default message", () => {
      const err = new StorageQuotaExceededError();
      expect(err.message).toBe("Storage quota exceeded");
    });

    it("accepts custom message", () => {
      const err = new StorageQuotaExceededError("Custom message");
      expect(err.message).toBe("Custom message");
    });
  });
});
