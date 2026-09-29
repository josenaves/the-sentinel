import { Entity } from './Entity.js';
import type { World } from '../world/World.js';
import type { Player } from '../player/Player.js';
import { getObjectEnergy } from '../world/Cell.js';
import { CELL_SIZE, SENTINEL_ROTATION_SPEED, SENTINEL_FOV, SENTINEL_SCAN_GRACE, SENTINEL_DRAIN_INTERVAL } from '../core/Constants.js';

export class Sentinel extends Entity {
  angle = 0;
  exposure = 0;
  warning = false;
  absorbed = false;
  private drainAccumulator = 0;
  private absorbAccumulator = 0;

  constructor(x = 8, z = 8, id = 'sentinel') {
    super(id, x, z);
  }

  eyePosition(world: World): { x: number; y: number; z: number } {
    const x = this.x * CELL_SIZE + CELL_SIZE / 2;
    const z = this.z * CELL_SIZE + CELL_SIZE / 2;
    return { x, y: world.columnTopAt(this.x, this.z) + 2, z };
  }

  update(deltaTime: number, world: World, player: Player, random: () => number = Math.random): boolean {
    if (this.absorbed) {
      this.warning = false;
      return false;
    }
    this.angle = (this.angle + SENTINEL_ROTATION_SPEED * deltaTime) % (Math.PI * 2);

    if (this.seesPlayer(world, player)) {
      this.exposure += deltaTime;
      this.warning = true;
      if (this.exposure >= SENTINEL_SCAN_GRACE) {
        this.drainAccumulator += deltaTime;
        while (this.drainAccumulator >= SENTINEL_DRAIN_INTERVAL) {
          this.drainAccumulator -= SENTINEL_DRAIN_INTERVAL;
          player.spendEnergy(1);
        }
      }
    } else {
      this.exposure = 0;
      this.drainAccumulator = 0;
      this.warning = false;
    }

    return this.absorbLandscape(deltaTime, world, player, random);
  }

  private seesPlayer(world: World, player: Player): boolean {
    return this.seesHead(world, player);
  }

  seesHead(world: World, player: Player): boolean {
    const eye = this.eyePosition(world);
    if (!this.withinGaze(eye, player.position)) return false;

    return world.hasLineOfSight(eye, player.position);
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

  // Like the 1986 original, the Sentinel absorbs energy sources it comes
  // across (boulders and synthoid shells, never trees) and each absorbed
  // energy unit regrows as a tree elsewhere, keeping total energy constant.
  // Returns true when the world changed so visuals can refresh.
  private absorbLandscape(deltaTime: number, world: World, player: Player, random: () => number): boolean {
    this.absorbAccumulator += deltaTime;
    let changed = false;
    while (this.absorbAccumulator >= SENTINEL_DRAIN_INTERVAL) {
      this.absorbAccumulator -= SENTINEL_DRAIN_INTERVAL;
      const victim = this.findEnergySource(world, player);
      if (!victim) break;
      this.consume(victim, world, player, random);
      changed = true;
    }
    return changed;
  }

  private findEnergySource(world: World, player: Player): { x: number; z: number } | null {
    const eye = this.eyePosition(world);
    const current = player.currentCell();
    const size = world.getSize();
    let best: { x: number; z: number } | null = null;
    let bestDist = Number.MAX_SAFE_INTEGER;
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const object = world.getObject(x, z);
        if (object !== 'boulder' && object !== 'robot') continue;
        if (x === current.x && z === current.z) continue;
        if (world.isTowerCell(x, z)) continue;
        const target = {
          x: (x + 0.5) * CELL_SIZE,
          y: world.columnTopAt(x, z),
          z: (z + 0.5) * CELL_SIZE,
        };
        if (!this.withinGaze(eye, target)) continue;
        if (!world.hasLineOfSight(eye, target)) continue;
        const dist = (target.x - eye.x) * (target.x - eye.x) + (target.z - eye.z) * (target.z - eye.z);
        if (dist < bestDist) {
          best = { x, z };
          bestDist = dist;
        }
      }
    }
    return best;
  }

  private consume(victim: { x: number; z: number }, world: World, player: Player, random: () => number): void {
    const object = world.getObject(victim.x, victim.z);
    let taken = false;
    if (object === 'boulder') taken = world.takeBoulder(victim.x, victim.z);
    else if (object === 'robot') taken = world.takeRobot(victim.x, victim.z, false);
    if (!taken) return;
    this.regrowTrees(getObjectEnergy(object), world, player, random);
  }

  private regrowTrees(count: number, world: World, player: Player, random: () => number): void {
    const size = world.getSize();
    const current = player.currentCell();
    for (let n = 0; n < count; n++) {
      for (let attempt = 0; attempt < 50; attempt++) {
        const x = Math.floor(random() * size);
        const z = Math.floor(random() * size);
        if (x === current.x && z === current.z) continue;
        if (world.placeTree(x, z)) break;
      }
    }
  }
}
