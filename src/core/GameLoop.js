export class GameLoop {
    running = false;
    lastTime = 0;
    updateCallback;
    constructor(updateCallback) {
        this.updateCallback = updateCallback;
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.tick.bind(this));
    }
    stop() {
        this.running = false;
    }
    tick(currentTime) {
        if (!this.running)
            return;
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        this.updateCallback(deltaTime);
        requestAnimationFrame(this.tick.bind(this));
    }
}
