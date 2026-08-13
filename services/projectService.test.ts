import { describe, it, expect } from 'vitest';
import { ProjectService } from './projectService';

// Access the private static sanitizer directly — it's the exact regression guard
// for the Zip Slip fix (CWE-22) made earlier: node names from user-editable module
// names or imported workspace JSON must never be able to escape the zip root.
const sanitize = (ProjectService as unknown as { sanitizeZipEntryName: (name: string) => string }).sanitizeZipEntryName;

describe('ProjectService.sanitizeZipEntryName (Zip Slip regression guard)', () => {
  it('leaves a normal name untouched', () => {
    expect(sanitize('App.Core')).toBe('App.Core');
  });

  it('strips parent-directory traversal segments', () => {
    expect(sanitize('../../etc/passwd')).not.toContain('..');
  });

  it('strips path separators so no nested path can be smuggled in', () => {
    const result = sanitize('foo/bar\\baz');
    expect(result).not.toMatch(/[\\/]/);
  });

  it('never returns an empty string', () => {
    expect(sanitize('..')).not.toBe('');
    expect(sanitize('')).not.toBe('');
  });
});
