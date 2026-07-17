/**
 * Renderer — Ball Hockey Formations Tool
 *
 * SVG renderer that patches the DOM based on application state.
 * Never mutates state — only reads it and updates SVG elements.
 */

// Rink geometry constants (viewBox: "0 0 200 85" — landscape, regulation proportions)
const RINK_WIDTH = 200;
const RINK_HEIGHT = 85;

// Token styling
const OWN_TOKEN_FILL = "#4a90d9";
const OPP_TOKEN_FILL = "#d94a4a";
const TOKEN_LABEL_FILL = "#ffffff";
const TOKEN_RADIUS = 3.5; // ~3.5% of 200 width = 7 diameter
const TOKEN_FONT_SIZE = 3;

// Ball styling
const BALL_FILL = "#000000";
const BALL_RADIUS = 2.2;

// Arrow styling
const ARROW_COLOR = "#000000";
const ARROW_STROKE_WIDTH = 1.5;
const ARROW_DASH = "6,3";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Converts normalized coordinates (0–1) to SVG pixel coordinates.
 * @param {number} nx - Normalized x [0, 1]
 * @param {number} ny - Normalized y [0, 1]
 * @param {{ width: number, height: number }} rinkRect
 * @returns {{ x: number, y: number }}
 */
export function toPixel(nx, ny, rinkRect = { width: RINK_WIDTH, height: RINK_HEIGHT }) {
  return {
    x: nx * rinkRect.width,
    y: ny * rinkRect.height,
  };
}

/**
 * Converts SVG pixel coordinates to normalized coordinates, clamped to [0, 1].
 * @param {number} px - Pixel x
 * @param {number} py - Pixel y
 * @param {{ width: number, height: number }} rinkRect
 * @returns {{ nx: number, ny: number }}
 */
export function toNormalized(px, py, rinkRect = { width: RINK_WIDTH, height: RINK_HEIGHT }) {
  return {
    nx: Math.max(0, Math.min(1, px / rinkRect.width)),
    ny: Math.max(0, Math.min(1, py / rinkRect.height)),
  };
}

// Rink colors — regulation hockey rink style
const RINK_SURFACE_COLOR = "#e8e8e8"; // Light grey/white ice-like surface
const BOARD_COLOR = "#333333";
const RED_LINE_COLOR = "#cc0000";
const BLUE_LINE_COLOR = "#0044aa";
const CREASE_FILL = "#a8d8f0"; // Light blue crease
const MARKING_COLOR = "#000000";
const GOAL_LINE_COLOR = "#cc0000";
const MARKING_STROKE_WIDTH = 0.5;
const CORNER_RADIUS = 14;

// Rink geometry: viewBox 0 0 200 85 (landscape)
// Center: (100, 42.5)
// Blue lines at ~1/3 and ~2/3 of width
const CENTER_X = RINK_WIDTH / 2;   // 100
const CENTER_Y = RINK_HEIGHT / 2;  // 42.5
const BLUE_LINE_LEFT = 66;          // Left blue line x position
const BLUE_LINE_RIGHT = 134;        // Right blue line x position
const GOAL_LINE_LEFT = 22;          // Left goal line x position
const GOAL_LINE_RIGHT = 178;        // Right goal line x position

/**
 * Helper: creates an SVG element with attributes.
 */
function svgCreate(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, val] of Object.entries(attrs)) {
    el.setAttribute(key, String(val));
  }
  return el;
}

/**
 * Renders a face-off circle with hash marks at a given position.
 */
