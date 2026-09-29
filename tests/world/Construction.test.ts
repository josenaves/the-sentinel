import { describe, it, expect } from 'vitest';
import { World } from '../../src/world/World.js';
import { WorldGenerator } from '../../src/world/WorldGenerator.js';

function emptyWorld(): World {
  const world = new World(0);
  for (let z = 0; z < 16; z++) {
    for (let x = 0; x < 16; x++) {
      world.setHeight(x, z, 0);
      world.setObject(x, z, 'empty');
      world.setStack(x, z, 0);
    }
  }
  return world;
}

describe('Construction', () => {
  it('should stack boulders with one unit per placement', () => {
    const world = emptyWorld();
    expect(world.placeBoulder(5, 5)).toBe(true);
    expect(world.getStack(5, 5)).toBe(1);
    expect(world.getObject(5, 5)).toBe('boulder');
    expect(world.placeBoulder(5, 5)).toBe(true);
    expect(world.getStack(5, 5)).toBe(2);
    expect(world.surfaceLevel(5, 5)).toBe(2);
  });

  it('should refuse boulders on trees, robots and the tower', () => {
    const world = emptyWorld();
    world.setObject(1, 1, 'tree');
    world.setObject(2, 2, 'robot');
    expect(world.placeBoulder(1, 1)).toBe(false);
    expect(world.placeBoulder(2, 2)).toBe(false);
    expect(world.placeBoulder(8, 8)).toBe(false);
    expect(world.getStack(1, 1)).toBe(0);
  });

  it('should remove one boulder per absorb and clear the last one', () => {
    const world = emptyWorld();
    world.placeBoulder(5, 5);
    world.placeBoulder(5, 5);
    expect(world.takeBoulder(5, 5)).toBe(true);
    expect(world.getStack(5, 5)).toBe(1);
    expect(world.getObject(5, 5)).toBe('boulder');
    expect(world.takeBoulder(5, 5)).toBe(true);
    expect(world.getStack(5, 5)).toBe(0);
    expect(world.getObject(5, 5)).toBe('empty');
    expect(world.takeBoulder(5, 5)).toBe(false);
  });

  it('should place robots on empty squares and atop boulder stacks', () => {
    const world = emptyWorld();
    expect(world.placeRobot(3, 3)).toBe(true);
    expect(world.getObject(3, 3)).toBe('robot');
    world.placeBoulder(4, 4);
    expect(world.placeRobot(4, 4)).toBe(true);
    expect(world.getObject(4, 4)).toBe('robot');
    expect(world.getStack(4, 4)).toBe(1);
  });

  it('should refuse robots on trees, robots and the tower', () => {
    const world = emptyWorld();
    world.setObject(1, 1, 'tree');
    world.placeRobot(2, 2);
    expect(world.placeRobot(1, 1)).toBe(false);
    expect(world.placeRobot(2, 2)).toBe(false);
    expect(world.placeRobot(8, 8)).toBe(false);
  });

  it('should restore the boulder under an absorbed robot but never the self', () => {
    const world = emptyWorld();
    world.placeBoulder(4, 4);
    world.placeRobot(4, 4);
    expect(world.takeRobot(4, 4, true)).toBe(false);
    expect(world.takeRobot(4, 4, false)).toBe(true);
    expect(world.getObject(4, 4)).toBe('boulder');
    expect(world.getStack(4, 4)).toBe(1);

    world.placeRobot(3, 3);
    expect(world.takeRobot(3, 3, false)).toBe(true);
    expect(world.getObject(3, 3)).toBe('empty');
    expect(world.takeRobot(3, 3, false)).toBe(false);
  });

  it('should place and absorb trees only on clear squares', () => {
    const world = emptyWorld();
    expect(world.placeTree(3, 3)).toBe(true);
    expect(world.placeTree(3, 3)).toBe(false);
    expect(world.placeTree(8, 8)).toBe(false);
    expect(world.takeTree(3, 3)).toBe(true);
    expect(world.getObject(3, 3)).toBe('empty');
    expect(world.takeTree(3, 3)).toBe(false);
  });

  it('should track landscape numbers like the generator', () => {
    expect(new World(2572).getLandscapeNumber()).toBe(2572);
    expect(new World(12572).getLandscapeNumber()).toBe(2572);
    expect(new World(0).getLandscapeNumber()).toBe(0);
  });

  it('should keep the tower closed until the Sentinel is absorbed', () => {
    const world = emptyWorld();
    expect(world.isTowerOpen()).toBe(false);
    expect(world.placeRobot(8, 8)).toBe(false);
    expect(world.placeTree(8, 8)).toBe(false);
    expect(world.placeBoulder(8, 8)).toBe(false);
    world.setTowerOpen(true);
    expect(world.isTowerOpen()).toBe(true);
    expect(world.placeRobot(8, 8)).toBe(true);
  });

  it('should only allow robots on the open tower, never trees or boulders', () => {
    const world = emptyWorld();
    world.setTowerOpen(true);
    expect(world.placeTree(8, 8)).toBe(false);
    expect(world.placeBoulder(8, 8)).toBe(false);
    expect(world.placeRobot(8, 8)).toBe(true);
    expect(world.getObject(8, 8)).toBe('robot');
  });

  it('should only allow absorbing the Sentinel from above its platform', () => {
    const world = emptyWorld();
    const top = world.columnTopAt(8, 8);
    expect(world.canAbsorbSentinel(top - 1)).toBe(false);
    expect(world.canAbsorbSentinel(top + 1)).toBe(true);
    world.setTowerOpen(true);
    expect(world.canAbsorbSentinel(top + 1)).toBe(false);
  });

  it('should generate natural boulders as single-unit stacks', () => {
    const world = new WorldGenerator(2572).generate();
    let boulders = 0;
    for (let z = 0; z < 16; z++) {
      for (let x = 0; x < 16; x++) {
        if (world.getObject(x, z) === 'boulder') {
          boulders++;
          expect(world.getStack(x, z)).toBe(1);
        }
        if (world.getObject(x, z) === 'tree') {
          expect(world.getStack(x, z)).toBe(0);
        }
      }
    }
    expect(boulders).toBeGreaterThan(0);
  });
});
