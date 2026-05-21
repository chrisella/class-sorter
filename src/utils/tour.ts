import { driver, type Driver } from 'driver.js';
import { useUIStore, useStudentStore, useClassStore } from '../stores';
import { injectDemoData, hasDemoData, DEMO_DATA_KEY } from './tourDemoData';

type View = 'classes' | 'students' | 'sorting' | 'results';

export const TOUR_SEEN_KEY = 'class-sorter-tour-seen';

let activeDriver: Driver | null = null;

interface TourStep {
  view: View | null;
  element?: string;
  title: string;
  description: string;
}

// Step index where the Add Pupil dialog is open
const ADD_PUPIL_DIALOG_STEP = 4;

const tourSteps: TourStep[] = [
  {
    view: null,
    title: 'Welcome to Class Sorter',
    description:
      "We've loaded some example pupils and classes so you can see how everything looks. Work through the four steps below — you can restart this tour any time with the <strong>?</strong> button.",
  },
  {
    view: 'classes',
    element: '#tour-source-section',
    title: 'Source Classes',
    description:
      'These are the classes your pupils are <em>currently</em> in. Adding them lets the algorithm spread pupils evenly — so pupils from the same existing class don\'t all end up together in a new group.',
  },
  {
    view: 'classes',
    element: '#tour-classes-section',
    title: 'Step 1 — New Classes',
    description:
      'Define the classes you\'re <em>creating</em>. Target sizes are calculated automatically from the number of pupils. Use the <strong>+1</strong> button on a class card to mark which one gets the extra pupil if numbers don\'t divide evenly.',
  },
  {
    view: 'students',
    element: '#tour-add-pupil-btn',
    title: 'Step 2 — Add Pupils',
    description:
      'Click <strong>Next</strong> to open the Add Pupil form and see what information you can record for each pupil.',
  },
  {
    // Dialog is open on this step — no element so popover floats above the dialog
    view: 'students',
    title: 'The Add Pupil Form',
    description:
      'Fill in the pupil\'s name, gender, behaviour and ability ranks, and any additional needs (EAL, EHCP, SEND, PPG, S&amp;L). Use the <strong>friendship</strong> and <strong>keep-apart</strong> fields to record social constraints. Click <strong>Next</strong> to close the form and continue.',
  },
  {
    view: 'students',
    element: '#tour-students-table',
    title: 'Quick Editing',
    description:
      'Most properties can be toggled directly in the table without opening the edit form. Click a <strong>gender badge</strong> to flip M/F, click <strong>behaviour or ability badges</strong> to cycle through ranks 1–3, and click <strong>EHCP/SEND/PPG badges</strong> to toggle them on or off.',
  },
  {
    view: 'sorting',
    element: '#tour-sort-btn',
    title: 'Step 3 — Create Groups',
    description:
      'Once pupils and classes are ready, click <strong>Create Groups</strong>. The algorithm balances gender, EAL, behaviour, ability, friendship preferences, and source class spread automatically.',
  },
  {
    view: 'results',
    element: '#tour-results-section',
    title: 'Step 4 — Review Groups',
    description:
      'Review the resulting classes here. <strong>Drag</strong> a pupil to move them between groups. <strong>Click</strong> a pupil to highlight all their connections. <strong>Hover</strong> to see friend, must-stay, and keep-apart details.',
  },
  {
    view: 'results',
    element: '#tour-property-filter',
    title: 'Filtering & Colour Coding',
    description:
      'Click any trait badge (<strong>EAL</strong>, <strong>EHCP</strong>, etc.) inside a class card to highlight those pupils across all groups. Toggle <strong>Source class</strong> to colour-code pupils by where they came from. Export to CSV, Excel, or PDF when you\'re done.',
  },
];

export function startTour() {
  if (activeDriver) {
    activeDriver.destroy();
    activeDriver = null;
  }

  const hasStudents = useStudentStore.getState().students.length > 0;
  const hasClasses = useClassStore.getState().classes.length > 0;
  if (!hasStudents && !hasClasses) {
    injectDemoData();
  }

  const { setView, setTourActive, setTourOpenAddPupil } = useUIStore.getState();
  setTourActive(true);

  const openDialog = () => setTourOpenAddPupil(true);
  const closeDialog = () => setTourOpenAddPupil(false);

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

      if (currentIndex === ADD_PUPIL_DIALOG_STEP) closeDialog();

      const nextStep = tourSteps[nextIndex];
      const currentStep = tourSteps[currentIndex];
      if (nextStep.view && nextStep.view !== currentStep.view) {
        setView(nextStep.view);
        setTimeout(() => {
          driverObj.moveNext();
          if (nextIndex === ADD_PUPIL_DIALOG_STEP) openDialog();
        }, 200);
      } else {
        driverObj.moveNext();
        if (nextIndex === ADD_PUPIL_DIALOG_STEP) openDialog();
      }
    },
    onPrevClick: () => {
      const currentIndex = driverObj.getActiveIndex() ?? 0;
      const prevIndex = currentIndex - 1;
      if (prevIndex < 0) return;

      if (currentIndex === ADD_PUPIL_DIALOG_STEP) closeDialog();

      const prevStep = tourSteps[prevIndex];
      const currentStep = tourSteps[currentIndex];
      if (prevStep?.view && prevStep.view !== currentStep.view) {
        setView(prevStep.view);
        setTimeout(() => {
          driverObj.movePrevious();
          if (prevIndex === ADD_PUPIL_DIALOG_STEP) openDialog();
        }, 200);
      } else {
        driverObj.movePrevious();
        if (prevIndex === ADD_PUPIL_DIALOG_STEP) openDialog();
      }
    },
    onDestroyStarted: () => {
      driverObj.destroy();
    },
    onDestroyed: () => {
      markSeen();
      activeDriver = null;
      setTourActive(false);
      closeDialog();
      setView('classes');
    },
  });

  activeDriver = driverObj;
  driverObj.drive();
}

export function markSeen() {
  localStorage.setItem(TOUR_SEEN_KEY, '1');
}

export function hasSeen(): boolean {
  return localStorage.getItem(TOUR_SEEN_KEY) === '1';
}

export { hasDemoData, DEMO_DATA_KEY };