function renderFaceOffCircle(group, cx, cy, radius, color) {
  // Circle
  group.appendChild(svgCreate("circle", {
    cx, cy, r: radius, fill: "none", stroke: color, "stroke-width": 0.5,
  }));
  // Center dot
  group.appendChild(svgCreate("circle", {
    cx, cy, r: 1, fill: color,
  }));
  // Hash marks (4 small lines on the circle exterior)
  const hashLen = 2.5;
  const hashOffset = radius + 0.8;
  const hashPositions = [
    { x1: cx - hashOffset, y1: cy - 3, x2: cx - hashOffset, y2: cy - 3 - hashLen },
    { x1: cx - hashOffset, y1: cy + 3, x2: cx - hashOffset, y2: cy + 3 + hashLen },
    { x1: cx + hashOffset, y1: cy - 3, x2: cx + hashOffset, y2: cy - 3 - hashLen },
    { x1: cx + hashOffset, y1: cy + 3, x2: cx + hashOffset, y2: cy + 3 + hashLen },
  ];
  for (const h of hashPositions) {
    group.appendChild(svgCreate("line", {
      ...h, stroke: color, "stroke-width": 0.5,
    }));
  }
}

/**
 * Renders static rink markings into the #rink-markings group.
 * Draws a regulation-style hockey rink in landscape orientation:
 * - Left end = opponent goal, Right end = own goal
 * - Red center line, blue zone lines, red goal lines
 * - Face-off circles with hash marks
 * - Goal creases (light blue filled)
 * - D-shaped goal frames
 * - Rounded corner boards
 *
 * @param {SVGElement} svgEl - The root SVG element containing #rink-markings
 * @param {string} format - Game format ("4v4", "5v5", "6v6") — reserved for future use
 */
