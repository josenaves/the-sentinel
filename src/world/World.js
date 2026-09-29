import { Terrain } from './Terrain.js';
import { WorldGenerator } from './WorldGenerator.js';
import { CELL_SIZE, SIGHT_RANGE, LANDSCAPE_COUNT, MAX_SENTRIES, LANDSCAPES_PER_SENTRY } from '../core/Constants.js';
export class World {
    terrain;
    verticalStructure = null;
    landscapeNumber;
    towerOpen = false;
    sentries = [];
    constructor(seed = 12345) {
        const n = Math.floor(seed);
        this.landscapeNumber = ((n % LANDSCAPE_COUNT) + LANDSCAPE_COUNT) % LANDSCAPE_COUNT;
        const generator = new WorldGenerator(seed);
        this.terrain = generator.generate();
        this.createVerticalStructure();
        this.sentries = this.placeSentries();
    }
    getLandscapeNumber() {
        return this.landscapeNumber;
    }
    isTowerOpen() {
        return this.towerOpen;
    }
    setTowerOpen(open) {
        this.towerOpen = open;
    }
    getSentries() {
        return this.sentries;
    }
    getTerrain() {
        return this.terrain;
    }
    getCell(x, z) {
        return this.terrain.getCell(x, z);
    }
    getHeight(x, z) {
        return this.terrain.getHeight(x, z);
    }
    setHeight(x, z, height) {
        return this.terrain.setHeight(x, z, height);
    }
    getObject(x, z) {
        return this.terrain.getObject(x, z);
    }
    setObject(x, z, object) {
        return this.terrain.setObject(x, z, object);
    }
    getStack(x, z) {
        return this.terrain.getStack(x, z);
    }
    setStack(x, z, stack) {
        return this.terrain.setStack(x, z, stack);
    }
    surfaceLevel(x, z) {
        return this.terrain.surfaceLevel(x, z);
    }
    isTowerCell(x, z) {
        const structure = this.verticalStructure;
        return structure !== null && x === structure.x && z === structure.z;
    }
    isTowerClosed(x, z) {
        return this.isTowerCell(x, z) && !this.towerOpen;
    }
    canAbsorbSentinel(eyeY) {
        const structure = this.verticalStructure;
        if (!structure || this.towerOpen)
            return false;
        return eyeY > this.columnTopAt(structure.x, structure.z);
    }
    placeTree(x, z) {
        if (this.isTowerCell(x, z))
            return false;
        if (this.terrain.getObject(x, z) !== 'empty' || this.terrain.getStack(x, z) > 0)
            return false;
        return this.terrain.setObject(x, z, 'tree');
    }
    takeTree(x, z) {
        if (this.terrain.getObject(x, z) !== 'tree')
            return false;
        return this.terrain.setObject(x, z, 'empty');
    }
    placeBoulder(x, z) {
        if (this.isTowerCell(x, z))
            return false;
        const object = this.terrain.getObject(x, z);
        if (object !== 'empty' && object !== 'boulder')
            return false;
        if (!this.terrain.setStack(x, z, this.terrain.getStack(x, z) + 1))
            return false;
        return this.terrain.setObject(x, z, 'boulder');
    }
    takeBoulder(x, z) {
        if (this.terrain.getObject(x, z) !== 'boulder')
            return false;
        const stack = this.terrain.getStack(x, z);
        if (stack < 1)
            return false;
        if (!this.terrain.setStack(x, z, stack - 1))
            return false;
        if (stack - 1 === 0) {
            return this.terrain.setObject(x, z, 'empty');
        }
        return true;
    }
    placeRobot(x, z) {
        if (this.isTowerClosed(x, z))
            return false;
        const object = this.terrain.getObject(x, z);
        if (object !== 'empty' && object !== 'boulder')
            return false;
        return this.terrain.setObject(x, z, 'robot');
    }
    takeRobot(x, z, isCurrentCell) {
        if (this.terrain.getObject(x, z) !== 'robot')
            return false;
        if (isCurrentCell)
            return false;
        return this.terrain.setObject(x, z, this.terrain.getStack(x, z) > 0 ? 'boulder' : 'empty');
    }
    getSize() {
        return this.terrain.getSize();
    }
    getCellSize() {
        return CELL_SIZE;
    }
    getHeightAtWorldPosition(worldX, worldZ) {
        return this.terrain.getHeightAtWorldPosition(worldX, worldZ, CELL_SIZE);
    }
    getVerticalStructure() {
        return this.verticalStructure;
    }
    raycastAim(origin, direction) {
        const size = this.terrain.getSize();
        const step = CELL_SIZE / 4;
        for (let dist = step; dist <= SIGHT_RANGE; dist += step) {
            const px = origin.x + direction.x * dist;
            const py = origin.y + direction.y * dist;
            const pz = origin.z + direction.z * dist;
            const cx = Math.floor(px / CELL_SIZE);
            const cz = Math.floor(pz / CELL_SIZE);
            if (cx < 0 || cx >= size || cz < 0 || cz >= size)
                continue;
            if (dist < CELL_SIZE)
                continue;
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
    pickHyperspaceDestination(fromX, fromZ, random) {
        const size = this.terrain.getSize();
        const height = this.terrain.surfaceLevel(fromX, fromZ);
        for (let attempt = 0; attempt < 200; attempt++) {
            const x = Math.floor(random() * size);
            const z = Math.floor(random() * size);
            if (x === fromX && z === fromZ)
                continue;
            if (this.terrain.surfaceLevel(x, z) > height)
                continue;
            if (this.isTowerCell(x, z))
                continue;
            const object = this.terrain.getObject(x, z);
            if (object !== 'empty' && object !== 'boulder')
                continue;
            return { x, z };
        }
        return null;
    }
    hasLineOfSight(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dz = to.z - from.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist === 0)
            return true;
        const size = this.terrain.getSize();
        const originCellX = Math.floor(from.x / CELL_SIZE);
        const originCellZ = Math.floor(from.z / CELL_SIZE);
        const steps = Math.max(1, Math.ceil(dist / (CELL_SIZE / 4)));
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const cx = Math.floor((from.x + dx * t) / CELL_SIZE);
            const cz = Math.floor((from.z + dz * t) / CELL_SIZE);
            if (cx < 0 || cx >= size || cz < 0 || cz >= size)
                continue;
            if (cx === originCellX && cz === originCellZ)
                continue;
            if (from.y + dy * t < this.columnTopAt(cx, cz)) {
                return false;
            }
        }
        return true;
    }
    columnTopAt(x, z) {
        const baseTop = (this.terrain.surfaceLevel(x, z) + 1) * CELL_SIZE;
        const structure = this.verticalStructure;
        if (structure && x === structure.x && z === structure.z) {
            return baseTop + structure.height * CELL_SIZE;
        }
        return baseTop;
    }
    createVerticalStructure() {
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
    placeSentries() {
        const count = Math.min(MAX_SENTRIES, Math.floor(this.landscapeNumber / LANDSCAPES_PER_SENTRY));
        const posts = [];
        if (count === 0)
            return posts;
        const size = this.terrain.getSize();
        let state = this.landscapeNumber >>> 0;
        const random = () => {
            state = (state * 1664525 + 1013904223) >>> 0;
            return state / 0x100000000;
        };
        const total = size * size;
        const indices = Array.from({ length: total }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            const a = indices[i];
            indices[i] = indices[j];
            indices[j] = a;
        }
        for (const index of indices) {
            if (posts.length >= count)
                break;
            const x = index % size;
            const z = Math.floor(index / size);
            if (this.isTowerCell(x, z))
                continue;
            if (this.terrain.getObject(x, z) !== 'empty')
                continue;
            posts.push({ x, z });
        }
        return posts;
    }
}
