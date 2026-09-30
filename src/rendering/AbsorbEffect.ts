import { InstancedMesh, BoxGeometry, MeshStandardMaterial, Matrix4, Vector3, Quaternion, Color } from 'three';

// Visual-only burst shown when an object is absorbed: a handful of small
// fragments fly outward and shrink to nothing (~0.45s). Fixed pool in a
// single InstancedMesh: no per-absorption allocations, no DOM needed.
const MAX_EFFECTS = 8;
const FRAGMENTS_PER_EFFECT = 8;
const COUNT = MAX_EFFECTS * FRAGMENTS_PER_EFFECT;
const LIFE = 0.45;

interface Fragment {
  active: boolean;
  age: number;
  position: Vector3;
  velocity: Vector3;
  size: number;
}

export class AbsorbEffect {
  private mesh: InstancedMesh;
  private fragments: Fragment[] = [];
  private cursor = 0;
  private dummy = new Matrix4();
  private position = new Vector3();
  private scale = new Vector3();
  private identity = new Quaternion();
  private color = new Color();

  constructor() {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({ flatShading: true, roughness: 0.9 });
    this.mesh = new InstancedMesh(geometry, material, COUNT);
    this.mesh.instanceMatrix.setUsage(35044);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < COUNT; i++) {
      this.fragments.push({
        active: false,
        age: 0,
        position: new Vector3(),
        velocity: new Vector3(),
        size: 1,
      });
      this.dummy.makeScale(0, 0, 0);
      this.mesh.setMatrixAt(i, this.dummy);
      this.mesh.setColorAt(i, this.color.set(0xffffff));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  spawn(x: number, y: number, z: number, colorHex: number): void {
    for (let n = 0; n < FRAGMENTS_PER_EFFECT; n++) {
      const slot = this.cursor;
      const fragment = this.fragments[slot]!;
      this.cursor = (this.cursor + 1) % COUNT;
      fragment.active = true;
      fragment.age = 0;
      fragment.position.set(
        x + (Math.random() - 0.5) * 2,
        y + (Math.random() - 0.5) * 2,
        z + (Math.random() - 0.5) * 2,
      );
      const theta = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      fragment.velocity.set(Math.cos(theta) * speed, 4 + Math.random() * 5, Math.sin(theta) * speed);
      fragment.size = 0.5 + Math.random() * 0.6;
      this.color.set(colorHex);
      this.color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.15);
      this.mesh.setColorAt(slot, this.color);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  update(deltaTime: number): void {
    const dt = Math.max(0, Math.min(deltaTime, 0.05));
    for (let i = 0; i < COUNT; i++) {
      const fragment = this.fragments[i]!;
      if (!fragment.active) continue;
      fragment.age += dt;
      if (fragment.age >= LIFE) {
        fragment.active = false;
        this.dummy.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, this.dummy);
        continue;
      }
      fragment.velocity.y -= 6 * dt;
      fragment.velocity.multiplyScalar(1 - 1.6 * dt);
      fragment.position.addScaledVector(fragment.velocity, dt);
      const shrink = fragment.size * (1 - fragment.age / LIFE);
      this.position.copy(fragment.position);
      this.scale.set(shrink, shrink, shrink);
      this.dummy.compose(this.position, this.identity, this.scale);
      this.mesh.setMatrixAt(i, this.dummy);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  activeCount(): number {
    return this.fragments.filter((fragment) => fragment.active).length;
  }

  getMesh(): InstancedMesh {
    return this.mesh;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as MeshStandardMaterial).dispose();
  }
}
