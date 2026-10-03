# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Changed

- HUD restyled after the 1986 original: energy as top-left icons
  (tree = 1, boulder = 2, robot = 3, golden robot = 15) and a top-right
  scan box (empty when calm, half yellow on partial sighting, full
  blinking red on full sighting, magenta border while a Meanie lurks).
  Aim, landscape and objective moved to a small bottom-left bar.
- HUD hidden behind the start panel (clean drone backdrop); it appears
  together with the crosshair only after the game starts.
- Bottom-left info text enlarged (11px → 15px) for readability.

## [0.1.0] - 2026-09-30

Milestones 1–12 (see `ROADMAP.md`).

### Added

- Foundation: TypeScript + Vite + Three.js + Vitest, fixed-timestep game
  loop, game state, deterministic seeded terrain (16×16 stepped heights),
  `InstancedMesh` terrain rendering, pointer-lock first-person controls,
  lighting with shadows and fog.
- World: procedural landscapes 0000–9999, trees/boulders scatter,
  deterministic per landscape number.
- Interaction: center-crosshair raycast aim; absorb (`A`) and create
  tree (`T`), boulder (`B`), robot (`R`); constant total energy with
  tree regrowth balancing.
- Construction: boulder stacking and climbing, safe spawn/hyperspace
  cells.
- Clones: robot shells (`R`), consciousness transfer (`Q`) with soul
  flight, husk recovery, hyperspace (`H`).
- Sentinel: rotating gaze, two-level scan warning (partial/full) with
  grace + drain, gradual landscape absorption, absorb-from-above (+4)
  opening the tower.
- Sentries: original count ritual on later landscapes, guardian
  gaze/drain/absorption, optional absorb (+4).
- Meanie: head-visible-without-tile trigger transforming a nearby tree
  (red cone overlay, `Mira: meanie`), forced hyperspace on sighting,
  revert after a full turn, removed by absorbing the tree.
- Level system: victory hyperspace loads the next landscape
  (present + energy) with energy carry-over.
- Polish: start panel with orbiting drone backdrop of the rendered world,
  game-over panel with click-to-restart, WebAudio synth sounds, landscape
  counter, objective hints, sentry/meanie warnings.

### Fixed

- Sights never target the player's own square; tower accepts robots only.
- Sentinel drain, zero-energy survival, sentry-cell build/hyperspace rules.
- ESC pointer-lock release with relock cooldown.
- `InstancedMesh` frustum-culling invalidation for newly placed objects.
