/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// We need to set up the DOM before importing the controller,
// because it registers a DOMContentLoaded listener on import.

function setupDOM() {
  document.body.innerHTML = `
    <header class="toolbar">
      <select id="format-select">
        <option value="4v4">4v4</option>
        <option value="5v5">5v5</option>
        <option value="6v6" selected>6v6</option>
      </select>
    </header>
    <main>
      <svg id="rink" viewBox="0 0 200 85" xmlns="http://www.w3.org/2000/svg">
        <g id="rink-markings"></g>
        <g id="arrows-layer"></g>
        <g id="tokens-layer"></g>
        <g id="ball-layer"></g>
      </svg>
    </main>
    <div id="notification-area"></div>
  `;
}

describe("controller — bootstrap", () => {
  beforeEach(() => {
    setupDOM();
    // Clear localStorage
    localStorage.clear();
  });

  it("bootstrap initializes state with default 6v6 format when no stored format", async () => {
    const { bootstrap } = await import("../src/controller.js");
    bootstrap();

    const formatSelect = document.getElementById("format-select");
    expect(formatSelect.value).toBe("6v6");

    // Tokens layer should have 6 tokens (6v6 default)
    const tokensLayer = document.getElementById("tokens-layer");
    const tokenGroups = tokensLayer.querySelectorAll("[data-token-id]");
    expect(tokenGroups.length).toBe(6);
  });

  it("bootstrap restores persisted format from localStorage", async () => {
    localStorage.setItem("bhf.v1.format", JSON.stringify("4v4"));

    // Re-import fresh module
    vi.resetModules();
    const { bootstrap } = await import("../src/controller.js");
    bootstrap();

    const formatSelect = document.getElementById("format-select");
    expect(formatSelect.value).toBe("4v4");

    const tokensLayer = document.getElementById("tokens-layer");
    const tokenGroups = tokensLayer.querySelectorAll("[data-token-id]");
    expect(tokenGroups.length).toBe(4); // 4v4 = 4 tokens
  });

  it("bootstrap renders ball at center (0.5, 0.5)", async () => {
    vi.resetModules();
    const { bootstrap } = await import("../src/controller.js");
    bootstrap();

    const ballLayer = document.getElementById("ball-layer");
    const ball = ballLayer.querySelector("[data-element='ball']");
    expect(ball).not.toBeNull();
    // Ball at normalized (0.5, 0.5) → pixel (22, 51.5) in viewBox 44x103
    expect(ball.getAttribute("cx")).toBe("100");
    expect(ball.getAttribute("cy")).toBe("42.5");
  });

  it("bootstrap shows notification when storage is unavailable", async () => {
    // Simulate storage unavailability by mocking
    vi.resetModules();

    // Make localStorage throw
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("SecurityError");
    };

    const { bootstrap } = await import("../src/controller.js");
    bootstrap();

    const notificationArea = document.getElementById("notification-area");
    const notifications = notificationArea.querySelectorAll(".notification");
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].textContent).toContain("Storage unavailable");

    // Restore
    Storage.prototype.setItem = originalSetItem;
  });

  it("bootstrap shows notification when data was discarded", async () => {
    // Store invalid format value
    localStorage.setItem("bhf.v1.format", "not-valid-json{{{");

    vi.resetModules();
    const { bootstrap } = await import("../src/controller.js");
    bootstrap();

    const notificationArea = document.getElementById("notification-area");
    const notifications = notificationArea.querySelectorAll(".notification");
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].textContent).toContain("could not be loaded");
  });

  it("bootstrap populates tokens for the active format", async () => {
    vi.resetModules();
    const { bootstrap } = await import("../src/controller.js");
    bootstrap();

    const tokensLayer = document.getElementById("tokens-layer");
    const tokenGroups = tokensLayer.querySelectorAll("[data-token-id]");
    // 6v6 has 6 tokens
    expect(tokenGroups.length).toBe(6);
  });
});

describe("controller — format selector", () => {
  beforeEach(() => {
    setupDOM();
    localStorage.clear();
  });

  it("changing format updates tokens to match new format count", async () => {
    vi.resetModules();
    const { bootstrap } = await import("../src/controller.js");
    bootstrap();

    const formatSelect = document.getElementById("format-select");
    formatSelect.value = "4v4";
    formatSelect.dispatchEvent(new Event("change"));

    const tokensLayer = document.getElementById("tokens-layer");
    const tokenGroups = tokensLayer.querySelectorAll("[data-token-id]");
    expect(tokenGroups.length).toBe(4);
  });

  it("changing format persists new format to localStorage", async () => {
    vi.resetModules();
    const { bootstrap } = await import("../src/controller.js");
    bootstrap();

    const formatSelect = document.getElementById("format-select");
    formatSelect.value = "5v5";
    formatSelect.dispatchEvent(new Event("change"));

    const stored = JSON.parse(localStorage.getItem("bhf.v1.format"));
    expect(stored).toBe("5v5");
  });

  it("changing format resets ball to center", async () => {
    vi.resetModules();
    const { bootstrap } = await import("../src/controller.js");
    bootstrap();

    const formatSelect = document.getElementById("format-select");
    formatSelect.value = "5v5";
    formatSelect.dispatchEvent(new Event("change"));

    const ballLayer = document.getElementById("ball-layer");
    const ball = ballLayer.querySelector("[data-element='ball']");
    expect(ball.getAttribute("cx")).toBe("100");
    expect(ball.getAttribute("cy")).toBe("42.5");
  });
});

