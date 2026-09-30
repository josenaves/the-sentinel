import { describe, it, expect } from 'vitest';
import { transferFlightDuration, transferFlightPose, transferShellScale, type FlightPoint } from '../../src/rendering/transferFlight.js';

const from: FlightPoint = { x: 0, y: 6, z: 0 };
const to: FlightPoint = { x: 20, y: 10, z: 0 };
const look: FlightPoint = { x: 0, y: 0, z: -1 };

function pose(progress: number): { pos: FlightPoint; lookAt: FlightPoint } {
  const pos: FlightPoint = { x: 0, y: 0, z: 0 };
  const lookAt: FlightPoint = { x: 0, y: 0, z: 0 };
  transferFlightPose(from, to, look, progress, pos, lookAt);
  return { pos, lookAt };
}

describe('transferFlight', () => {
  it('should scale duration with distance within bounds', () => {
    const short = transferFlightDuration(from, { x: 4, y: 6, z: 0 });
    const long = transferFlightDuration(from, { x: 200, y: 6, z: 0 });
    expect(short).toBeGreaterThanOrEqual(0.45);
    expect(long).toBeLessThanOrEqual(0.9);
    expect(long).toBeGreaterThan(short);
  });

  it('should start at the old eye and end at the new one', () => {
    const start = pose(0);
    expect(start.pos.x).toBeCloseTo(from.x, 5);
    expect(start.pos.y).toBeCloseTo(from.y, 5);
    const end = pose(1);
    expect(end.pos.x).toBeCloseTo(to.x, 5);
    expect(end.pos.y).toBeCloseTo(to.y, 5);
  });

  it('should arc above the straight line mid-flight', () => {
    const mid = pose(0.5);
    expect(mid.pos.x).toBeCloseTo(10, 5);
    expect(mid.pos.y).toBeGreaterThan(8);
  });

  it('should look at the destination shell first, then blend to first-person', () => {
    const early = pose(0.2);
    expect(early.lookAt.x).toBeCloseTo(to.x, 5);
    expect(early.lookAt.y).toBeCloseTo(to.y - 1, 5);
    const end = pose(1);
    expect(end.lookAt.x).toBeCloseTo(to.x + look.x, 5);
    expect(end.lookAt.y).toBeCloseTo(to.y + look.y, 5);
    expect(end.lookAt.z).toBeCloseTo(to.z + look.z, 5);
  });
});

describe('transferShellScale', () => {
  it('should be hidden at both ends, full mid-flight', () => {
    expect(transferShellScale(0)).toBe(0);
    expect(transferShellScale(1)).toBe(0);
    expect(transferShellScale(0.5)).toBe(1);
  });

  it('should grow then shrink monotonically on each slope', () => {
    expect(transferShellScale(0.1)).toBeGreaterThan(0);
    expect(transferShellScale(0.1)).toBeLessThan(transferShellScale(0.2));
    expect(transferShellScale(0.9)).toBeGreaterThan(0);
    expect(transferShellScale(0.9)).toBeLessThan(transferShellScale(0.85));
  });
});
