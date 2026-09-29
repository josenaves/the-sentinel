import { describe, it, expect, vi, afterEach } from 'vitest';
import { World } from '../../src/world/World.js';
import { Player } from '../../src/player/Player.js';
import { Sentinel } from '../../src/entities/Sentinel.js';

afterEach(() => {
  vi.restoreAllMocks();
});

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

function clearWorld(world: World): void {
  for (let z = 0; z < 16; z++) {
    for (let x = 0; x < 16; x++) {
      world.setObject(x, z, 'empty');
      world.setStack(x, z, 0);
    }
  }
}

function countTrees(world: World): number {
  let count = 0;
  for (let z = 0; z < 16; z++) {
    for (let x = 0; x < 16; x++) {
      if (world.getObject(x, z) === 'tree') count++;
    }
  }
  return count;
}

function cyclingRandom(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length]!;
}

function hiddenPlayer(world: World): Player {
  const player = new Player(world);
  player.setPosition(8 * 4 + 2, 0, 4 * 4 + 2);
  return player;
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

  it('should distinguish head visibility from square visibility', () => {
    const { world, player, sentinel } = exposedSetup();
    vi.spyOn(world, 'hasLineOfSight').mockImplementation((_from, to) => (to as { y: number }).y > 5);
    expect(sentinel.seesHead(world, player)).toBe(true);
    expect(sentinel.seesSquare(world, player)).toBe(false);
  });

  it('should see the square when line of sight is clear', () => {
    const { world, player, sentinel } = exposedSetup();
    expect(sentinel.seesHead(world, player)).toBe(true);
    expect(sentinel.seesSquare(world, player)).toBe(true);
  });

  it('should reduce a lone boulder to a tree, regrowing one tree', () => {
    const world = flatWorld();
    clearWorld(world);
    const player = hiddenPlayer(world);
    const sentinel = new Sentinel();
    sentinel.angle = 0;
    world.placeBoulder(8, 10);

    const changed = sentinel.update(1, world, player, cyclingRandom([0, 0]));

    expect(changed).toBe(true);
    expect(world.getObject(8, 10)).toBe('tree');
    expect(world.getStack(8, 10)).toBe(0);
    expect(countTrees(world)).toBe(2);
    expect(player.energy).toBe(10);
  });

  it('should ignore trees', () => {
    const world = flatWorld();
    clearWorld(world);
    const player = hiddenPlayer(world);
    const sentinel = new Sentinel();
    sentinel.angle = 0;
    world.placeTree(8, 10);

    const changed = sentinel.update(1, world, player, cyclingRandom([0]));

    expect(changed).toBe(false);
    expect(world.getObject(8, 10)).toBe('tree');
    expect(countTrees(world)).toBe(1);
  });

  it('should reduce a robot shell to a boulder, then to a tree', () => {
    const world = flatWorld();
    clearWorld(world);
    const player = hiddenPlayer(world);
    const sentinel = new Sentinel();
    sentinel.angle = 0;
    world.placeRobot(8, 10);
    const random = cyclingRandom([0, 0, 0, 0.5]);

    expect(sentinel.update(1, world, player, random)).toBe(true);
    expect(world.getObject(8, 10)).toBe('boulder');
    expect(countTrees(world)).toBe(1);

    expect(sentinel.update(1, world, player, random)).toBe(true);
    expect(world.getObject(8, 10)).toBe('tree');
    expect(countTrees(world)).toBe(3);
  });

  it('should not absorb the shell the player stands on', () => {
    const { world, player, sentinel } = exposedSetup();
    clearWorld(world);
    world.placeRobot(8, 12);

    const changed = sentinel.update(1, world, player, cyclingRandom([0]));

    expect(changed).toBe(false);
    expect(world.getObject(8, 12)).toBe('robot');
    expect(player.energy).toBe(10);
  });

  it('should not absorb landscape once absorbed itself', () => {
    const world = flatWorld();
    clearWorld(world);
    const player = hiddenPlayer(world);
    const sentinel = new Sentinel();
    sentinel.angle = 0;
    sentinel.absorbed = true;
    world.placeBoulder(8, 10);

    const changed = sentinel.update(1, world, player, cyclingRandom([0]));

    expect(changed).toBe(false);
    expect(world.getObject(8, 10)).toBe('boulder');
  });
});
