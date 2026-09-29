export type CellObject = 'empty' | 'tree' | 'boulder' | 'robot' | 'sentry' | 'sentinel';

export const OBJECT_ENERGY: Record<CellObject, number> = {
  empty: 0,
  tree: 1,
  boulder: 2,
  robot: 3,
  sentry: 4,
  sentinel: 4,
};

export interface Cell {
  height: number;
  object: CellObject;
  stack: number;
}

export function createCell(height: number = 0, object: CellObject = 'empty', stack = 0): Cell {
  return { height, object, stack };
}

export function getObjectEnergy(object: CellObject): number {
  return OBJECT_ENERGY[object];
}