import { describe, it, expect } from 'vitest';
import { squarify, LayoutBounds } from '../src/layout/treemap.ts';

describe('Squarified Treemap Layout Engine', () => {
  it('returns empty array for empty inputs or zero area', () => {
    const bounds: LayoutBounds = { x: 0, z: 0, width: 100, depth: 100 };
    expect(squarify([], bounds)).toEqual([]);
    expect(squarify([{ path: 'a.ts', name: 'a.ts', weight: 10 }], { x: 0, z: 0, width: 0, depth: 100 })).toEqual([]);
  });

  it('conserves area across nodes', () => {
    const nodes = [
      { path: 'main.ts', name: 'main.ts', weight: 100 },
      { path: 'util.ts', name: 'util.ts', weight: 50 },
      { path: 'test.ts', name: 'test.ts', weight: 50 },
    ];
    const bounds: LayoutBounds = { x: 0, z: 0, width: 100, depth: 100 };
    const rects = squarify(nodes, bounds, 0.0); // 0 margin to test pure area math

    expect(rects.length).toBe(3);

    const totalRectArea = rects.reduce((sum, r) => sum + r.width * r.depth, 0);
    const boundsArea = bounds.width * bounds.depth;

    // Within floating point precision
    expect(Math.abs(totalRectArea - boundsArea)).toBeLessThan(0.01);
  });

  it('produces non-overlapping bounding boxes', () => {
    const nodes = [
      { path: 'a.ts', name: 'a.ts', weight: 80 },
      { path: 'b.ts', name: 'b.ts', weight: 40 },
      { path: 'c.ts', name: 'c.ts', weight: 30 },
      { path: 'd.ts', name: 'd.ts', weight: 15 },
      { path: 'e.ts', name: 'e.ts', weight: 10 },
    ];
    const bounds: LayoutBounds = { x: 0, z: 0, width: 100, depth: 100 };
    const rects = squarify(nodes, bounds, 0.5);

    expect(rects.length).toBe(5);

    // Pairwise overlap check
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const r1 = rects[i];
        const r2 = rects[j];

        const xOverlap = Math.max(0, Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x));
        const zOverlap = Math.max(0, Math.min(r1.z + r1.depth, r2.z + r2.depth) - Math.max(r1.z, r2.z));

        // Overlap area should be virtually zero
        const overlapArea = xOverlap * zOverlap;
        expect(overlapArea).toBeLessThan(0.001);
      }
    }
  });
});
