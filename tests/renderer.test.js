/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  toPixel,
  toNormalized,
  renderRink,
  renderTokens,
  renderBall,
  renderArrows,
} from "../src/renderer.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function createSvg() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 200 85");

  const layers = ["rink-markings", "arrows-layer", "tokens-layer", "ball-layer"];
  for (const id of layers) {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("id", id);
    svg.appendChild(g);
  }

  document.body.appendChild(svg);
  return svg;
}

describe("toPixel", () => {
  it("converts (0, 0) to (0, 0)", () => {
    const result = toPixel(0, 0);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it("converts (1, 1) to (44, 103)", () => {
    const result = toPixel(1, 1);
    expect(result).toEqual({ x: 200, y: 85 });
  });

  it("converts (0.5, 0.5) to rink center", () => {
    const result = toPixel(0.5, 0.5);
    expect(result).toEqual({ x: 100, y: 42.5 });
  });

  it("uses custom rinkRect when provided", () => {
    const result = toPixel(0.5, 0.5, { width: 100, height: 200 });
    expect(result).toEqual({ x: 50, y: 100 });
  });
});

describe("toNormalized", () => {
  it("converts (0, 0) to (0, 0)", () => {
    const result = toNormalized(0, 0);
    expect(result).toEqual({ nx: 0, ny: 0 });
  });

  it("converts (44, 103) to (1, 1)", () => {
    const result = toNormalized(200, 85);
    expect(result).toEqual({ nx: 1, ny: 1 });
  });

  it("clamps negative values to 0", () => {
    const result = toNormalized(-10, -20);
    expect(result).toEqual({ nx: 0, ny: 0 });
  });

  it("clamps values exceeding rink dimensions to 1", () => {
    const result = toNormalized(100, 200);
    expect(result).toEqual({ nx: 0.5, ny: 1 });
  });

  it("converts midpoint correctly", () => {
    const result = toNormalized(100, 42.5);
    expect(result.nx).toBeCloseTo(0.5);
    expect(result.ny).toBeCloseTo(0.5);
  });
});

describe("renderRink", () => {
  let svg;

  beforeEach(() => {
    document.body.innerHTML = "";
    svg = createSvg();
  });

  it("renders markings into #rink-markings group", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    expect(markings.children.length).toBeGreaterThan(0);
  });

  it("renders the rink surface with light grey fill (#e8e8e8)", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    const surface = markings.querySelector("rect");
    expect(surface).not.toBeNull();
    expect(surface.getAttribute("fill")).toBe("#e8e8e8");
    expect(surface.getAttribute("rx")).toBe("14");
    expect(surface.getAttribute("ry")).toBe("14");
    expect(surface.getAttribute("width")).toBe("200");
    expect(surface.getAttribute("height")).toBe("85");
  });

  it("renders board outline with rounded corners and dark stroke", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    const rects = markings.querySelectorAll("rect");
    const boards = rects[1];
    expect(boards.getAttribute("stroke")).toBe("#333333");
    expect(boards.getAttribute("fill")).toBe("none");
    expect(boards.getAttribute("rx")).toBe("14");
  });

  it("renders red center line as vertical at x=100", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    const lines = markings.querySelectorAll("line");
    // First line is the center line (red, vertical)
    const centerLine = lines[0];
    expect(centerLine).not.toBeNull();
    expect(centerLine.getAttribute("x1")).toBe("100");
    expect(centerLine.getAttribute("x2")).toBe("100");
    expect(centerLine.getAttribute("stroke")).toBe("#cc0000");
  });

  it("renders blue zone lines at x=66 and x=134", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    const lines = markings.querySelectorAll("line");
    // Lines 1 and 2 are blue lines (vertical)
    const blueLine1 = lines[1];
    const blueLine2 = lines[2];
    expect(blueLine1.getAttribute("stroke")).toBe("#0044aa");
    expect(blueLine2.getAttribute("stroke")).toBe("#0044aa");
    expect(blueLine1.getAttribute("x1")).toBe("66");
    expect(blueLine2.getAttribute("x1")).toBe("134");
  });

  it("renders center circle with blue stroke and radius 15 at (100, 42.5)", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    const circles = markings.querySelectorAll("circle");
    const centerCircle = circles[0];
    expect(centerCircle.getAttribute("cx")).toBe("100");
    expect(centerCircle.getAttribute("cy")).toBe("42.5");
    expect(centerCircle.getAttribute("r")).toBe("15");
    expect(centerCircle.getAttribute("fill")).toBe("none");
    expect(centerCircle.getAttribute("stroke")).toBe("#0044aa");
  });

  it("renders red face-off circles with radius 10 in the zones", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    const circles = markings.querySelectorAll("circle");
    // Face-off circles have red stroke and r=10
    const redCircles = Array.from(circles).filter(
      (c) => c.getAttribute("stroke") === "#cc0000" && c.getAttribute("r") === "10"
    );
    expect(redCircles.length).toBe(4);
  });

  it("positions face-off circles at (44,24), (44,61), (156,24), (156,61)", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    const circles = markings.querySelectorAll("circle");
    const faceOffCircles = Array.from(circles).filter(
      (c) => c.getAttribute("stroke") === "#cc0000" && c.getAttribute("r") === "10"
    );
    const positions = faceOffCircles.map((c) => ({
      cx: c.getAttribute("cx"),
      cy: c.getAttribute("cy"),
    }));
    expect(positions).toContainEqual({ cx: "44", cy: "24" });
    expect(positions).toContainEqual({ cx: "44", cy: "61" });
    expect(positions).toContainEqual({ cx: "156", cy: "24" });
    expect(positions).toContainEqual({ cx: "156", cy: "61" });
  });

  it("renders goal creases as arc paths with light blue fill", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    const paths = markings.querySelectorAll("path");
    // Creases have light blue fill
    const creases = Array.from(paths).filter((p) => p.getAttribute("fill") === "#a8d8f0");
    expect(creases.length).toBe(2);
    expect(creases[0].getAttribute("d")).toContain("A");
    expect(creases[1].getAttribute("d")).toContain("A");
  });

  it("renders goal frames as D-shaped paths with stroke-width 0.8", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    const paths = markings.querySelectorAll("path");
    // Goal frames have red stroke and stroke-width 0.8
    const goalFrames = Array.from(paths).filter(
      (p) => p.getAttribute("stroke") === "#cc0000" && parseFloat(p.getAttribute("stroke-width")) === 0.8
    );
    expect(goalFrames.length).toBe(2);
  });

  it("renders goal posts as red dots with r=0.7", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    const circles = markings.querySelectorAll("circle");
    // Find red circles with r=0.7 (goal posts)
    const posts = Array.from(circles).filter(
      (c) => c.getAttribute("fill") === "#cc0000" && c.getAttribute("r") === "0.7"
    );
    expect(posts.length).toBe(4); // 2 per goal
  });

  it("clears existing markings before re-rendering", () => {
    renderRink(svg, "6v6");
    const firstCount = svg.querySelector("#rink-markings").children.length;
    renderRink(svg, "5v5");
    const secondCount = svg.querySelector("#rink-markings").children.length;
    expect(firstCount).toBe(secondCount);
  });

  it("renders red goal lines at x=22 and x=178 with stroke-width 0.5", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    const lines = markings.querySelectorAll("line");
    // Goal lines are full-height vertical lines (y1=2, y2=83) with red stroke and 0.5 width
    const goalLines = Array.from(lines).filter(
      (l) =>
        l.getAttribute("stroke") === "#cc0000" &&
        parseFloat(l.getAttribute("stroke-width")) === 0.5 &&
        l.getAttribute("y1") === "2" &&
        l.getAttribute("y2") === "83"
    );
    expect(goalLines.length).toBe(2);
    const xPositions = goalLines.map((l) => l.getAttribute("x1"));
    expect(xPositions).toContain("22");
    expect(xPositions).toContain("178");
  });

  it("places opponent goal at left and own goal at right", () => {
    renderRink(svg, "6v6");
    const markings = svg.querySelector("#rink-markings");
    const paths = markings.querySelectorAll("path");
    // Goal frame paths with stroke-width 0.8
    const goalFrames = Array.from(paths).filter(
      (p) => p.getAttribute("stroke") === "#cc0000" && parseFloat(p.getAttribute("stroke-width")) === 0.8
    );
    expect(goalFrames.length).toBe(2);
    // First goal frame references left goal line area (x=22)
    expect(goalFrames[0].getAttribute("d")).toContain("22");
    // Second goal frame references right goal line area (x=178)
    expect(goalFrames[1].getAttribute("d")).toContain("178");
  });
});

