import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
}

export function InlinePopover({ anchorEl, onClose, children }: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        e.target !== anchorEl &&
        !anchorEl?.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [anchorEl, onClose]);

  if (!anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 4;
  const left = rect.left + window.scrollX;

  return createPortal(
    <div
      ref={popoverRef}
      className="absolute z-50 min-w-40 rounded-lg border border-slate-200 bg-white shadow-lg"
      style={{ top, left }}
    >
      {children}
    </div>,
    document.body
  );
}
