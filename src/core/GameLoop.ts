export class GameLoop {
  private running = false;
  private lastTime = 0;
  private updateCallback: (deltaTime: number) => void;

  constructor(updateCallback: (deltaTime: number) => void) {
    this.updateCallback = updateCallback;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.tick.bind(this));
  }

  stop(): void {
    this.running = false;
  }

  private tick(currentTime: number): void {
    if (!this.running) return;

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.updateCallback(deltaTime);

    requestAnimationFrame(this.tick.bind(this));
  }
}