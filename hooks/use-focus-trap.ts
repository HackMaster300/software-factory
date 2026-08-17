'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared focus-trap + Escape-to-close + focus-restore behavior for any
 * dialog-like overlay (modal, drawer, command palette). While `isOpen`:
 *  - Tab/Shift+Tab wrap within the container's focusable elements, so Tab
 *    can never escape to whatever is behind the overlay.
 *  - Escape calls `onClose`.
 *  - On open, focus moves into the container (first focusable descendant,
 *    or the container itself if none — e.g. a still-loading dialog).
 *  - On close, focus returns to whichever element triggered the dialog,
 *    instead of resetting to the document body.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void
) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    const getFocusable = () =>
      container
        ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
            (el) => el.offsetParent !== null
          )
        : [];

    // Move focus into the dialog. If nothing inside is already focused
    // (e.g. no autoFocus field), focus the first focusable element.
    if (!container?.contains(document.activeElement)) {
      const focusable = getFocusable();
      (focusable[0] || container)?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      previouslyFocused.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
}
