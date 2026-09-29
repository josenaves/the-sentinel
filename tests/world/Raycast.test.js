import { describe, it, expect } from 'vitest';
import { World } from '../../src/world/World.js';
function flatWorld() {
    const world = new World(0);
    for (let z = 0; z < 16; z++)
        for (let x = 0; x < 16; x++)
            world.setHeight(x, z, 0);
    return world;
}
describe('World.raycastAim', () => {
    it('should hit a cell ahead when looking down-forward', () => {
        const world = flatWorld();
        const target = world.raycastAim({ x: 8 * 4 + 2, y: 20, z: 8 * 4 + 2 }, { x: 0, y: -Math.SQRT1_2, z: -Math.SQRT1_2 });
        expect(target).not.toBeNull();
        expect(target?.tower).toBe(false);
        expect(target.z).toBeLessThan(8);
    });
    it('should stop at the first occluding column', () => {
        const world = flatWorld();
        world.setHeight(8, 6, 8);
        const target = world.raycastAim({ x: 8 * 4 + 2, y: 20, z: 8 * 4 + 2 }, { x: 0, y: -Math.SQRT1_2, z: -Math.SQRT1_2 });
        expect(target).toEqual({ x: 8, z: 6, tower: false });
    });
    it('should report the tower cell when the ray hits the tower', () => {
        const world = flatWorld();
        const target = world.raycastAim({ x: 8 * 4 + 2, y: 10, z: 12 * 4 + 2 }, { x: 0, y: 0, z: -1 });
        expect(target).toEqual({ x: 8, z: 8, tower: true });
    });
    it('should reach far cells from a high tower', () => {
        const world = flatWorld();
        const target = world.raycastAim({ x: 14 * 4 + 2, y: 100, z: 14 * 4 + 2 }, { x: 0, y: -1, z: 0 });
        expect(target).toEqual({ x: 14, z: 14, tower: false });
    });
    it('should return null beyond sight range', () => {
        const world = flatWorld();
        const target = world.raycastAim({ x: 14 * 4 + 2, y: 200, z: 14 * 4 + 2 }, { x: 0, y: -1, z: 0 });
        expect(target).toBeNull();
    });
    it('should report line of sight over flat ground', () => {
        const world = flatWorld();
        expect(world.hasLineOfSight({ x: 8 * 4 + 2, y: 26, z: 8 * 4 + 2 }, { x: 8 * 4 + 2, y: 5.7, z: 12 * 4 + 2 })).toBe(true);
    });
    it('should block line of sight behind a wall', () => {
        const world = flatWorld();
        world.setHeight(8, 10, 8);
        expect(world.hasLineOfSight({ x: 8 * 4 + 2, y: 26, z: 8 * 4 + 2 }, { x: 8 * 4 + 2, y: 5.7, z: 12 * 4 + 2 })).toBe(false);
    });
    it('should hit a tree cube when aiming at it horizontally', () => {
        const world = flatWorld();
        world.setObject(8, 6, 'tree');
        const target = world.raycastAim({ x: 8 * 4 + 2, y: 5.7, z: 8 * 4 + 2 }, { x: 0, y: 0, z: -1 });
        expect(target).toEqual({ x: 8, z: 6, tower: false });
    });
    it('should miss flat ground when aiming horizontally above it', () => {
        const world = flatWorld();
        const target = world.raycastAim({ x: 8 * 4 + 2, y: 5.7, z: 8 * 4 + 2 }, { x: 0, y: 0, z: -1 });
        expect(target).toBeNull();
    });
    it('should target the own square when looking straight down', () => {
        const world = flatWorld();
        const target = world.raycastAim({ x: 5 * 4 + 2, y: 5.7, z: 5 * 4 + 2 }, { x: 0, y: -1, z: 0 });
        expect(target).toEqual({ x: 5, z: 5, tower: false });
    });
    it('should hit the top of a boulder stack', () => {
        const world = flatWorld();
        world.placeBoulder(8, 6);
        world.placeBoulder(8, 6);
        const target = world.raycastAim({ x: 8 * 4 + 2, y: 5.7, z: 8 * 4 + 2 }, { x: 0, y: 0, z: -1 });
        expect(target).toEqual({ x: 8, z: 6, tower: false });
    });
    it('should return null when looking at the sky', () => {
        const world = flatWorld();
        const target = world.raycastAim({ x: 8 * 4 + 2, y: 50, z: 8 * 4 + 2 }, { x: 0, y: 1, z: 0 });
        expect(target).toBeNull();
    });
});
