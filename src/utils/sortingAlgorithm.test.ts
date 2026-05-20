import { describe, it, expect } from 'vitest';
import {
  runSorting,
  collectConstraintViolations,
  buildAssignmentFromStudents,
  getAssignmentInsights,
  calculateStudentSatisfaction,
} from './sortingAlgorithm';
import type { Student, Class, SortingConfiguration } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStudent(overrides: Partial<Student> & { id: string; name: string }): Student {
  return {
    gender: 'male',
    isEAL: false,
    behavior: 2,
    ability: 2,
    ehcp: false,
    send: false,
    ppg: false,
    sl: false,
    sourceClassId: null,
    mustBeWithStudentId: null,
    preferredFriends: [],
    keepApartFrom: [],
    assignedClassId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeClass(id: string, targetSize = 10): Class {
  return { id, name: id, targetSize, createdAt: new Date() };
}

function makeConfig(overrides: Partial<SortingConfiguration> = {}): SortingConfiguration {
  return {
    numberOfClasses: 2,
    classSizeMode: 'flexible',
    maxIterations: 500,
    largerClassId: null,
    priorityWeights: {
      friendPreference: 0.6,
      classSizeBalance: 0.8,
      genderBalance: 0.2,
      ealBalance: 0.2,
      behaviorBalance: 0.2,
      abilityBalance: 0.2,
      ehcpBalance: 0.2,
      sendBalance: 0.2,
      ppgBalance: 0.2,
      slBalance: 0.2,
      sourceClassBalance: 0.2,
    },
    ...overrides,
  };
}

// ─── buildAssignmentFromStudents ─────────────────────────────────────────────

describe('buildAssignmentFromStudents', () => {
  it('maps students with assigned classes', () => {
    const students = [
      makeStudent({ id: 's1', name: 'A', assignedClassId: 'c1' }),
      makeStudent({ id: 's2', name: 'B', assignedClassId: 'c2' }),
    ];
    const map = buildAssignmentFromStudents(students);
    expect(map.get('s1')).toBe('c1');
    expect(map.get('s2')).toBe('c2');
  });

  it('skips students without assigned class', () => {
    const students = [makeStudent({ id: 's1', name: 'A', assignedClassId: null })];
    const map = buildAssignmentFromStudents(students);
    expect(map.size).toBe(0);
  });
});

// ─── calculateStudentSatisfaction ────────────────────────────────────────────

describe('calculateStudentSatisfaction', () => {
  it('returns 100 when student has no preferred friends', () => {
    const student = makeStudent({ id: 's1', name: 'A', assignedClassId: 'c1' });
    const result = calculateStudentSatisfaction(student, 'c1', [student]);
    expect(result.score).toBe(100);
    expect(result.hasKeepApartViolation).toBe(false);
    expect(result.hasMustBeWithViolation).toBe(false);
  });

  it('scores proportional to friends in same class', () => {
    const s1 = makeStudent({ id: 's1', name: 'A', assignedClassId: 'c1', preferredFriends: ['s2', 's3'] });
    const s2 = makeStudent({ id: 's2', name: 'B', assignedClassId: 'c1' });
    const s3 = makeStudent({ id: 's3', name: 'C', assignedClassId: 'c2' });
    const result = calculateStudentSatisfaction(s1, 'c1', [s1, s2, s3]);
    expect(result.score).toBe(50); // 1 of 2 friends in class
    expect(result.preferredFriendsInClass).toBe(1);
  });

  it('detects keep-apart violation', () => {
    const s1 = makeStudent({ id: 's1', name: 'A', assignedClassId: 'c1', keepApartFrom: ['s2'] });
    const s2 = makeStudent({ id: 's2', name: 'B', assignedClassId: 'c1' });
    const result = calculateStudentSatisfaction(s1, 'c1', [s1, s2]);
    expect(result.hasKeepApartViolation).toBe(true);
  });

  it('detects must-be-with violation', () => {
    const s1 = makeStudent({ id: 's1', name: 'A', assignedClassId: 'c1', mustBeWithStudentId: 's2' });
    const s2 = makeStudent({ id: 's2', name: 'B', assignedClassId: 'c2' });
    const result = calculateStudentSatisfaction(s1, 'c1', [s1, s2]);
    expect(result.hasMustBeWithViolation).toBe(true);
  });
});

// ─── collectConstraintViolations ─────────────────────────────────────────────

describe('collectConstraintViolations', () => {
  const classA = makeClass('c1');
  const classB = makeClass('c2');

  it('returns no violations for a clean assignment', () => {
    const students = [
      makeStudent({ id: 's1', name: 'A' }),
      makeStudent({ id: 's2', name: 'B' }),
    ];
    const assignment = new Map([['s1', 'c1'], ['s2', 'c2']]);
    const violations = collectConstraintViolations(students, [classA, classB], assignment, 'flexible', 'manual_edit');
    expect(violations.filter((v) => v.type !== 'class_size')).toHaveLength(0);
  });

  it('detects keep-apart violation when students share a class', () => {
    const s1 = makeStudent({ id: 's1', name: 'A', keepApartFrom: ['s2'] });
    const s2 = makeStudent({ id: 's2', name: 'B', keepApartFrom: [] });
    const assignment = new Map([['s1', 'c1'], ['s2', 'c1']]);
    const violations = collectConstraintViolations([s1, s2], [classA, classB], assignment, 'flexible', 'manual_edit');
    const keepApart = violations.filter((v) => v.type === 'keep_apart');
    expect(keepApart).toHaveLength(1);
    expect(keepApart[0].studentId).toBe('s1');
    expect(keepApart[0].severity).toBe('hard');
  });

  it('deduplicates bidirectional keep-apart violations', () => {
    const s1 = makeStudent({ id: 's1', name: 'A', keepApartFrom: ['s2'] });
    const s2 = makeStudent({ id: 's2', name: 'B', keepApartFrom: ['s1'] });
    const assignment = new Map([['s1', 'c1'], ['s2', 'c1']]);
    const violations = collectConstraintViolations([s1, s2], [classA, classB], assignment, 'flexible', 'manual_edit');
    expect(violations.filter((v) => v.type === 'keep_apart')).toHaveLength(1);
  });

  it('detects must-be-with violation when pair is separated', () => {
    const s1 = makeStudent({ id: 's1', name: 'A', mustBeWithStudentId: 's2' });
    const s2 = makeStudent({ id: 's2', name: 'B', mustBeWithStudentId: 's1' });
    const assignment = new Map([['s1', 'c1'], ['s2', 'c2']]);
    const violations = collectConstraintViolations([s1, s2], [classA, classB], assignment, 'flexible', 'manual_edit');
    const mustBe = violations.filter((v) => v.type === 'must_be_with');
    expect(mustBe).toHaveLength(1);
    expect(mustBe[0].severity).toBe('hard');
  });

  it('does NOT flag must-be-with when pair is together', () => {
    const s1 = makeStudent({ id: 's1', name: 'A', mustBeWithStudentId: 's2' });
    const s2 = makeStudent({ id: 's2', name: 'B', mustBeWithStudentId: 's1' });
    const assignment = new Map([['s1', 'c1'], ['s2', 'c1']]);
    const violations = collectConstraintViolations([s1, s2], [classA, classB], assignment, 'flexible', 'manual_edit');
    expect(violations.filter((v) => v.type === 'must_be_with')).toHaveLength(0);
  });

  it('reports class size warning in strict mode for >0 deviation', () => {
    const assignment = new Map([['s1', 'c1']]);
    const violations = collectConstraintViolations(
      [makeStudent({ id: 's1', name: 'A' })],
      [makeClass('c1', 5), makeClass('c2', 5)],
      assignment,
      'strict',
      'manual_edit'
    );
    const sizeViolations = violations.filter((v) => v.type === 'class_size');
    expect(sizeViolations.length).toBeGreaterThan(0);
    expect(sizeViolations[0].severity).toBe('warning');
  });
});

// ─── getAssignmentInsights ────────────────────────────────────────────────────

describe('getAssignmentInsights', () => {
  it('categorises violations by type', () => {
    const s1 = makeStudent({ id: 's1', name: 'A', assignedClassId: 'c1', keepApartFrom: ['s2'] });
    const s2 = makeStudent({ id: 's2', name: 'B', assignedClassId: 'c1' });
    const insights = getAssignmentInsights([s1, s2], [makeClass('c1'), makeClass('c2')], 'flexible');
    expect(insights.blacklistViolations).toHaveLength(1);
    expect(insights.mustBeWithViolations).toHaveLength(0);
  });
});

// ─── runSorting (constraint invariants) ──────────────────────────────────────

describe('runSorting', () => {
  const makeStudents = (count: number) =>
    Array.from({ length: count }, (_, i) => makeStudent({ id: `s${i}`, name: `Student ${i}` }));

  it('assigns every student to a class (flexible mode)', async () => {
    const students = makeStudents(6);
    const classes = [makeClass('c1', 3), makeClass('c2', 3)];
    const result = await runSorting(students, classes, makeConfig({ classSizeMode: 'flexible' }));
    expect(Object.keys(result.assignments)).toHaveLength(6);
    students.forEach((s) => expect(result.assignments[s.id]).toBeTruthy());
  }, 10000);

  it('assigns every student to a class (strict mode)', async () => {
    const students = makeStudents(6);
    const classes = [makeClass('c1', 3), makeClass('c2', 3)];
    const result = await runSorting(students, classes, makeConfig({ classSizeMode: 'strict' }));
    expect(Object.keys(result.assignments)).toHaveLength(6);
    students.forEach((s) => expect(result.assignments[s.id]).toBeTruthy());
  }, 10000);

  it('never places keep-apart students in the same class (flexible)', async () => {
    const s1 = makeStudent({ id: 's1', name: 'A', keepApartFrom: ['s2'] });
    const s2 = makeStudent({ id: 's2', name: 'B', keepApartFrom: [] });
    const others = makeStudents(4).map((s, i) => ({ ...s, id: `o${i}`, name: `Other ${i}` }));
    const students = [s1, s2, ...others];
    const classes = [makeClass('c1', 3), makeClass('c2', 3)];
    const result = await runSorting(students, classes, makeConfig({ classSizeMode: 'flexible' }));
    expect(result.assignments['s1']).not.toBe(result.assignments['s2']);
  }, 10000);

  it('always places must-be-with pair in same class (flexible)', async () => {
    const s1 = makeStudent({ id: 's1', name: 'A', mustBeWithStudentId: 's2' });
    const s2 = makeStudent({ id: 's2', name: 'B', mustBeWithStudentId: 's1' });
    const others = makeStudents(4).map((s, i) => ({ ...s, id: `o${i}`, name: `Other ${i}` }));
    const students = [s1, s2, ...others];
    const classes = [makeClass('c1', 3), makeClass('c2', 3)];
    const result = await runSorting(students, classes, makeConfig({ classSizeMode: 'flexible' }));
    expect(result.assignments['s1']).toBe(result.assignments['s2']);
  }, 10000);

  it('strict mode produces exact class sizes', async () => {
    const students = makeStudents(6);
    const classes = [makeClass('c1', 3), makeClass('c2', 3)];
    const result = await runSorting(students, classes, makeConfig({ classSizeMode: 'strict' }));
    expect(result.sizeCompliance.isExact).toBe(true);
  }, 10000);
});