describe("renderTokens", () => {
  let svg;

  beforeEach(() => {
    document.body.innerHTML = "";
    svg = createSvg();
  });

  it("renders own tokens as blue circles", () => {
    const ownTokens = [
      { id: "own-0", team: "own", label: "G", nx: 0.5, ny: 0.95, formationKey: "G" },
    ];
    renderTokens(svg, ownTokens, []);

    const layer = svg.querySelector("#tokens-layer");
    const circles = layer.querySelectorAll("circle");
    expect(circles).toHaveLength(1);
    expect(circles[0].getAttribute("fill")).toBe("#4a90d9");
  });

  it("renders opponent tokens as red circles", () => {
    const opponentTokens = [
      { id: "opp-0", team: "opp", label: "G", nx: 0.5, ny: 0.05, formationKey: "G" },
    ];
    renderTokens(svg, [], opponentTokens);

    const layer = svg.querySelector("#tokens-layer");
    const circles = layer.querySelectorAll("circle");
    expect(circles).toHaveLength(1);
    expect(circles[0].getAttribute("fill")).toBe("#d94a4a");
  });

  it("renders labels centered in tokens", () => {
    const ownTokens = [
      { id: "own-0", team: "own", label: "LW", nx: 0.3, ny: 0.5, formationKey: "LW" },
    ];
    renderTokens(svg, ownTokens, []);

    const layer = svg.querySelector("#tokens-layer");
    const text = layer.querySelector("text");
    expect(text.textContent).toBe("LW");
    expect(text.getAttribute("text-anchor")).toBe("middle");
    expect(text.getAttribute("dominant-baseline")).toBe("central");
    expect(text.getAttribute("fill")).toBe("#ffffff");
  });

  it("truncates labels to 5 characters", () => {
    const ownTokens = [
      { id: "own-0", team: "own", label: "LONGNAME", nx: 0.5, ny: 0.5, formationKey: "X" },
    ];
    renderTokens(svg, ownTokens, []);

    const layer = svg.querySelector("#tokens-layer");
    const text = layer.querySelector("text");
    expect(text.textContent).toBe("LONGN");
  });

  it("renders both own and opponent tokens", () => {
    const ownTokens = [
      { id: "own-0", team: "own", label: "C", nx: 0.5, ny: 0.5, formationKey: "C" },
      { id: "own-1", team: "own", label: "LW", nx: 0.3, ny: 0.4, formationKey: "LW" },
    ];
    const opponentTokens = [
      { id: "opp-0", team: "opp", label: "G", nx: 0.5, ny: 0.05, formationKey: "G" },
    ];
    renderTokens(svg, ownTokens, opponentTokens);

    const layer = svg.querySelector("#tokens-layer");
    const groups = layer.querySelectorAll("g");
    expect(groups).toHaveLength(3);
  });

  it("clears previous tokens on re-render", () => {
    const ownTokens = [
      { id: "own-0", team: "own", label: "C", nx: 0.5, ny: 0.5, formationKey: "C" },
    ];
    renderTokens(svg, ownTokens, []);
    renderTokens(svg, ownTokens, []);

    const layer = svg.querySelector("#tokens-layer");
    const groups = layer.querySelectorAll("g");
    expect(groups).toHaveLength(1);
  });

  it("positions tokens at correct SVG coordinates", () => {
    const ownTokens = [
      { id: "own-0", team: "own", label: "G", nx: 0.5, ny: 0.95, formationKey: "G" },
    ];
    renderTokens(svg, ownTokens, []);

    const circle = svg.querySelector("#tokens-layer circle");
    expect(parseFloat(circle.getAttribute("cx"))).toBeCloseTo(100); // 0.5 * 200
    expect(parseFloat(circle.getAttribute("cy"))).toBeCloseTo(80.75); // 0.95 * 85
  });

  it("sets data-token-id attribute on token groups", () => {
    const ownTokens = [
      { id: "own-0", team: "own", label: "C", nx: 0.5, ny: 0.5, formationKey: "C" },
    ];
    renderTokens(svg, ownTokens, []);

    const g = svg.querySelector("#tokens-layer g");
    expect(g.getAttribute("data-token-id")).toBe("own-0");
    expect(g.getAttribute("data-team")).toBe("own");
  });

  it("uses correct token radius", () => {
    const ownTokens = [
      { id: "own-0", team: "own", label: "C", nx: 0.5, ny: 0.5, formationKey: "C" },
    ];
    renderTokens(svg, ownTokens, []);

    const circle = svg.querySelector("#tokens-layer circle");
    const r = parseFloat(circle.getAttribute("r"));
    // Diameter should be between 3% and 6% of 44 (viewBox width)
    const diameter = r * 2;
    expect(diameter).toBeGreaterThanOrEqual(200 * 0.03);
    expect(diameter).toBeLessThanOrEqual(200 * 0.06);
  });

  it("renders empty arrays without errors", () => {
    renderTokens(svg, [], []);
    const layer = svg.querySelector("#tokens-layer");
    expect(layer.children).toHaveLength(0);
  });
});

