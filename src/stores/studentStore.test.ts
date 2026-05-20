import { describe, it, expect, beforeEach } from 'vitest';
import { useStudentStore } from './studentStore';

beforeEach(() => {
  useStudentStore.setState({ students: [] });
  localStorage.clear();
});

function addStudent(name = 'Alice') {
  return useStudentStore.getState().addStudent({
    name,
    gender: 'female',
    isEAL: false,
    behavior: 2,
    ability: 2,
    ehcp: false,
    send: false,
    ppg: false,
    sl: false,
    mustBeWithStudentId: null,
    preferredFriends: [],
    keepApartFrom: [],
    sourceClassId: null,
  });
}

// ─── addStudent ───────────────────────────────────────────────────────────────

describe('addStudent', () => {
  it('adds a student and returns an id', () => {
    const id = addStudent('Bob');
    expect(id).toBeTruthy();
    expect(useStudentStore.getState().students).toHaveLength(1);
    expect(useStudentStore.getState().students[0].name).toBe('Bob');
  });

  it('initialises assignedClassId as null', () => {
    const id = addStudent();
    const student = useStudentStore.getState().getStudentById(id);
    expect(student?.assignedClassId).toBeNull();
  });
});

// ─── updateStudent ────────────────────────────────────────────────────────────

describe('updateStudent', () => {
  it('updates a simple field', () => {
    const id = addStudent('Carol');
    useStudentStore.getState().updateStudent(id, { name: 'Caroline' });
    expect(useStudentStore.getState().getStudentById(id)?.name).toBe('Caroline');
  });
});

// ─── deleteStudent ────────────────────────────────────────────────────────────

describe('deleteStudent', () => {
  it('removes student from the list', () => {
    const id = addStudent();
    useStudentStore.getState().deleteStudent(id);
    expect(useStudentStore.getState().students).toHaveLength(0);
  });

  it('removes deleted student from other students\' preferredFriends', () => {
    const idA = addStudent('A');
    const idB = addStudent('B');
    useStudentStore.getState().updateStudent(idA, { preferredFriends: [idB] });
    useStudentStore.getState().deleteStudent(idB);
    expect(useStudentStore.getState().getStudentById(idA)?.preferredFriends).not.toContain(idB);
  });

  it('removes deleted student from keepApartFrom lists', () => {
    const idA = addStudent('A');
    const idB = addStudent('B');
    useStudentStore.getState().updateStudent(idA, { keepApartFrom: [idB] });
    useStudentStore.getState().deleteStudent(idB);
    expect(useStudentStore.getState().getStudentById(idA)?.keepApartFrom).not.toContain(idB);
  });

  it('clears mustBeWithStudentId when the paired student is deleted', () => {
    const idA = addStudent('A');
    const idB = addStudent('B');
    useStudentStore.getState().setMustBeWithPair(idA, idB);
    useStudentStore.getState().deleteStudent(idB);
    expect(useStudentStore.getState().getStudentById(idA)?.mustBeWithStudentId).toBeNull();
  });
});

// ─── setMustBeWithPair ────────────────────────────────────────────────────────

describe('setMustBeWithPair', () => {
  it('creates a bidirectional pair', () => {
    const idA = addStudent('A');
    const idB = addStudent('B');
    const result = useStudentStore.getState().setMustBeWithPair(idA, idB);
    expect(result.success).toBe(true);
    expect(useStudentStore.getState().getStudentById(idA)?.mustBeWithStudentId).toBe(idB);
    expect(useStudentStore.getState().getStudentById(idB)?.mustBeWithStudentId).toBe(idA);
  });

  it('rejects pairing a student with themselves', () => {
    const idA = addStudent('A');
    const result = useStudentStore.getState().setMustBeWithPair(idA, idA);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects pairing when students have a keep-apart relationship', () => {
    const idA = addStudent('A');
    const idB = addStudent('B');
    useStudentStore.getState().updateStudent(idA, { keepApartFrom: [idB] });
    const result = useStudentStore.getState().setMustBeWithPair(idA, idB);
    expect(result.success).toBe(false);
  });

  it('clears pair when targetId is null', () => {
    const idA = addStudent('A');
    const idB = addStudent('B');
    useStudentStore.getState().setMustBeWithPair(idA, idB);
    useStudentStore.getState().setMustBeWithPair(idA, null);
    expect(useStudentStore.getState().getStudentById(idA)?.mustBeWithStudentId).toBeNull();
    expect(useStudentStore.getState().getStudentById(idB)?.mustBeWithStudentId).toBeNull();
  });

  it('detaches previous partner when re-pairing', () => {
    const idA = addStudent('A');
    const idB = addStudent('B');
    const idC = addStudent('C');
    useStudentStore.getState().setMustBeWithPair(idA, idB);
    useStudentStore.getState().setMustBeWithPair(idA, idC);
    expect(useStudentStore.getState().getStudentById(idB)?.mustBeWithStudentId).toBeNull();
    expect(useStudentStore.getState().getStudentById(idA)?.mustBeWithStudentId).toBe(idC);
    expect(useStudentStore.getState().getStudentById(idC)?.mustBeWithStudentId).toBe(idA);
  });
});

