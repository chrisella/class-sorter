import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Class, SortingConfiguration, SortingResult, SourceClass } from '../types';
import { buildTargetSizes } from '../utils/classSizeUtils';
import { ALL_SOURCE_CLASS_COLORS, type SourceClassColor } from '../utils/sourceClassColors';

interface ClassState {
  classes: Class[];
  sourceClasses: SourceClass[];
  sortingConfig: SortingConfiguration;
  lastSortingResult: SortingResult | null;

  addClass: (name: string, targetSize: number, teacherName?: string) => string;
  updateClass: (id: string, updates: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  deleteAllClasses: () => void;
  getClassById: (id: string) => Class | undefined;

  addSourceClass: (name: string, color?: SourceClassColor | null) => string;
  updateSourceClass: (id: string, updates: Partial<Pick<SourceClass, 'name' | 'color'>>) => void;
  deleteSourceClass: (id: string, studentCount: number) => { success: boolean; error?: string };
  getSourceClassById: (id: string) => SourceClass | undefined;

  setSortingConfig: (config: Partial<SortingConfiguration>) => void;
  setLargerClassId: (id: string | null) => void;
  setLastSortingResult: (result: SortingResult | null) => void;

  generateDefaultClasses: (count: number, totalStudents: number) => void;
}

const defaultSortingConfig: SortingConfiguration = {
  numberOfClasses: 3,
  classSizeMode: 'strict',
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
  maxIterations: 10000,
  largerClassId: null,
};

export const useClassStore = create<ClassState>()(
  persist(
    (set, get) => ({
      classes: [],
      sourceClasses: [],
      sortingConfig: defaultSortingConfig,
      lastSortingResult: null,

      addClass: (name, targetSize, teacherName) => {
        const id = uuidv4();
        const newClass: Class = {
          id,
          name,
          targetSize,
          teacherName,
          createdAt: new Date(),
        };
        set((state) => ({
          classes: [...state.classes, newClass],
        }));
        return id;
      },

      updateClass: (id, updates) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteClass: (id) => {
        set((state) => ({
          classes: state.classes.filter((c) => c.id !== id),
          sortingConfig:
            state.sortingConfig.largerClassId === id
              ? { ...state.sortingConfig, largerClassId: null }
              : state.sortingConfig,
        }));
      },

      deleteAllClasses: () => {
        set({ classes: [], lastSortingResult: null });
      },

      getClassById: (id) => {
        return get().classes.find((c) => c.id === id);
      },

      addSourceClass: (name, color) => {
        const id = uuidv4();
        let resolvedColor: SourceClassColor;
        if (color != null) {
          resolvedColor = color;
        } else {
          const usedColors = new Set(get().sourceClasses.map((sc) => sc.color).filter(Boolean));
          const available = ALL_SOURCE_CLASS_COLORS.filter((c) => !usedColors.has(c));
          const pool = available.length > 0 ? available : ALL_SOURCE_CLASS_COLORS;
          resolvedColor = pool[Math.floor(Math.random() * pool.length)]!;
        }
        const newSourceClass: SourceClass = {
          id,
          name,
          color: resolvedColor,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ sourceClasses: [...state.sourceClasses, newSourceClass] }));
        return id;
      },

      updateSourceClass: (id, updates) => {
        set((state) => ({
          sourceClasses: state.sourceClasses.map((sc) =>
            sc.id === id ? { ...sc, ...updates } : sc
          ),
        }));
      },

      deleteSourceClass: (id, studentCount) => {
        if (studentCount > 0) {
          return {
            success: false,
            error: `${studentCount} pupil${studentCount === 1 ? '' : 's'} reference this source class — unassign them first.`,
          };
        }
        set((state) => ({
          sourceClasses: state.sourceClasses.filter((sc) => sc.id !== id),
        }));
        return { success: true };
      },

      getSourceClassById: (id) => {
        return get().sourceClasses.find((sc) => sc.id === id);
      },

      setSortingConfig: (config) => {
        set((state) => ({
          sortingConfig: { ...state.sortingConfig, ...config },
        }));
      },

      setLargerClassId: (id) => {
        set((state) => ({
          sortingConfig: {
            ...state.sortingConfig,
            largerClassId: state.sortingConfig.largerClassId === id ? null : id,
          },
        }));
      },

      setLastSortingResult: (result) => {
        set({ lastSortingResult: result });
      },

      generateDefaultClasses: (count, totalStudents) => {
        const targetSizes = buildTargetSizes(totalStudents, count);
        const newClasses: Class[] = [];
        const now = new Date();

        for (let i = 0; i < count; i++) {
          newClasses.push({
            id: uuidv4(),
            name: `Class ${String.fromCharCode(65 + i)}`, // Class A, B, C, etc.
            targetSize: targetSizes[i] ?? 0,
            createdAt: now,
          });
        }

        set({ classes: newClasses });
      },
    }),
    {
      name: 'class-sorter-classes',
      version: 1,
    }
  )
);