describe("renderBall", () => {
  let svg;

  beforeEach(() => {
    document.body.innerHTML = "";
    svg = createSvg();
  });

  it("renders ball as orange circle", () => {
    renderBall(svg, { nx: 0.5, ny: 0.5 });

    const layer = svg.querySelector("#ball-layer");
    const circle = layer.querySelector("circle");
    expect(circle).not.toBeNull();
    expect(circle.getAttribute("fill")).toBe("#000000");
  });

  it("renders ball smaller than tokens", () => {
    renderBall(svg, { nx: 0.5, ny: 0.5 });

    const circle = svg.querySelector("#ball-layer circle");
    const ballRadius = parseFloat(circle.getAttribute("r"));
    // Ball radius (0.5) should be smaller than token radius (0.77)
    expect(ballRadius).toBeLessThan(3.5);
  });

  it("positions ball at correct SVG coordinates", () => {
    renderBall(svg, { nx: 0.5, ny: 0.5 });

    const circle = svg.querySelector("#ball-layer circle");
    expect(parseFloat(circle.getAttribute("cx"))).toBeCloseTo(100);
    expect(parseFloat(circle.getAttribute("cy"))).toBeCloseTo(42.5);
  });

  it("clears previous ball on re-render", () => {
    renderBall(svg, { nx: 0.5, ny: 0.5 });
    renderBall(svg, { nx: 0.3, ny: 0.7 });

    const layer = svg.querySelector("#ball-layer");
    const circles = layer.querySelectorAll("circle");
    expect(circles).toHaveLength(1);
  });

  it("sets data-element attribute", () => {
    renderBall(svg, { nx: 0.5, ny: 0.5 });

    const circle = svg.querySelector("#ball-layer circle");
    expect(circle.getAttribute("data-element")).toBe("ball");
  });

  it("ball color is distinct from own and opponent token colors", () => {
    renderBall(svg, { nx: 0.5, ny: 0.5 });

    const circle = svg.querySelector("#ball-layer circle");
    const fill = circle.getAttribute("fill");
    expect(fill).not.toBe("#4a90d9"); // not blue (own)
    expect(fill).not.toBe("#d94a4a"); // not red (opponent)
  });
});

