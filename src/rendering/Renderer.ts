import { Scene, WebGLRenderer, PerspectiveCamera, Color, InstancedMesh, Mesh, BoxGeometry, CylinderGeometry, IcosahedronGeometry, SphereGeometry, MeshStandardMaterial, Matrix4, Vector3, Group } from 'three';
import { World } from '../world/World.js';
import { CELL_SIZE, WORLD_SIZE } from '../core/Constants.js';
import { createLighting } from './Lighting.js';
import { TerrainRenderer } from './TerrainRenderer.js';
import { Player } from '../player/Player.js';
import type { Sentinel } from '../entities/Sentinel.js';

export class Renderer {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private terrainRenderer: TerrainRenderer;
  private structureMesh: InstancedMesh | null = null;
  private sentinelHead: Group | null = null;
  private world: World;
  private player: Player;
  private sentinel: Sentinel | null = null;
  private container: HTMLElement;

  constructor(world: World, player: Player, sentinel?: Sentinel) {
    this.world = world;
    this.player = player;
    if (sentinel) this.sentinel = sentinel;

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

    this.createVerticalStructure();
    this.createSentinelHead();

    this.container = document.getElementById('app')!;
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onResize.bind(this));
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

  private createSentinelHead(): void {
    if (!this.sentinel) return;
    const structure = this.world.getVerticalStructure();
    if (!structure) return;

    const group = new Group();
    const robeMaterial = new MeshStandardMaterial({ color: 0x2a1b5a, roughness: 0.8, flatShading: true });
    const hoodMaterial = new MeshStandardMaterial({ color: 0x3a2a6e, roughness: 0.8, flatShading: true });
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

    const baseTop = this.world.getHeight(structure.x, structure.z) * CELL_SIZE;
    group.position.set(
      (structure.x + 0.5) * CELL_SIZE,
      baseTop + structure.height * CELL_SIZE,
      (structure.z + 0.5) * CELL_SIZE,
    );
    this.sentinelHead = group;
    this.scene.add(group);
  }

  initialize(): void {
    this.terrainRenderer.update();
  }

  updateTerrain(): void {
    this.terrainRenderer.update();
  }

  render(): void {
    if (this.sentinelHead && this.sentinel) {
      this.sentinelHead.rotation.y = this.sentinel.angle;
      this.sentinelHead.visible = !this.sentinel.absorbed;
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
    window.removeEventListener('resize', this.onResize.bind(this));
    this.terrainRenderer.dispose();
    if (this.sentinelHead) {
      this.sentinelHead.traverse((child) => {
        const mesh = child as Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          (mesh.material as MeshStandardMaterial).dispose();
        }
      });
      this.scene.remove(this.sentinelHead);
      this.sentinelHead = null;
    }
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