'use client';

import { useSyncExternalStore } from 'react';

export interface ToastAction {
  label: string;
  onAction: () => void;
}

export interface Toast {
  id: string;
  message: string;
  action?: ToastAction;
}

const UNDO_TOAST_DURATION_MS = 6000;

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let nextId = 0;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

const emptyToasts: Toast[] = [];

function getServerSnapshot(): Toast[] {
  return emptyToasts;
}

export function dismissToast(id: string) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toasts = toasts.filter((t) => t.id !== id);
  emitChange();
}

/** Shows a toast with an optional action (e.g. "Undo"), auto-dismissed after ~6s. */
export function showToast(message: string, action?: ToastAction): string {
  const id = `toast-${nextId++}`;
  toasts = [...toasts, { id, message, action }];
  emitChange();
  timers.set(
    id,
    setTimeout(() => dismissToast(id), UNDO_TOAST_DURATION_MS)
  );
  return id;
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
