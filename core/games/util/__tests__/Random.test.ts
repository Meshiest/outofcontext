import { describe, it, expect } from 'vitest';
import { gauss } from '../Random';

describe('Random.gauss', () => {
  it('stays approximately within [-1, 1] with default parameters', () => {
    for (let i = 0; i < 5000; i++) {
      const v = gauss();
      // The sum-of-12 approximation is bounded exactly by [-2, 2] but overwhelmingly in [-1, 1].
      expect(v).toBeGreaterThanOrEqual(-2);
      expect(v).toBeLessThanOrEqual(2);
    }
  });

  it('shifts and scales to approximately [3, 7] for gauss(2, 5)', () => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 5000; i++) {
      const v = gauss(2, 5);
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    // Centered on 5, spread by 2; extremes are rare but bounded.
    expect(min).toBeGreaterThanOrEqual(1);
    expect(max).toBeLessThanOrEqual(9);
    expect(min).toBeLessThan(5);
    expect(max).toBeGreaterThan(5);
  });

  it('has a sample mean close to the middle parameter', () => {
    const n = 20000;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += gauss(1, 5);
    const mean = sum / n;
    expect(Math.abs(mean - 5)).toBeLessThan(0.1);
  });
});