export function renderRink(svgEl, format) {
  ensureLayers(svgEl);
  const markingsGroup = svgEl.querySelector("#rink-markings");
  if (!markingsGroup) return;

  // Clear existing markings
  markingsGroup.innerHTML = "";

  // === RINK SURFACE ===
  markingsGroup.appendChild(svgCreate("rect", {
    x: 0, y: 0, width: RINK_WIDTH, height: RINK_HEIGHT,
    rx: CORNER_RADIUS, ry: CORNER_RADIUS, fill: RINK_SURFACE_COLOR,
  }));

  // === BOARDS (thick dark outline with rounded corners) ===
  markingsGroup.appendChild(svgCreate("rect", {
    x: 1, y: 1, width: RINK_WIDTH - 2, height: RINK_HEIGHT - 2,
    rx: CORNER_RADIUS, ry: CORNER_RADIUS,
    fill: "none", stroke: BOARD_COLOR, "stroke-width": 1.5,
  }));

  // === RED CENTER LINE (vertical at center) ===
  markingsGroup.appendChild(svgCreate("line", {
    x1: CENTER_X, y1: 2, x2: CENTER_X, y2: RINK_HEIGHT - 2,
    stroke: RED_LINE_COLOR, "stroke-width": 1.2,
  }));

  // === BLUE LINES (vertical zone boundaries) ===
  markingsGroup.appendChild(svgCreate("line", {
    x1: BLUE_LINE_LEFT, y1: 2, x2: BLUE_LINE_LEFT, y2: RINK_HEIGHT - 2,
    stroke: BLUE_LINE_COLOR, "stroke-width": 1.0,
  }));
  markingsGroup.appendChild(svgCreate("line", {
    x1: BLUE_LINE_RIGHT, y1: 2, x2: BLUE_LINE_RIGHT, y2: RINK_HEIGHT - 2,
    stroke: BLUE_LINE_COLOR, "stroke-width": 1.0,
  }));

  // === GOAL LINES (vertical, red, thin) ===
  markingsGroup.appendChild(svgCreate("line", {
    x1: GOAL_LINE_LEFT, y1: 2, x2: GOAL_LINE_LEFT, y2: RINK_HEIGHT - 2,
    stroke: GOAL_LINE_COLOR, "stroke-width": 0.5,
  }));
  markingsGroup.appendChild(svgCreate("line", {
    x1: GOAL_LINE_RIGHT, y1: 2, x2: GOAL_LINE_RIGHT, y2: RINK_HEIGHT - 2,
    stroke: GOAL_LINE_COLOR, "stroke-width": 0.5,
  }));

  // === CENTER CIRCLE ===
  markingsGroup.appendChild(svgCreate("circle", {
    cx: CENTER_X, cy: CENTER_Y, r: 15,
    fill: "none", stroke: BLUE_LINE_COLOR, "stroke-width": 0.5,
  }));

  // === CENTER ICE DOT ===
  markingsGroup.appendChild(svgCreate("circle", {
    cx: CENTER_X, cy: CENTER_Y, r: 1.2, fill: BLUE_LINE_COLOR,
  }));

  // === FACE-OFF CIRCLES (4 zone circles — red) ===
  const faceOffPositions = [
    { cx: 44, cy: 24 },   // Left-top (offensive zone)
    { cx: 44, cy: 61 },   // Left-bottom
    { cx: 156, cy: 24 },  // Right-top (defensive zone)
    { cx: 156, cy: 61 },  // Right-bottom
  ];
  for (const pos of faceOffPositions) {
    renderFaceOffCircle(markingsGroup, pos.cx, pos.cy, 10, RED_LINE_COLOR);
  }

  // === NEUTRAL ZONE DOTS (4 small dots near blue lines) ===
  const neutralDots = [
    { cx: BLUE_LINE_LEFT + 4, cy: 24 },
    { cx: BLUE_LINE_LEFT + 4, cy: 61 },
    { cx: BLUE_LINE_RIGHT - 4, cy: 24 },
    { cx: BLUE_LINE_RIGHT - 4, cy: 61 },
  ];
  for (const pos of neutralDots) {
    markingsGroup.appendChild(svgCreate("circle", {
      cx: pos.cx, cy: pos.cy, r: 0.8, fill: RED_LINE_COLOR,
    }));
  }

  // === GOAL CREASES (light blue semi-circles) ===
  // Left crease (opponent goal — opens to the right)
  markingsGroup.appendChild(svgCreate("path", {
    d: `M ${GOAL_LINE_LEFT} ${CENTER_Y - 6} A 7 7 0 0 1 ${GOAL_LINE_LEFT} ${CENTER_Y + 6}`,
    fill: CREASE_FILL, stroke: RED_LINE_COLOR, "stroke-width": 0.5,
  }));
  // Right crease (own goal — opens to the left)
  markingsGroup.appendChild(svgCreate("path", {
    d: `M ${GOAL_LINE_RIGHT} ${CENTER_Y - 6} A 7 7 0 0 0 ${GOAL_LINE_RIGHT} ${CENTER_Y + 6}`,
    fill: CREASE_FILL, stroke: RED_LINE_COLOR, "stroke-width": 0.5,
  }));

  // === GOAL FRAMES (D-shaped) ===
  const goalWidth = 6; // half-height of goal opening
  const goalDepth = 5; // depth behind goal line

  // Left goal frame (opponent — opens to the right)
  markingsGroup.appendChild(svgCreate("path", {
    d: `M ${GOAL_LINE_LEFT} ${CENTER_Y - goalWidth} L ${GOAL_LINE_LEFT - goalDepth + 1.5} ${CENTER_Y - goalWidth} Q ${GOAL_LINE_LEFT - goalDepth} ${CENTER_Y - goalWidth} ${GOAL_LINE_LEFT - goalDepth} ${CENTER_Y - goalWidth + 1.5} L ${GOAL_LINE_LEFT - goalDepth} ${CENTER_Y + goalWidth - 1.5} Q ${GOAL_LINE_LEFT - goalDepth} ${CENTER_Y + goalWidth} ${GOAL_LINE_LEFT - goalDepth + 1.5} ${CENTER_Y + goalWidth} L ${GOAL_LINE_LEFT} ${CENTER_Y + goalWidth}`,
    fill: "none", stroke: "#cc0000", "stroke-width": 0.8,
  }));
  // Left goal posts
  markingsGroup.appendChild(svgCreate("circle", {
    cx: GOAL_LINE_LEFT, cy: CENTER_Y - goalWidth, r: 0.7, fill: "#cc0000",
  }));
  markingsGroup.appendChild(svgCreate("circle", {
    cx: GOAL_LINE_LEFT, cy: CENTER_Y + goalWidth, r: 0.7, fill: "#cc0000",
  }));
  // Left goal net mesh
  for (let i = 1; i <= 3; i++) {
    const x = GOAL_LINE_LEFT - (goalDepth * i / 4);
    markingsGroup.appendChild(svgCreate("line", {
      x1: x, y1: CENTER_Y - goalWidth + 1,
      x2: x, y2: CENTER_Y + goalWidth - 1,
      stroke: "#cccccc", "stroke-width": 0.3,
    }));
  }

  // Right goal frame (own — opens to the left)
  markingsGroup.appendChild(svgCreate("path", {
    d: `M ${GOAL_LINE_RIGHT} ${CENTER_Y - goalWidth} L ${GOAL_LINE_RIGHT + goalDepth - 1.5} ${CENTER_Y - goalWidth} Q ${GOAL_LINE_RIGHT + goalDepth} ${CENTER_Y - goalWidth} ${GOAL_LINE_RIGHT + goalDepth} ${CENTER_Y - goalWidth + 1.5} L ${GOAL_LINE_RIGHT + goalDepth} ${CENTER_Y + goalWidth - 1.5} Q ${GOAL_LINE_RIGHT + goalDepth} ${CENTER_Y + goalWidth} ${GOAL_LINE_RIGHT + goalDepth - 1.5} ${CENTER_Y + goalWidth} L ${GOAL_LINE_RIGHT} ${CENTER_Y + goalWidth}`,
    fill: "none", stroke: "#cc0000", "stroke-width": 0.8,
  }));
  // Right goal posts
  markingsGroup.appendChild(svgCreate("circle", {
    cx: GOAL_LINE_RIGHT, cy: CENTER_Y - goalWidth, r: 0.7, fill: "#cc0000",
  }));
  markingsGroup.appendChild(svgCreate("circle", {
    cx: GOAL_LINE_RIGHT, cy: CENTER_Y + goalWidth, r: 0.7, fill: "#cc0000",
  }));
  // Right goal net mesh
  for (let i = 1; i <= 3; i++) {
    const x = GOAL_LINE_RIGHT + (goalDepth * i / 4);
    markingsGroup.appendChild(svgCreate("line", {
      x1: x, y1: CENTER_Y - goalWidth + 1,
      x2: x, y2: CENTER_Y + goalWidth - 1,
      stroke: "#cccccc", "stroke-width": 0.3,
    }));
  }
}

