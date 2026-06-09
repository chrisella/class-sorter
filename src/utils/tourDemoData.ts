import type { Student, Class, SourceClass } from '../types';
import { useStudentStore, useClassStore } from '../stores';

export const DEMO_DATA_KEY = 'class-sorter-demo-data';

const SC1 = 'demo-sc1';
const SC2 = 'demo-sc2';
const CLS1 = 'demo-cls1';
const CLS2 = 'demo-cls2';
const CLS3 = 'demo-cls3';

const s = (n: number) => `demo-s${n}`;
const now = new Date();

const demoSourceClasses: SourceClass[] = [
  { id: SC1, name: '5 Maple', color: 'amber', createdAt: now.toISOString() },
  { id: SC2, name: '5 Oak',   color: 'sky',   createdAt: now.toISOString() },
];

const demoClasses: Class[] = [
  { id: CLS1, name: '6A', targetSize: 6, teacherName: 'Ms Allen',  createdAt: now },
  { id: CLS2, name: '6B', targetSize: 6, teacherName: 'Mr Barnes', createdAt: now },
  { id: CLS3, name: '6C', targetSize: 6, teacherName: 'Mrs Cole',  createdAt: now },
];

function mk(
  n: number,
  name: string,
  gender: 'male' | 'female',
  sc: string,
  cls: string,
  extra: Partial<Student> = {}
): Student {
  return {
    id: s(n),
    name,
    gender,
    isEAL: false,
    behavior: 2,
    ability: 2,
    ehcp: false,
    send: false,
    monitoringSen: false,
    ppg: false,
    sl: false,
    sourceClassId: sc,
    mustBeWithStudentId: null,
    preferredFriends: [],
    keepApartFrom: [],
    assignedClassId: cls,
    createdAt: now,
    updatedAt: now,
    ...extra,
  };
}

const demoStudents: Student[] = [
  // 6A
  mk(1,  'Alice Brown',    'female', SC1, CLS1, { behavior: 1, ability: 3, preferredFriends: [s(4), s(6)] }),
  mk(2,  'Ben Carter',     'male',   SC1, CLS1, { behavior: 2, ability: 2 }),
  mk(3,  'Charlie Davis',  'male',   SC2, CLS1, { behavior: 3, ability: 1, preferredFriends: [s(7)] }),
  mk(4,  'Diana Evans',    'female', SC2, CLS1, { behavior: 1, ability: 3 }),
  mk(5,  'Ethan Foster',   'male',   SC1, CLS1, { isEAL: true, ability: 2 }),
  mk(6,  'Fiona Green',    'female', SC2, CLS1, { behavior: 2, ability: 2 }),
  // 6B
  mk(7,  'George Harris',  'male',   SC1, CLS2, { behavior: 3, ability: 1 }),
  mk(8,  'Hannah Irving',  'female', SC2, CLS2, { behavior: 1, ability: 3, preferredFriends: [s(6)] }),
  mk(9,  'Ivan James',     'male',   SC1, CLS2, { send: true, behavior: 2, keepApartFrom: [s(7)] }),
  mk(10, 'Julia Knight',   'female', SC1, CLS2, { behavior: 2, ability: 2 }),
  mk(11, 'Kevin Lee',      'male',   SC2, CLS2, { ability: 3 }),
  mk(12, 'Laura Martin',   'female', SC2, CLS2, { isEAL: true, behavior: 1 }),
  // 6C
  mk(13, 'Marcus Newman',  'male',   SC1, CLS3, { behavior: 2, ability: 2 }),
  mk(14, 'Nadia Oliver',   'female', SC2, CLS3, { ppg: true, ability: 1 }),
  mk(15, 'Oscar Parker',   'male',   SC1, CLS3, { ehcp: true, behavior: 1, ability: 1 }),
  mk(16, 'Priya Quinn',    'female', SC2, CLS3, { behavior: 3, ability: 3 }),
  mk(17, 'Ryan Scott',     'male',   SC2, CLS3, { behavior: 2, ability: 2 }),
  mk(18, 'Sophie Thomas',  'female', SC1, CLS3, { behavior: 1, ability: 3 }),
];

export function hasDemoData(): boolean {
  return localStorage.getItem(DEMO_DATA_KEY) === '1';
}

export function injectDemoData() {
  useStudentStore.setState({ students: demoStudents });
  useClassStore.setState({
    classes: demoClasses,
    sourceClasses: demoSourceClasses,
    lastSortingResult: null,
  });
  localStorage.setItem(DEMO_DATA_KEY, '1');
  window.dispatchEvent(new Event('demo-data-change'));
}

export function clearDemoData() {
  localStorage.removeItem(DEMO_DATA_KEY);
  useStudentStore.setState({ students: [] });
  useClassStore.setState({ classes: [], sourceClasses: [], lastSortingResult: null });
  window.dispatchEvent(new Event('demo-data-change'));
}
