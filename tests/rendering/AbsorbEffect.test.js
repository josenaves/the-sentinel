import { describe, it, expect } from 'vitest';
import { AbsorbEffect } from '../../src/rendering/AbsorbEffect.js';
describe('AbsorbEffect', () => {
    it('should activate fragments on spawn', () => {
        const effect = new AbsorbEffect();
        expect(effect.activeCount()).toBe(0);
        effect.spawn(0, 4, 0, 0x2ecc71);
        expect(effect.activeCount()).toBe(8);
        effect.dispose();
    });
    it('should expire fragments after their lifetime', () => {
        const effect = new AbsorbEffect();
        effect.spawn(0, 4, 0, 0x888888);
        effect.update(0.05);
        expect(effect.activeCount()).toBe(8);
        for (let i = 0; i < 10; i++)
            effect.update(0.05);
        expect(effect.activeCount()).toBe(0);
        effect.dispose();
    });
    it('should write live matrices while active and zero them when done', () => {
        const effect = new AbsorbEffect();
        effect.spawn(0, 4, 0, 0xd6dde5);
        effect.update(0.05);
        const live = effect.getMesh().instanceMatrix.array.slice(0, 16);
        expect(Array.from(live).some((value) => value !== 0)).toBe(true);
        for (let i = 0; i < 10; i++)
            effect.update(0.05);
        const dead = effect.getMesh().instanceMatrix.array;
        const scalesZero = Array.from({ length: 64 }, (_, i) => dead[i * 16] === 0 && dead[i * 16 + 5] === 0 && dead[i * 16 + 10] === 0);
        expect(scalesZero.every(Boolean)).toBe(true);
        effect.dispose();
    });
    it('should reuse pool slots without growing', () => {
        const effect = new AbsorbEffect();
        for (let i = 0; i < 10; i++)
            effect.spawn(i, 4, 0, 0xffffff);
        expect(effect.activeCount()).toBeLessThanOrEqual(64);
        expect(effect.getMesh().count).toBe(64);
        effect.dispose();
    });
});
