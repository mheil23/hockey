/**
 * Static Data Layer — Ball Hockey Formations Tool
 *
 * Contains preset formations, position descriptions, predefined situational moments,
 * and lookup functions for each.
 */

// ─── Preset Formations ─────────────────────────────────────────────────────────
// Coordinates are normalized [0,1]: (0,0) = top-left, (1,1) = bottom-right
// Landscape orientation: own goal on RIGHT (nx≈1), opponent goal on LEFT (nx≈0)
// Own team faces LEFT: LW/LD = bottom (high ny), RW/RD = top (low ny)

const PRESET_FORMATIONS = [
  // ─── 4v4 (3 runners + 1 goalie) ───────────────────────────────────────────
  // Landscape: nx = left(opponent) to right(own), ny = top to bottom
  // Own team faces LEFT: LW/LD = bottom (high ny), RW/RD = top (low ny)
  {
    id: "4v4-2-1",
    name: "2-1",
    format: "4v4",
    positions: [
      { key: "G", label: "G", nx: 0.89, ny: 0.5, descriptionId: "G" },
      { key: "LD", label: "LD", nx: 0.78, ny: 0.72, descriptionId: "LD" },
      { key: "RD", label: "RD", nx: 0.78, ny: 0.28, descriptionId: "RD" },
      { key: "C", label: "C", nx: 0.52, ny: 0.5, descriptionId: "C" },
    ],
  },
  {
    id: "4v4-1-2",
    name: "1-2",
    format: "4v4",
    positions: [
      { key: "G", label: "G", nx: 0.89, ny: 0.5, descriptionId: "G" },
      { key: "D", label: "D", nx: 0.78, ny: 0.5, descriptionId: "D" },
      { key: "LW", label: "LW", nx: 0.52, ny: 0.8, descriptionId: "LW" },
      { key: "RW", label: "RW", nx: 0.52, ny: 0.2, descriptionId: "RW" },
    ],
  },
  {
    id: "4v4-1-1-1",
    name: "1-1-1",
    format: "4v4",
    positions: [
      { key: "G", label: "G", nx: 0.89, ny: 0.5, descriptionId: "G" },
      { key: "D", label: "D", nx: 0.78, ny: 0.5, descriptionId: "D" },
      { key: "C", label: "C", nx: 0.52, ny: 0.5, descriptionId: "C" },
      { key: "F", label: "F", nx: 0.52, ny: 0.2, descriptionId: "F" },
    ],
  },

  // ─── 5v5 (4 runners + 1 goalie) ───────────────────────────────────────────
  {
    id: "5v5-2-1-1",
    name: "2-1-1",
    format: "5v5",
    positions: [
      { key: "G", label: "G", nx: 0.89, ny: 0.5, descriptionId: "G" },
      { key: "LD", label: "LD", nx: 0.78, ny: 0.72, descriptionId: "LD" },
      { key: "RD", label: "RD", nx: 0.78, ny: 0.28, descriptionId: "RD" },
      { key: "C", label: "C", nx: 0.52, ny: 0.5, descriptionId: "C" },
      { key: "F", label: "F", nx: 0.52, ny: 0.2, descriptionId: "F" },
    ],
  },
  {
    id: "5v5-1-2-1",
    name: "1-2-1",
    format: "5v5",
    positions: [
      { key: "G", label: "G", nx: 0.89, ny: 0.5, descriptionId: "G" },
      { key: "D", label: "D", nx: 0.78, ny: 0.5, descriptionId: "D" },
      { key: "LW", label: "LW", nx: 0.52, ny: 0.8, descriptionId: "LW" },
      { key: "RW", label: "RW", nx: 0.52, ny: 0.2, descriptionId: "RW" },
      { key: "C", label: "C", nx: 0.52, ny: 0.5, descriptionId: "C" },
    ],
  },
  {
    id: "5v5-2-2",
    name: "2-2",
    format: "5v5",
    positions: [
      { key: "G", label: "G", nx: 0.89, ny: 0.5, descriptionId: "G" },
      { key: "LD", label: "LD", nx: 0.78, ny: 0.72, descriptionId: "LD" },
      { key: "RD", label: "RD", nx: 0.78, ny: 0.28, descriptionId: "RD" },
      { key: "LW", label: "LW", nx: 0.52, ny: 0.8, descriptionId: "LW" },
      { key: "RW", label: "RW", nx: 0.52, ny: 0.2, descriptionId: "RW" },
    ],
  },
  {
    id: "5v5-1-1-2",
    name: "1-1-2",
    format: "5v5",
    positions: [
      { key: "G", label: "G", nx: 0.89, ny: 0.5, descriptionId: "G" },
      { key: "D", label: "D", nx: 0.78, ny: 0.5, descriptionId: "D" },
      { key: "C", label: "C", nx: 0.52, ny: 0.5, descriptionId: "C" },
      { key: "LW", label: "LW", nx: 0.52, ny: 0.8, descriptionId: "LW" },
      { key: "RW", label: "RW", nx: 0.52, ny: 0.2, descriptionId: "RW" },
    ],
  },

  // ─── 6v6 (5 runners + 1 goalie) ───────────────────────────────────────────
  {
    id: "6v6-standard",
    name: "Standard (2F-1C-2D)",
    format: "6v6",
    positions: [
      { key: "G", label: "G", nx: 0.89, ny: 0.5, descriptionId: "G" },
      { key: "LD", label: "LD", nx: 0.78, ny: 0.72, descriptionId: "LD" },
      { key: "RD", label: "RD", nx: 0.78, ny: 0.28, descriptionId: "RD" },
      { key: "C", label: "C", nx: 0.52, ny: 0.5, descriptionId: "C" },
      { key: "LW", label: "LW", nx: 0.52, ny: 0.85, descriptionId: "LW" },
      { key: "RW", label: "RW", nx: 0.52, ny: 0.15, descriptionId: "RW" },
    ],
  },
  {
    id: "6v6-1-2-2",
    name: "1-2-2",
    format: "6v6",
    positions: [
      { key: "G", label: "G", nx: 0.89, ny: 0.5, descriptionId: "G" },
      { key: "LD", label: "LD", nx: 0.78, ny: 0.65, descriptionId: "LD" },
      { key: "RD", label: "RD", nx: 0.78, ny: 0.35, descriptionId: "RD" },
      { key: "C", label: "C", nx: 0.52, ny: 0.5, descriptionId: "C" },
      { key: "LW", label: "LW", nx: 0.52, ny: 0.85, descriptionId: "LW" },
      { key: "RW", label: "RW", nx: 0.52, ny: 0.15, descriptionId: "RW" },
    ],
  },
  {
    id: "6v6-2-1-2",
    name: "2-1-2",
    format: "6v6",
    positions: [
      { key: "G", label: "G", nx: 0.89, ny: 0.5, descriptionId: "G" },
      { key: "LD", label: "LD", nx: 0.78, ny: 0.72, descriptionId: "LD" },
      { key: "RD", label: "RD", nx: 0.78, ny: 0.28, descriptionId: "RD" },
      { key: "C", label: "C", nx: 0.52, ny: 0.5, descriptionId: "C" },
      { key: "LW", label: "LW", nx: 0.52, ny: 0.85, descriptionId: "LW" },
      { key: "RW", label: "RW", nx: 0.52, ny: 0.15, descriptionId: "RW" },
    ],
  },
  {
    id: "6v6-1-3-1",
    name: "1-3-1",
    format: "6v6",
    positions: [
      { key: "G", label: "G", nx: 0.89, ny: 0.5, descriptionId: "G" },
      { key: "LD", label: "LD", nx: 0.78, ny: 0.65, descriptionId: "LD" },
      { key: "RD", label: "RD", nx: 0.78, ny: 0.35, descriptionId: "RD" },
      { key: "LW", label: "LW", nx: 0.52, ny: 0.8, descriptionId: "LW" },
      { key: "C", label: "C", nx: 0.52, ny: 0.5, descriptionId: "C" },
      { key: "RW", label: "RW", nx: 0.52, ny: 0.2, descriptionId: "RW" },
    ],
  },
  {
    id: "6v6-overload",
    name: "Overload",
    format: "6v6",
    positions: [
      { key: "G", label: "G", nx: 0.89, ny: 0.5, descriptionId: "G" },
      { key: "LD", label: "LD", nx: 0.78, ny: 0.72, descriptionId: "LD" },
      { key: "RD", label: "RD", nx: 0.78, ny: 0.28, descriptionId: "RD" },
      { key: "C", label: "C", nx: 0.52, ny: 0.4, descriptionId: "C" },
      { key: "LW", label: "LW", nx: 0.52, ny: 0.6, descriptionId: "LW" },
      { key: "RW", label: "RW", nx: 0.52, ny: 0.15, descriptionId: "RW" },
    ],
  },
];


