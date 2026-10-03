// HUD no estilo do original (1986):
// - canto superior esquerdo: energia em ícones (árvore=1, pedra=2, robô=3,
//   robô dourado=15), como no C64 ("tree=1, rock=2, robot=3, golden=15").
// - canto superior direito: caixa de scan, vazia em paz, meia em partial
//   (só a cabeça visível) e cheia piscando em full, borda magenta com Meanie.
// - resto (mira, paisagem, objetivo) em barra inferior discreta.
// A API pública é preservada: Game chama os mesmos métodos.
export class HUD {
    element;
    scanBox;
    scanFill;
    scanLabel;
    info;
    crosshair;
    overlay = null;
    lastEnergy = null;
    warningLevel = 'none';
    meanieActive = false;
    constructor() {
        this.injectBlinkStyle();
        // Faixa de energia (topo-esquerda): só ícones, sem texto de controles.
        this.element = document.createElement('div');
        this.element.style.cssText = `
      position: fixed;
      top: 12px;
      left: 12px;
      display: flex;
      gap: 6px;
      align-items: flex-end;
      pointer-events: none;
      font-family: monospace;
      user-select: none;
    `;
        this.element.setAttribute('aria-label', 'Energy');
        document.body.appendChild(this.element);
        // Caixa de scan (topo-direita): vazia por padrão.
        this.scanBox = document.createElement('div');
        this.scanBox.style.cssText = `
      position: fixed;
      top: 12px;
      right: 12px;
      width: 148px;
      height: 24px;
      border: 2px solid rgba(224,224,224,0.85);
      background: #000;
      pointer-events: none;
      box-sizing: border-box;
      user-select: none;
    `;
        this.scanFill = document.createElement('div');
        this.scanFill.style.cssText = `
      height: 100%;
      width: 0%;
      background: transparent;
    `;
        this.scanLabel = document.createElement('div');
        this.scanLabel.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-family: monospace;
      font-size: 11px;
      letter-spacing: 1px;
      pointer-events: none;
    `;
        this.scanLabel.style.display = 'none';
        this.scanBox.appendChild(this.scanFill);
        this.scanBox.appendChild(this.scanLabel);
        document.body.appendChild(this.scanBox);
        // Barra inferior: paisagem, mira, objetivo. Maior que antes para
        // leitura em tela cheia (era 11px, quase ilegível).
        this.info = document.createElement('div');
        this.info.style.cssText = `
      position: fixed;
      left: 12px;
      bottom: 12px;
      color: rgba(224,224,224,0.92);
      font-family: monospace;
      font-size: 15px;
      line-height: 1.7;
      pointer-events: none;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.9);
      user-select: none;
    `;
        document.body.appendChild(this.info);
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
    injectBlinkStyle() {
        if (document.getElementById('hud-blink-style'))
            return;
        const style = document.createElement('style');
        style.id = 'hud-blink-style';
        style.textContent = `
      @keyframes hud-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
    `;
        document.head.appendChild(style);
    }
    setEnergy(energy) {
        const value = Math.max(0, Math.floor(energy));
        if (value === this.lastEnergy)
            return;
        this.lastEnergy = value;
        this.element.innerHTML = '';
        if (value === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'color: rgba(255,68,68,0.9); font-size: 12px;';
            empty.textContent = '—';
            empty.setAttribute('data-energy', 'true');
            this.element.appendChild(empty);
            return;
        }
        let rest = value;
        const icons = [];
        while (rest >= 15) {
            icons.push({ glyph: '●', color: '#ffcf3f', title: 'golden robot (15)' });
            rest -= 15;
        }
        while (rest >= 3) {
            icons.push({ glyph: '●', color: '#e8f4ff', title: 'robot (3)' });
            rest -= 3;
        }
        if (rest >= 2) {
            icons.push({ glyph: '■', color: '#9aa0a6', title: 'boulder (2)' });
            rest -= 2;
        }
        while (rest >= 1) {
            icons.push({ glyph: '▲', color: '#2ecc71', title: 'tree (1)' });
            rest -= 1;
        }
        for (const icon of icons) {
            const span = document.createElement('span');
            span.textContent = icon.glyph;
            span.title = `${icon.title} — total ${value}`;
            span.style.cssText = `
        color: ${icon.color};
        font-size: 15px;
        line-height: 1;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.9);
      `;
            this.element.appendChild(span);
        }
        this.element.setAttribute('aria-label', `Energy ${value}`);
    }
    ensureInfoLine(key) {
        let line = this.info.querySelector(`[data-${key}]`);
        if (!line) {
            line = document.createElement('div');
            line.setAttribute(`data-${key}`, 'true');
            this.info.appendChild(line);
        }
        return line;
    }
    setTarget(text) {
        this.ensureInfoLine('target').textContent = text;
    }
    setObjective(text) {
        this.ensureInfoLine('objective').textContent = text;
    }
    setLandscape(number) {
        this.ensureInfoLine('landscape').textContent = `Landscape ${String(number).padStart(4, '0')}`;
    }
    setWarning(level) {
        this.warningLevel = level;
        this.renderScan();
    }
    setMeanie(active) {
        this.meanieActive = active;
        this.renderScan();
    }
    renderScan() {
        const level = this.warningLevel;
        const meanie = this.meanieActive;
        // Borda magenta denuncia o Meanie mesmo sem scan cheio.
        this.scanBox.style.borderColor = meanie ? '#ff2d78' : 'rgba(224,224,224,0.85)';
        this.scanBox.style.boxShadow = meanie ? '0 0 8px rgba(255,45,120,0.8)' : 'none';
        this.scanFill.style.animation = '';
        if (level === 'none' && !meanie) {
            this.scanFill.style.width = '0%';
            this.scanFill.style.background = 'transparent';
            this.scanLabel.style.display = 'none';
            return;
        }
        if (meanie && level !== 'full') {
            // Meanie à espreita: caixa marcada, sem varredura cheia.
            this.scanFill.style.width = level === 'partial' ? '50%' : '100%';
            this.scanFill.style.background = '#ff2d78';
            this.scanLabel.style.display = 'flex';
            this.scanLabel.textContent = 'MEANIE';
            this.scanLabel.style.color = '#fff';
            return;
        }
        if (level === 'partial') {
            this.scanFill.style.width = '50%';
            this.scanFill.style.background = '#ffdf6b';
            this.scanLabel.style.display = 'none';
            return;
        }
        // full: varredura cheia, vermelha e piscando.
        this.scanFill.style.width = '100%';
        this.scanFill.style.background = '#ff4444';
        this.scanFill.style.animation = 'hud-blink 0.5s steps(2) infinite';
        this.scanLabel.style.display = 'flex';
        this.scanLabel.textContent = meanie ? 'MEANIE' : 'SCAN';
        this.scanLabel.style.color = '#fff';
    }
    showMessage(text) {
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
    clearMessage() {
        if (this.overlay?.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
    }
    // Mostra/esconde energia, scan, info e crosshair (ex.: escondidos
    // atrás do painel de início, visíveis no jogo).
    setVisible(visible) {
        const display = visible ? '' : 'none';
        this.element.style.display = visible ? 'flex' : display;
        this.scanBox.style.display = display;
        this.info.style.display = display;
        this.crosshair.style.display = display;
    }
    showStartPanel(onStart) {
        // Na tela de início (drone orbiting) o HUD fica escondido: sem
        // energia, scan, mira ou crosshair até o jogo começar.
        this.setVisible(false);
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
      <div style="margin-top: 12px; color: #ffdf6b;">CLICK OR PRESS ENTER TO PLAY</div>
    `;
        let dismissed = false;
        const start = () => {
            if (dismissed)
                return;
            dismissed = true;
            window.removeEventListener('keydown', onKey);
            panel.parentNode?.removeChild(panel);
            this.setVisible(true);
            onStart();
        };
        const onKey = (event) => {
            if (event.code === 'Enter')
                start();
        };
        panel.addEventListener('click', start);
        window.addEventListener('keydown', onKey);
        document.body.appendChild(panel);
    }
    showGameOverPanel(message, onRestart) {
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
    dispose() {
        this.clearMessage();
        for (const node of [this.element, this.scanBox, this.info]) {
            if (node.parentNode)
                node.parentNode.removeChild(node);
        }
        if (this.crosshair.parentNode) {
            this.crosshair.parentNode.removeChild(this.crosshair);
        }
    }
}
