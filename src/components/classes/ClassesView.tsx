import { useEffect, useState } from 'react';
import { useClassStore, useStudentStore } from '../../stores';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { SourceClassSection } from './SourceClassSection';
import type { Class } from '../../types';
import { buildTargetSizes, buildClassTargetMap } from '../../utils/classSizeUtils';

export function ClassesView() {
  const {
    classes,
    addClass,
    updateClass,
    deleteClass,
    deleteAllClasses,
    generateDefaultClasses,
    setLargerClassId,
    sortingConfig,
  } = useClassStore();
  const { students } = useStudentStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateCount, setGenerateCount] = useState('3');
  const classTargetMap = buildClassTargetMap(classes, students.length, sortingConfig.largerClassId);

  useEffect(() => {
    classes.forEach((cls) => {
      const targetSize = classTargetMap[cls.id];
      if (targetSize !== undefined && cls.targetSize !== targetSize) {
        updateClass(cls.id, { targetSize });
      }
    });
  }, [classes, classTargetMap, updateClass]);

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const nextTargetSizes = buildTargetSizes(students.length, classes.length + 1);
    classes.forEach((cls, index) => {
      const targetSize = nextTargetSizes[index];
      if (targetSize !== undefined && cls.targetSize !== targetSize) {
        updateClass(cls.id, { targetSize });
      }
    });

    const targetSize = nextTargetSizes[nextTargetSizes.length - 1] ?? students.length;
    addClass(newClassName.trim(), targetSize, newTeacherName.trim() || undefined);
    setNewClassName('');
    setNewTeacherName('');
    setShowAddForm(false);
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(generateCount, 10);
    if (count > 0 && count <= 10) {
      generateDefaultClasses(count, students.length);
      setShowGenerateDialog(false);
      setGenerateCount('3');
    }
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Step 1</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Set up your classes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Define where pupils are coming from, then add the classes you want to fill.
        </p>
      </div>

      {/* Source Classes */}
      <SourceClassSection />

      {/* Destination Classes — unified card */}
      <div id="tour-classes-section" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Card header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">New classes</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {classes.length > 0
                ? `${classes.length} class${classes.length === 1 ? '' : 'es'} · ${students.length} pupils to distribute`
                : 'Add the classes you want to fill. Target sizes are calculated automatically.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700"
            >
              Add Class
            </button>
            <button
              onClick={() => setShowGenerateDialog(true)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Auto Generate
            </button>
            {classes.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                Remove All
              </button>
            )}
          </div>
        </div>

        {/* Add Class Form — inline inside card */}
        {showAddForm && (
          <form onSubmit={handleAddClass} className="mt-4 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">Class Name</label>
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="e.g., Class A"
                autoFocus
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">Teacher Name (optional)</label>
              <input
                type="text"
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="e.g., Mrs. Smith"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newClassName.trim()}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewClassName('');
                  setNewTeacherName('');
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Classes Grid */}
        {classes.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const isLarger = sortingConfig.largerClassId === cls.id;
              const targetSize = classTargetMap[cls.id] ?? cls.targetSize;
              return (
                <div
                  key={cls.id}
                  className={`rounded-xl border p-4 ${isLarger ? 'border-sky-400 ring-1 ring-sky-300' : 'border-slate-200'}`}
                >
                  {editingId === cls.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        defaultValue={cls.name}
                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateClass(cls.id, { name: e.currentTarget.value });
                            setEditingId(null);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        autoFocus
                      />
                      <input
                        type="text"
                        defaultValue={cls.teacherName || ''}
                        placeholder="Teacher name"
                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateClass(cls.id, { teacherName: e.currentTarget.value || undefined });
                            setEditingId(null);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm text-slate-600 hover:text-slate-800"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">{cls.name}</h3>
                          {cls.teacherName && (
                            <p className="text-sm text-slate-500">{cls.teacherName}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingId(cls.id)}
                            className="text-xs text-sky-600 hover:text-sky-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingClass(cls)}
                            className="text-xs text-rose-600 hover:text-rose-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                          Target: {targetSize} pupils
                        </p>
                        <button
                          onClick={() => setLargerClassId(cls.id)}
                          title={isLarger ? 'This class gets the extra pupil — click to unset' : 'Mark this class to receive the extra pupil'}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                            isLarger
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-400 hover:bg-sky-50 hover:text-sky-600'
                          }`}
                        >
                          +1
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 py-10 text-center">
            <svg
              className="mx-auto h-10 w-10 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="mt-3 text-sm text-slate-400">No classes added yet. Use Auto Generate for a quick start.</p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showClearConfirm && (
        <ConfirmDialog
          title="Remove All Classes"
          message="Are you sure you want to remove every class?"
          confirmLabel="Delete All"
          onConfirm={() => {
            deleteAllClasses();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      {deletingClass && (
        <ConfirmDialog
          title="Delete Class"
          message={`Are you sure you want to delete ${deletingClass.name}?`}
          confirmLabel="Delete"
          onConfirm={() => {
            deleteClass(deletingClass.id);
            setDeletingClass(null);
          }}
          onCancel={() => setDeletingClass(null)}
        />
      )}

      {showGenerateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowGenerateDialog(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Auto Generate Classes</h3>
            <form onSubmit={handleGenerateSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of classes (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={generateCount}
                onChange={(e) => setGenerateCount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
