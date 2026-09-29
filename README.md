# SENTINEL-3D

A modern reimagining of **The Sentinel** (1986, ZX Spectrum) built with TypeScript and Three.js.

## Inspiration

The Sentinel is a classic atmospheric puzzle-strategy game where you explore a 3D landscape, absorb energy, create clones, and ultimately confront the Sentinel entity. This project aims to recreate that experience with modern graphics while preserving the core mechanics.

## Stack

- **TypeScript** - Type-safe JavaScript
- **Three.js** - WebGL 3D rendering
- **Vite** - Fast build tool and dev server
- **Vitest** - Unit testing framework

## Installation

```bash
bun install
```

## Development

```bash
bun run dev
```

Opens the game at http://localhost:3000

## Testing

```bash
bun run test
```

## Building

```bash
bun run build
```

Outputs to `dist/`

## Architecture

```
GAME DOMAIN (world, player, entities)
    ↓
WORLD MODEL (grid, cells, terrain generation)
    ↓
GAMEPLAY SYSTEMS (movement, interaction, energy)
    ↓
THREE.JS RENDERING (scene, camera, meshes, lighting)
    ↓
INPUT / UI (keyboard, mouse, HUD)
```

Key principle: **Game logic is independent of Three.js**. The world can be tested without a WebGL context.

## Roadmap

| Milestone | Focus |
|-----------|-------|
| 1 | Foundation (Three.js setup, basic terrain, player movement) |
| 2 | Terrain (procedural generation, instanced rendering) |
| 3 | Player (refined controls, collision, camera) |
| 4 | Interaction (absorption, creation) |
| 5 | Energy (resource system) |
| 6 | Construction (vertical structures) |
| 7 | Clones (player duplicates) |
| 8 | Sentinel (main antagonist) |
| 9 | Sentries (guardian entities) |
| 10 | Level system |
| 11 | Procedural worlds |
| 12 | Polish |

## Controls

| Key | Action |
|-----|--------|
| Arrows / Mouse | Look around |
| Click | Capture mouse |
| A | Absorb aimed object |
| T | Create tree (-1) |
| B | Create boulder (-2) |
| R | Create robot (-3) |
| Q | Transfer to aimed robot |
| H | Hyperspace (-3) |
| U | U-turn |
| ESC | Release mouse |

## License

MIT