import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastContainer } from './ToastContainer';
import { showToast, dismissToast } from '../../hooks/use-toasts';

describe('<ToastContainer />', () => {
  const ids: string[] = [];
  afterEach(() => {
    act(() => ids.splice(0).forEach(dismissToast));
    vi.useRealTimers();
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('shows a queued toast and dismisses it via the close button', () => {
    render(<ToastContainer />);
    act(() => {
      ids.push(showToast('Blueprint deleted'));
    });
    expect(screen.getByRole('status').textContent).toContain('Blueprint deleted');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('runs the action (e.g. Undo) and then dismisses the toast', () => {
    const onAction = vi.fn();
    render(<ToastContainer />);
    act(() => {
      ids.push(showToast('Rule removed', { label: 'Undo', onAction }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('auto-dismisses after ~6 seconds', () => {
    vi.useFakeTimers();
    render(<ToastContainer />);
    act(() => {
      ids.push(showToast('Saved'));
    });
    expect(screen.getByRole('status')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(6100);
    });
    expect(screen.queryByRole('status')).toBeNull();
  });
});
