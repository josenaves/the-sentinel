export const OBJECT_ENERGY = {
    empty: 0,
    tree: 1,
    boulder: 2,
    robot: 3,
    sentry: 4,
    sentinel: 4,
};
export function createCell(height = 0, object = 'empty', stack = 0) {
    return { height, object, stack };
}
export function getObjectEnergy(object) {
    return OBJECT_ENERGY[object];
}
