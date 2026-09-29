import { describe, it, expect } from 'vitest';
import { Color, MeshStandardMaterial } from 'three';
import { World } from '../../src/world/World.js';
import { TerrainRenderer } from '../../src/rendering/TerrainRenderer.js';
import { CELL_SIZE } from '../../src/core/Constants.js';
function emptyFlatWorld() {
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
function expectColor(actual, offset, hex) {
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
        expect(renderer.getRobotBodyMesh().count).toBe(0);
        expect(renderer.getRobotHeadMesh().count).toBe(0);
    });
    it('should draw trunk and foliage for a tree with true colors', () => {
        const world = emptyFlatWorld();
        world.setObject(5, 5, 'tree');
        const renderer = new TerrainRenderer(world);
        renderer.update();
        expect(renderer.getTrunkMesh().count).toBe(1);
        expect(renderer.getFoliageMesh().count).toBe(1);
        expect(renderer.getRockMesh().count).toBe(0);
        const trunkMatrix = renderer.getTrunkMesh().instanceMatrix.array;
        expect(trunkMatrix[12]).toBeCloseTo((5 + 0.5) * 4, 5);
        expect(trunkMatrix[13]).toBeCloseTo(4 + 1, 5);
        expect(trunkMatrix[14]).toBeCloseTo((5 + 0.5) * 4, 5);
        const trunkColors = renderer.getTrunkMesh().instanceColor.array;
        expectColor(trunkColors, 0, 0x7a5230);
        const foliageColors = renderer.getFoliageMesh().instanceColor.array;
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
        const rock = renderer.getRockMesh();
        expectColor(rock.instanceColor.array, 0, 0x888888);
        expect(rock.instanceMatrix.array[13]).toBeCloseTo(1 * 4 + 2, 5);
        expect(rock.instanceMatrix.array[16 + 13]).toBeCloseTo(2 * 4 + 2, 5);
    });
    it('should draw a synthoid shell (robed body + head) on a robot cell', () => {
        const world = emptyFlatWorld();
        world.placeRobot(5, 5);
        const renderer = new TerrainRenderer(world);
        renderer.update();
        expect(renderer.getRobotBodyMesh().count).toBe(1);
        expect(renderer.getRobotHeadMesh().count).toBe(1);
        expect(renderer.getTrunkMesh().count).toBe(0);
        expect(renderer.getRockMesh().count).toBe(0);
        const body = renderer.getRobotBodyMesh();
        expectColor(body.instanceColor.array, 0, 0xd6dde5);
        expect(body.instanceMatrix.array[12]).toBeCloseTo((5 + 0.5) * 4, 5);
        expect(body.instanceMatrix.array[13]).toBeCloseTo(4 + 1.7, 5);
        expect(body.instanceMatrix.array[14]).toBeCloseTo((5 + 0.5) * 4, 5);
        expect(renderer.getRobotBodyMesh().material.emissive.getHex()).toBe(0x5a6a7d);
        const head = renderer.getRobotHeadMesh();
        expectColor(head.instanceColor.array, 0, 0xffe9a8);
        expect(renderer.getRobotHeadMesh().material.emissive.getHex()).toBe(0xffb52e);
        expect(head.instanceMatrix.array[12]).toBeCloseTo((5 + 0.5) * 4, 5);
        expect(head.instanceMatrix.array[13]).toBeCloseTo(4 + 4.4, 5);
        expect(head.instanceMatrix.array[14]).toBeCloseTo((5 + 0.5) * 4, 5);
    });
    it('should draw the synthoid on top of a boulder stack', () => {
        const world = emptyFlatWorld();
        world.placeBoulder(6, 6);
        world.placeBoulder(6, 6);
        world.placeRobot(6, 6);
        const renderer = new TerrainRenderer(world);
        renderer.update();
        expect(renderer.getRobotBodyMesh().count).toBe(1);
        expect(renderer.getRobotHeadMesh().count).toBe(1);
        expect(renderer.getRockMesh().count).toBe(2);
        const body = renderer.getRobotBodyMesh();
        expect(body.instanceMatrix.array[13]).toBeCloseTo(3 * 4 + 1.7, 5);
    });
    it('should draw the synthoid on the tower platform, not at ground level', () => {
        const world = emptyFlatWorld();
        const structure = world.getVerticalStructure();
        world.setTowerOpen(true);
        world.placeRobot(structure.x, structure.z);
        const renderer = new TerrainRenderer(world);
        renderer.update();
        const platformTop = world.columnTopAt(structure.x, structure.z);
        expect(platformTop).toBeGreaterThan((0 + 1) * 4);
        expect(renderer.getRobotBodyMesh().count).toBe(1);
        expect(renderer.getRobotHeadMesh().count).toBe(1);
        // The visual tower top sits one cell below columnTopAt.
        const visualTop = platformTop - CELL_SIZE;
        const body = renderer.getRobotBodyMesh();
        expect(body.instanceMatrix.array[13]).toBeCloseTo(visualTop + 1.7, 5);
        const head = renderer.getRobotHeadMesh();
        expect(head.instanceMatrix.array[13]).toBeCloseTo(visualTop + 4.4, 5);
    });
    it('should invalidate cached bounding spheres on update', () => {
        const world = emptyFlatWorld();
        const renderer = new TerrainRenderer(world);
        renderer.update();
        // Simulate three.js having cached frustum-culling spheres (possibly
        // computed while empty, which would cull subsequently placed objects).
        const stale = {};
        const meshes = [
            renderer.getMesh(),
            renderer.getTrunkMesh(),
            renderer.getFoliageMesh(),
            renderer.getRockMesh(),
            renderer.getRobotBodyMesh(),
            renderer.getRobotHeadMesh(),
        ];
        for (const mesh of meshes) {
            mesh.boundingSphere = stale;
        }
        world.placeRobot(5, 5);
        renderer.update();
        for (const mesh of meshes) {
            expect(mesh.boundingSphere).toBeNull();
        }
        expect(renderer.getRobotBodyMesh().count).toBe(1);
    });
});
