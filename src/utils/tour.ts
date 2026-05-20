import { driver } from 'driver.js';
import { useUIStore } from '../stores';

type View = 'classes' | 'students' | 'sorting' | 'results';

const TOUR_SEEN_KEY = 'class-sorter-tour-seen';

interface TourStep {
  view: View | null;
  element?: string;
  title: string;
  description: string;
}

const tourSteps: TourStep[] = [
  {
    view: null,
    title: 'Welcome to Class Sorter',
    description:
      'A quick tour of the four steps. You can restart it any time with the <strong>?</strong> button in the header.',
  },
  {
    view: 'classes',
    element: '#tour-classes-section',
    title: 'Step 1 — Classes',
    description:
      'Define your destination classes here. Target sizes are calculated automatically from the number of pupils. If the total doesn\'t divide evenly, the <strong>▲</strong> button on a class lets you designate which one gets the extra pupil.',
  },
  {
    view: 'students',
    element: '#tour-import-btn',
    title: 'Step 2 — Pupils',
    description:
      'Import your pupil list from a saved file for the quickest start, or add pupils one by one. Every detail can be edited later.',
  },
  {
    view: 'sorting',
    element: '#tour-sort-btn',
    title: 'Step 3 — Create Groups',
    description:
      'Once you have pupils and classes set up, click <strong>Create Groups</strong>. The algorithm balances gender, EAL, behaviour, ability, and friendship preferences automatically.',
  },
  {
    view: 'results',
    element: '#tour-results-section',
    title: 'Step 4 — Review Groups',
    description:
      'Review the resulting classes here. Drag pupils between groups to make manual adjustments, then export to PDF or Excel when you\'re done.',
  },
];

export function startTour() {
  const { setView } = useUIStore.getState();

  const driverObj = driver({
    showProgress: true,
    allowClose: true,
    steps: tourSteps.map((step) => ({
      ...(step.element ? { element: step.element } : {}),
      popover: { title: step.title, description: step.description },
    })),
    onNextClick: () => {
      const currentIndex = driverObj.getActiveIndex() ?? 0;
      const nextIndex = currentIndex + 1;

      if (nextIndex >= tourSteps.length) {
        driverObj.destroy();
        return;
      }

      const nextStep = tourSteps[nextIndex];
      if (nextStep.view) {
        setView(nextStep.view);
        setTimeout(() => driverObj.moveNext(), 100);
      } else {
        driverObj.moveNext();
      }
    },
    onPrevClick: () => {
      const currentIndex = driverObj.getActiveIndex() ?? 0;
      const prevIndex = currentIndex - 1;
      if (prevIndex < 0) return;

      const prevStep = tourSteps[prevIndex];
      if (prevStep?.view) {
        setView(prevStep.view);
        setTimeout(() => driverObj.movePrevious(), 100);
      } else {
        driverObj.movePrevious();
      }
    },
    onDestroyStarted: () => {
      markSeen();
    },
  });

  driverObj.drive();
}

export function markSeen() {
  localStorage.setItem(TOUR_SEEN_KEY, '1');
}

export function hasSeen(): boolean {
  return localStorage.getItem(TOUR_SEEN_KEY) === '1';
}
