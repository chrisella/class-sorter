import { describe, it, expect } from 'vitest';
import { buildTargetSizes, buildClassTargetMap, calculateSizeCompliance } from './classSizeUtils';
import type { Class } from '../types';

function makeClass(id: string, targetSize = 10): Class {
  return { id, name: id, targetSize, createdAt: new Date() };
}

// ─── buildTargetSizes ────────────────────────────────────────────────────────

describe('buildTargetSizes', () => {
  it('returns empty array when classCount is 0', () => {
    expect(buildTargetSizes(30, 0)).toEqual([]);
  });

  it('distributes evenly when divisible', () => {
    expect(buildTargetSizes(30, 3)).toEqual([10, 10, 10]);
  });

  it('puts remainder in last slots', () => {
    // 10 students, 3 classes → [3, 4, 3]... no: baseSize=3, remainder=1
    // index >= classCount - remainder → index >= 2 → only index 2 gets +1
    expect(buildTargetSizes(10, 3)).toEqual([3, 3, 4]);
  });

  it('handles more remainder', () => {
    // 11 students, 3 classes → baseSize=3, remainder=2 → indices 1,2 get +1
    expect(buildTargetSizes(11, 3)).toEqual([3, 4, 4]);
  });

  it('handles single class', () => {
    expect(buildTargetSizes(15, 1)).toEqual([15]);
  });

  it('handles more classes than students', () => {
    const sizes = buildTargetSizes(2, 3);
    expect(sizes).toHaveLength(3);
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(2);
  });
});

// ─── buildClassTargetMap ─────────────────────────────────────────────────────

describe('buildClassTargetMap', () => {
  const classes = [makeClass('a'), makeClass('b'), makeClass('c')];

  it('distributes evenly without largerClassId', () => {
    const map = buildClassTargetMap(classes, 30);
    expect(map).toEqual({ a: 10, b: 10, c: 10 });
  });

  it('ignores unknown largerClassId', () => {
    const map = buildClassTargetMap(classes, 30, 'nonexistent');
    expect(map).toEqual({ a: 10, b: 10, c: 10 });
  });

  it('gives the larger class one extra student when there is a remainder', () => {
    // 10 students, 3 classes → baseSize=3, remainder=1
    // largerClassId='a' should get the extra
    const map = buildClassTargetMap(classes, 10, 'a');
    expect(map['a']).toBe(4);
    expect(map['b']).toBe(3);
    expect(map['c']).toBe(3);
  });

  it('returns equal sizes when no remainder even with largerClassId set', () => {
    const map = buildClassTargetMap(classes, 9, 'a');
    expect(map['a']).toBe(3);
    expect(map['b']).toBe(3);
    expect(map['c']).toBe(3);
  });
});

// ─── calculateSizeCompliance ─────────────────────────────────────────────────

describe('calculateSizeCompliance', () => {
  const classes = [makeClass('a', 10), makeClass('b', 10), makeClass('c', 10)];

  function makeAssignment(entries: [string, string][]): Map<string, string> {
    return new Map(entries);
  }

  it('reports isExact when assignment matches targets', () => {
    const assignment = makeAssignment([
      ...Array.from({ length: 10 }, (_, i) => [`s${i}`, 'a'] as [string, string]),
      ...Array.from({ length: 10 }, (_, i) => [`s${i + 10}`, 'b'] as [string, string]),
      ...Array.from({ length: 10 }, (_, i) => [`s${i + 20}`, 'c'] as [string, string]),
    ]);
    const result = calculateSizeCompliance(classes, assignment, 30);
    expect(result.isExact).toBe(true);
    expect(result.maxDeviation).toBe(0);
  });

  it('detects deviation', () => {
    // 11 in 'a', 9 in 'b', 10 in 'c' — target 10 each
    const assignment = makeAssignment([
      ...Array.from({ length: 11 }, (_, i) => [`s${i}`, 'a'] as [string, string]),
      ...Array.from({ length: 9 }, (_, i) => [`s${i + 11}`, 'b'] as [string, string]),
      ...Array.from({ length: 10 }, (_, i) => [`s${i + 20}`, 'c'] as [string, string]),
    ]);
    const result = calculateSizeCompliance(classes, assignment, 30);
    expect(result.isExact).toBe(false);
    expect(result.maxDeviation).toBe(1);
    expect(result.classDeviations['a']).toBe(1);
    expect(result.classDeviations['b']).toBe(1);
    expect(result.classDeviations['c']).toBe(0);
  });

  it('ignores students assigned to unknown classes', () => {
    const assignment = makeAssignment([['s1', 'unknown-class']]);
    const result = calculateSizeCompliance(classes, assignment, 1);
    expect(result.classActualSizes['a']).toBe(0);
  });
});
