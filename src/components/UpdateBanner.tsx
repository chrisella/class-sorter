import { useEffect, useState } from 'react';

interface UpdateInfo {
  version: string;
  url: string;
}

declare global {
  interface Window {
    electron?: {
      onUpdateAvailable?: (cb: (info: UpdateInfo) => void) => void;
      openExternal?: (url: string) => void;
    };
  }
}

export function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    window.electron?.onUpdateAvailable?.((info) => setUpdate(info));
  }, []);

  if (!update) return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-sky-600 px-6 py-2 text-sm text-white">
      <span>
        Version <strong>{update.version}</strong> is available.
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => window.electron?.openExternal?.(update.url)}
          className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50"
        >
          Download
        </button>
        <button
          type="button"
          onClick={() => setUpdate(null)}
          className="text-sky-200 hover:text-white"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