/**
 * Ensures the SVG has the required layered <g> groups in the correct order.
 * Creates them if they don't exist.
 * @param {SVGElement} svgEl
 */
function ensureLayers(svgEl) {
  const layerIds = ["rink-markings", "arrows-layer", "tokens-layer", "ball-layer"];
  for (const id of layerIds) {
    if (!svgEl.querySelector(`#${id}`)) {
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("id", id);
      svgEl.appendChild(g);
    }
  }
}

/**
 * Renders own-team and opponent-team tokens into the #tokens-layer group.
 * Clears and re-renders all tokens each call (simple DOM patching approach).
 *
 * Own tokens: blue (#4a90d9), Opponent tokens: red (#d94a4a)
 * Each token is a circle with a centered text label (max 5 chars, white).
 *
 * @param {SVGElement} svgEl - The root SVG element
 * @param {PositionToken[]} ownTokens - Array of own-team tokens
 * @param {PositionToken[]} opponentTokens - Array of opponent-team tokens
 */
export function renderTokens(svgEl, ownTokens, opponentTokens) {
  ensureLayers(svgEl);
  const layer = svgEl.querySelector("#tokens-layer");
  layer.innerHTML = "";

  const allTokens = [
    ...opponentTokens.map((t) => ({ ...t, fill: OPP_TOKEN_FILL })),
    ...ownTokens.map((t) => ({ ...t, fill: OWN_TOKEN_FILL })),
  ];

  for (const token of allTokens) {
    const { x, y } = toPixel(token.nx, token.ny);

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("data-token-id", token.id);
    g.setAttribute("data-team", token.team);

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", TOKEN_RADIUS);
    circle.setAttribute("fill", token.fill);
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "0.1");

    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.setAttribute("fill", TOKEN_LABEL_FILL);
    text.setAttribute("font-size", TOKEN_FONT_SIZE);
    text.setAttribute("font-family", "system-ui, sans-serif");
    text.setAttribute("pointer-events", "none");
    text.textContent = (token.label || "").slice(0, 5);

    g.appendChild(circle);
    g.appendChild(text);
    layer.appendChild(g);
  }
}

