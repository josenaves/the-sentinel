import { describe, it, expect } from 'vitest';
import { Terrain } from '../../src/world/Terrain.js';
import { WORLD_SIZE, MAX_HEIGHT } from '../../src/core/Constants.js';

describe('Terrain', () => {
  it('should create terrain with correct size', () => {
    const terrain = new Terrain(16);
    expect(terrain.getSize()).toBe(16);
  });

  it('should return cell within bounds', () => {
    const terrain = new Terrain(4);
    const cell = terrain.getCell(2, 2);
    expect(cell).toBeDefined();
    expect(cell?.height).toBe(0);
  });

  it('should return undefined for out of bounds', () => {
    const terrain = new Terrain(4);
    expect(terrain.getCell(-1, 0)).toBeUndefined();
    expect(terrain.getCell(0, -1)).toBeUndefined();
    expect(terrain.getCell(4, 0)).toBeUndefined();
    expect(terrain.getCell(0, 4)).toBeUndefined();
  });

  it('should get and set height', () => {
    const terrain = new Terrain(4);
    expect(terrain.getHeight(1, 1)).toBe(0);

    terrain.setHeight(1, 1, 5);
    expect(terrain.getHeight(1, 1)).toBe(5);
  });

  it('should clamp height to valid range', () => {
    const terrain = new Terrain(4);

    terrain.setHeight(0, 0, -5);
    expect(terrain.getHeight(0, 0)).toBe(0);

    terrain.setHeight(0, 0, MAX_HEIGHT + 10);
    expect(terrain.getHeight(0, 0)).toBe(MAX_HEIGHT);
  });

  it('should default to an empty stack', () => {
    const terrain = new Terrain(4);
    expect(terrain.getStack(1, 1)).toBe(0);
    expect(terrain.surfaceLevel(1, 1)).toBe(terrain.getHeight(1, 1));
  });

  it('should get and set stacks with clamping', () => {
    const terrain = new Terrain(4);
    terrain.setHeight(1, 1, 2);
    expect(terrain.setStack(1, 1, 3)).toBe(true);
    expect(terrain.getStack(1, 1)).toBe(3);
    expect(terrain.surfaceLevel(1, 1)).toBe(5);

    terrain.setStack(1, 1, -4);
    expect(terrain.getStack(1, 1)).toBe(0);
    expect(terrain.setStack(-1, 0, 1)).toBe(false);
  });

  it('should return false for setHeight out of bounds', () => {
    const terrain = new Terrain(4);
    expect(terrain.setHeight(-1, 0, 1)).toBe(false);
    expect(terrain.setHeight(0, -1, 1)).toBe(false);
    expect(terrain.setHeight(4, 0, 1)).toBe(false);
    expect(terrain.setHeight(0, 4, 1)).toBe(false);
  });

  it('should get height at world position', () => {
    const terrain = new Terrain(4);
    terrain.setHeight(1, 1, 3);

    expect(terrain.getHeightAtWorldPosition(4.5, 4.5, 4)).toBe(3);
    expect(terrain.getHeightAtWorldPosition(0, 0, 4)).toBe(0);
  });

  it('should handle world boundaries', () => {
    const terrain = new Terrain(WORLD_SIZE);
    const size = terrain.getSize();

    expect(terrain.getCell(0, 0)).toBeDefined();
    expect(terrain.getCell(size - 1, size - 1)).toBeDefined();
    expect(terrain.getCell(size, 0)).toBeUndefined();
    expect(terrain.getCell(0, size)).toBeUndefined();
  });
});