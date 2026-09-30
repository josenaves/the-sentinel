import { Scene, WebGLRenderer, PerspectiveCamera, Color, InstancedMesh, Mesh, BoxGeometry, CylinderGeometry, ConeGeometry, IcosahedronGeometry, SphereGeometry, MeshStandardMaterial, Matrix4, Vector3, Group } from 'three';
import { World } from '../world/World.js';
import { CELL_SIZE, WORLD_SIZE } from '../core/Constants.js';
import { createLighting } from './Lighting.js';
import { TerrainRenderer, ROBOT_COLORS } from './TerrainRenderer.js';
import { AbsorbEffect } from './AbsorbEffect.js';
import { transferFlightDuration, transferFlightPose, transferShellScale, type FlightPoint } from './transferFlight.js';
import type { CellObject } from '../world/Cell.js';
import { Player } from '../player/Player.js';
import type { Sentinel } from '../entities/Sentinel.js';
import type { Sentry } from '../entities/Sentry.js';
import type { Meanie } from '../entities/Meanie.js';

export class Renderer {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private terrainRenderer: TerrainRenderer;
  private absorbEffects: AbsorbEffect;
  private structureMesh: InstancedMesh | null = null;
  private watcherHeads: Array<{ group: Group; entity: Sentinel }> = [];
  private meanieMesh: Mesh | null = null;
  private meanie: Meanie | null = null;
  private world: World;
  private player: Player;
  private sentinel: Sentinel | null = null;
  private sentries: Sentry[] = [];
  private container: HTMLElement;
  private lastEffectTick = 0;
  private flight: { from: FlightPoint; to: FlightPoint; start: number; duration: number } | null = null;
  private transferShell: Group | null = null;
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
    this.absorbEffects = new AbsorbEffect();
    this.scene.add(this.absorbEffects.getMesh());
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

  setMeanie(meanie: Meanie | null): void {
    if (this.meanieMesh) {
      this.scene.remove(this.meanieMesh);
      this.meanieMesh.geometry.dispose();
      (this.meanieMesh.material as MeshStandardMaterial).dispose();
      this.meanieMesh = null;
    }
    this.meanie = meanie;
    if (!meanie) return;
    const material = new MeshStandardMaterial({
      color: 0xff2d78,
      emissive: 0xaa0f4d,
      emissiveIntensity: 0.8,
      flatShading: true,
    });
    const mesh = new Mesh(new ConeGeometry(1.4, 7, 7), material);
    mesh.castShadow = true;
    mesh.position.set(
      (meanie.x + 0.5) * CELL_SIZE,
      this.world.columnTopAt(meanie.x, meanie.z) + 3.5,
      (meanie.z + 0.5) * CELL_SIZE,
    );
    this.meanieMesh = mesh;
    this.scene.add(mesh);
  }

  // Fragment burst at the absorbed cell. Call after the world mutation:
  // the origin is derived from the post-mutation column top. Visual only.
  playAbsorbEffect(x: number, z: number, kind: CellObject): void {
    const colors: Partial<Record<CellObject, number>> = {
      tree: 0x2ecc71,
      boulder: 0x888888,
      robot: 0xd6dde5,
      sentry: 0x722929,
      sentinel: 0x3a2a6e,
    };
    const color = colors[kind] ?? 0xffffff;
    const lift = kind === 'boulder' || kind === 'sentinel' ? 2 : 3;
    this.absorbEffects.spawn(
      (x + 0.5) * CELL_SIZE,
      this.world.columnTopAt(x, z) + lift,
      (z + 0.5) * CELL_SIZE,
      color,
    );
  }

  render(): void {
    this.tickEffects();
    this.syncWatcherVisuals(0);
    if (this.renderFlight()) return;
    this.camera.position.set(this.player.position.x, this.player.position.y, this.player.position.z);

    const lookAt = new Vector3();
    lookAt.x = this.camera.position.x - Math.sin(this.player.rotation) * Math.cos(this.player.pitch);
    lookAt.y = this.camera.position.y - Math.sin(this.player.pitch);
    lookAt.z = this.camera.position.z - Math.cos(this.player.rotation) * Math.cos(this.player.pitch);
    this.camera.lookAt(lookAt);

    this.renderer.render(this.scene, this.camera);
  }

  // Backdrop for the start panel: the same world scene (terrain, trees,
  // boulders, tower, sentinel/sentries, meanie when present) with a drone
  // camera slowly orbiting overhead. Visual only: no game state is touched.
  renderDrone(elapsedSeconds: number): void {
    this.tickEffects();
    this.syncWatcherVisuals(elapsedSeconds);
    const center = (WORLD_SIZE * CELL_SIZE) / 2;
    const angle = elapsedSeconds * 0.12;
    const radius = WORLD_SIZE * CELL_SIZE * 0.95;
    this.camera.position.set(
      center + Math.cos(angle) * radius,
      WORLD_SIZE * CELL_SIZE * 0.7,
      center + Math.sin(angle) * radius,
    );
    this.camera.lookAt(new Vector3(center, CELL_SIZE * 2, center));

    this.renderer.render(this.scene, this.camera);
  }