// ─── Position Descriptions ──────────────────────────────────────────────────────
// Ball hockey specific: played on foot, court surface, no icing

const POSITION_DESCRIPTIONS = [
  {
    id: "G",
    positionName: "Goalie",
    roleDescription:
      "The last line of defense who guards the net and directs the team's defensive positioning on the court",
    keyAttributes: [
      "Quick reflexes",
      "Court awareness",
      "Communication",
      "Flexibility",
    ],
    responsibilities:
      "Stops shots on net, controls rebounds, communicates defensive assignments to teammates, and initiates breakout passes from the crease area",
  },
  {
    id: "LD",
    positionName: "Left Defense",
    roleDescription:
      "A defensive player positioned on the left side who protects the zone in front of the net and transitions the ball up court",
    keyAttributes: [
      "Positioning",
      "Stick checking",
      "Passing accuracy",
      "Physical play",
    ],
    responsibilities:
      "Defends the left side of the court, blocks passing lanes, clears the ball from the defensive zone, and supports breakout plays by receiving outlet passes",
  },
  {
    id: "RD",
    positionName: "Right Defense",
    roleDescription:
      "A defensive player positioned on the right side who anchors the back end and moves the ball to forwards on transition",
    keyAttributes: [
      "Positioning",
      "Stick checking",
      "Court vision",
      "Endurance",
    ],
    responsibilities:
      "Defends the right side of the court, covers opposing forwards, initiates transition passes, and supports the goalie by clearing rebounds away from the crease",
  },
  {
    id: "C",
    positionName: "Center",
    roleDescription:
      "The primary playmaker who controls the middle of the court and links defense to offense in transition play",
    keyAttributes: [
      "Speed",
      "Court vision",
      "Face-off skills",
      "Two-way play",
      "Endurance",
    ],
    responsibilities:
      "Wins face-offs, transitions the ball through the neutral zone, supports both offensive attacks and defensive coverage, and distributes to wingers on the court",
  },
  {
    id: "LW",
    positionName: "Left Wing",
    roleDescription:
      "An offensive forward who operates on the left side of the court and drives toward the opposing net",
    keyAttributes: ["Speed", "Shooting", "Agility", "Positioning"],
    responsibilities:
      "Attacks down the left side, creates scoring opportunities near the net, backchecks to support defense in the neutral zone, and cycles the ball along the boards",
  },
  {
    id: "RW",
    positionName: "Right Wing",
    roleDescription:
      "An offensive forward who works the right side of the court and pressures the opposing defense",
    keyAttributes: ["Speed", "Shooting", "Physical play", "Forechecking"],
    responsibilities:
      "Drives offense on the right side, finishes scoring chances, supports forechecking pressure on opponents, and tracks back to cover the defensive zone on transitions",
  },
  {
    id: "D",
    positionName: "Defense",
    roleDescription:
      "A solo defender responsible for covering the full width of the defensive zone and transitioning the ball forward",
    keyAttributes: [
      "Positioning",
      "Court coverage",
      "Passing",
      "Decision making",
    ],
    responsibilities:
      "Covers the entire defensive zone width, reads offensive plays to intercept passes, starts breakout plays by moving the ball to forwards, and anchors the back line",
  },
  {
    id: "F",
    positionName: "Forward",
    roleDescription:
      "A versatile attacking player who leads the offensive push and applies pressure in the opposing zone",
    keyAttributes: ["Speed", "Shooting", "Creativity", "Work rate"],
    responsibilities:
      "Leads the forecheck in the offensive zone, creates scoring chances through movement and passing, pressures opposing defenders into turnovers, and supports center on face-offs",
  },
];


