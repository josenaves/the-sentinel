# ROADMAP.md

## ✅ MILESTONE 1 - Foundation (COMPLETE)
- [x] Project setup: TypeScript, Vite, Three.js, Vitest
- [x] Architecture documentation (AGENTS.md, ARCHITECTURE.md, GAMEPLAY.md)
- [x] Game loop with fixed timestep
- [x] GameState management
- [x] World/Terrain domain model (independent of Three.js)
- [x] Deterministic terrain generation with seeded 4-octave value noise
- [x] InstancedMesh terrain rendering (low-poly, full-height cubes)
- [x] PerspectiveCamera with Pointer Lock mouse look
- [x] WASD movement with terrain-following
- [x] Lighting: ambient + directional + shadows + fog
- [x] Vertical structure at world center
- [x] Minimal HUD
- [x] Unit tests (200 passing)
- [x] Build passes

## ✅ MILESTONE 2 - Terrain (COMPLETE)
- [x] Seeded procedural generation (WorldGenerator + 16x16 stepped heights)
- [x] Trees/boulders scatter, deterministic per landscape number

## ✅ MILESTONE 3 - Player (COMPLETE)
- [x] First-person controls, pointer-lock mouse look, terrain-following eye
- [x] Tower-platform eye height on transfer

## ✅ MILESTONE 4 - Interaction (COMPLETE)
- [x] Absorption (tree/boulder/robot/sentinel/sentry/meanie-tree) and creation
- [x] Raycast aim with full-board sight range

## ✅ MILESTONE 5 - Energy (COMPLETE)
- [x] Costs, constant total energy, regrow-trees balancing

## ✅ MILESTONE 6 - Construction (COMPLETE)
- [x] Boulder stacking, climbing, safe spawn/hyperspace cells

## ✅ MILESTONE 7 - Clones (COMPLETE)
- [x] Robot shells (R), consciousness transfer (Q), husk recovery

## ✅ MILESTONE 8 - Sentinel (COMPLETE)
- [x] Rotating gaze, grace + drain, landscape absorption (gradual)
- [x] Absorb from above (+4), tower opens

## ✅ MILESTONE 9 - Sentries (COMPLETE)
- [x] Original count ritual (thousands+2, cap 7, tens-cap below 100)
- [x] Guardians with gaze/drain/absorption, optional absorb (+4)

## ✅ MILESTONE 10/11 - Level system / Procedural worlds (COMPLETE)
- [x] Victory hyperspace loads next landscape (present + energy)
- [x] Energy carry-over, deterministic generation, landscape HUD

## ✅ MILESTONE 12 - Polish (COMPLETE)
- [x] Start panel with goal and controls
- [x] Game-over panel with click-to-restart
- [x] WebAudio synth sounds (no dependencies)
- [x] Landscape counter, objective hints, sentry/meanie warnings
- [x] README controls and docs

## Backlog (verificação em jogo)

- [ ] Meanie: confirmar encontro em gameplay real e ajustar o trigger (cabeça visível sem o tile + árvore próxima) se estiver raro demais