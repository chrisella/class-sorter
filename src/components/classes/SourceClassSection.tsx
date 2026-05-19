import { useState } from 'react';
import { useClassStore, useStudentStore } from '../../stores';
import { ALL_SOURCE_CLASS_COLORS, sourceClassColorMap } from '../../utils/sourceClassColors';
import type { SourceClassColor } from '../../types';

export function SourceClassSection() {
  const { sourceClasses, addSourceClass, updateSourceClass, deleteSourceClass } = useClassStore();
  const { countStudentsInSourceClass } = useStudentStore();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<SourceClassColor | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<SourceClassColor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addSourceClass(newName.trim(), newColor);
    setNewName('');
    setNewColor(null);
    setShowForm(false);
  };

  const startEdit = (id: string) => {
    const sc = sourceClasses.find((s) => s.id === id);
    if (!sc) return;
    setEditingId(id);
    setEditName(sc.name);
    setEditColor(sc.color);
  };

  const handleEditSave = (id: string) => {
    if (!editName.trim()) return;
    updateSourceClass(id, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const count = countStudentsInSourceClass(id);
    const result = deleteSourceClass(id, count);
    if (!result.success) {
      setDeleteError(result.error ?? 'Cannot delete.');
      setTimeout(() => setDeleteError(null), 3000);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Source classes</h3>
          <p className="mt-1 text-sm text-slate-500">
            The classes pupils are currently in. Used to spread them evenly across new groups.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Add Source Class
        </button>
      </div>

      {deleteError && (
        <div className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{deleteError}</div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="e.g., Year 5 Elm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Color (auto if blank)</label>
            <ColorPicker value={newColor} onChange={setNewColor} allowNone />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newName.trim()}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewName(''); setNewColor(null); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {sourceClasses.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sourceClasses.map((sc) => {
            const count = countStudentsInSourceClass(sc.id);
            const colorMeta = sc.color ? sourceClassColorMap[sc.color] : null;
            return (
              <div
                key={sc.id}
                className={`rounded-xl border p-3 ${colorMeta ? colorMeta.bg200 : 'bg-slate-100'} border-slate-200`}
              >
                {editingId === sc.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                      autoFocus
                    />
                    <ColorPicker value={editColor} onChange={setEditColor} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditSave(sc.id)}
                        className="rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {colorMeta && (
                          <span className={`inline-block h-3 w-3 rounded-full ${colorMeta.bg500} shrink-0`} />
                        )}
                        <span className="truncate text-sm font-medium text-slate-900">{sc.name}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{count} pupil{count === 1 ? '' : 's'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(sc.id)}
                        className="text-xs text-sky-600 hover:text-sky-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sc.id)}
                        disabled={count > 0}
                        title={count > 0 ? `${count} pupil${count === 1 ? '' : 's'} reference this — unassign them first` : 'Delete'}
                        className="text-xs text-rose-600 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">No source classes added yet.</p>
      )}
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
  allowNone,
}: {
  value: SourceClassColor | null;
  onChange: (c: SourceClassColor | null) => void;
  allowNone?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {allowNone && (
        <button
          type="button"
          onClick={() => onChange(null)}
          title="Auto"
          className={`h-5 w-5 rounded-full border-2 ${value === null ? 'border-sky-500' : 'border-slate-300'} bg-white text-[9px] text-slate-400`}
        >
          ?
        </button>
      )}
      {ALL_SOURCE_CLASS_COLORS.map((color) => {
        const meta = sourceClassColorMap[color];
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            title={meta.label}
            className={`h-5 w-5 rounded-full ${meta.bg500} border-2 ${value === color ? 'border-slate-800' : 'border-transparent'}`}
          />
        );
      })}
    </div>
  );
}
