# AGENTS.md

## General rules

1. Read `AGENTS.md`, `ARCHITECTURE.md`, `GAMEPLAY.md` and `ROADMAP.md` before modifying the project.
2. Do not rewrite large parts of the project without necessity.
3. Preserve existing internal APIs whenever possible.
4. Do not introduce dependencies without justifying the need.
5. Run tests after relevant changes.
6. Run `bun run build` before considering a milestone complete.
7. Do not mix rendering logic with game-domain logic.
8. Do not implement future features prematurely.
9. Prefer small, verifiable changes.
10. Do not overengineer.

## Three.js rules

* Three.js must be used in the rendering layer.
* The domain must not depend directly on `THREE.Mesh`.
* Avoid creating thousands of individual Three.js objects when instancing can be used.
* Use `InstancedMesh` when appropriate.
* Properly dispose of geometries, materials and textures when objects are removed.
* Do not introduce post-processing before there is a real need.

## Gameplay rules

The game world must be deterministic when given a seed.
Terrain logic must work without Three.js.