import { describe, it, expect } from 'vitest';
import { World } from '../../src/world/World.js';
import { Player } from '../../src/player/Player.js';
import { Sentry } from '../../src/entities/Sentry.js';
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
function countTrees(world) {
    let count = 0;
    for (let z = 0; z < 16; z++) {
        for (let x = 0; x < 16; x++) {
            if (world.getObject(x, z) === 'tree')
                count++;
        }
    }
    return count;
}
function cyclingRandom(values) {
    let i = 0;
    return () => values[i++ % values.length];
}
describe('Sentry', () => {
    it('should warn and drain like the Sentinel', () => {
        const world = flatWorld();
        clearWorld(world);
        const player = new Player(world);
        player.setPosition(8 * 4 + 2, 0, 12 * 4 + 2);
        const sentry = new Sentry(8, 10);
        sentry.angle = 0;
        for (let i = 0; i < 6; i++) {
            sentry.angle = 0;
            sentry.update(1, world, player);
        }
        expect(sentry.warning).toBe(true);
        expect(player.energy).toBe(8);
    });
    it('should absorb a visible boulder from its square', () => {
        const world = flatWorld();
        clearWorld(world);
        const player = new Player(world);
        player.setPosition(8 * 4 + 2, 0, 4 * 4 + 2);
        const sentry = new Sentry(8, 8);
        sentry.angle = 0;
        world.placeBoulder(8, 10);
        const changed = sentry.update(1, world, player, cyclingRandom([0, 0, 0, 0.5]));
        expect(changed).toBe(true);
        expect(world.getObject(8, 10)).toBe('empty');
        expect(countTrees(world)).toBe(2);
    });
    it('should stop once absorbed', () => {
        const world = flatWorld();
        clearWorld(world);
        const player = new Player(world);
        player.setPosition(8 * 4 + 2, 0, 12 * 4 + 2);
        const sentry = new Sentry(8, 10);
        sentry.angle = 0;
        sentry.absorbed = true;
        expect(sentry.update(1, world, player)).toBe(false);
        expect(sentry.warning).toBe(false);
        expect(player.energy).toBe(10);
    });
});
