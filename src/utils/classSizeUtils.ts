import type { Class, SizeCompliance } from '../types';

export function buildTargetSizes(totalStudents: number, classCount: number): number[] {
  if (classCount <= 0) return [];

  const baseSize = Math.floor(totalStudents / classCount);
  const remainder = totalStudents % classCount;

  return Array.from({ length: classCount }, (_, index) =>
    baseSize + (index >= classCount - remainder ? 1 : 0)
  );
}

export function buildClassTargetMap(
  classes: Class[],
  totalStudents: number,
  largerClassId?: string | null
): Record<string, number> {
  if (!largerClassId || !classes.some((c) => c.id === largerClassId)) {
    const targetSizes = buildTargetSizes(totalStudents, classes.length);
    return classes.reduce<Record<string, number>>((acc, cls, index) => {
      acc[cls.id] = targetSizes[index] ?? 0;
      return acc;
    }, {});
  }

  const baseSize = Math.floor(totalStudents / classes.length);
  const remainder = totalStudents % classes.length;
  const map: Record<string, number> = {};
  classes.forEach((cls) => { map[cls.id] = baseSize; });

  let extrasLeft = remainder;
  if (extrasLeft > 0) {
    map[largerClassId] = baseSize + 1;
    extrasLeft--;
  }
  for (let i = classes.length - 1; i >= 0 && extrasLeft > 0; i--) {
    const cls = classes[i];
    if (cls && map[cls.id] === baseSize) {
      map[cls.id] = baseSize + 1;
      extrasLeft--;
    }
  }
  return map;
}

export function calculateSizeCompliance(
  classes: Class[],
  assignment: Map<string, string>,
  totalStudents: number,
  largerClassId?: string | null
): SizeCompliance {
  const classTargets = buildClassTargetMap(classes, totalStudents, largerClassId);
  const classActualSizes = classes.reduce<Record<string, number>>((acc, cls) => {
    acc[cls.id] = 0;
    return acc;
  }, {});

  assignment.forEach((classId) => {
    if (classActualSizes[classId] !== undefined) {
      classActualSizes[classId] += 1;
    }
  });

  const classDeviations = classes.reduce<Record<string, number>>((acc, cls) => {
    acc[cls.id] = Math.abs((classActualSizes[cls.id] ?? 0) - (classTargets[cls.id] ?? 0));
    return acc;
  }, {});

  const actualSizes = classes.map((cls) => classActualSizes[cls.id] ?? 0);
  const targetSizes = classes.map((cls) => classTargets[cls.id] ?? 0);

  return {
    targetSizes,
    actualSizes,
    isExact: classes.every((cls) => (classActualSizes[cls.id] ?? 0) === (classTargets[cls.id] ?? 0)),
    maxDeviation: classes.reduce(
      (max, cls) => Math.max(max, classDeviations[cls.id] ?? 0),
      0
    ),
    classTargets,
    classActualSizes,
    classDeviations,
  };
}