describe("renderArrows", () => {
  let svg;

  beforeEach(() => {
    document.body.innerHTML = "";
    svg = createSvg();
  });

  it("renders arrow paths in #arrows-layer", () => {
    const arrows = [
      { id: "a1", startNx: 0.2, startNy: 0.3, endNx: 0.8, endNy: 0.7, style: "solid" },
    ];
    renderArrows(svg, arrows);

    const layer = svg.querySelector("#arrows-layer");
    const paths = layer.querySelectorAll("path");
    expect(paths).toHaveLength(1);
  });

  it("renders solid arrows without stroke-dasharray", () => {
    const arrows = [
      { id: "a1", startNx: 0.2, startNy: 0.3, endNx: 0.8, endNy: 0.7, style: "solid" },
    ];
    renderArrows(svg, arrows);

    const path = svg.querySelector("#arrows-layer path");
    expect(path.getAttribute("stroke-dasharray")).toBeNull();
  });

  it("renders dashed arrows with stroke-dasharray", () => {
    const arrows = [
      { id: "a1", startNx: 0.2, startNy: 0.3, endNx: 0.8, endNy: 0.7, style: "dashed" },
    ];
    renderArrows(svg, arrows);

    const path = svg.querySelector("#arrows-layer path");
    expect(path.getAttribute("stroke-dasharray")).toBe("6,3");
  });

  it("applies arrowhead marker to arrows", () => {
    const arrows = [
      { id: "a1", startNx: 0.1, startNy: 0.1, endNx: 0.9, endNy: 0.9, style: "solid" },
    ];
    renderArrows(svg, arrows);

    const path = svg.querySelector("#arrows-layer path");
    expect(path.getAttribute("marker-end")).toContain("url(#arrowhead-marker)");
  });

  it("creates arrowhead marker in defs", () => {
    const arrows = [
      { id: "a1", startNx: 0.1, startNy: 0.1, endNx: 0.9, endNy: 0.9, style: "solid" },
    ];
    renderArrows(svg, arrows);

    const marker = svg.querySelector("defs #arrowhead-marker");
    expect(marker).not.toBeNull();
    expect(marker.querySelector("polygon")).not.toBeNull();
  });

  it("renders multiple arrows", () => {
    const arrows = [
      { id: "a1", startNx: 0.1, startNy: 0.1, endNx: 0.5, endNy: 0.5, style: "solid" },
      { id: "a2", startNx: 0.3, startNy: 0.3, endNx: 0.9, endNy: 0.9, style: "dashed" },
      { id: "a3", startNx: 0.0, startNy: 0.0, endNx: 1.0, endNy: 1.0, style: "solid" },
    ];
    renderArrows(svg, arrows);

    const layer = svg.querySelector("#arrows-layer");
    expect(layer.querySelectorAll("path")).toHaveLength(3);
  });

  it("clears previous arrows on re-render", () => {
    const arrows1 = [
      { id: "a1", startNx: 0.1, startNy: 0.1, endNx: 0.5, endNy: 0.5, style: "solid" },
    ];
    renderArrows(svg, arrows1);

    const arrows2 = [
      { id: "a2", startNx: 0.3, startNy: 0.3, endNx: 0.8, endNy: 0.8, style: "dashed" },
    ];
    renderArrows(svg, arrows2);

    const layer = svg.querySelector("#arrows-layer");
    expect(layer.querySelectorAll("path")).toHaveLength(1);
  });

  it("renders empty array without errors", () => {
    renderArrows(svg, []);

    const layer = svg.querySelector("#arrows-layer");
    expect(layer.querySelectorAll("path")).toHaveLength(0);
  });

  it("sets data-arrow-id attribute on paths", () => {
    const arrows = [
      { id: "a1", startNx: 0.1, startNy: 0.1, endNx: 0.5, endNy: 0.5, style: "solid" },
    ];
    renderArrows(svg, arrows);

    const path = svg.querySelector("#arrows-layer path");
    expect(path.getAttribute("data-arrow-id")).toBe("a1");
  });

  it("uses quadratic Bézier path (Q command)", () => {
    const arrows = [
      { id: "a1", startNx: 0.2, startNy: 0.3, endNx: 0.8, endNy: 0.7, style: "solid" },
    ];
    renderArrows(svg, arrows);

    const path = svg.querySelector("#arrows-layer path");
    const d = path.getAttribute("d");
    expect(d).toMatch(/^M .+ Q .+ .+$/);
  });

  it("arrow stroke color is light for visibility on rink", () => {
    const arrows = [
      { id: "a1", startNx: 0.1, startNy: 0.1, endNx: 0.9, endNy: 0.9, style: "solid" },
    ];
    renderArrows(svg, arrows);

    const path = svg.querySelector("#arrows-layer path");
    expect(path.getAttribute("stroke")).toBe("#000000");
  });
});

