import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';

function setup(overrides: Partial<ComponentProps<typeof Sidebar>> = {}) {
  const props = { activeView: 'dashboard', setActiveView: vi.fn(), isOpen: false, onClose: vi.fn(), ...overrides };
  render(<Sidebar {...props} />);
  return props;
}

describe('<Sidebar />', () => {
  it('renders every navigation entry and highlights the active one', () => {
    setup({ activeView: 'rules' });
    for (const label of ['Overview', 'Blueprints', 'Scaffolding Wizard', 'Architecture Rules', 'AI & Prompts', 'Impact Analyzer']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: /Architecture Rules/ }).className).toContain('bg-blue-600/20');
    expect(screen.getByRole('button', { name: /Overview/ }).className).not.toContain('bg-blue-600/20');
  });

  it('navigates and closes the drawer when an item is clicked', () => {
    const props = setup();
    fireEvent.click(screen.getByRole('button', { name: /Decision Logs/ }));
    expect(props.setActiveView).toHaveBeenCalledWith('decisions');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('"+ New Project" opens the scaffolding wizard', () => {
    const props = setup();
    fireEvent.click(screen.getByRole('button', { name: /New Project/ }));
    expect(props.setActiveView).toHaveBeenCalledWith('scaffolder');
  });

  it('is exposed as a modal dialog only while open', () => {
    setup({ isOpen: true });
    expect(screen.getByRole('dialog', { name: 'Navigation menu' })).toBeTruthy();
  });

  it('is not a dialog while closed', () => {
    setup({ isOpen: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('close button calls onClose', () => {
    const props = setup({ isOpen: true });
    fireEvent.click(screen.getByRole('button', { name: 'Close navigation menu' }));
    expect(props.onClose).toHaveBeenCalled();
  });
});
