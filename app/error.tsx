'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#0e1013] text-gray-100 font-sans">
      <AlertTriangle className="h-10 w-10 text-amber-400" aria-hidden="true" />
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="max-w-md text-center text-sm text-gray-400">
        The Software Factory workspace hit an unexpected error. Your data in local storage is
        unaffected. You can try recovering the current view below.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-600">Error reference: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-2 flex items-center gap-2 rounded-lg border border-[#2e3444] bg-[#1e222d] px-4 py-2 text-sm font-medium text-gray-200 hover:text-white"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}
