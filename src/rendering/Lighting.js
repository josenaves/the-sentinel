import { AmbientLight, DirectionalLight, Fog, Color } from 'three';
export function createLighting() {
    const ambient = new AmbientLight(0xffffff, 0.5);
    const directional = new DirectionalLight(0xffffff, 1);
    directional.position.set(50, 100, 50);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 1;
    directional.shadow.camera.far = 200;
    directional.shadow.camera.left = -100;
    directional.shadow.camera.right = 100;
    directional.shadow.camera.top = 100;
    directional.shadow.camera.bottom = -100;
    const fog = new Fog(0x87ceeb, 40, 190);
    return { ambient, directional, fog };
}
