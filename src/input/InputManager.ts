export class InputManager {
  private keys: Map<string, boolean> = new Map();
  private pressed: Set<string> = new Set();
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;
  private pointerLocked = false;

  private onKeyDownBound = (event: KeyboardEvent): void => {
    this.keys.set(event.code, true);
    if (!event.repeat) {
      this.pressed.add(event.code);
    }
  };

  private onKeyUpBound = (event: KeyboardEvent): void => {
    this.keys.set(event.code, false);
  };

  private onMouseMoveBound = (event: MouseEvent): void => {
    if (this.pointerLocked) {
      this.mouseDeltaX += event.movementX;
      this.mouseDeltaY += event.movementY;
    }
  };

  private onClickBound = (): void => {
    this.requestPointerLock();
  };

  private onPointerLockChangeBound = (): void => {
    this.pointerLocked = document.pointerLockElement === document.body;
  };

  private onPointerLockErrorBound = (): void => {
    this.pointerLocked = false;
  };

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    window.addEventListener('mousemove', this.onMouseMoveBound);
    window.addEventListener('click', this.onClickBound);
    document.addEventListener('pointerlockchange', this.onPointerLockChangeBound);
    document.addEventListener('pointerlockerror', this.onPointerLockErrorBound);
  }

  private requestPointerLock(): void {
    if (!this.pointerLocked) {
      document.body.requestPointerLock?.();
    }
  }

  getInputState(): { panLeft: boolean; panRight: boolean; panUp: boolean; panDown: boolean; mouseDeltaX: number; mouseDeltaY: number; absorb: boolean; createTree: boolean; createBoulder: boolean; createRobot: boolean; transfer: boolean; hyperspace: boolean; uturn: boolean } {
    const state = {
      panLeft: this.keys.get('ArrowLeft') ?? false,
      panRight: this.keys.get('ArrowRight') ?? false,
      panUp: this.keys.get('ArrowUp') ?? false,
      panDown: this.keys.get('ArrowDown') ?? false,
      mouseDeltaX: this.mouseDeltaX,
      mouseDeltaY: this.mouseDeltaY,
      absorb: this.pressed.has('KeyA'),
      createTree: this.pressed.has('KeyT'),
      createBoulder: this.pressed.has('KeyB'),
      createRobot: this.pressed.has('KeyR'),
      transfer: this.pressed.has('KeyQ'),
      hyperspace: this.pressed.has('KeyH'),
      uturn: this.pressed.has('KeyU'),
    };

    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.pressed.clear();

    return state;
  }

  isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    window.removeEventListener('click', this.onClickBound);
    document.removeEventListener('pointerlockchange', this.onPointerLockChangeBound);
    document.removeEventListener('pointerlockerror', this.onPointerLockErrorBound);
  }
}
