import { describe, it, expect } from 'vitest';
import { Player } from '../../src/player/Player.js';
import { World } from '../../src/world/World.js';
import { MOUSE_SENSITIVITY, PAN_KEYBOARD_SPEED } from '../../src/core/Constants.js';
function idleInput() {
    return { panLeft: false, panRight: false, panUp: false, panDown: false, mouseDeltaX: 0, mouseDeltaY: 0, absorb: false, createTree: false, createBoulder: false, createRobot: false, transfer: false, hyperspace: false, uturn: false };
}
describe('Player', () => {
    it('should scale mouse deltas by MOUSE_SENSITIVITY', () => {
        const player = new Player(new World(2572));
        const input = { ...idleInput(), mouseDeltaX: 1000, mouseDeltaY: 500 };
        player.update(0.016, input);
        expect(player.rotation).toBeCloseTo(-1000 * MOUSE_SENSITIVITY, 10);
        expect(player.pitch).toBeCloseTo(500 * MOUSE_SENSITIVITY, 10);
    });
    it('should keep small trackpad deltas controllable', () => {
        const player = new Player(new World(2572));
        player.update(0.016, { ...idleInput(), mouseDeltaX: 20 });
        expect(Math.abs(player.rotation)).toBeLessThan(Math.PI / 4);
    });
    it('should pan with arrow keys without moving', () => {
        const player = new Player(new World(2572));
        player.setPosition(5 * 4 + 2, 0, 5 * 4 + 2);
        player.update(1, { ...idleInput(), panLeft: true });
        expect(player.rotation).toBeCloseTo(PAN_KEYBOARD_SPEED, 10);
        expect(player.position.x).toBeCloseTo(5 * 4 + 2, 10);
        expect(player.position.z).toBeCloseTo(5 * 4 + 2, 10);
        player.update(1, { ...idleInput(), panRight: true });
        expect(player.rotation).toBeCloseTo(0, 10);
        player.update(1, { ...idleInput(), panUp: true });
        expect(player.pitch).toBeCloseTo(-PAN_KEYBOARD_SPEED, 10);
        player.update(1, { ...idleInput(), panDown: true });
        expect(player.pitch).toBeCloseTo(0, 10);
    });
    it('should turn 180 degrees on u-turn', () => {
        const player = new Player(new World(2572));
        player.update(0.016, { ...idleInput(), uturn: true });
        expect(player.rotation).toBeCloseTo(Math.PI, 10);
        player.update(0.016, { ...idleInput(), uturn: true });
        expect(player.rotation).toBeCloseTo(Math.PI * 2, 10);
    });
    it('should transfer to a cell center with eye above the column', () => {
        const world = new World(0);
        for (let z = 0; z < 16; z++)
            for (let x = 0; x < 16; x++)
                world.setHeight(x, z, 0);
        world.setHeight(5, 5, 2);
        const player = new Player(world);
        player.transferTo(5, 5);
        expect(player.position.x).toBeCloseTo((5 + 0.5) * 4, 10);
        expect(player.position.z).toBeCloseTo((5 + 0.5) * 4, 10);
        expect(player.position.y).toBeCloseTo((2 + 1) * 4 + 1.7, 10);
        expect(player.currentCell()).toEqual({ x: 5, z: 5 });
    });
    it('should add and spend energy', () => {
        const player = new Player(new World(2572));
        const start = player.energy;
        expect(player.canAfford(start)).toBe(true);
        expect(player.canAfford(start + 1)).toBe(false);
        player.addEnergy(2);
        expect(player.energy).toBe(start + 2);
        expect(player.spendEnergy(3)).toBe(true);
        expect(player.energy).toBe(start - 1);
        expect(player.spendEnergy(100000)).toBe(false);
        expect(player.energy).toBe(start - 1);
    });
    it('should clamp pitch to [-PI/2, PI/2]', () => {
        const player = new Player(new World(2572));
        player.update(0.016, { ...idleInput(), mouseDeltaY: 100000 });
        expect(player.pitch).toBeGreaterThanOrEqual(-Math.PI / 2);
        player.update(0.016, { ...idleInput(), mouseDeltaY: -100000 });
        expect(player.pitch).toBeLessThanOrEqual(Math.PI / 2);
    });
});
