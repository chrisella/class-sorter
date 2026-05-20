import { create } from 'zustand';

type View = 'students' | 'classes' | 'sorting' | 'results';

interface UIState {
  currentView: View;
  setView: (view: View) => void;
  isSorting: boolean;
  setIsSorting: (sorting: boolean) => void;
  sortingProgress: number;
  setSortingProgress: (progress: number) => void;
  tourActive: boolean;
  setTourActive: (active: boolean) => void;
  tourOpenAddPupil: boolean;
  setTourOpenAddPupil: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'classes',
  setView: (view) => set({ currentView: view }),
  isSorting: false,
  setIsSorting: (sorting) => set({ isSorting: sorting }),
  sortingProgress: 0,
  setSortingProgress: (progress) => set({ sortingProgress: progress }),
  tourActive: false,
  setTourActive: (active) => set({ tourActive: active }),
  tourOpenAddPupil: false,
  setTourOpenAddPupil: (open) => set({ tourOpenAddPupil: open }),
}));
