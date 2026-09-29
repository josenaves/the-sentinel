import { Game } from './core/Game.js';
import { HUD } from './ui/HUD.js';
const hud = new HUD();
const game = new Game(hud);
window.addEventListener('beforeunload', () => {
    game.dispose();
    hud.dispose();
});
