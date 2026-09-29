export class HUD {
    element;
    crosshair;
    constructor() {
        this.element = document.createElement('div');
        this.element.style.cssText = `
      position: fixed;
      top: 16px;
      left: 16px;
      color: #e0e0e0;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.5;
      pointer-events: none;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
    `;
        this.element.innerHTML = `
      <strong>SENTINEL-3D</strong><br>
      Arrows/Mouse Look<br>
      Click Capture mouse<br>
      A Absorb | T Tree | B Boulder<br>
      R Robot | Q Transfer | H Hyper<br>
      U U-turn<br>
      ESC   Release Mouse
    `;
        document.body.appendChild(this.element);
        const crosshair = document.createElement('div');
        crosshair.style.cssText = `
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: #ffffff;
      font-family: monospace;
      font-size: 20px;
      pointer-events: none;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
    `;
        crosshair.textContent = '+';
        document.body.appendChild(crosshair);
        this.crosshair = crosshair;
    }
    setEnergy(energy) {
        let energyLine = this.element.querySelector('[data-energy]');
        if (!energyLine) {
            energyLine = document.createElement('div');
            energyLine.setAttribute('data-energy', 'true');
            this.element.appendChild(energyLine);
        }
        energyLine.textContent = `Energy ${energy}`;
    }
    setTarget(text) {
        let target = this.element.querySelector('[data-target]');
        if (!target) {
            target = document.createElement('div');
            target.setAttribute('data-target', 'true');
            this.element.appendChild(target);
        }
        target.textContent = text;
    }
    setObjective(text) {
        let objective = this.element.querySelector('[data-objective]');
        if (!objective) {
            objective = document.createElement('div');
            objective.setAttribute('data-objective', 'true');
            this.element.appendChild(objective);
        }
        objective.textContent = text;
    }
    setWarning(active) {
        let warning = this.element.querySelector('[data-warning]');
        if (!warning) {
            warning = document.createElement('div');
            warning.setAttribute('data-warning', 'true');
            warning.textContent = '!! SENTINEL SEES YOU !!';
            this.element.appendChild(warning);
        }
        warning.style.display = active ? 'block' : 'none';
    }
    showMessage(text) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
      position: fixed;
      left: 50%;
      top: 40%;
      transform: translate(-50%, -50%);
      color: #ff4444;
      font-family: monospace;
      font-size: 28px;
      pointer-events: none;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.9);
    `;
        overlay.textContent = text;
        document.body.appendChild(overlay);
    }
    dispose() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        if (this.crosshair.parentNode) {
            this.crosshair.parentNode.removeChild(this.crosshair);
        }
    }
}
