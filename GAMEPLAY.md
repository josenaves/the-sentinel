# GAMEPLAY.md

## World

A world composed of a grid:

```
(x, z)
```

16x16 squares (256 total), like the original: discrete stepped height
levels with plateaus and cliffs, deterministic per landscape number
0000-9999.

Reverse-engineered from the ZX Spectrum 48k original (RAM snapshot):
per-square data lives in parallel 256-byte tables at `0xF800`,
`0xF840`, `0xF880` (height / object attributes), render scratch at
`0xF8C0`, flags at `0x5E00` (bits 6-7), plus a second bank at
`0xF900`/`0xFA00`/`0xFB00` with projection LUTs.

Each cell will have at least:

```typescript
interface Cell {
    height: number;
    object: 'empty' | 'tree' | 'boulder' | 'robot' | 'sentry' | 'sentinel';
}
```

Object energy (original manual): tree 1, boulder 2, robot 3,
sentry/sentinel 4. Total landscape energy is constant.

## Interaction

Aim with the center crosshair (raycast against terrain columns and
the tower, range-limited). `A` absorbs a tree (+1) or boulder (+2);
`T` creates a tree (-1), `B` a boulder (-2) on an empty aimed square.
Keys are edge-triggered (one action per press). The tower cannot be
absorbed yet (Milestone 8).

Movement: the Synthoid is static, standing on a square (spawned on
low ground). No walking: aim at a visible square, create a robot
(`R`, -3 energy) on an empty aimed square, then transfer (`Q`) to it.
The old square keeps a robot husk: look back and absorb it (`A`, +3)
to recover the energy. Hyperspace (`H`, -3 energy, death below 3)
jumps to a random square of equal or lower height, never the current
one, leaving the old robot behind.

## Construction

Boulders stack: each placement (`B`, -2) adds one unit on the aimed
square (natural boulders count as one unit). Each absorb (`A`, +2)
removes one unit; the last one clears the square. Robots can be
created on empty squares or atop stacks (`R`, -3) to gain altitude;
absorbing a robot (+3) restores the boulder underneath. Climbing this
way is how you get above the tower to see the square the Sentinel
stands on.

## Victory

Absorb the Sentinel (`A` on the tower, +4 energy) only while your eye
is above its platform: you must look down on it. The Sentinel stops
scanning, its platform opens for robot placement, and absorbing
anything else is over (creation and transfer still work). Transfer
onto the tower square and hyperspace (`H`) to complete the landscape;
the next landscape number is shown (present + energy after the jump),
following the original code formula. Loading it is a future level
milestone.

## Sentinel

Perched on the tower, rotating slowly. If you are inside its gaze
cone with a clear line of sight, the warning shows: after ~5s of
continuous exposure it drains 1 energy per second. Break line of
sight (or leave the cone) to reset. At 0 energy you are absorbed:
game over. (Meanie/hyperspace and absorbing the Sentinel itself are
future milestones.)

Later may have:

```typescript
terrainType
object
occupant
energy
visibility
```

## Player

The player occupies a position in the world.
The camera is first-person.

## Energy

Energy will be a fundamental resource.

Later may be used for:
* absorbing objects
* creating objects
* creating clones
* executing special actions

## Construction

The player will be able to create vertical structures.

## Sentinel

The Sentinel will be an entity that:
* observes
* rotates
* detects
* reacts
* can be absorbed

Not implemented in the first milestone.