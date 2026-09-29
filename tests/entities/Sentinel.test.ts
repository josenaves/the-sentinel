import { describe, it, expect } from 'vitest';
import { World } from '../../src/world/World.js';
import { Player } from '../../src/player/Player.js';
import { Sentinel } from '../../src/entities/Sentinel.js';

function flatWorld(): World {
  const world = new World(0);
  for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) world.setHeight(x, z, 0);
  return world;
}

function exposedSetup(): { world: World; player: Player; sentinel: Sentinel } {
  const world = flatWorld();
  const player = new Player(world);
  player.setPosition(8 * 4 + 2, 0, 12 * 4 + 2);
  const sentinel = new Sentinel();
  sentinel.angle = 0;
  return { world, player, sentinel };
}

describe('Sentinel', () => {
  it('should warn but not drain before the scan grace period', () => {
    const { world, player, sentinel } = exposedSetup();
    for (let i = 0; i < 4; i++) {
      sentinel.angle = 0;
      sentinel.update(1, world, player);
    }
    expect(sentinel.warning).toBe(true);
    expect(player.energy).toBe(10);
  });

  it('should drain energy after the grace period', () => {
    const { world, player, sentinel } = exposedSetup();
    for (let i = 0; i < 6; i++) {
      sentinel.angle = 0;
      sentinel.update(1, world, player);
    }
    expect(player.energy).toBe(8);
  });

  it('should lose sight when facing away', () => {
    const { world, player, sentinel } = exposedSetup();
    sentinel.angle = Math.PI;
    sentinel.update(1, world, player);
    expect(sentinel.warning).toBe(false);
    expect(sentinel.exposure).toBe(0);
  });

  it('should lose sight when the gaze rotates away', () => {
    const { world, player, sentinel } = exposedSetup();
    sentinel.update(1, world, player);
    expect(sentinel.warning).toBe(true);
    for (let i = 0; i < 5; i++) sentinel.update(1, world, player);
    expect(sentinel.warning).toBe(false);
    expect(sentinel.exposure).toBe(0);
  });

  it('should stop scanning once absorbed', () => {
    const { world, player, sentinel } = exposedSetup();
    sentinel.absorbed = true;
    sentinel.update(10, world, player);
    expect(sentinel.warning).toBe(false);
    expect(player.energy).toBe(10);
  });

  it('should not see through a wall', () => {
    const { world, player, sentinel } = exposedSetup();
    world.setHeight(8, 10, 8);
    sentinel.update(1, world, player);
    expect(sentinel.warning).toBe(false);
  });
});
