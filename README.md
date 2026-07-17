# 🏒 Ball Hockey Formations

A lightweight web application for youth ball hockey coaches to visualize and communicate team positional systems and tactical strategies. Built for the EHT Street Hockey Association's youth divisions (ages 4–19).

## Features

- **Game format selection** — 4v4, 5v5, and 6v6 with appropriate player counts
- **Preset formations** — 12 positional systems across all formats (2-1, 1-2-1, Standard 2F-1C-2D, Overload, etc.)
- **Interactive SVG rink** — drag player tokens and the ball to explore tactics in real time
- **Opponent overlay** — visualize matchups with mirrored opponent formations
- **Position descriptions** — tap any token to learn about that role's responsibilities and key attributes
- **Situational moments** — load predefined scenarios (face-offs, breakouts, power plays, penalty kills) or save your own
- **Movement arrows** — draw solid or dashed arrows to illustrate player movement and passing lanes
- **PNG export** — download the current rink view as an image to share with players and parents
- **Session persistence** — saved moments and format preference are stored in localStorage
- **Mobile responsive** — touch-friendly with stacked toolbar on narrow viewports
- **Dark theme** — designed for outdoor readability with ball hockey visual identity

## Tech Stack

- Vanilla HTML / CSS / JavaScript (ES modules, no build step)
- MVC architecture with immutable state model
- SVG rendering with Pointer Events API for unified mouse + touch
- Vitest + fast-check for testing

## Getting Started

```bash
npm install
npx serve .
```

Open `http://localhost:3000` in your browser.

## Running Tests

```bash
npm test           # single run
npm run test:watch # watch mode
```

## Project Structure

```
src/
  state.js         — pure state mutation functions (immutable)
  data.js          — preset formations, position descriptions, predefined moments
  renderer.js      — SVG coordinate conversion and DOM rendering
  storage.js       — versioned localStorage adapter
  controller.js    — bootstrap, format/formation selectors, notifications
  drag.js          — pointer-based drag interactions
  opponent.js      — opponent overlay toggle and formation select
  description.js   — position description panel
  moments.js       — situational moments selector, save/delete
  arrows.js        — draw mode and arrow creation
  reset-export.js  — reset with confirmation, PNG export
tests/
  *.test.js        — unit tests for each module
index.html         — single-page app with inline CSS
```

## License

MIT