  private syncWatcherVisuals(elapsedSeconds: number): void {
    for (const { group, entity } of this.watcherHeads) {
      group.rotation.y = entity.angle + elapsedSeconds * 0.15;
      group.visible = !entity.absorbed;
    }
    if (this.meanieMesh && this.meanie) {
      this.meanieMesh.rotation.y = this.meanie.angle + elapsedSeconds * 4.5;
    }
  }

  // Soul flight between robot shells: the logic already teleported, this
  // only flies the camera from the old eye to the new one. Visual only.
  startTransferFlight(from: FlightPoint, to: FlightPoint): void {
    this.flight = {
      from: { ...from },
      to: { ...to },
      start: performance.now() / 1000,
      duration: transferFlightDuration(from, to),
    };
    this.showTransferShell(to);
  }

  // Transient destination shell the soul flies into: same look as the
  // TerrainRenderer robot, scaled by the flight envelope. Hidden on arrival
  // (the player now occupies it, invisible in first-person).
  private showTransferShell(to: FlightPoint): void {
    const cellX = Math.floor(to.x / CELL_SIZE);
    const cellZ = Math.floor(to.z / CELL_SIZE);
    let surface = this.world.columnTopAt(cellX, cellZ);
    if (this.world.isTowerCell(cellX, cellZ)) surface -= CELL_SIZE;
    if (!this.transferShell) {
      const group = new Group();
      const body = new Mesh(
        new CylinderGeometry(0.55, 0.95, 1, 7),
        new MeshStandardMaterial({ color: ROBOT_COLORS.body, emissive: ROBOT_COLORS.bodyEmissive, emissiveIntensity: 0.5, flatShading: true }),
      );
      body.position.y = 1.7;
      body.scale.set(2.4, 3.4, 2.4);
      const head = new Mesh(
        new IcosahedronGeometry(0.5, 0),
        new MeshStandardMaterial({ color: ROBOT_COLORS.head, emissive: ROBOT_COLORS.headEmissive, emissiveIntensity: 0.9, flatShading: true }),
      );
      head.position.y = 4.4;
      head.scale.set(2.0, 2.2, 2.0);
      group.add(body);
      group.add(head);
      this.transferShell = group;
      this.scene.add(group);
    }
    this.transferShell.position.set((cellX + 0.5) * CELL_SIZE, surface, (cellZ + 0.5) * CELL_SIZE);
    this.transferShell.scale.setScalar(0);
    this.transferShell.visible = true;
  }

  private hideTransferShell(): void {
    if (this.transferShell) this.transferShell.visible = false;
    this.flight = null;
  }

  // Returns true while a flight frame was rendered.
  private renderFlight(): boolean {
    if (!this.flight) return false;
    const now = performance.now() / 1000;
    const progress = (now - this.flight.start) / this.flight.duration;
    if (progress >= 1) {
      this.hideTransferShell();
      return false;
    }
    if (this.transferShell) {
      this.transferShell.scale.setScalar(Math.max(0.0001, transferShellScale(progress)));
    }
    const cosPitch = Math.cos(this.player.pitch);
    const lookDir: FlightPoint = {
      x: -Math.sin(this.player.rotation) * cosPitch,
      y: -Math.sin(this.player.pitch),
      z: -Math.cos(this.player.rotation) * cosPitch,
    };
    const pos: FlightPoint = { x: 0, y: 0, z: 0 };
    const look: FlightPoint = { x: 0, y: 0, z: 0 };
    transferFlightPose(this.flight.from, this.flight.to, lookDir, progress, pos, look);
    this.camera.position.set(pos.x, pos.y, pos.z);
    this.camera.lookAt(new Vector3(look.x, look.y, look.z));
    this.renderer.render(this.scene, this.camera);
    return true;
  }

  private tickEffects(): void {
    const now = performance.now() / 1000;
    if (this.lastEffectTick === 0) this.lastEffectTick = now;
    this.absorbEffects.update(now - this.lastEffectTick);
    this.lastEffectTick = now;
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResizeBound);
    this.terrainRenderer.dispose();
    this.absorbEffects.dispose();
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
    this.setMeanie(null);
    if (this.transferShell) {
      this.transferShell.traverse((child) => {
        const mesh = child as Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          (mesh.material as MeshStandardMaterial).dispose();
        }
      });
      this.scene.remove(this.transferShell);
      this.transferShell = null;
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