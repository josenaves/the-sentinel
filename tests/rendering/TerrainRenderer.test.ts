import { describe, it, expect } from 'vitest';
import { Color } from 'three';
import { World } from '../../src/world/World.js';
import { TerrainRenderer } from '../../src/rendering/TerrainRenderer.js';

function emptyFlatWorld(): World {
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

function expectColor(actual: ArrayLike<number>, offset: number, hex: number): void {
  const expected = new Color(hex);
  expect(actual[offset]).toBeCloseTo(expected.r, 5);
  expect(actual[offset + 1]).toBeCloseTo(expected.g, 5);
  expect(actual[offset + 2]).toBeCloseTo(expected.b, 5);
}

describe('TerrainRenderer', () => {
  it('should draw only terrain cubes when there are no objects', () => {
    const renderer = new TerrainRenderer(emptyFlatWorld());
    renderer.update();

    expect(renderer.getMesh().count).toBe(16 * 16);
    expect(renderer.getTrunkMesh().count).toBe(0);
    expect(renderer.getFoliageMesh().count).toBe(0);
    expect(renderer.getRockMesh().count).toBe(0);
  });

  it('should draw trunk and foliage for a tree with true colors', () => {
    const world = emptyFlatWorld();
    world.setObject(5, 5, 'tree');
    const renderer = new TerrainRenderer(world);
    renderer.update();

    expect(renderer.getTrunkMesh().count).toBe(1);
    expect(renderer.getFoliageMesh().count).toBe(1);
    expect(renderer.getRockMesh().count).toBe(0);

    const trunkMatrix = (renderer.getTrunkMesh() as unknown as { instanceMatrix: { array: Float32Array } }).instanceMatrix.array;
    expect(trunkMatrix[12]).toBeCloseTo((5 + 0.5) * 4, 5);
    expect(trunkMatrix[13]).toBeCloseTo(4 + 1, 5);
    expect(trunkMatrix[14]).toBeCloseTo((5 + 0.5) * 4, 5);

    const trunkColors = (renderer.getTrunkMesh() as unknown as { instanceColor: { array: Float32Array } }).instanceColor.array;
    expectColor(trunkColors, 0, 0x7a5230);
    const foliageColors = (renderer.getFoliageMesh() as unknown as { instanceColor: { array: Float32Array } }).instanceColor.array;
    expectColor(foliageColors, 0, 0x2ecc71);
  });

  it('should draw one gray rock per boulder stack unit', () => {
    const world = emptyFlatWorld();
    world.placeBoulder(6, 6);
    world.placeBoulder(6, 6);
    const renderer = new TerrainRenderer(world);
    renderer.update();

    expect(renderer.getRockMesh().count).toBe(2);
    expect(renderer.getTrunkMesh().count).toBe(0);

    const rock = renderer.getRockMesh() as unknown as {
      instanceColor: { array: Float32Array };
      instanceMatrix: { array: Float32Array };
    };
    expectColor(rock.instanceColor.array, 0, 0x888888);
    expect(rock.instanceMatrix.array[13]).toBeCloseTo(1 * 4 + 2, 5);
    expect(rock.instanceMatrix.array[16 + 13]).toBeCloseTo(2 * 4 + 2, 5);
  });
});
