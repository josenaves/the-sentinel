import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputManager } from '../../src/input/InputManager.js';

function createEventTarget() {
  const listeners: Record<string, Array<(event: never) => void>> = {};
  return {
    listeners,
    addEventListener(type: string, fn: (event: never) => void): void {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    removeEventListener(type: string, fn: (event: never) => void): void {
      listeners[type] = (listeners[type] ?? []).filter((f) => f !== fn);
    },
    dispatch(type: string, event: unknown): void {
      for (const fn of listeners[type] ?? []) fn(event as never);
    },
  };
}

describe('InputManager pointer lock', () => {
  let win: ReturnType<typeof createEventTarget>;
  let doc: ReturnType<typeof createEventTarget> & {
    pointerLockElement: unknown;
    body: { requestPointerLock: ReturnType<typeof vi.fn> };
    exitPointerLock: ReturnType<typeof vi.fn>;
  };
  let manager: InputManager | null = null;

  beforeEach(() => {
    win = createEventTarget();
    doc = Object.assign(createEventTarget(), {
      pointerLockElement: null as unknown,
      body: { requestPointerLock: vi.fn() },
      exitPointerLock: vi.fn(),
    });
    vi.stubGlobal('window', win);
    vi.stubGlobal('document', doc);
    vi.spyOn(Date, 'now').mockReturnValue(100000);
  });

  afterEach(() => {
    manager?.dispose();
    manager = null;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function lock(): void {
    doc.pointerLockElement = doc.body;
    doc.dispatch('pointerlockchange', {});
  }

  function unlock(): void {
    doc.pointerLockElement = null;
    doc.dispatch('pointerlockchange', {});
  }

  it('requests pointer lock on click when unlocked', () => {
    manager = new InputManager();
    win.dispatch('click', {});
    expect(doc.body.requestPointerLock).toHaveBeenCalledTimes(1);
  });

  it('tracks pointerlockchange state', () => {
    manager = new InputManager();
    expect(manager.isPointerLocked()).toBe(false);
    lock();
    expect(manager.isPointerLocked()).toBe(true);
    unlock();
    expect(manager.isPointerLocked()).toBe(false);
  });

  it('calls exitPointerLock on Escape while locked', () => {
    manager = new InputManager();
    lock();
    win.dispatch('keydown', { code: 'Escape', repeat: false });
    expect(doc.exitPointerLock).toHaveBeenCalledTimes(1);
  });

  it('does not call exitPointerLock on Escape while unlocked', () => {
    manager = new InputManager();
    win.dispatch('keydown', { code: 'Escape', repeat: false });
    expect(doc.exitPointerLock).not.toHaveBeenCalled();
  });

  it('ignores lock requests during cooldown after ESC unlock', () => {
    manager = new InputManager();
    lock();
    win.dispatch('keydown', { code: 'Escape', repeat: false });
    unlock();
    expect(manager.isPointerLocked()).toBe(false);
    win.dispatch('click', {});
    expect(doc.body.requestPointerLock).not.toHaveBeenCalled();
  });

  it('ignores lock requests during cooldown after native unlock', () => {
    manager = new InputManager();
    lock();
    unlock();
    win.dispatch('click', {});
    expect(doc.body.requestPointerLock).not.toHaveBeenCalled();
  });

  it('allows lock requests after cooldown expires', () => {
    manager = new InputManager();
    lock();
    unlock();
    vi.mocked(Date.now).mockReturnValue(100000 + InputManager.RELOCK_COOLDOWN_MS + 1);
    win.dispatch('click', {});
    expect(doc.body.requestPointerLock).toHaveBeenCalledTimes(1);
  });
});