// ─── assignStudentToClass / clearAllAssignments ───────────────────────────────

describe('assignStudentToClass', () => {
  it('assigns a student to a class', () => {
    const id = addStudent();
    useStudentStore.getState().assignStudentToClass(id, 'class-1');
    expect(useStudentStore.getState().getStudentById(id)?.assignedClassId).toBe('class-1');
  });

  it('unassigns when passed null', () => {
    const id = addStudent();
    useStudentStore.getState().assignStudentToClass(id, 'class-1');
    useStudentStore.getState().assignStudentToClass(id, null);
    expect(useStudentStore.getState().getStudentById(id)?.assignedClassId).toBeNull();
  });
});

describe('clearAllAssignments', () => {
  it('resets all assignedClassId to null', () => {
    const idA = addStudent('A');
    const idB = addStudent('B');
    useStudentStore.getState().assignStudentToClass(idA, 'c1');
    useStudentStore.getState().assignStudentToClass(idB, 'c2');
    useStudentStore.getState().clearAllAssignments();
    expect(useStudentStore.getState().getStudentById(idA)?.assignedClassId).toBeNull();
    expect(useStudentStore.getState().getStudentById(idB)?.assignedClassId).toBeNull();
  });
});

// ─── importStudents ───────────────────────────────────────────────────────────

describe('importStudents', () => {
  it('imports students and resolves preferred friend names to ids', () => {
    useStudentStore.getState().importStudents([
      { name: 'Alice', gender: 'female', isEAL: false, behavior: 2, ability: 2, ehcp: false, send: false, ppg: false, sl: false, preferredFriendNames: ['Bob'], keepApartFromNames: [] },
      { name: 'Bob', gender: 'male', isEAL: false, behavior: 2, ability: 2, ehcp: false, send: false, ppg: false, sl: false, preferredFriendNames: [], keepApartFromNames: [] },
    ]);
    const { students } = useStudentStore.getState();
    expect(students).toHaveLength(2);
    const alice = students.find((s) => s.name === 'Alice');
    const bob = students.find((s) => s.name === 'Bob');
    expect(alice?.preferredFriends).toContain(bob?.id);
  });

  it('resolves must-be-with by name', () => {
    useStudentStore.getState().importStudents([
      { name: 'Alice', gender: 'female', isEAL: false, behavior: 2, ability: 2, ehcp: false, send: false, ppg: false, sl: false, mustBeWithStudentName: 'Bob', preferredFriendNames: [], keepApartFromNames: [] },
      { name: 'Bob', gender: 'male', isEAL: false, behavior: 2, ability: 2, ehcp: false, send: false, ppg: false, sl: false, preferredFriendNames: [], keepApartFromNames: [] },
    ]);
    const { students } = useStudentStore.getState();
    const alice = students.find((s) => s.name === 'Alice');
    const bob = students.find((s) => s.name === 'Bob');
    expect(alice?.mustBeWithStudentId).toBe(bob?.id);
    expect(bob?.mustBeWithStudentId).toBe(alice?.id);
  });

  it('throws when must-be-with references unknown student', () => {
    expect(() =>
      useStudentStore.getState().importStudents([
        { name: 'Alice', gender: 'female', isEAL: false, behavior: 2, ability: 2, ehcp: false, send: false, ppg: false, sl: false, mustBeWithStudentName: 'Nobody', preferredFriendNames: [], keepApartFromNames: [] },
      ])
    ).toThrow('Nobody');
  });
});
