import { Scene, WebGLRenderer, PerspectiveCamera, Color, InstancedMesh, Mesh, BoxGeometry, CylinderGeometry, IcosahedronGeometry, SphereGeometry, MeshStandardMaterial, Matrix4, Vector3, Group } from 'three';
import { World } from '../world/World.js';
import { CELL_SIZE, WORLD_SIZE } from '../core/Constants.js';
import { createLighting } from './Lighting.js';
import { TerrainRenderer } from './TerrainRenderer.js';
import { Player } from '../player/Player.js';
import type { Sentinel } from '../entities/Sentinel.js';
import type { Sentry } from '../entities/Sentry.js';

export class Renderer {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private terrainRenderer: TerrainRenderer;
  private structureMesh: InstancedMesh | null = null;
  private watcherHeads: Array<{ group: Group; entity: Sentinel }> = [];
  private world: World;
  private player: Player;
  private sentinel: Sentinel | null = null;
  private sentries: Sentry[] = [];
  private container: HTMLElement;
  private onResizeBound = (): void => {
    this.onResize();
  };

  constructor(world: World, player: Player, sentinel?: Sentinel, sentries: Sentry[] = []) {
    this.world = world;
    this.player = player;
    if (sentinel) this.sentinel = sentinel;
    this.sentries = sentries;

    this.scene = new Scene();
    this.scene.background = new Color(0x87ceeb);

    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = 1;

    const { ambient, directional, fog } = createLighting();
    this.scene.add(ambient);
    this.scene.add(directional);
    this.scene.fog = fog;

    this.terrainRenderer = new TerrainRenderer(world);
    this.scene.add(this.terrainRenderer.getMesh());
    this.scene.add(this.terrainRenderer.getTrunkMesh());
    this.scene.add(this.terrainRenderer.getFoliageMesh());
    this.scene.add(this.terrainRenderer.getRockMesh());
    this.scene.add(this.terrainRenderer.getRobotBodyMesh());
    this.scene.add(this.terrainRenderer.getRobotHeadMesh());

    this.createVerticalStructure();
    this.createWatcherHeads();

    this.container = document.getElementById('app')!;
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onResizeBound);
  }

  private createVerticalStructure(): void {
    const structure = this.world.getVerticalStructure();
    if (!structure) return;

    const geometry = new BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
    const material = new MeshStandardMaterial({
      color: 0x8b7355,
      flatShading: true,
    });

    const count = structure.height;
    this.structureMesh = new InstancedMesh(geometry, material, count);
    this.structureMesh.instanceMatrix.setUsage(35044);
    this.structureMesh.castShadow = true;
    this.structureMesh.receiveShadow = true;

    const dummy = new Matrix4();
    const position = new Vector3();
    const worldX = (structure.x + 0.5) * CELL_SIZE;
    const worldZ = (structure.z + 0.5) * CELL_SIZE;
    const baseHeight = this.world.getHeight(structure.x, structure.z) * CELL_SIZE;

    for (let i = 0; i < count; i++) {
      position.set(worldX, baseHeight + i * CELL_SIZE + CELL_SIZE * 0.5, worldZ);
      dummy.makeTranslation(position.x, position.y, position.z);
      this.structureMesh.setMatrixAt(i, dummy);
    }

    this.structureMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.structureMesh);
  }

  private createWatcherHeads(): void {
    if (this.sentinel) {
      const structure = this.world.getVerticalStructure();
      if (structure) {
        const baseTop = this.world.getHeight(structure.x, structure.z) * CELL_SIZE;
        this.createWatcherHead(
          this.sentinel,
          structure.x,
          structure.z,
          baseTop + structure.height * CELL_SIZE,
          1,
          0x2a1b5a,
          0x3a2a6e,
        );
      }
    }
    for (const sentry of this.sentries) {
      this.createWatcherHead(
        sentry,
        sentry.x,
        sentry.z,
        this.world.columnTopAt(sentry.x, sentry.z),
        0.7,
        0x5a1f1f,
        0x722929,
      );
    }
  }

  private createWatcherHead(entity: Sentinel, cellX: number, cellZ: number, baseY: number, scale: number, robeColor: number, hoodColor: number): void {
    const group = new Group();
    const robeMaterial = new MeshStandardMaterial({ color: robeColor, roughness: 0.8, flatShading: true });
    const hoodMaterial = new MeshStandardMaterial({ color: hoodColor, roughness: 0.8, flatShading: true });
    const eyeMaterial = new MeshStandardMaterial({ color: 0x201a00, emissive: 0xffdd44 });

    const robe = new Mesh(new CylinderGeometry(0.9, 2.0, 4.5, 7), robeMaterial);
    robe.position.y = 2.25;
    robe.castShadow = true;
    group.add(robe);

    const hood = new Mesh(new IcosahedronGeometry(1.5, 0), hoodMaterial);
    hood.position.y = 5.2;
    hood.castShadow = true;
    group.add(hood);

    for (const side of [-1, 1]) {
      const eye = new Mesh(new SphereGeometry(0.22, 6, 5), eyeMaterial);
      eye.position.set(0.55 * side, 5.4, 1.25);
      group.add(eye);
    }

    group.scale.setScalar(scale);
    group.position.set(
      (cellX + 0.5) * CELL_SIZE,
      baseY,
      (cellZ + 0.5) * CELL_SIZE,
    );
    this.watcherHeads.push({ group, entity });
    this.scene.add(group);
  }

  initialize(): void {
    this.terrainRenderer.update();
  }

  updateTerrain(): void {
    this.terrainRenderer.update();
  }

  render(): void {
    for (const { group, entity } of this.watcherHeads) {
      group.rotation.y = entity.angle;
      group.visible = !entity.absorbed;
    }
    this.camera.position.set(this.player.position.x, this.player.position.y, this.player.position.z);

    const lookAt = new Vector3();
    lookAt.x = this.camera.position.x - Math.sin(this.player.rotation) * Math.cos(this.player.pitch);
    lookAt.y = this.camera.position.y - Math.sin(this.player.pitch);
    lookAt.z = this.camera.position.z - Math.cos(this.player.rotation) * Math.cos(this.player.pitch);
    this.camera.lookAt(lookAt);

    this.renderer.render(this.scene, this.camera);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResizeBound);
    this.terrainRenderer.dispose();
    for (const { group } of this.watcherHeads) {
      group.traverse((child) => {
        const mesh = child as Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          (mesh.material as MeshStandardMaterial).dispose();
        }
      });
      this.scene.remove(group);
    }
    this.watcherHeads = [];
    if (this.structureMesh) {
      this.structureMesh.geometry.dispose();
      (this.structureMesh.material as any).dispose();
    }
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}