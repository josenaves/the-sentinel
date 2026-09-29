import type { GameState } from './GameState.js';
import { createInitialGameState } from './GameState.js';
import { GameLoop } from './GameLoop.js';
import { World, type SightTarget } from '../world/World.js';
import { Player, type InputState } from '../player/Player.js';
import { Sentinel } from '../entities/Sentinel.js';
import { Sentry } from '../entities/Sentry.js';
import { Meanie } from '../entities/Meanie.js';
import { InputManager } from '../input/InputManager.js';
import { Renderer } from '../rendering/Renderer.js';
import type { HUD } from '../ui/HUD.js';
import type { CellObject } from '../world/Cell.js';
import { getObjectEnergy } from '../world/Cell.js';
import { Sound } from '../audio/Sound.js';
import { TREE_COST, BOULDER_COST, ROBOT_COST, HYPERSPACE_COST, SENTINEL_ENERGY, STARTING_ENERGY, MEANIE_ROTATION_SPEED } from './Constants.js';

export class Game {
  private state: GameState;
  private world: World;
  private player: Player;
  private input: InputManager;
  private renderer: Renderer;
  private gameLoop: GameLoop;
  private hud: HUD | null = null;
  private sentinel: Sentinel;
  private sentries: Sentry[] = [];
  private meanie: Meanie | null = null;
  private sound = new Sound();
  private started = false;
  private warned = false;
  private over = false;
  private overMessage = 'ABSORBED BY THE SENTINEL';
  private transitionTo: number | null = null;
  private transitionTimer = 0;

  constructor(hud?: HUD) {
    this.state = createInitialGameState();
    // New games start at landscape 0000 like the 1986 original: no sentries.
    this.world = new World(0);
    this.player = new Player(this.world);
    this.sentinel = new Sentinel();
    this.sentries = this.createSentries();
    this.input = new InputManager();
    this.renderer = new Renderer(this.world, this.player, this.sentinel, this.sentries);
    this.gameLoop = new GameLoop(this.update.bind(this));
    if (hud) this.hud = hud;

    this.initialize();
    if (this.hud) {
      this.hud.showStartPanel(() => this.startGame());
    } else {
      this.startGame();
    }
  }

  private initialize(): void {
    this.renderer.initialize();
    const spawn = this.findSpawnCell();
    this.player.setPosition((spawn.x + 0.5) * 4, 0, (spawn.z + 0.5) * 4);
  }

  private startGame(): void {
    if (this.started) return;
    this.started = true;
    this.sound.unlock();
    this.gameLoop.start();
  }

  private restart(): void {
    this.over = false;
    this.warned = false;
    this.loadLandscape(0);
    this.player.energy = STARTING_ENERGY;
    this.sound.unlock();
    this.gameLoop.start();
  }

  private loadLandscape(landscapeNumber: number): void {
    const energy = this.player.energy;
    this.clearMeanie();
    this.renderer.dispose();
    this.world = new World(landscapeNumber);
    this.player = new Player(this.world);
    this.player.energy = energy;
    this.sentinel = new Sentinel();
    this.sentries = this.createSentries();
    this.renderer = new Renderer(this.world, this.player, this.sentinel, this.sentries);
    this.renderer.initialize();
    const spawn = this.findSpawnCell();
    this.player.setPosition((spawn.x + 0.5) * 4, 0, (spawn.z + 0.5) * 4);
    this.state = createInitialGameState();
    this.hud?.clearMessage();
  }

  private createSentries(): Sentry[] {
    return this.world.getSentries().map((post) => new Sentry(post.x, post.z));
  }

  private sentryAt(x: number, z: number): Sentry | undefined {
    return this.sentries.find((sentry) => !sentry.absorbed && sentry.x === x && sentry.z === z);
  }

