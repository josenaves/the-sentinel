import { Terrain } from './Terrain.js';
import { WorldGenerator } from './WorldGenerator.js';
import type { CellObject } from './Cell.js';
import { CELL_SIZE, SIGHT_RANGE, LANDSCAPE_COUNT } from '../core/Constants.js';

export interface SightTarget {
  x: number;
  z: number;
  tower: boolean;
}

export class World {
  private terrain: Terrain;
  private verticalStructure: { x: number; z: number; height: number } | null = null;
  private landscapeNumber: number;
  private towerOpen = false;

  constructor(seed: number = 12345) {
    const n = Math.floor(seed);
    this.landscapeNumber = ((n % LANDSCAPE_COUNT) + LANDSCAPE_COUNT) % LANDSCAPE_COUNT;
    const generator = new WorldGenerator(seed);
    this.terrain = generator.generate();
    this.createVerticalStructure();
  }

  getLandscapeNumber(): number {
    return this.landscapeNumber;
  }

  isTowerOpen(): boolean {
    return this.towerOpen;
  }

  setTowerOpen(open: boolean): void {
    this.towerOpen = open;
  }

  getTerrain(): Terrain {
    return this.terrain;
  }

  getCell(x: number, z: number) {
    return this.terrain.getCell(x, z);
  }

  getHeight(x: number, z: number): number {
    return this.terrain.getHeight(x, z);
  }

  setHeight(x: number, z: number, height: number): boolean {
    return this.terrain.setHeight(x, z, height);
  }

  getObject(x: number, z: number): CellObject {
    return this.terrain.getObject(x, z);
  }

  setObject(x: number, z: number, object: CellObject): boolean {
    return this.terrain.setObject(x, z, object);
  }

  getStack(x: number, z: number): number {
    return this.terrain.getStack(x, z);
  }

  setStack(x: number, z: number, stack: number): boolean {
    return this.terrain.setStack(x, z, stack);
  }

  surfaceLevel(x: number, z: number): number {
    return this.terrain.surfaceLevel(x, z);
  }

  isTowerCell(x: number, z: number): boolean {
    const structure = this.verticalStructure;
    return structure !== null && x === structure.x && z === structure.z;
  }

  private isTowerClosed(x: number, z: number): boolean {
    return this.isTowerCell(x, z) && !this.towerOpen;
  }

  canAbsorbSentinel(eyeY: number): boolean {
    const structure = this.verticalStructure;
    if (!structure || this.towerOpen) return false;
    return eyeY > this.columnTopAt(structure.x, structure.z);
  }

  placeTree(x: number, z: number): boolean {
    if (this.isTowerClosed(x, z)) return false;
    if (this.terrain.getObject(x, z) !== 'empty' || this.terrain.getStack(x, z) > 0) return false;
    return this.terrain.setObject(x, z, 'tree');
  }

  takeTree(x: number, z: number): boolean {
    if (this.terrain.getObject(x, z) !== 'tree') return false;
    return this.terrain.setObject(x, z, 'empty');
  }

  placeBoulder(x: number, z: number): boolean {
    if (this.isTowerClosed(x, z)) return false;
    const object = this.terrain.getObject(x, z);
    if (object !== 'empty' && object !== 'boulder') return false;
    if (!this.terrain.setStack(x, z, this.terrain.getStack(x, z) + 1)) return false;
    return this.terrain.setObject(x, z, 'boulder');
  }

  takeBoulder(x: number, z: number): boolean {
    if (this.terrain.getObject(x, z) !== 'boulder') return false;
    const stack = this.terrain.getStack(x, z);
    if (stack < 1) return false;
    if (!this.terrain.setStack(x, z, stack - 1)) return false;
    if (stack - 1 === 0) {
      return this.terrain.setObject(x, z, 'empty');
    }
    return true;
  }

  placeRobot(x: number, z: number): boolean {
    if (this.isTowerClosed(x, z)) return false;
    const object = this.terrain.getObject(x, z);
    if (object !== 'empty' && object !== 'boulder') return false;
    return this.terrain.setObject(x, z, 'robot');
  }

