import { CELL_SIZE, PLAYER_HEIGHT, MOUSE_SENSITIVITY, PAN_KEYBOARD_SPEED, STARTING_ENERGY } from '../core/Constants.js';
import { World } from '../world/World.js';

export interface InputState {
  panLeft: boolean;
  panRight: boolean;
  panUp: boolean;
  panDown: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;
  absorb: boolean;
  createTree: boolean;
  createBoulder: boolean;
  createRobot: boolean;
  transfer: boolean;
  hyperspace: boolean;
  uturn: boolean;
}

export class Player {
  position = { x: 0, y: 0, z: 0 };
  rotation = 0;
  pitch = 0;
  energy = STARTING_ENERGY;
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  setPosition(x: number, y: number, z: number): void {
    this.position.x = x;
    this.position.z = z;
    this.position.y = this.groundEyeHeight(x, z);
  }

  currentCell(): { x: number; z: number } {
    return {
      x: Math.floor(this.position.x / CELL_SIZE),
      z: Math.floor(this.position.z / CELL_SIZE),
    };
  }

  transferTo(cellX: number, cellZ: number): void {
    this.setPosition((cellX + 0.5) * CELL_SIZE, 0, (cellZ + 0.5) * CELL_SIZE);
  }

  update(deltaTime: number, input: InputState): void {
    if (input.uturn) {
      this.rotation += Math.PI;
    }
    this.handleRotation(deltaTime, input);
  }

  private handleRotation(deltaTime: number, input: InputState): void {
    if (input.panLeft) this.rotation += PAN_KEYBOARD_SPEED * deltaTime;
    if (input.panRight) this.rotation -= PAN_KEYBOARD_SPEED * deltaTime;
    if (input.panUp) this.pitch -= PAN_KEYBOARD_SPEED * deltaTime;
    if (input.panDown) this.pitch += PAN_KEYBOARD_SPEED * deltaTime;
    this.rotation -= input.mouseDeltaX * MOUSE_SENSITIVITY;
    this.pitch += input.mouseDeltaY * MOUSE_SENSITIVITY;
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
  }

  private groundEyeHeight(worldX: number, worldZ: number): number {
    const cellX = Math.floor(worldX / CELL_SIZE);
    const cellZ = Math.floor(worldZ / CELL_SIZE);
    return this.world.columnTopAt(cellX, cellZ) + PLAYER_HEIGHT;
  }

  canAfford(cost: number): boolean {
    return this.energy >= cost;
  }

  addEnergy(amount: number): void {
    this.energy += amount;
  }

  spendEnergy(cost: number): boolean {
    if (this.energy < cost) return false;
    this.energy -= cost;
    return true;
  }
}
