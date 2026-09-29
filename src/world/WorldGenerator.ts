import { Terrain } from './Terrain.js';
import { WORLD_SIZE, MAX_HEIGHT, LANDSCAPE_COUNT } from '../core/Constants.js';
import type { CellObject } from './Cell.js';

const CONTROL_STEP = 4;
const TREE_DENSITY = 0.06;
const BOULDER_DENSITY = 0.03;

export class WorldGenerator {
  private landscape: number;

  constructor(seed: number) {
    const n = Math.floor(seed);
    this.landscape = ((n % LANDSCAPE_COUNT) + LANDSCAPE_COUNT) % LANDSCAPE_COUNT;
  }

  getLandscapeNumber(): number {
    return this.landscape;
  }

  generate(): Terrain {
    const terrain = new Terrain(WORLD_SIZE);
    const random = this.createSeededRandom(this.landscape);

    const control = this.generateControlGrid(random);
    for (let z = 0; z < WORLD_SIZE; z++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        terrain.setHeight(x, z, this.steppedHeight(x, z, control));
      }
    }

    this.scatterObjects(terrain, random);

    return terrain;
  }

  private generateControlGrid(random: () => number): number[][] {
    const points = WORLD_SIZE / CONTROL_STEP;
    const grid: number[][] = [];
    for (let j = 0; j <= points; j++) {
      const row: number[] = [];
      for (let i = 0; i <= points; i++) {
        row.push(Math.floor(random() * (MAX_HEIGHT + 1)));
      }
      grid.push(row);
    }
    return grid;
  }

  private steppedHeight(x: number, z: number, control: number[][]): number {
    const gx = x / CONTROL_STEP;
    const gz = z / CONTROL_STEP;
    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const fx = gx - x0;
    const fz = gz - z0;

    const v00 = control[z0]![x0]!;
    const v10 = control[z0]![x0 + 1]!;
    const v01 = control[z0 + 1]![x0]!;
    const v11 = control[z0 + 1]![x0 + 1]!;

    const top = v00 + (v10 - v00) * fx;
    const bottom = v01 + (v11 - v01) * fx;
    const height = Math.floor(top + (bottom - top) * fz);

    return Math.max(0, Math.min(MAX_HEIGHT, height));
  }

  private scatterObjects(terrain: Terrain, random: () => number): void {
    const size = terrain.getSize();
    const total = size * size;
    const treeCount = Math.floor(total * TREE_DENSITY);
    const boulderCount = Math.floor(total * BOULDER_DENSITY);

    const indices: number[] = Array.from({ length: total }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const a = indices[i]!;
      indices[i] = indices[j]!;
      indices[j] = a;
    }

    const center = Math.floor(size / 2);
    const centerIndex = center * size + center;

    const place = (kind: CellObject, count: number, taken: Set<number>): void => {
      let placed = 0;
      for (const index of indices) {
        if (placed >= count) break;
        if (index === centerIndex || taken.has(index)) continue;
        const x = index % size;
        const z = Math.floor(index / size);
        terrain.setObject(x, z, kind);
        if (kind === 'boulder') {
          terrain.setStack(x, z, 1);
        }
        taken.add(index);
        placed++;
      }
    };

    const taken = new Set<number>();
    place('tree', treeCount, taken);
    place('boulder', boulderCount, taken);
  }

  private createSeededRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }
}
