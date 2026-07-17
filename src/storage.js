/**
 * Storage Adapter — Ball Hockey Formations Tool
 *
 * Versioned localStorage adapter with validation and error handling.
 * Handles SecurityError for private browsing / iframe restrictions.
 */

/**
 * Custom error thrown when localStorage quota is exceeded.
 */
export class StorageQuotaExceededError extends Error {
  constructor(message = "Storage quota exceeded") {
    super(message);
    this.name = "StorageQuotaExceededError";
  }
}

/** Key prefix and storage keys */
const KEY_PREFIX = "bhf.v1.";

export const KEYS = {
  format: `${KEY_PREFIX}format`,
  savedMoments: `${KEY_PREFIX}savedMoments`,
  opponentState: `${KEY_PREFIX}opponentState`,
};

/** Valid format values */
const VALID_FORMATS = ["4v4", "5v5", "6v6"];

/**
 * Validates a single saved moment entry.
 * A valid moment must have: id (string), name (string), ownPositions (array with label/nx/ny entries).
 * @param {*} entry
 * @returns {boolean}
 */
function isValidMomentEntry(entry) {
  if (entry == null || typeof entry !== "object") return false;
  if (typeof entry.id !== "string" || entry.id.length === 0) return false;
  if (typeof entry.name !== "string" || entry.name.length === 0) return false;
  if (!Array.isArray(entry.ownPositions) || entry.ownPositions.length === 0) return false;

  // Validate each position in ownPositions
  for (const pos of entry.ownPositions) {
    if (pos == null || typeof pos !== "object") return false;
    if (typeof pos.label !== "string") return false;
    if (typeof pos.nx !== "number" || typeof pos.ny !== "number") return false;
  }

  return true;
}

/**
 * StorageAdapter — handles localStorage read/write with versioned keys,
 * validation, and error handling.
 */
export class StorageAdapter {
  constructor() {
    this._available = null;
  }

  /**
   * Detects whether localStorage is available.
   * Uses try/catch to handle SecurityError in private browsing / iframe restrictions.
   * @returns {boolean}
   */
  isAvailable() {
    if (this._available !== null) return this._available;

    try {
      const testKey = `${KEY_PREFIX}__test__`;
      localStorage.setItem(testKey, "1");
      localStorage.removeItem(testKey);
      this._available = true;
    } catch (e) {
      this._available = false;
    }

    return this._available;
  }

  /**
   * Reads a raw string value from localStorage.
   * Returns null if key doesn't exist or storage is unavailable.
   * @param {string} key - The full storage key (e.g., KEYS.format)
   * @returns {string|null}
   */
  read(key) {
    if (!this.isAvailable()) return null;

    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  /**
   * Writes a value to localStorage after JSON.stringify.
   * Throws StorageQuotaExceededError if quota is exceeded.
   * @param {string} key - The full storage key
   * @param {*} value - Value to store (will be JSON.stringified)
   * @throws {StorageQuotaExceededError}
   */
  write(key, value) {
    if (!this.isAvailable()) return;

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (e) {
      if (
        e.name === "QuotaExceededError" ||
        e.code === 22 ||
        e.code === 1014 ||
        e.message?.includes("quota")
      ) {
        throw new StorageQuotaExceededError();
      }
      // Re-throw SecurityError or other unexpected errors
      throw e;
    }
  }

  /**
   * Loads all persisted data from localStorage.
   * Validates JSON, discards corrupt entries, returns discardedCount.
   * Never throws — all errors are caught and handled gracefully.
   * @returns {{ format: string|null, savedMoments: Array, opponentState: object|null, discardedCount: number }}
   */
  loadAll() {
    const result = {
      format: null,
      savedMoments: [],
      opponentState: null,
      discardedCount: 0,
    };

    if (!this.isAvailable()) return result;

    // Load format
    const rawFormat = this.read(KEYS.format);
    if (rawFormat !== null) {
      try {
        const parsed = JSON.parse(rawFormat);
        if (VALID_FORMATS.includes(parsed)) {
          result.format = parsed;
        } else {
          result.discardedCount++;
        }
      } catch (e) {
        result.discardedCount++;
      }
    }

    // Load savedMoments
    const rawMoments = this.read(KEYS.savedMoments);
    if (rawMoments !== null) {
      try {
        const parsed = JSON.parse(rawMoments);
        if (Array.isArray(parsed)) {
          for (const entry of parsed) {
            if (isValidMomentEntry(entry)) {
              result.savedMoments.push(entry);
            } else {
              result.discardedCount++;
            }
          }
        } else {
          result.discardedCount++;
        }
      } catch (e) {
        result.discardedCount++;
      }
    }

    // Load opponentState
    const rawOpponent = this.read(KEYS.opponentState);
    if (rawOpponent !== null) {
      try {
        const parsed = JSON.parse(rawOpponent);
        if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
          result.opponentState = parsed;
        } else {
          result.discardedCount++;
        }
      } catch (e) {
        result.discardedCount++;
      }
    }

    return result;
  }
}
