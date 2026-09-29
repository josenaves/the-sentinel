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

  it('should never hyperspace onto a tree or robot cell', () => {
    const world = new World(0);
    for (let z = 0; z < 16; z++) {
      for (let x = 0; x < 16; x++) {
        world.setHeight(x, z, 0);
        world.setObject(x, z, 'tree');
        world.setStack(x, z, 0);
      }
    }
    world.setObject(3, 3, 'empty');

    let i = 0;
    const sequence = [0, 0, 51 / 256, 51 / 256];
    const destination = world.pickHyperspaceDestination(5, 5, () => sequence[i++ % sequence.length]!);

    expect(destination).toEqual({ x: 3, z: 3 });
  });

  it('should allow a robot shell on the open tower only', () => {
    const world = new World(0);
    const structure = world.getVerticalStructure()!;

    expect(world.placeRobot(structure.x, structure.z)).toBe(false);

    world.setTowerOpen(true);
    expect(world.placeRobot(structure.x, structure.z)).toBe(true);
    expect(world.getObject(structure.x, structure.z)).toBe('robot');
    expect(world.takeRobot(structure.x, structure.z, false)).toBe(true);
  });

  it('should target the tower cell when aiming down from above', () => {
    const world = new World(0);
    for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) world.setHeight(x, z, 0);
    const top = world.columnTopAt(8, 8);
    const origin = { x: (8 + 0.5) * CELL_SIZE, y: top + 10, z: (8 + 0.5) * CELL_SIZE };

    const target = world.raycastAim(origin, { x: 0, y: -1, z: 0 });

    expect(target).not.toBeNull();
    expect(target!.x).toBe(8);
    expect(target!.z).toBe(8);
    expect(target!.tower).toBe(true);
  });
  it('should create vertical structure at center', () => {
    const world = new World(12345);
    const structure = world.getVerticalStructure();
    expect(structure).not.toBeNull();
    expect(structure?.x).toBe(Math.floor(WORLD_SIZE / 2));
    expect(structure?.z).toBe(Math.floor(WORLD_SIZE / 2));
    expect(structure?.height).toBeGreaterThan(0);
  });

  it('should derive the landscape number from the seed', () => {
    expect(new World(2572).getLandscapeNumber()).toBe(2572);
    expect(new World(10000).getLandscapeNumber()).toBe(0);
  });

  it('should generate identical landscapes from the same number', () => {    const a = new World(2572);
    const b = new World(2572);
    for (let z = 0; z < 16; z++) {
      for (let x = 0; x < 16; x++) {
        expect(b.getHeight(x, z)).toBe(a.getHeight(x, z));
        expect(b.getObject(x, z)).toBe(a.getObject(x, z));
        expect(b.getStack(x, z)).toBe(a.getStack(x, z));
      }
    }
    expect(b.getVerticalStructure()).toEqual(a.getVerticalStructure());
  });

  it('should place no sentries on early landscapes', () => {
    expect(new World(0).getSentries()).toEqual([]);
    expect(new World(1499).getSentries()).toEqual([]);
  });

  it('should place one sentry on landscape 2345', () => {
    const world = new World(2345);
    const posts = world.getSentries();
    expect(posts).toHaveLength(1);
    const post = posts[0]!;
    expect(post.x).toBeGreaterThanOrEqual(0);
    expect(post.x).toBeLessThan(16);
    expect(post.z).toBeGreaterThanOrEqual(0);
    expect(post.z).toBeLessThan(16);
    expect(world.isTowerCell(post.x, post.z)).toBe(false);
    expect(world.getObject(post.x, post.z)).toBe('empty');
  });

  it('should place sentries deterministically and cap at five', () => {
    expect(new World(5000).getSentries()).toEqual(new World(5000).getSentries());
    expect(new World(5000).getSentries()).toHaveLength(3);
    expect(new World(9999).getSentries()).toHaveLength(5);
  });
});