/**
 * Renders the ball into the #ball-layer group.
 * Ball is orange (#f5a623), smaller than tokens (radius 0.5).
 *
 * @param {SVGElement} svgEl - The root SVG element
 * @param {{ nx: number, ny: number }} ball - Ball position in normalized coords
 */
export function renderBall(svgEl, ball) {
  ensureLayers(svgEl);
  const layer = svgEl.querySelector("#ball-layer");
  layer.innerHTML = "";

  const { x, y } = toPixel(ball.nx, ball.ny);

  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("cx", x);
  circle.setAttribute("cy", y);
  circle.setAttribute("r", BALL_RADIUS);
  circle.setAttribute("fill", BALL_FILL);
  circle.setAttribute("stroke", "#ffffff");
  circle.setAttribute("stroke-width", "0.08");
  circle.setAttribute("data-element", "ball");

  layer.appendChild(circle);
}

/**
 * Ensures a <defs> element with the arrowhead marker exists in the SVG.
 * Returns the marker id to reference with marker-end.
 * @param {SVGElement} svgEl
 * @returns {string} The marker id
 */
function ensureArrowMarker(svgEl) {
  const markerId = "arrowhead-marker";
  let defs = svgEl.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(SVG_NS, "defs");
    svgEl.insertBefore(defs, svgEl.firstChild);
  }

  if (!defs.querySelector(`#${markerId}`)) {
    const marker = document.createElementNS(SVG_NS, "marker");
    marker.setAttribute("id", markerId);
    marker.setAttribute("markerWidth", "4");
    marker.setAttribute("markerHeight", "4");
    marker.setAttribute("refX", "3");
    marker.setAttribute("refY", "2");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "strokeWidth");

    const polygon = document.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("points", "0,0 4,2 0,4");
    polygon.setAttribute("fill", ARROW_COLOR);

    marker.appendChild(polygon);
    defs.appendChild(marker);
  }

  return markerId;
}

/**
 * Renders movement arrows into the #arrows-layer group.
 * Arrows are quadratic Bézier curves with arrowhead markers.
 * Solid arrows have no dash; dashed arrows use stroke-dasharray "2,1".
 *
 * @param {SVGElement} svgEl - The root SVG element
 * @param {Arrow[]} arrows - Array of arrow objects
 */
export function renderArrows(svgEl, arrows) {
  ensureLayers(svgEl);
  const layer = svgEl.querySelector("#arrows-layer");
  layer.innerHTML = "";

  if (arrows.length === 0) return;

  const markerId = ensureArrowMarker(svgEl);

  for (const arrow of arrows) {
    const start = toPixel(arrow.startNx, arrow.startNy);
    const end = toPixel(arrow.endNx, arrow.endNy);

    // Compute a control point for a subtle curve (midpoint offset perpendicular)
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    // Offset perpendicular to the line direction for a subtle curve
    const offset = len * 0.1;
    const controlX = midX + (len > 0 ? (-dy / len) * offset : 0);
    const controlY = midY + (len > 0 ? (dx / len) * offset : 0);

    const path = document.createElementNS(SVG_NS, "path");
    const d = `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", ARROW_COLOR);
    path.setAttribute("stroke-width", ARROW_STROKE_WIDTH);
    path.setAttribute("marker-end", `url(#${markerId})`);
    path.setAttribute("data-arrow-id", arrow.id);
    path.setAttribute("pointer-events", "stroke");
    path.setAttribute("cursor", "pointer");

    if (arrow.style === "dashed") {
      path.setAttribute("stroke-dasharray", ARROW_DASH);
    }

    layer.appendChild(path);
  }
}
