import { useEffect, useRef } from "react";

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
    "[contenteditable='true']",
  ].join(",");

  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
  );
}

/**
 * Minimal, dependency-free modal a11y:
 * - focus first focusable element on mount
 * - trap Tab/Shift+Tab within modal
 * - close on Escape
 * - restore focus to previously focused element on unmount
 */
export function useModalA11y(opts: {
  containerRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  isOpen: boolean;
}) {
  const onCloseRef = useRef(opts.onClose);
  useEffect(() => {
    onCloseRef.current = opts.onClose;
  }, [opts.onClose]);

  useEffect(() => {
    if (!opts.isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = opts.containerRef.current;
    if (!container) return;

    // Focus first focusable element, otherwise focus container.
    const focusables = getFocusableElements(container);
    (focusables[0] ?? container).focus?.();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab") return;

      const currentContainer = opts.containerRef.current;
      if (!currentContainer) return;

      const items = getFocusableElements(currentContainer);
      if (items.length === 0) {
        e.preventDefault();
        currentContainer.focus?.();
        return;
      }

      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (!active) return;

      if (e.shiftKey) {
        if (active === first || !currentContainer.contains(active)) {
          e.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Restore focus when modal unmounts/closes.
      previouslyFocused?.focus?.();
    };
  }, [opts.containerRef, opts.isOpen]);
}
