export interface GameState {
  elapsedTime: number;
  player: {
    x: number;
    y: number;
    z: number;
    rotation: number;
    pitch: number;
  };
}

export function createInitialGameState(): GameState {
  return {
    elapsedTime: 0,
    player: {
      x: 0,
      y: 0,
      z: 0,
      rotation: 0,
      pitch: 0,
    },
  };
}