export class InputManager {
    keys = new Map();
    pressed = new Set();
    mouseDeltaX = 0;
    mouseDeltaY = 0;
    pointerLocked = false;
    onKeyDownBound = (event) => {
        this.keys.set(event.code, true);
        if (!event.repeat) {
            this.pressed.add(event.code);
        }
    };
    onKeyUpBound = (event) => {
        this.keys.set(event.code, false);
    };
    onMouseMoveBound = (event) => {
        if (this.pointerLocked) {
            this.mouseDeltaX += event.movementX;
            this.mouseDeltaY += event.movementY;
        }
    };
    onClickBound = () => {
        this.requestPointerLock();
    };
    onPointerLockChangeBound = () => {
        this.pointerLocked = document.pointerLockElement === document.body;
    };
    onPointerLockErrorBound = () => {
        this.pointerLocked = false;
    };
    constructor() {
        this.setupEventListeners();
    }
    setupEventListeners() {
        window.addEventListener('keydown', this.onKeyDownBound);
        window.addEventListener('keyup', this.onKeyUpBound);
        window.addEventListener('mousemove', this.onMouseMoveBound);
        window.addEventListener('click', this.onClickBound);
        document.addEventListener('pointerlockchange', this.onPointerLockChangeBound);
        document.addEventListener('pointerlockerror', this.onPointerLockErrorBound);
    }
    requestPointerLock() {
        if (!this.pointerLocked) {
            document.body.requestPointerLock?.();
        }
    }
    getInputState() {
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
    isPointerLocked() {
        return this.pointerLocked;
    }
    dispose() {
        window.removeEventListener('keydown', this.onKeyDownBound);
        window.removeEventListener('keyup', this.onKeyUpBound);
        window.removeEventListener('mousemove', this.onMouseMoveBound);
        window.removeEventListener('click', this.onClickBound);
        document.removeEventListener('pointerlockchange', this.onPointerLockChangeBound);
        document.removeEventListener('pointerlockerror', this.onPointerLockErrorBound);
    }
}
