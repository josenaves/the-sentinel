import { CELL_SIZE, PLAYER_HEIGHT, MOUSE_SENSITIVITY, PAN_KEYBOARD_SPEED, STARTING_ENERGY } from '../core/Constants.js';
import { World } from '../world/World.js';
export class Player {
    position = { x: 0, y: 0, z: 0 };
    rotation = 0;
    pitch = 0;
    energy = STARTING_ENERGY;
    world;
    constructor(world) {
        this.world = world;
    }
    setPosition(x, y, z) {
        this.position.x = x;
        this.position.z = z;
        this.position.y = this.groundEyeHeight(x, z);
    }
    currentCell() {
        return {
            x: Math.floor(this.position.x / CELL_SIZE),
            z: Math.floor(this.position.z / CELL_SIZE),
        };
    }
    transferTo(cellX, cellZ) {
        this.setPosition((cellX + 0.5) * CELL_SIZE, 0, (cellZ + 0.5) * CELL_SIZE);
    }
    update(deltaTime, input) {
        if (input.uturn) {
            this.rotation += Math.PI;
        }
        this.handleRotation(deltaTime, input);
    }
    handleRotation(deltaTime, input) {
        if (input.panLeft)
            this.rotation += PAN_KEYBOARD_SPEED * deltaTime;
        if (input.panRight)
            this.rotation -= PAN_KEYBOARD_SPEED * deltaTime;
        if (input.panUp)
            this.pitch -= PAN_KEYBOARD_SPEED * deltaTime;
        if (input.panDown)
            this.pitch += PAN_KEYBOARD_SPEED * deltaTime;
        this.rotation -= input.mouseDeltaX * MOUSE_SENSITIVITY;
        this.pitch += input.mouseDeltaY * MOUSE_SENSITIVITY;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    }
    groundEyeHeight(worldX, worldZ) {
        const cellX = Math.floor(worldX / CELL_SIZE);
        const cellZ = Math.floor(worldZ / CELL_SIZE);
        return this.world.columnTopAt(cellX, cellZ) + PLAYER_HEIGHT;
    }
    canAfford(cost) {
        return this.energy >= cost;
    }
    addEnergy(amount) {
        this.energy += amount;
    }
    spendEnergy(cost) {
        if (this.energy < cost)
            return false;
        this.energy -= cost;
        return true;
    }
}
