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
anything else is over (creation and transfer still work). Create the
shell (`R`) on the tower square while looking down from above (from
below, neighboring squares block the aim), transfer (`Q`) onto it and
hyperspace (`H`) to complete the landscape;
the next landscape number is shown (present + energy after the jump),
following the original code formula, and the new landscape loads
automatically with your remaining energy.

## Sentinel

Perched on the tower, rotating slowly. The scan warning has two
levels like the 1986 original: full when a watcher sees your square
(drain of 1 energy per second after ~5s of continuous exposure; break
line of sight to reset; at 0 energy you are absorbed) and partial
when it sees only your head (no drain, but it may spawn a Meanie).
It also absorbs boulders and robot shells it sees (never
trees, never the shell you stand on): each absorbed energy unit
regrows as a random tree elsewhere, keeping total energy constant.

## Meanie

If a watcher sees your head but not your square (you are peeking
from behind cover), it transforms a tree near you into a Meanie.
The Meanie spins fast: if it sees your square it forces a
hyperspace (`-3` energy, same rules as `H`); if it completes a full
turn without seeing it, it reverts to a tree. Absorbing the tree
(`A`, +1) also removes the Meanie.

## Sentries

Guardian entities on later landscapes, counted like the 1986
original: thousands digit plus two, adjusted by RNG down into 0..7
(never above 7), and capped at the tens digit below landscape 100 —
so landscape 0000 has none. New games start at landscape 0000 with
no sentries. They behave like the Sentinel — rotating
gaze, energy drain, landscape absorption — but stand on ordinary
squares instead of a tower. Absorbing them is optional: aim at the
sentry while looking down on its square (`A`, +4 energy). They are
not required to complete the landscape.

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