  takeRobot(x: number, z: number, isCurrentCell: boolean): boolean {
    if (this.terrain.getObject(x, z) !== 'robot') return false;
    if (isCurrentCell) return false;
    return this.terrain.setObject(x, z, this.terrain.getStack(x, z) > 0 ? 'boulder' : 'empty');
  }

  getSize(): number {
    return this.terrain.getSize();
  }

  getCellSize(): number {
    return CELL_SIZE;
  }

  getHeightAtWorldPosition(worldX: number, worldZ: number): number {
    return this.terrain.getHeightAtWorldPosition(worldX, worldZ, CELL_SIZE);
  }

  getVerticalStructure(): { x: number; z: number; height: number } | null {
    return this.verticalStructure;
  }

  raycastAim(origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }): SightTarget | null {
    const size = this.terrain.getSize();

    const step = CELL_SIZE / 4;
    for (let dist = step; dist <= SIGHT_RANGE; dist += step) {
      const px = origin.x + direction.x * dist;
      const py = origin.y + direction.y * dist;
      const pz = origin.z + direction.z * dist;

      const cx = Math.floor(px / CELL_SIZE);
      const cz = Math.floor(pz / CELL_SIZE);
      if (cx < 0 || cx >= size || cz < 0 || cz >= size) continue;
      if (dist < CELL_SIZE) continue;

      let top = this.columnTopAt(cx, cz);
      if (this.terrain.getObject(cx, cz) === 'tree') {
        top += CELL_SIZE;
      }
      if (py <= top) {
        const structure = this.verticalStructure;
        return { x: cx, z: cz, tower: structure !== null && cx === structure.x && cz === structure.z };
      }
    }

    return null;
  }

  pickHyperspaceDestination(fromX: number, fromZ: number, random: () => number): { x: number; z: number } | null {
    const size = this.terrain.getSize();
    const height = this.terrain.surfaceLevel(fromX, fromZ);
    for (let attempt = 0; attempt < 200; attempt++) {
      const x = Math.floor(random() * size);
      const z = Math.floor(random() * size);
      if (x === fromX && z === fromZ) continue;
      if (this.terrain.surfaceLevel(x, z) > height) continue;
      if (this.isTowerCell(x, z)) continue;
      const object = this.terrain.getObject(x, z);
      if (object !== 'empty' && object !== 'boulder') continue;
      return { x, z };
    }
    return null;
  }

  hasLineOfSight(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist === 0) return true;

    const size = this.terrain.getSize();
    const originCellX = Math.floor(from.x / CELL_SIZE);
    const originCellZ = Math.floor(from.z / CELL_SIZE);
    const steps = Math.max(1, Math.ceil(dist / (CELL_SIZE / 4)));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const cx = Math.floor((from.x + dx * t) / CELL_SIZE);
      const cz = Math.floor((from.z + dz * t) / CELL_SIZE);
      if (cx < 0 || cx >= size || cz < 0 || cz >= size) continue;
      if (cx === originCellX && cz === originCellZ) continue;
      if (from.y + dy * t < this.columnTopAt(cx, cz)) {
        return false;
      }
    }
    return true;
  }

  columnTopAt(x: number, z: number): number {
    const baseTop = (this.terrain.surfaceLevel(x, z) + 1) * CELL_SIZE;
    const structure = this.verticalStructure;
    if (structure && x === structure.x && z === structure.z) {
      return baseTop + structure.height * CELL_SIZE;
    }
    return baseTop;
  }

  private createVerticalStructure(): void {
    const size = this.terrain.getSize();
    const centerX = Math.floor(size / 2);
    const centerZ = Math.floor(size / 2);
    const baseHeight = this.terrain.getHeight(centerX, centerZ);
    this.verticalStructure = {
      x: centerX,
      z: centerZ,
      height: baseHeight + 6,
    };
  }
}