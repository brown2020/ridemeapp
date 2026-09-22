"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type ModalDialogProps = Readonly<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Wider panel for lists */
  size?: "md" | "lg";
}>;

/**
 * Native HTML dialog modal — avoids createPortal(document.body) SSR hazards.
 */
export function ModalDialog({
  open,
  onClose,
  title,
  children,
  size = "md",
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onDialogClose = () => onClose();
    dialog.addEventListener("close", onDialogClose);
    return () => dialog.removeEventListener("close", onDialogClose);
  }, [onClose]);

  const maxWidth = size === "lg" ? "max-w-lg" : "max-w-md";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={`relative z-modal w-full ${maxWidth} rounded-xl border-0 bg-white p-6 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm`}
    >
      <h2 id={titleId} className="sr-only">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
