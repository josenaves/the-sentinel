export function createInitialGameState() {
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
