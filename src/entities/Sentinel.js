import { Entity } from './Entity.js';
import { CELL_SIZE, SENTINEL_ROTATION_SPEED, SENTINEL_FOV, SENTINEL_SCAN_GRACE, SENTINEL_DRAIN_INTERVAL } from '../core/Constants.js';
export class Sentinel extends Entity {
    angle = 0;
    exposure = 0;
    warning = false;
    absorbed = false;
    drainAccumulator = 0;
    absorbAccumulator = 0;
    constructor(x = 8, z = 8, id = 'sentinel') {
        super(id, x, z);
    }
    eyePosition(world) {
        const x = this.x * CELL_SIZE + CELL_SIZE / 2;
        const z = this.z * CELL_SIZE + CELL_SIZE / 2;
        return { x, y: world.columnTopAt(this.x, this.z) + 2, z };
    }
    update(deltaTime, world, player, random = Math.random) {
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
        }
        else {
            this.exposure = 0;
            this.drainAccumulator = 0;
            this.warning = false;
        }
        return this.absorbLandscape(deltaTime, world, player, random);
    }
    // Energy drain needs the full sighting like the 1986 original: seeing
    // only the head (partial) cannot absorb energy, it may spawn a Meanie.
    seesPlayer(world, player) {
        return this.seesHead(world, player) && this.seesSquare(world, player);
    }
    seesHead(world, player) {
        const eye = this.eyePosition(world);
        if (!this.withinGaze(eye, player.position))
            return false;
        return world.hasLineOfSight(eye, player.position);
    }
    seesSquare(world, player) {
        const eye = this.eyePosition(world);
        const current = player.currentCell();
        const base = {
            x: player.position.x,
            y: world.columnTopAt(current.x, current.z),
            z: player.position.z,
        };
        if (!this.withinGaze(eye, base))
            return false;
        return world.hasLineOfSight(eye, base);
    }
    withinGaze(eye, target) {
        const dx = target.x - eye.x;
        const dz = target.z - eye.z;
        const yawToTarget = Math.atan2(dx, dz);
        const facingX = Math.sin(this.angle);
        const facingZ = Math.cos(this.angle);
        const yawFacing = Math.atan2(facingX, facingZ);
        let diff = yawToTarget - yawFacing;
        while (diff > Math.PI)
            diff -= Math.PI * 2;
        while (diff < -Math.PI)
            diff += Math.PI * 2;
        return Math.abs(diff) <= SENTINEL_FOV / 2;
    }
    // Like the 1986 original, the Sentinel absorbs energy sources it comes
    // across (boulders and synthoid shells, never trees) and each absorbed
    // energy unit regrows as a tree elsewhere, keeping total energy constant.
    // Returns true when the world changed so visuals can refresh.
    absorbLandscape(deltaTime, world, player, random) {
        this.absorbAccumulator += deltaTime;
        let changed = false;
        while (this.absorbAccumulator >= SENTINEL_DRAIN_INTERVAL) {
            this.absorbAccumulator -= SENTINEL_DRAIN_INTERVAL;
            const victim = this.findEnergySource(world, player);
            if (!victim)
                break;
            this.consume(victim, world, player, random);
            changed = true;
        }
        return changed;
    }
    findEnergySource(world, player) {
        const eye = this.eyePosition(world);
        const current = player.currentCell();
        const size = world.getSize();
        let best = null;
        let bestDist = Number.MAX_SAFE_INTEGER;
        for (let z = 0; z < size; z++) {
            for (let x = 0; x < size; x++) {
                const object = world.getObject(x, z);
                if (object !== 'boulder' && object !== 'robot')
                    continue;
                if (x === current.x && z === current.z)
                    continue;
                if (world.isTowerCell(x, z))
                    continue;
                const target = {
                    x: (x + 0.5) * CELL_SIZE,
                    y: world.columnTopAt(x, z),
                    z: (z + 0.5) * CELL_SIZE,
                };
                if (!this.withinGaze(eye, target))
                    continue;
                if (!world.hasLineOfSight(eye, target))
                    continue;
                const dist = (target.x - eye.x) * (target.x - eye.x) + (target.z - eye.z) * (target.z - eye.z);
                if (dist < bestDist) {
                    best = { x, z };
                    bestDist = dist;
                }
            }
        }
        return best;
    }
    consume(victim, world, player, random) {
        // Like the original, energy is reduced to 1 one unit at a time: a robot
        // becomes a boulder, a boulder becomes a tree. Totals stay constant.
        const object = world.getObject(victim.x, victim.z);
        if (object === 'robot') {
            world.setObject(victim.x, victim.z, 'boulder');
            this.regrowTrees(1, world, player, random);
        }
        else if (object === 'boulder') {
            if (world.getStack(victim.x, victim.z) <= 1) {
                world.setStack(victim.x, victim.z, 0);
                world.setObject(victim.x, victim.z, 'tree');
                this.regrowTrees(1, world, player, random);
            }
            else {
                if (!world.takeBoulder(victim.x, victim.z))
                    return;
                this.regrowTrees(2, world, player, random);
            }
        }
    }
    regrowTrees(count, world, player, random) {
        const size = world.getSize();
        const current = player.currentCell();
        for (let n = 0; n < count; n++) {
            for (let attempt = 0; attempt < 50; attempt++) {
                const x = Math.floor(random() * size);
                const z = Math.floor(random() * size);
                if (x === current.x && z === current.z)
                    continue;
                if (world.placeTree(x, z))
                    break;
            }
        }
    }
}
