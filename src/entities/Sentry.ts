import { Sentinel } from './Sentinel.js';

// A guardian entity. Behaves exactly like the Sentinel (rotating gaze,
// energy drain, landscape absorption) but stands on an ordinary square
// instead of a tower, and absorbing it is optional: worth 4 energy.
export class Sentry extends Sentinel {
  constructor(x: number, z: number) {
    super(x, z, 'sentry');
  }
}
