import { describe, it, expect } from 'vitest';
import { WorldGenerator } from '../../src/world/WorldGenerator.js';
import { getObjectEnergy } from '../../src/world/Cell.js';
import { WORLD_SIZE, MAX_HEIGHT, LANDSCAPE_COUNT } from '../../src/core/Constants.js';

describe('WorldGenerator', () => {
  it('should generate deterministic terrain with same seed', () => {
    const gen1 = new WorldGenerator(12345);
    const gen2 = new WorldGenerator(12345);

    const terrain1 = gen1.generate();
    const terrain2 = gen2.generate();

    for (let z = 0; z < WORLD_SIZE; z++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        expect(terrain1.getHeight(x, z)).toBe(terrain2.getHeight(x, z));
        expect(terrain1.getObject(x, z)).toBe(terrain2.getObject(x, z));
      }
    }
  });

  it('should generate different terrain with different seeds', () => {
    const gen1 = new WorldGenerator(12345);
    const gen2 = new WorldGenerator(54321);

    const terrain1 = gen1.generate();
    const terrain2 = gen2.generate();

    let different = false;
    for (let z = 0; z < WORLD_SIZE; z++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        if (terrain1.getHeight(x, z) !== terrain2.getHeight(x, z)) {
          different = true;
          break;
        }
      }
    }
    expect(different).toBe(true);
  });

  it('should generate heights within valid range', () => {
    const generator = new WorldGenerator(999);
    const terrain = generator.generate();

    for (let z = 0; z < WORLD_SIZE; z++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        const height = terrain.getHeight(x, z);
        expect(height).toBeGreaterThanOrEqual(0);
        expect(height).toBeLessThanOrEqual(MAX_HEIGHT);
      }
    }
  });

  it('should normalize seeds to landscape numbers 0-9999', () => {
    const gen = new WorldGenerator(12572);
    expect(gen.getLandscapeNumber()).toBe(2572);

    const a = new WorldGenerator(12572).generate();
    const b = new WorldGenerator(2572).generate();
    for (let z = 0; z < WORLD_SIZE; z++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        expect(a.getHeight(x, z)).toBe(b.getHeight(x, z));
      }
    }

    expect(new WorldGenerator(0).getLandscapeNumber()).toBe(0);
    expect(new WorldGenerator(9999).getLandscapeNumber()).toBe(LANDSCAPE_COUNT - 1);
  });

  it('should generate stepped terrain with plateaus and cliffs', () => {
    const terrain = new WorldGenerator(2572).generate();

    let plateaus = 0;
    let cliffs = 0;
    for (let z = 0; z < WORLD_SIZE; z++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        const height = terrain.getHeight(x, z);
        expect(Number.isInteger(height)).toBe(true);
        if (x + 1 < WORLD_SIZE) {
          const delta = Math.abs(terrain.getHeight(x + 1, z) - height);
          if (delta === 0) plateaus++;
          if (delta >= 2) cliffs++;
        }
      }
    }
    expect(plateaus).toBeGreaterThan(100);
    expect(cliffs).toBeGreaterThan(10);
  });

  it('should place objects with valid energy values', () => {
    const terrain = new WorldGenerator(2572).generate();

    let trees = 0;
    let boulders = 0;
    for (let z = 0; z < WORLD_SIZE; z++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        const object = terrain.getObject(x, z);
        const energy = getObjectEnergy(object);
        expect(energy).toBeGreaterThanOrEqual(0);
        if (object === 'tree') {
          trees++;
          expect(energy).toBe(1);
        }
        if (object === 'boulder') {
          boulders++;
          expect(energy).toBe(2);
        }
      }
    }
    expect(trees).toBeGreaterThan(0);
    expect(boulders).toBeGreaterThan(0);
  });

  it('should match golden heights for landscape 2572', () => {
    const terrain = new WorldGenerator(2572).generate();

    expect(
      Array.from({ length: WORLD_SIZE }, (_, x) => terrain.getHeight(x, 0)),
    ).toEqual([2, 2, 3, 4, 5, 5, 6, 7, 8, 7, 7, 7, 7, 6, 5, 4]);
    expect(
      Array.from({ length: WORLD_SIZE }, (_, x) => terrain.getHeight(x, 8)),
    ).toEqual([7, 5, 3, 1, 0, 0, 0, 0, 0, 2, 4, 6, 8, 6, 5, 3]);
  });
});
