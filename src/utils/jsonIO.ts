import type { Student, Class, SortingConfiguration } from '../types';

interface AppState {
  schemaVersion: 1;
  classes: Class[];
  sortingConfig: SortingConfiguration;
  students: Student[];
}

export function exportState(
  students: Student[],
  classes: Class[],
  sortingConfig: SortingConfiguration
): void {
  const state: AppState = {
    schemaVersion: 1,
    classes,
    sortingConfig,
    students,
  };

  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'class-sorter.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateAndParseState(raw: unknown): AppState {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid file: not a JSON object.');
  }
  const obj = raw as Record<string, unknown>;

  if (obj.schemaVersion !== 1) {
    throw new Error('Unsupported schema version. Please export a fresh file.');
  }
  if (!Array.isArray(obj.students)) {
    throw new Error('Invalid file: missing students array.');
  }
  if (!Array.isArray(obj.classes)) {
    throw new Error('Invalid file: missing classes array.');
  }
  if (typeof obj.sortingConfig !== 'object' || obj.sortingConfig === null) {
    throw new Error('Invalid file: missing sortingConfig.');
  }

  return obj as unknown as AppState;
}
