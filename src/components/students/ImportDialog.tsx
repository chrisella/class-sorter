import { useState } from 'react';
import { useStudentStore, useClassStore } from '../../stores';
import { validateAndParseState } from '../../utils/jsonIO';

interface Props {
  onClose: () => void;
}

export function ImportDialog({ onClose }: Props) {
  const { students: _existingStudents } = useStudentStore();
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ students: number; classes: number } | null>(null);
  const [pendingFile, setPendingFile] = useState<unknown>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setPreview(null);
    setPendingFile(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const parsed = validateAndParseState(raw);
        setPreview({ students: parsed.students.length, classes: parsed.classes.length });
        setPendingFile(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to read file.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!pendingFile) return;

    try {
      const parsed = validateAndParseState(pendingFile);

      // Replace all state — no migration
      useStudentStore.setState({ students: parsed.students });
      useClassStore.setState({
        classes: parsed.classes,
        sortingConfig: parsed.sortingConfig,
        lastSortingResult: null,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Import</h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload JSON file
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800">
            This will replace all current pupils, classes, and sorting settings.
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {preview && (
            <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3 text-sm text-green-800">
              Ready to import: <strong>{preview.students}</strong> pupils and{' '}
              <strong>{preview.classes}</strong> classes.
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!pendingFile}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
