import { createInitialGameState } from './GameState.js';
import { GameLoop } from './GameLoop.js';
import { World } from '../world/World.js';
import { Player } from '../player/Player.js';
import { Sentinel } from '../entities/Sentinel.js';
import { InputManager } from '../input/InputManager.js';
import { Renderer } from '../rendering/Renderer.js';
import { getObjectEnergy } from '../world/Cell.js';
import { TREE_COST, BOULDER_COST, ROBOT_COST, HYPERSPACE_COST, SENTINEL_ENERGY } from './Constants.js';
export class Game {
    state;
    world;
    player;
    input;
    renderer;
    gameLoop;
    hud = null;
    sentinel;
    over = false;
    overMessage = 'ABSORBED BY THE SENTINEL';
    transitionTo = null;
    transitionTimer = 0;
    constructor(hud) {
        this.state = createInitialGameState();
        this.world = new World();
        this.player = new Player(this.world);
        this.sentinel = new Sentinel();
        this.input = new InputManager();
        this.renderer = new Renderer(this.world, this.player, this.sentinel);
        this.gameLoop = new GameLoop(this.update.bind(this));
        if (hud)
            this.hud = hud;
        this.initialize();
    }
    initialize() {
        this.renderer.initialize();
        const spawn = this.findSpawnCell();
        this.player.setPosition((spawn.x + 0.5) * 4, 0, (spawn.z + 0.5) * 4);
        this.gameLoop.start();
    }
    loadLandscape(landscapeNumber) {
        const energy = this.player.energy;
        this.renderer.dispose();
        this.world = new World(landscapeNumber);
        this.player = new Player(this.world);
        this.player.energy = energy;
        this.sentinel = new Sentinel();
        this.renderer = new Renderer(this.world, this.player, this.sentinel);
        this.renderer.initialize();
        const spawn = this.findSpawnCell();
        this.player.setPosition((spawn.x + 0.5) * 4, 0, (spawn.z + 0.5) * 4);
        this.state = createInitialGameState();
        this.hud?.clearMessage();
    }
    findSpawnCell() {
        const size = this.world.getSize();
        const center = size / 2;
        let best = { x: 0, z: 0 };
        let bestHeight = Number.MAX_SAFE_INTEGER;
        let bestDistance = -1;
        for (let z = 0; z < size; z++) {
            for (let x = 0; x < size; x++) {
                const structure = this.world.getVerticalStructure();
                if (structure && x === structure.x && z === structure.z)
                    continue;
                const object = this.world.getObject(x, z);
                if (object !== 'empty' && object !== 'boulder')
                    continue;
                const height = this.world.getHeight(x, z);
                const distance = (x - center) * (x - center) + (z - center) * (z - center);
                if (height < bestHeight || (height === bestHeight && distance > bestDistance)) {
                    best = { x, z };
                    bestHeight = height;
                    bestDistance = distance;
                }
            }
        }
        return best;
    }
    update(deltaTime) {
        if (this.transitionTo !== null) {
            this.transitionTimer -= deltaTime;
            if (this.transitionTimer <= 0) {
                const next = this.transitionTo;
                this.transitionTo = null;
                this.loadLandscape(next);
            }
            this.renderer.render();
            return;
        }
        this.state.elapsedTime += deltaTime;
        const inputState = this.input.getInputState();
        this.player.update(deltaTime, inputState);
        const aimTarget = this.world.raycastAim(this.player.position, this.aimDirection());
        this.handleActions(inputState, aimTarget);
        this.hud?.setTarget(this.describeTarget(aimTarget));
        this.hud?.setObjective(this.describeObjective());
        if (this.sentinel.update(deltaTime, this.world, this.player)) {
            this.renderer.updateTerrain();
        }
        this.hud?.setWarning(this.sentinel.warning);
        if (!this.over && this.player.energy <= 0) {
            this.endGame(this.overMessage);
        }
        this.state.player.x = this.player.position.x;
        this.state.player.y = this.player.position.y;
        this.state.player.z = this.player.position.z;
        this.state.player.rotation = this.player.rotation;
        this.state.player.pitch = this.player.pitch;
        this.hud?.setEnergy(this.player.energy);
        this.hud?.setLandscape(this.world.getLandscapeNumber());
        this.renderer.render();
    }
    aimDirection() {
        const cosPitch = Math.cos(this.player.pitch);
        return {
            x: -Math.sin(this.player.rotation) * cosPitch,
            y: -Math.sin(this.player.pitch),
            z: -Math.cos(this.player.rotation) * cosPitch,
        };
    }
    describeTarget(target) {
        if (!target)
            return 'Mira: —';
        if (target.tower)
            return 'Mira: torre';
        const stack = this.world.getStack(target.x, target.z);
        const suffix = stack > 0 ? ` x${stack + 1}` : '';
        return `Mira: (${target.x},${target.z}) ${this.world.getObject(target.x, target.z)}${suffix}`;
    }
    describeObjective() {
        if (!this.world.isTowerOpen())
            return 'OBJ: suba acima da torre e absorva o Sentinel (A)';
        const current = this.player.currentCell();
        if (this.world.isTowerCell(current.x, current.z))
            return 'OBJ: pressione H para vencer!';
        return 'OBJ: torre aberta! R na torre, Q, depois H';
    }
    endGame(message) {
        if (this.over)
            return;
        this.over = true;
        this.hud?.showMessage(message);
        this.gameLoop.stop();
    }
    handleActions(input, target) {
        if (input.hyperspace) {
            if (this.hyperspace()) {
                this.renderer.updateTerrain();
            }
            return;
        }
        if (!input.absorb && !input.createTree && !input.createBoulder && !input.createRobot && !input.transfer)
            return;
        if (!target)
            return;
        let changed = false;
        if (input.absorb) {
            changed = this.absorb(target);
        }
        else if (input.createTree) {
            changed = this.create(target, 'tree', TREE_COST);
        }
        else if (input.createBoulder) {
            changed = this.create(target, 'boulder', BOULDER_COST);
        }
        else if (input.createRobot) {
            changed = this.create(target, 'robot', ROBOT_COST);
        }
        else if (input.transfer) {
            changed = this.transfer(target);
        }
        if (changed) {
            this.renderer.updateTerrain();
        }
    }
    absorb(target) {
        if (target.tower) {
            return this.absorbSentinel();
        }
        const object = this.world.getObject(target.x, target.z);
        if (object !== 'tree' && object !== 'boulder' && object !== 'robot')
            return false;
        const current = this.player.currentCell();
        const isCurrent = target.x === current.x && target.z === current.z;
        let taken = false;
        if (object === 'tree')
            taken = this.world.takeTree(target.x, target.z);
        else if (object === 'boulder')
            taken = this.world.takeBoulder(target.x, target.z);
        else
            taken = this.world.takeRobot(target.x, target.z, isCurrent);
        if (!taken)
            return false;
        this.player.addEnergy(getObjectEnergy(object));
        return true;
    }
    absorbSentinel() {
        if (!this.world.canAbsorbSentinel(this.player.position.y))
            return false;
        this.world.setTowerOpen(true);
        this.sentinel.absorbed = true;
        this.player.addEnergy(SENTINEL_ENERGY);
        return true;
    }
    transfer(target) {
        const current = this.player.currentCell();
        if (target.x === current.x && target.z === current.z)
            return false;
        if (!this.world.takeRobot(target.x, target.z, false))
            return false;
        if (!this.world.placeRobot(current.x, current.z)) {
            this.world.placeRobot(target.x, target.z);
            return false;
        }
        this.player.transferTo(target.x, target.z);
        return true;
    }
    hyperspace() {
        const current = this.player.currentCell();
        if (this.world.isTowerCell(current.x, current.z) && this.world.isTowerOpen()) {
            if (!this.player.canAfford(HYPERSPACE_COST)) {
                this.player.energy = 0;
                this.overMessage = 'DESTROYED';
                return false;
            }
            this.player.spendEnergy(HYPERSPACE_COST);
            const next = this.world.getLandscapeNumber() + this.player.energy;
            this.hud?.showMessage(`LANDSCAPE COMPLETE — NEXT ${next}`);
            this.transitionTo = next;
            this.transitionTimer = 2.5;
            return false;
        }
        if (!this.player.canAfford(HYPERSPACE_COST)) {
            this.player.energy = 0;
            this.overMessage = 'DESTROYED';
            return false;
        }
        const destination = this.world.pickHyperspaceDestination(current.x, current.z, Math.random);
        if (!destination)
            return false;
        this.player.spendEnergy(HYPERSPACE_COST);
        this.world.placeRobot(current.x, current.z);
        this.player.transferTo(destination.x, destination.z);
        return true;
    }
    create(target, kind, cost) {
        if (!this.player.canAfford(cost))
            return false;
        let placed = false;
        if (kind === 'tree')
            placed = this.world.placeTree(target.x, target.z);
        else if (kind === 'boulder')
            placed = this.world.placeBoulder(target.x, target.z);
        else
            placed = this.world.placeRobot(target.x, target.z);
        if (!placed)
            return false;
        this.player.spendEnergy(cost);
        return true;
    }
    dispose() {
        this.gameLoop.stop();
        this.renderer.dispose();
        this.input.dispose();
    }
}
