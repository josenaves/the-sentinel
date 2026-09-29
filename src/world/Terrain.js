import { createCell } from './Cell.js';
import { WORLD_SIZE, MAX_HEIGHT } from '../core/Constants.js';
export class Terrain {
    cells;
    constructor(size = WORLD_SIZE) {
        this.cells = Array.from({ length: size }, () => Array.from({ length: size }, () => createCell(0)));
    }
    getSize() {
        return this.cells.length;
    }
    getCell(x, z) {
        if (x < 0 || x >= this.cells.length || z < 0 || z >= this.cells.length) {
            return undefined;
        }
        const row = this.cells[z];
        if (!row)
            return undefined;
        return row[x];
    }
    getHeight(x, z) {
        const cell = this.getCell(x, z);
        return cell?.height ?? 0;
    }
    setHeight(x, z, height) {
        if (x < 0 || x >= this.cells.length || z < 0 || z >= this.cells.length) {
            return false;
        }
        const row = this.cells[z];
        if (!row)
            return false;
        const cell = row[x];
        if (!cell)
            return false;
        cell.height = Math.max(0, Math.min(MAX_HEIGHT, height));
        return true;
    }
    getObject(x, z) {
        return this.getCell(x, z)?.object ?? 'empty';
    }
    setObject(x, z, object) {
        const cell = this.getCell(x, z);
        if (!cell)
            return false;
        cell.object = object;
        return true;
    }
    getStack(x, z) {
        return this.getCell(x, z)?.stack ?? 0;
    }
    setStack(x, z, stack) {
        const cell = this.getCell(x, z);
        if (!cell)
            return false;
        cell.stack = Math.max(0, Math.floor(stack));
        return true;
    }
    surfaceLevel(x, z) {
        return this.getHeight(x, z) + this.getStack(x, z);
    }
    getHeightAtWorldPosition(worldX, worldZ, cellSize) {
        const x = Math.floor(worldX / cellSize);
        const z = Math.floor(worldZ / cellSize);
        return this.getHeight(x, z);
    }
}
