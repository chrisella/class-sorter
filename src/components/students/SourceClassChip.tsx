import { useRef, useState } from 'react';
import { useClassStore, useStudentStore } from '../../stores';
import { sourceClassColorMap } from '../../utils/sourceClassColors';
import { InlinePopover } from './InlinePopover';
import type { Student } from '../../types';

interface Props {
  student: Student;
}

export function SourceClassChip({ student }: Props) {
  const { sourceClasses } = useClassStore();
  const { updateStudent } = useStudentStore();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const current = sourceClasses.find((sc) => sc.id === student.sourceClassId);

  const handleSelect = (id: string | null) => {
    updateStudent(student.id, { sourceClassId: id });
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium hover:bg-slate-100"
        title="Click to change source class"
      >
        {current ? (
          <>
            <span
              className={`inline-block h-2 w-2 rounded-full ${current.color ? sourceClassColorMap[current.color].bg500 : 'bg-slate-400'}`}
            />
            <span className="max-w-[80px] truncate">{current.name}</span>
          </>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </button>

      {open && (
        <InlinePopover anchorEl={triggerRef.current} onClose={() => setOpen(false)}>
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
              None
            </button>
            {sourceClasses.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleSelect(sc.id)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 ${
                  sc.id === student.sourceClassId ? 'font-medium text-slate-900' : 'text-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${sc.color ? sourceClassColorMap[sc.color].bg500 : 'bg-slate-400'}`}
                />
                {sc.name}
              </button>
            ))}
            {sourceClasses.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400">No source classes defined</p>
            )}
          </div>
        </InlinePopover>
      )}
    </>
  );
}
