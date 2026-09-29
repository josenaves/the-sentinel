import { Entity } from './Entity.js';
import { CELL_SIZE, SENTINEL_ROTATION_SPEED, SENTINEL_FOV, SENTINEL_SCAN_GRACE, SENTINEL_DRAIN_INTERVAL } from '../core/Constants.js';
export class Sentinel extends Entity {
    angle = 0;
    exposure = 0;
    warning = false;
    absorbed = false;
    drainAccumulator = 0;
    constructor(x = 8, z = 8) {
        super('sentinel', x, z);
    }
    eyePosition(world) {
        const x = this.x * CELL_SIZE + CELL_SIZE / 2;
        const z = this.z * CELL_SIZE + CELL_SIZE / 2;
        return { x, y: world.columnTopAt(this.x, this.z) + 2, z };
    }
    update(deltaTime, world, player) {
        if (this.absorbed) {
            this.warning = false;
            return;
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
    }
    seesPlayer(world, player) {
        const eye = this.eyePosition(world);
        const dx = player.position.x - eye.x;
        const dz = player.position.z - eye.z;
        const yawToPlayer = Math.atan2(dx, dz);
        const facingX = Math.sin(this.angle);
        const facingZ = Math.cos(this.angle);
        const yawFacing = Math.atan2(facingX, facingZ);
        let diff = yawToPlayer - yawFacing;
        while (diff > Math.PI)
            diff -= Math.PI * 2;
        while (diff < -Math.PI)
            diff += Math.PI * 2;
        if (Math.abs(diff) > SENTINEL_FOV / 2)
            return false;
        return world.hasLineOfSight(eye, player.position);
    }
}