// ─── Predefined Situational Moments ─────────────────────────────────────────────
// Format: 6v6 by default for standard moments, power play/penalty kill have asymmetric counts

const PREDEFINED_MOMENTS = [
  {
    id: "moment-center-faceoff",
    name: "Center Face-Off",
    isPredefined: true,
    format: "6v6",
    ownPositions: [
      { label: "G", nx: 0.89, ny: 0.5 },
      { label: "LD", nx: 0.78, ny: 0.72 },
      { label: "RD", nx: 0.78, ny: 0.28 },
      { label: "C", nx: 0.52, ny: 0.5 },
      { label: "LW", nx: 0.52, ny: 0.85 },
      { label: "RW", nx: 0.52, ny: 0.15 },
    ],
    opponentPositions: [
      { label: "G", nx: 0.11, ny: 0.5 },
      { label: "LD", nx: 0.22, ny: 0.28 },
      { label: "RD", nx: 0.22, ny: 0.72 },
      { label: "C", nx: 0.48, ny: 0.5 },
      { label: "LW", nx: 0.48, ny: 0.15 },
      { label: "RW", nx: 0.48, ny: 0.85 },
    ],
    ballPosition: { nx: 0.5, ny: 0.5 },
  },
  {
    id: "moment-defensive-zone-faceoff",
    name: "Defensive Zone Face-Off",
    isPredefined: true,
    format: "6v6",
    ownPositions: [
      { label: "G", nx: 0.89, ny: 0.5 },
      { label: "LD", nx: 0.82, ny: 0.65 },
      { label: "RD", nx: 0.82, ny: 0.35 },
      { label: "C", nx: 0.78, ny: 0.5 },
      { label: "LW", nx: 0.72, ny: 0.8 },
      { label: "RW", nx: 0.72, ny: 0.2 },
    ],
    opponentPositions: [
      { label: "G", nx: 0.11, ny: 0.5 },
      { label: "LD", nx: 0.35, ny: 0.35 },
      { label: "RD", nx: 0.35, ny: 0.65 },
      { label: "C", nx: 0.76, ny: 0.5 },
      { label: "LW", nx: 0.7, ny: 0.2 },
      { label: "RW", nx: 0.7, ny: 0.8 },
    ],
    ballPosition: { nx: 0.78, ny: 0.28 },
  },
  {
    id: "moment-offensive-zone-faceoff",
    name: "Offensive Zone Face-Off",
    isPredefined: true,
    format: "6v6",
    ownPositions: [
      { label: "G", nx: 0.89, ny: 0.5 },
      { label: "LD", nx: 0.55, ny: 0.65 },
      { label: "RD", nx: 0.55, ny: 0.35 },
      { label: "C", nx: 0.24, ny: 0.5 },
      { label: "LW", nx: 0.2, ny: 0.8 },
      { label: "RW", nx: 0.2, ny: 0.2 },
    ],
    opponentPositions: [
      { label: "G", nx: 0.11, ny: 0.5 },
      { label: "LD", nx: 0.22, ny: 0.35 },
      { label: "RD", nx: 0.22, ny: 0.65 },
      { label: "C", nx: 0.26, ny: 0.5 },
      { label: "LW", nx: 0.3, ny: 0.2 },
      { label: "RW", nx: 0.3, ny: 0.8 },
    ],
    ballPosition: { nx: 0.22, ny: 0.28 },
  },
  {
    id: "moment-breakout",
    name: "Breakout",
    isPredefined: true,
    format: "6v6",
    ownPositions: [
      { label: "G", nx: 0.89, ny: 0.5 },
      { label: "LD", nx: 0.85, ny: 0.75 },
      { label: "RD", nx: 0.85, ny: 0.25 },
      { label: "C", nx: 0.65, ny: 0.5 },
      { label: "LW", nx: 0.55, ny: 0.85 },
      { label: "RW", nx: 0.55, ny: 0.15 },
    ],
    opponentPositions: [
      { label: "G", nx: 0.11, ny: 0.5 },
      { label: "LD", nx: 0.35, ny: 0.4 },
      { label: "RD", nx: 0.35, ny: 0.6 },
      { label: "C", nx: 0.55, ny: 0.5 },
      { label: "LW", nx: 0.6, ny: 0.25 },
      { label: "RW", nx: 0.6, ny: 0.75 },
    ],
    ballPosition: { nx: 0.88, ny: 0.5 },
  },
  {
    id: "moment-forecheck-aggressive",
    name: "Forecheck (Aggressive)",
    isPredefined: true,
    format: "6v6",
    ownPositions: [
      { label: "G", nx: 0.89, ny: 0.5 },
      { label: "LD", nx: 0.55, ny: 0.7 },
      { label: "RD", nx: 0.55, ny: 0.3 },
      { label: "C", nx: 0.3, ny: 0.5 },
      { label: "LW", nx: 0.18, ny: 0.75 },
      { label: "RW", nx: 0.18, ny: 0.25 },
    ],
    opponentPositions: [
      { label: "G", nx: 0.11, ny: 0.5 },
      { label: "LD", nx: 0.15, ny: 0.7 },
      { label: "RD", nx: 0.15, ny: 0.3 },
      { label: "C", nx: 0.25, ny: 0.5 },
      { label: "LW", nx: 0.3, ny: 0.8 },
      { label: "RW", nx: 0.3, ny: 0.2 },
    ],
    ballPosition: { nx: 0.15, ny: 0.4 },
  },
  {
    id: "moment-forecheck-passive",
    name: "Forecheck (Passive)",
    isPredefined: true,
    format: "6v6",
    ownPositions: [
      { label: "G", nx: 0.89, ny: 0.5 },
      { label: "LD", nx: 0.65, ny: 0.7 },
      { label: "RD", nx: 0.65, ny: 0.3 },
      { label: "C", nx: 0.45, ny: 0.5 },
      { label: "LW", nx: 0.4, ny: 0.75 },
      { label: "RW", nx: 0.4, ny: 0.25 },
    ],
    opponentPositions: [
      { label: "G", nx: 0.11, ny: 0.5 },
      { label: "LD", nx: 0.15, ny: 0.7 },
      { label: "RD", nx: 0.15, ny: 0.3 },
      { label: "C", nx: 0.25, ny: 0.5 },
      { label: "LW", nx: 0.3, ny: 0.8 },
      { label: "RW", nx: 0.3, ny: 0.2 },
    ],
    ballPosition: { nx: 0.2, ny: 0.5 },
  },
  {
    id: "moment-power-play-5v4",
    name: "Power Play 5v4",
    isPredefined: true,
    format: "6v6",
    ownPositions: [
      { label: "G", nx: 0.89, ny: 0.5 },
      { label: "LD", nx: 0.5, ny: 0.7 },
      { label: "RD", nx: 0.5, ny: 0.3 },
      { label: "C", nx: 0.3, ny: 0.5 },
      { label: "LW", nx: 0.2, ny: 0.8 },
      { label: "RW", nx: 0.2, ny: 0.2 },
    ],
    opponentPositions: [
      { label: "G", nx: 0.11, ny: 0.5 },
      { label: "LD", nx: 0.22, ny: 0.4 },
      { label: "RD", nx: 0.22, ny: 0.6 },
      { label: "C", nx: 0.32, ny: 0.5 },
      { label: "LW", nx: 0.35, ny: 0.25 },
    ],
    ballPosition: { nx: 0.28, ny: 0.5 },
  },
  {
    id: "moment-power-play-4v3",
    name: "Power Play 4v3",
    isPredefined: true,
    format: "5v5",
    ownPositions: [
      { label: "G", nx: 0.89, ny: 0.5 },
      { label: "LD", nx: 0.5, ny: 0.7 },
      { label: "RD", nx: 0.5, ny: 0.3 },
      { label: "C", nx: 0.3, ny: 0.5 },
      { label: "F", nx: 0.18, ny: 0.5 },
    ],
    opponentPositions: [
      { label: "G", nx: 0.11, ny: 0.5 },
      { label: "D", nx: 0.22, ny: 0.5 },
      { label: "LW", nx: 0.3, ny: 0.7 },
      { label: "RW", nx: 0.3, ny: 0.3 },
    ],
    ballPosition: { nx: 0.25, ny: 0.5 },
  },
  {
    id: "moment-penalty-kill-4v5",
    name: "Penalty Kill 4v5",
    isPredefined: true,
    format: "6v6",
    ownPositions: [
      { label: "G", nx: 0.89, ny: 0.5 },
      { label: "LD", nx: 0.72, ny: 0.65 },
      { label: "RD", nx: 0.72, ny: 0.35 },
      { label: "C", nx: 0.6, ny: 0.4 },
      { label: "RW", nx: 0.6, ny: 0.6 },
    ],
    opponentPositions: [
      { label: "G", nx: 0.11, ny: 0.5 },
      { label: "LD", nx: 0.4, ny: 0.7 },
      { label: "RD", nx: 0.4, ny: 0.3 },
      { label: "C", nx: 0.3, ny: 0.5 },
      { label: "LW", nx: 0.25, ny: 0.8 },
      { label: "RW", nx: 0.25, ny: 0.2 },
    ],
    ballPosition: { nx: 0.35, ny: 0.5 },
  },
  {
    id: "moment-penalty-kill-3v4",
    name: "Penalty Kill 3v4",
    isPredefined: true,
    format: "5v5",
    ownPositions: [
      { label: "G", nx: 0.89, ny: 0.5 },
      { label: "D", nx: 0.72, ny: 0.5 },
      { label: "LW", nx: 0.6, ny: 0.65 },
      { label: "RW", nx: 0.6, ny: 0.35 },
    ],
    opponentPositions: [
      { label: "G", nx: 0.11, ny: 0.5 },
      { label: "LD", nx: 0.4, ny: 0.7 },
      { label: "RD", nx: 0.4, ny: 0.3 },
      { label: "C", nx: 0.28, ny: 0.5 },
      { label: "F", nx: 0.18, ny: 0.5 },
    ],
    ballPosition: { nx: 0.32, ny: 0.5 },
  },
];


