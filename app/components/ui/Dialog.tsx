"use client";

/* ===================== */
/* Dialog */
/* Native <dialog>: focus trap, Esc to close and a backdrop for free.
*/
/* ===================== */

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function Dialog({ open, title, description, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="panel overflow-hidden rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line bg-surface-2/50 px-5 py-4">
          <div>
            <h2 id="dialog-title" className="font-semibold tracking-tight">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
          </div>
          <button type="button" className="icon-btn -mr-2 -mt-1" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {open ? children : null}
      </div>
    </dialog>
  );
}
