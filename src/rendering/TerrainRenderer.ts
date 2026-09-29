import { InstancedMesh, BoxGeometry, CylinderGeometry, ConeGeometry, IcosahedronGeometry, MeshStandardMaterial, Color, Matrix4, Vector3, Quaternion } from 'three';
import { World } from '../world/World.js';
import { CELL_SIZE, WORLD_SIZE, MAX_HEIGHT } from '../core/Constants.js';

const TRUNK_COLOR = 0x7a5230;
const FOLIAGE_COLOR = 0x2ecc71;
const BOULDER_COLOR = 0x888888;
// Synthoid shell: a small statuesque figure in the visual family of the
// Sentinel (robed body + glowing head), like the roughly-carved fetishes of
// the 1986 original. Pale body + emissive materials so the shell stays
// visible under any lighting (the original used flat, unlit colors).
const ROBOT_BODY_COLOR = 0xd6dde5;
const ROBOT_BODY_EMISSIVE = 0x5a6a7d;
const ROBOT_HEAD_COLOR = 0xffe9a8;
const ROBOT_HEAD_EMISSIVE = 0xffb52e;

export class TerrainRenderer {
  private mesh: InstancedMesh;
  private trunkMesh: InstancedMesh;
  private foliageMesh: InstancedMesh;
  private rockMesh: InstancedMesh;
  private robotBodyMesh: InstancedMesh;
  private robotHeadMesh: InstancedMesh;
  private world: World;
  private dummy = new Matrix4();
  private color = new Color();
  private position = new Vector3();
  private scale = new Vector3();
  private identity = new Quaternion();

  constructor(world: World) {
    this.world = world;
    this.mesh = this.createMesh();
    this.trunkMesh = this.createUnitMesh(new CylinderGeometry(0.5, 0.65, 1, 7));
    this.foliageMesh = this.createUnitMesh(new ConeGeometry(0.5, 1, 8));
    this.rockMesh = this.createUnitMesh(new CylinderGeometry(0.32, 0.5, 1, 6));
    this.robotBodyMesh = this.createUnitMesh(new CylinderGeometry(0.55, 0.95, 1, 7), WORLD_SIZE * WORLD_SIZE, ROBOT_BODY_EMISSIVE, 0.5);
    this.robotHeadMesh = this.createUnitMesh(new IcosahedronGeometry(0.5, 0), WORLD_SIZE * WORLD_SIZE, ROBOT_HEAD_EMISSIVE, 0.9);
  }

  private createMesh(): InstancedMesh {
    const geometry = new BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
    const material = new MeshStandardMaterial({
      color: 0x6b8e5e,
      flatShading: true,
    });

    const count = WORLD_SIZE * WORLD_SIZE * (MAX_HEIGHT + 1);
    const mesh = new InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(35044);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  private createUnitMesh(geometry: BoxGeometry | CylinderGeometry | ConeGeometry | IcosahedronGeometry, count: number = WORLD_SIZE * WORLD_SIZE * 4, emissive: number = 0x000000, emissiveIntensity: number = 0): InstancedMesh {
    const material = new MeshStandardMaterial({
      color: 0xffffff,
      emissive,
      emissiveIntensity,
      flatShading: true,
    });

    const mesh = new InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(35044);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  update(): void {
    let index = 0;
    let trunks = 0;
    let foliage = 0;
    let rocks = 0;
    let robotBodies = 0;
    let robotHeads = 0;
    const size = this.world.getSize();

    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const height = this.world.getHeight(x, z);
        const worldX = (x + 0.5) * CELL_SIZE;
        const worldZ = (z + 0.5) * CELL_SIZE;
        const top = (height + 1) * CELL_SIZE;

        for (let h = 0; h <= height; h++) {
          this.position.set(worldX, h * CELL_SIZE + CELL_SIZE * 0.5, worldZ);
          this.dummy.makeTranslation(this.position.x, this.position.y, this.position.z);

          const heightRatio = h / MAX_HEIGHT;
          this.color.setHSL(0.25 + heightRatio * 0.15, 0.4, 0.2 + heightRatio * 0.4);
          this.mesh.setColorAt(index, this.color);
          this.mesh.setMatrixAt(index, this.dummy);
          index++;
        }

        const object = this.world.getObject(x, z);
        const stack = this.world.getStack(x, z);
        if (object === 'tree') {
          trunks = this.blit(this.trunkMesh, trunks, worldX, top + 1, worldZ, 1.6, 2, 1.6, TRUNK_COLOR);
          foliage = this.blit(this.foliageMesh, foliage, worldX, top + 4.2, worldZ, 4.4, 4.4, 4.4, FOLIAGE_COLOR);
        }
        if (object === 'robot') {
          // columnTopAt sits one cell above the tower's visual top (the
          // structure's first box is embedded in the terrain column).
          let surface = this.world.columnTopAt(x, z);
          if (this.world.isTowerCell(x, z)) surface -= CELL_SIZE;
          robotBodies = this.blit(this.robotBodyMesh, robotBodies, worldX, surface + 1.7, worldZ, 2.4, 3.4, 2.4, ROBOT_BODY_COLOR);
          robotHeads = this.blit(this.robotHeadMesh, robotHeads, worldX, surface + 4.4, worldZ, 2.0, 2.2, 2.0, ROBOT_HEAD_COLOR);
        }
        for (let s = 1; s <= stack; s++) {
          rocks = this.blit(this.rockMesh, rocks, worldX, (height + s) * CELL_SIZE + CELL_SIZE * 0.5, worldZ, 3.8, 4, 3.8, BOULDER_COLOR);
        }
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
    this.mesh.count = index;
    // Instance transforms change on every update, but three.js caches the
    // frustum-culling bounding sphere after the first render. Invalidate it
    // so newly placed objects (e.g. the first robot shell) are not culled.
    this.mesh.boundingSphere = null;

    this.finishMesh(this.trunkMesh, trunks);
    this.finishMesh(this.foliageMesh, foliage);
    this.finishMesh(this.rockMesh, rocks);
    this.finishMesh(this.robotBodyMesh, robotBodies);
    this.finishMesh(this.robotHeadMesh, robotHeads);
  }

  private blit(mesh: InstancedMesh, index: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: number): number {
    if (index >= mesh.instanceMatrix.count) return index;
    this.position.set(x, y, z);
    this.scale.set(sx, sy, sz);
    this.dummy.compose(this.position, this.identity, this.scale);
    this.color.set(color);
    mesh.setColorAt(index, this.color);
    mesh.setMatrixAt(index, this.dummy);
    return index + 1;
  }

  private finishMesh(mesh: InstancedMesh, count: number): void {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
    mesh.count = count;
    mesh.boundingSphere = null;
  }

  getMesh(): InstancedMesh {
    return this.mesh;
  }

  getTrunkMesh(): InstancedMesh {
    return this.trunkMesh;
  }

  getFoliageMesh(): InstancedMesh {
    return this.foliageMesh;
  }

  getRockMesh(): InstancedMesh {
    return this.rockMesh;
  }

  getRobotBodyMesh(): InstancedMesh {
    return this.robotBodyMesh;
  }

  getRobotHeadMesh(): InstancedMesh {
    return this.robotHeadMesh;
  }

  dispose(): void {
    for (const mesh of [this.mesh, this.trunkMesh, this.foliageMesh, this.rockMesh, this.robotBodyMesh, this.robotHeadMesh]) {
      mesh.geometry.dispose();
      (mesh.material as MeshStandardMaterial).dispose();
    }
  }
}