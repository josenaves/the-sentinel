import { describe, it, expect, vi, afterEach } from 'vitest';
import { World } from '../../src/world/World.js';
import { Player } from '../../src/player/Player.js';
import { Meanie } from '../../src/entities/Meanie.js';
afterEach(() => {
    vi.restoreAllMocks();
});
function flatWorld() {
    const world = new World(0);
    for (let z = 0; z < 16; z++)
        for (let x = 0; x < 16; x++)
            world.setHeight(x, z, 0);
    return world;
}
function clearWorld(world) {
    for (let z = 0; z < 16; z++) {
        for (let x = 0; x < 16; x++) {
            world.setObject(x, z, 'empty');
            world.setStack(x, z, 0);
        }
    }
}
describe('Meanie', () => {
    it('should spawn on the nearest tree within range', () => {
        const world = flatWorld();
        clearWorld(world);
        const player = new Player(world);
        player.setPosition(5 * 4 + 2, 0, 5 * 4 + 2);
        world.setObject(7, 5, 'tree');
        world.setObject(5, 8, 'tree');
        world.setObject(0, 0, 'tree');
        expect(Meanie.spawnAt(world, player)).toEqual({ x: 7, z: 5 });
    });
    it('should ignore trees out of range and on the player square', () => {
        const world = flatWorld();
        clearWorld(world);
        const player = new Player(world);
        player.setPosition(10 * 4 + 2, 0, 10 * 4 + 2);
        world.setObject(0, 0, 'tree');
        world.setObject(10, 10, 'tree');
        expect(Meanie.spawnAt(world, player)).toBeNull();
    });
    it('should see the square only when facing it with line of sight', () => {
        const world = flatWorld();
        clearWorld(world);
        const player = new Player(world);
        player.setPosition(8 * 4 + 2, 0, 12 * 4 + 2);
        const meanie = new Meanie(8, 10);
        vi.spyOn(world, 'hasLineOfSight').mockReturnValue(true);
        meanie.angle = 0;
        expect(meanie.seesSquare(world, player)).toBe(true);
        meanie.angle = Math.PI;
        expect(meanie.seesSquare(world, player)).toBe(false);
    });
    it('should lose sight when blocked', () => {
        const world = flatWorld();
        clearWorld(world);
        const player = new Player(world);
        player.setPosition(8 * 4 + 2, 0, 12 * 4 + 2);
        const meanie = new Meanie(8, 10);
        meanie.angle = 0;
        vi.spyOn(world, 'hasLineOfSight').mockReturnValue(false);
        expect(meanie.seesSquare(world, player)).toBe(false);
    });
});
