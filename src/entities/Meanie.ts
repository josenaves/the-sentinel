import { Entity } from './Entity.js';
import type { World } from '../world/World.js';
import type { Player } from '../player/Player.js';
import { CELL_SIZE, SENTINEL_FOV, MEANIE_TREE_RANGE, MEANIE_EYE_HEIGHT } from '../core/Constants.js';

// A tree near the player, transformed by a watcher that sees the player's
// head but not their square. Spins fast until it sees the player's square
// (forcing hyperspace) or completes a full turn (reverting to a tree).
// The terrain cell stays a tree; the Meanie is Game-level state.
export class Meanie extends Entity {
  angle = 0;
  spun = 0;

  constructor(x: number, z: number) {
    super('meanie', x, z);
  }

  eyePosition(world: World): { x: number; y: number; z: number } {
    return {
      x: this.x * CELL_SIZE + CELL_SIZE / 2,
      y: world.columnTopAt(this.x, this.z) + MEANIE_EYE_HEIGHT,
      z: this.z * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  seesSquare(world: World, player: Player): boolean {
    const eye = this.eyePosition(world);
    const current = player.currentCell();
    const base = {
      x: player.position.x,
      y: world.columnTopAt(current.x, current.z),
      z: player.position.z,
    };
    if (!this.withinGaze(eye, base)) return false;

    return world.hasLineOfSight(eye, base);
  }

  private withinGaze(eye: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }): boolean {
    const dx = target.x - eye.x;
    const dz = target.z - eye.z;
    const yawToTarget = Math.atan2(dx, dz);
    const facingX = Math.sin(this.angle);
    const facingZ = Math.cos(this.angle);
    const yawFacing = Math.atan2(facingX, facingZ);

    let diff = yawToTarget - yawFacing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff) <= SENTINEL_FOV / 2;
  }

  static spawnAt(world: World, player: Player): { x: number; z: number } | null {
    const current = player.currentCell();
    const size = world.getSize();
    let best: { x: number; z: number } | null = null;
    let bestDist = Number.MAX_SAFE_INTEGER;
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        if (world.getObject(x, z) !== 'tree') continue;
        if (x === current.x && z === current.z) continue;
        const dist = Math.max(Math.abs(x - current.x), Math.abs(z - current.z));
        if (dist > MEANIE_TREE_RANGE || dist >= bestDist) continue;
        best = { x, z };
        bestDist = dist;
      }
    }
    return best;
  }
}
