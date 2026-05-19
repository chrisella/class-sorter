export type SourceClassColor = 'rose' | 'amber' | 'emerald' | 'sky' | 'violet' | 'slate';

export const ALL_SOURCE_CLASS_COLORS: SourceClassColor[] = [
  'rose', 'amber', 'emerald', 'sky', 'violet', 'slate',
];

export const sourceClassColorMap: Record<SourceClassColor, { bg200: string; bg500: string; label: string }> = {
  rose:    { bg200: 'bg-rose-200',    bg500: 'bg-rose-500',    label: 'Rose' },
  amber:   { bg200: 'bg-amber-200',   bg500: 'bg-amber-500',   label: 'Amber' },
  emerald: { bg200: 'bg-emerald-200', bg500: 'bg-emerald-500', label: 'Emerald' },
  sky:     { bg200: 'bg-sky-200',     bg500: 'bg-sky-500',     label: 'Sky' },
  violet:  { bg200: 'bg-violet-200',  bg500: 'bg-violet-500',  label: 'Violet' },
  slate:   { bg200: 'bg-slate-200',   bg500: 'bg-slate-500',   label: 'Slate' },
};
