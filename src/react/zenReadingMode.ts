import { useSyncExternalStore } from "react";

type ZenReadingPreference = "default" | "enabled" | "disabled";

let zenReadingPreference: ZenReadingPreference = "default";
const listeners = new Set<() => void>();

const notify = (): void => {
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const snapshot = (routeDefault = false): boolean =>
  zenReadingPreference === "default" ? routeDefault : zenReadingPreference === "enabled";

export const isZenReadingMode = (routeDefault = false): boolean => snapshot(routeDefault);

export const enterZenReadingMode = (): void => {
  if (zenReadingPreference === "enabled") return;
  zenReadingPreference = "enabled";
  notify();
};

export const exitZenReadingMode = (): void => {
  if (zenReadingPreference === "disabled") return;
  zenReadingPreference = "disabled";
  notify();
};

export const toggleZenReadingMode = (routeDefault = false): void => {
  if (snapshot(routeDefault)) exitZenReadingMode();
  else enterZenReadingMode();
};

export const useZenReadingMode = (routeDefault = false): boolean =>
  useSyncExternalStore(
    subscribe,
    () => snapshot(routeDefault),
    () => snapshot(routeDefault),
  );

export const resetZenReadingModeForTests = (): void => {
  zenReadingPreference = "default";
  notify();
};