// ─── Default Formation Mapping ──────────────────────────────────────────────────

export const DEFAULT_FORMATION = {
  "4v4": "4v4-2-1",
  "5v5": "5v5-2-1-1",
  "6v6": "6v6-standard",
};

// ─── Export Functions ────────────────────────────────────────────────────────────

/**
 * Returns all preset formations for the given format.
 * @param {"4v4"|"5v5"|"6v6"} format
 * @returns {PresetFormation[]}
 */
export function getFormationsForFormat(format) {
  return PRESET_FORMATIONS.filter((f) => f.format === format);
}

/**
 * Returns a single preset formation by its id.
 * @param {string} id
 * @returns {PresetFormation|undefined}
 */
export function getFormationById(id) {
  return PRESET_FORMATIONS.find((f) => f.id === id);
}

/**
 * Returns a position description by its id.
 * @param {string} id
 * @returns {PositionDescription|undefined}
 */
export function getDescriptionById(id) {
  return POSITION_DESCRIPTIONS.find((d) => d.id === id);
}

/**
 * Returns all predefined situational moments for the given format.
 * Includes moments that match the format, plus power play / penalty kill
 * moments that are relevant (moments with asymmetric counts are included
 * if they match the format field).
 * @param {"4v4"|"5v5"|"6v6"} format
 * @returns {SituationalMoment[]}
 */
export function getPredefinedMoments(format) {
  return PREDEFINED_MOMENTS.filter((m) => m.format === format);
}

// Re-export raw arrays for testing / introspection
export { PRESET_FORMATIONS, POSITION_DESCRIPTIONS, PREDEFINED_MOMENTS };
