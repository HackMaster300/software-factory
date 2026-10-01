import { afterEach } from 'vitest';

// React Testing Library only auto-cleans up when test globals are enabled;
// unmount rendered trees explicitly (DOM environments only).
afterEach(async () => {
  if (typeof document === 'undefined') return;
  const { cleanup } = await import('@testing-library/react');
  cleanup();
});
