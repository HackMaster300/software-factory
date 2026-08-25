'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useToasts, dismissToast } from '../../hooks/use-toasts';
import { Button } from './Button';

/**
 * Mounted once near the app root. Renders whatever `showToast()` (hooks/use-toasts.ts)
 * has queued — primarily used for "X deleted — Undo" confirmations.
 */
export const ToastContainer: React.FC = () => {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="flex items-center justify-between gap-3 bg-[#1c2029] border border-[#2e3340] rounded-lg shadow-2xl px-4 py-2.5 text-xs text-gray-200"
        >
          <span className="flex-1">{toast.message}</span>
          <div className="flex items-center gap-1 shrink-0">
            {toast.action && (
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-400 hover:text-blue-300"
                onClick={() => {
                  toast.action?.onAction();
                  dismissToast(toast.id);
                }}
              >
                {toast.action.label}
              </Button>
            )}
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="min-w-11 min-h-11 sm:min-w-6 sm:min-h-6 inline-flex items-center justify-center rounded text-gray-500 hover:text-gray-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
