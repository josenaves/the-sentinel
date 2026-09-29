import { describe, it, expect } from 'vitest';
import { World } from '../../src/world/World.js';
import { WORLD_SIZE, CELL_SIZE } from '../../src/core/Constants.js';

describe('World', () => {
  it('should create world with terrain', () => {
    const world = new World(12345);
    expect(world.getTerrain()).toBeDefined();
    expect(world.getSize()).toBe(WORLD_SIZE);
  });

  it('should delegate getHeight to terrain', () => {
    const world = new World(12345);
    const height = world.getHeight(5, 5);
    expect(height).toBeGreaterThanOrEqual(0);
  });

  it('should delegate setHeight to terrain', () => {
    const world = new World(12345);
    expect(world.setHeight(5, 5, 3)).toBe(true);
    expect(world.getHeight(5, 5)).toBe(3);
  });

  it('should return cell size', () => {
    const world = new World(12345);
    expect(world.getCellSize()).toBe(CELL_SIZE);
  });

  it('should get height at world position', () => {
    const world = new World(12345);
    const height = world.getHeight(8, 8);
    const worldHeight = world.getHeightAtWorldPosition(8 * CELL_SIZE + 2, 8 * CELL_SIZE + 2);
    expect(worldHeight).toBe(height);
  });

  it('should pick a hyperspace destination at equal or lower height', () => {
    const world = new World(0);
    for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) world.setHeight(x, z, 3);
    world.setHeight(5, 5, 5);
    world.setHeight(2, 2, 1);

    let state = 12345;
    const random = (): number => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };

    const destination = world.pickHyperspaceDestination(5, 5, random);
    expect(destination).not.toBeNull();
    expect(destination).not.toEqual({ x: 5, z: 5 });
    expect(world.getHeight(destination!.x, destination!.z)).toBeLessThanOrEqual(5);
    expect(destination).not.toEqual({ x: 8, z: 8 });
  });

  it('should return null when every other square is higher', () => {
    const world = new World(0);
    for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) world.setHeight(x, z, 8);
    world.setHeight(5, 5, 0);

    expect(world.pickHyperspaceDestination(5, 5, () => 0.5)).toBeNull();
  });

  it('should create vertical structure at center', () => {
    const world = new World(12345);
    const structure = world.getVerticalStructure();
    expect(structure).not.toBeNull();
    expect(structure?.x).toBe(Math.floor(WORLD_SIZE / 2));
    expect(structure?.z).toBe(Math.floor(WORLD_SIZE / 2));
    expect(structure?.height).toBeGreaterThan(0);
  });
});