describe("Layer structure", () => {
  let svg;

  beforeEach(() => {
    document.body.innerHTML = "";
    svg = createSvg();
  });

  it("maintains correct layer order after rendering", () => {
    renderTokens(svg, [{ id: "own-0", team: "own", label: "C", nx: 0.5, ny: 0.5, formationKey: "C" }], []);
    renderBall(svg, { nx: 0.5, ny: 0.5 });
    renderArrows(svg, [{ id: "a1", startNx: 0.1, startNy: 0.1, endNx: 0.9, endNy: 0.9, style: "solid" }]);

    const groups = svg.querySelectorAll("g[id]");
    const ids = Array.from(groups).map((g) => g.id);
    expect(ids).toEqual(["rink-markings", "arrows-layer", "tokens-layer", "ball-layer"]);
  });

  it("creates layers if SVG starts empty", () => {
    const emptySvg = document.createElementNS(SVG_NS, "svg");
    document.body.appendChild(emptySvg);

    renderTokens(emptySvg, [], []);

    expect(emptySvg.querySelector("#rink-markings")).not.toBeNull();
    expect(emptySvg.querySelector("#arrows-layer")).not.toBeNull();
    expect(emptySvg.querySelector("#tokens-layer")).not.toBeNull();
    expect(emptySvg.querySelector("#ball-layer")).not.toBeNull();
  });
});
