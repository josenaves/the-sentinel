import type { Cell, CellObject } from './Cell.js';
import { createCell } from './Cell.js';
import { WORLD_SIZE, MAX_HEIGHT } from '../core/Constants.js';

export class Terrain {
  private cells: Cell[][];

  constructor(size: number = WORLD_SIZE) {
    this.cells = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => createCell(0))
    );
  }

  getSize(): number {
    return this.cells.length;
  }

  getCell(x: number, z: number): Cell | undefined {
    if (x < 0 || x >= this.cells.length || z < 0 || z >= this.cells.length) {
      return undefined;
    }
    const row = this.cells[z];
    if (!row) return undefined;
    return row[x];
  }

  getHeight(x: number, z: number): number {
    const cell = this.getCell(x, z);
    return cell?.height ?? 0;
  }

  setHeight(x: number, z: number, height: number): boolean {
    if (x < 0 || x >= this.cells.length || z < 0 || z >= this.cells.length) {
      return false;
    }
    const row = this.cells[z];
    if (!row) return false;
    const cell = row[x];
    if (!cell) return false;
    cell.height = Math.max(0, Math.min(MAX_HEIGHT, height));
    return true;
  }

  getObject(x: number, z: number): CellObject {
    return this.getCell(x, z)?.object ?? 'empty';
  }

  setObject(x: number, z: number, object: CellObject): boolean {
    const cell = this.getCell(x, z);
    if (!cell) return false;
    cell.object = object;
    return true;
  }

  getStack(x: number, z: number): number {
    return this.getCell(x, z)?.stack ?? 0;
  }

  setStack(x: number, z: number, stack: number): boolean {
    const cell = this.getCell(x, z);
    if (!cell) return false;
    cell.stack = Math.max(0, Math.floor(stack));
    return true;
  }

  surfaceLevel(x: number, z: number): number {
    return this.getHeight(x, z) + this.getStack(x, z);
  }

  getHeightAtWorldPosition(worldX: number, worldZ: number, cellSize: number): number {
    const x = Math.floor(worldX / cellSize);
    const z = Math.floor(worldZ / cellSize);
    return this.getHeight(x, z);
  }
}