  private findSpawnCell(): { x: number; z: number } {
    const size = this.world.getSize();
    const center = size / 2;
    let best = { x: 0, z: 0 };
    let bestHeight = Number.MAX_SAFE_INTEGER;
    let bestDistance = -1;
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const structure = this.world.getVerticalStructure();
        if (structure && x === structure.x && z === structure.z) continue;
        const object = this.world.getObject(x, z);
        if (object !== 'empty' && object !== 'boulder') continue;
        if (this.sentryAt(x, z)) continue;
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

  private update(deltaTime: number): void {
    if (!this.started) {
      this.renderer.render();
      return;
    }
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

    const inputState: InputState = this.input.getInputState();
    this.player.update(deltaTime, inputState);
    const aimTarget = this.world.raycastAim(this.player.position, this.aimDirection());
    this.handleActions(inputState, aimTarget);
    this.hud?.setTarget(this.describeTarget(aimTarget));
    this.hud?.setObjective(this.describeObjective());
    if (this.sentinel.update(deltaTime, this.world, this.player)) {
      this.renderer.updateTerrain();
    }
    for (const sentry of this.sentries) {
      if (sentry.update(deltaTime, this.world, this.player)) {
        this.renderer.updateTerrain();
      }
    }
    const warning = this.sentinel.warning || this.sentries.some((sentry) => sentry.warning);
    this.hud?.setWarning(warning);
    if (warning && !this.warned) {
      this.sound.alarm();
    }
    this.warned = warning;
    this.updateMeanie(deltaTime);
    this.hud?.setMeanie(this.meanie !== null);
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

  private aimDirection(): { x: number; y: number; z: number } {
    const cosPitch = Math.cos(this.player.pitch);
    return {
      x: -Math.sin(this.player.rotation) * cosPitch,
      y: -Math.sin(this.player.pitch),
      z: -Math.cos(this.player.rotation) * cosPitch,
    };
  }

  private describeTarget(target: SightTarget | null): string {
    if (!target) return 'Mira: —';
    if (target.tower) return 'Mira: torre';
    if (this.meanie && this.meanie.x === target.x && this.meanie.z === target.z) return 'Mira: meanie';
    if (this.sentryAt(target.x, target.z)) return 'Mira: sentry';
    const stack = this.world.getStack(target.x, target.z);
    const suffix = stack > 0 ? ` x${stack + 1}` : '';
    return `Mira: (${target.x},${target.z}) ${this.world.getObject(target.x, target.z)}${suffix}`;
  }

  private describeObjective(): string {
    if (!this.world.isTowerOpen()) return 'OBJ: suba acima da torre e absorva o Sentinel (A)';
    const current = this.player.currentCell();
    if (this.world.isTowerCell(current.x, current.z)) return 'OBJ: pressione H para vencer!';
    return 'OBJ: torre aberta! R na torre, Q, depois H';
  }

  private endGame(message: string): void {
    if (this.over) return;
    this.over = true;
    this.sound.lose();
    this.gameLoop.stop();
    this.hud?.showGameOverPanel(message, () => this.restart());
  }

  private handleActions(input: InputState, target: SightTarget | null): void {
    if (input.hyperspace) {
      if (this.hyperspace()) {
        this.renderer.updateTerrain();
        this.sound.hyperspace();
      }
      return;
    }
    if (!input.absorb && !input.createTree && !input.createBoulder && !input.createRobot && !input.transfer) return;
    if (!target) return;
    // Like the 1986 original, the sights never target your own square:
    // you cannot absorb the stack you stand on nor create inside yourself.
    const currentCell = this.player.currentCell();
    if (target.x === currentCell.x && target.z === currentCell.z) return;

    let changed = false;
    if (input.absorb) {
      changed = this.absorb(target);
    } else if (input.createTree) {
      changed = this.create(target, 'tree', TREE_COST);
    } else if (input.createBoulder) {
      changed = this.create(target, 'boulder', BOULDER_COST);
    } else if (input.createRobot) {
      changed = this.create(target, 'robot', ROBOT_COST);
    } else if (input.transfer) {
      changed = this.transfer(target);
    }
    if (changed) {
      this.renderer.updateTerrain();
      if (input.absorb) this.sound.absorb();
      else if (input.transfer) this.sound.transfer();
      else this.sound.create();
    }
  }

  private absorb(target: SightTarget): boolean {
    if (target.tower) {
      return this.absorbSentinel();
    }
    const sentry = this.sentryAt(target.x, target.z);
    if (sentry) {
      return this.absorbSentry(sentry);
    }
    const object = this.world.getObject(target.x, target.z);
    if (object !== 'tree' && object !== 'boulder' && object !== 'robot') return false;
    const current = this.player.currentCell();
    const isCurrent = target.x === current.x && target.z === current.z;
    let taken = false;
    if (object === 'tree') taken = this.world.takeTree(target.x, target.z);
    else if (object === 'boulder') taken = this.world.takeBoulder(target.x, target.z);
    else taken = this.world.takeRobot(target.x, target.z, isCurrent);
    if (!taken) return false;
    if (object === 'tree' && this.meanie && this.meanie.x === target.x && this.meanie.z === target.z) {
      this.clearMeanie();
    }
    this.player.addEnergy(getObjectEnergy(object));
    return true;
  }

  private absorbSentinel(): boolean {
    if (!this.world.canAbsorbSentinel(this.player.position.y)) return false;
    this.world.setTowerOpen(true);
    this.sentinel.absorbed = true;
    this.player.addEnergy(SENTINEL_ENERGY);
    return true;
  }

  private absorbSentry(sentry: Sentry): boolean {
    if (this.player.position.y <= this.world.columnTopAt(sentry.x, sentry.z)) return false;
    sentry.absorbed = true;
    this.player.addEnergy(getObjectEnergy('sentry'));
    return true;
  }

  private updateMeanie(deltaTime: number): void {
    if (!this.meanie) {
      this.trySpawnMeanie();
      return;
    }
    this.meanie.angle = (this.meanie.angle + MEANIE_ROTATION_SPEED * deltaTime) % (Math.PI * 2);
    this.meanie.spun += MEANIE_ROTATION_SPEED * deltaTime;
    if (this.meanie.seesSquare(this.world, this.player)) {
      this.clearMeanie();
      if (this.hyperspace()) {
        this.renderer.updateTerrain();
      }
    } else if (this.meanie.spun >= Math.PI * 2) {
      this.clearMeanie();
    }
  }

  private trySpawnMeanie(): void {
    if (this.over) return;
    const watchers: Sentinel[] = [this.sentinel, ...this.sentries];
    for (const watcher of watchers) {
      if (watcher.absorbed) continue;
      if (!watcher.seesHead(this.world, this.player)) continue;
      if (watcher.seesSquare(this.world, this.player)) continue;
      const spot = Meanie.spawnAt(this.world, this.player);
      if (!spot) continue;
      this.meanie = new Meanie(spot.x, spot.z);
      this.renderer.setMeanie(this.meanie);
      this.sound.meanie();
      break;
    }
  }

  private clearMeanie(): void {
    this.meanie = null;
    this.renderer.setMeanie(null);
  }

  private transfer(target: SightTarget): boolean {
    const current = this.player.currentCell();
    if (target.x === current.x && target.z === current.z) return false;
    if (!this.world.takeRobot(target.x, target.z, false)) return false;
    if (!this.world.placeRobot(current.x, current.z)) {
      this.world.placeRobot(target.x, target.z);
      return false;
    }
    this.player.transferTo(target.x, target.z);
    return true;
  }

  private hyperspace(): boolean {
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
      this.sound.win();
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
    if (!destination) return false;
    this.player.spendEnergy(HYPERSPACE_COST);
    this.world.placeRobot(current.x, current.z);
    this.player.transferTo(destination.x, destination.z);
    return true;
  }

  private create(target: SightTarget, kind: CellObject, cost: number): boolean {
    if (!this.player.canAfford(cost)) return false;
    let placed = false;
    if (kind === 'tree') placed = this.world.placeTree(target.x, target.z);
    else if (kind === 'boulder') placed = this.world.placeBoulder(target.x, target.z);
    else placed = this.world.placeRobot(target.x, target.z);
    if (!placed) return false;
    this.player.spendEnergy(cost);
    return true;
  }

  dispose(): void {
    this.gameLoop.stop();
    this.renderer.dispose();
    this.input.dispose();
  }
}