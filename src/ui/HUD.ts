export class HUD {
  private element: HTMLElement;
  private crosshair!: HTMLElement;
  private overlay: HTMLElement | null = null;

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

  setEnergy(energy: number): void {    let energyLine = this.element.querySelector('[data-energy]');
    if (!energyLine) {
      energyLine = document.createElement('div');
      energyLine.setAttribute('data-energy', 'true');
      this.element.appendChild(energyLine);
    }
    energyLine.textContent = `Energy ${energy}`;
  }

  setTarget(text: string): void {
    let target = this.element.querySelector('[data-target]');
    if (!target) {
      target = document.createElement('div');
      target.setAttribute('data-target', 'true');
      this.element.appendChild(target);
    }
    target.textContent = text;
  }

  setObjective(text: string): void {
    let objective = this.element.querySelector('[data-objective]');
    if (!objective) {
      objective = document.createElement('div');
      objective.setAttribute('data-objective', 'true');
      this.element.appendChild(objective);
    }
    objective.textContent = text;
  }

  setLandscape(number: number): void {
    let landscape = this.element.querySelector('[data-landscape]');
    if (!landscape) {
      landscape = document.createElement('div');
      landscape.setAttribute('data-landscape', 'true');
      this.element.appendChild(landscape);
    }
    landscape.textContent = `Landscape ${String(number).padStart(4, '0')}`;
  }

  setWarning(level: 'none' | 'partial' | 'full'): void {
    let warning = this.element.querySelector('[data-warning]');
    if (!warning) {
      warning = document.createElement('div');
      warning.setAttribute('data-warning', 'true');
      this.element.appendChild(warning);
    }
    const element = warning as HTMLElement;
    if (level === 'none') {
      element.style.display = 'none';
      return;
    }
    element.style.display = 'block';
    element.style.color = level === 'full' ? '#ff4444' : '#ffdf6b';
    element.textContent = level === 'full' ? '!! SENTINEL SEES YOU !!' : '! SENTINEL SEES YOU (PARTIAL)';
  }

  setMeanie(active: boolean): void {
    let meanie = this.element.querySelector('[data-meanie]');
    if (!meanie) {
      meanie = document.createElement('div');
      meanie.setAttribute('data-meanie', 'true');
      meanie.textContent = '!! MEANIE — MOVE !!';
      this.element.appendChild(meanie);
    }
    (meanie as HTMLElement).style.display = active ? 'block' : 'none';
  }

  showMessage(text: string): void {
    if (!this.overlay) {
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
      document.body.appendChild(overlay);
      this.overlay = overlay;
    }
    this.overlay.textContent = text;
  }

  clearMessage(): void {
    if (this.overlay?.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
  }

  showStartPanel(onStart: () => void): void {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: fixed;
      left: 50%;
      top: 35%;
      transform: translate(-50%, -50%);
      color: #ffffff;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid #ffffff;
      padding: 24px 32px;
      font-family: monospace;
      font-size: 16px;
      line-height: 1.8;
      text-align: center;
      cursor: pointer;
      z-index: 10;
    `;
    panel.innerHTML = `
      <div style="font-size: 24px; font-weight: bold;">SENTINEL-3D</div>
      <div>Absorb the Sentinel on the tower, then hyperspace out.</div>
      <div>A absorb | T tree | B boulder | R robot | Q transfer | H hyper</div>
      <div style="margin-top: 12px; color: #ffdf6b;">CLICK TO PLAY</div>
    `;
    panel.addEventListener('click', () => {
      panel.parentNode?.removeChild(panel);
      onStart();
    });
    document.body.appendChild(panel);
  }

  showGameOverPanel(message: string, onRestart: () => void): void {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: fixed;
      left: 50%;
      top: 40%;
      transform: translate(-50%, -50%);
      color: #ff4444;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid #ff4444;
      padding: 24px 32px;
      font-family: monospace;
      font-size: 20px;
      line-height: 2;
      text-align: center;
      cursor: pointer;
      z-index: 10;
    `;
    panel.innerHTML = `
      <div style="font-size: 28px;">${message}</div>
      <div style="font-size: 16px; color: #ffffff;">CLICK TO TRY AGAIN</div>
    `;
    panel.addEventListener('click', () => {
      panel.parentNode?.removeChild(panel);
      onRestart();
    });
    document.body.appendChild(panel);
  }

  dispose(): void {
    this.clearMessage();
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    if (this.crosshair.parentNode) {
      this.crosshair.parentNode.removeChild(this.crosshair);
    }
  }
}