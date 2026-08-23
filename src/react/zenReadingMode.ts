import { useSyncExternalStore } from "react";

let zenReadingMode = false;
const listeners = new Set<() => void>();

const notify = (): void => {
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const snapshot = (): boolean => zenReadingMode;

export const isZenReadingMode = (): boolean => snapshot();

export const enterZenReadingMode = (): void => {
  if (zenReadingMode) return;
  zenReadingMode = true;
  notify();
};

export const exitZenReadingMode = (): void => {
  if (!zenReadingMode) return;
  zenReadingMode = false;
  notify();
};

export const useZenReadingMode = (): boolean => useSyncExternalStore(subscribe, snapshot, snapshot);

export const resetZenReadingModeForTests = (): void => {
  zenReadingMode = false;
  notify();
};
