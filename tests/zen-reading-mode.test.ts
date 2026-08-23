import { afterEach, describe, expect, it } from "vitest";
import {
  enterZenReadingMode,
  exitZenReadingMode,
  isZenReadingMode,
  resetZenReadingModeForTests,
  toggleZenReadingMode,
} from "../src/react/zenReadingMode";

describe("Zen reading mode", () => {
  afterEach(() => resetZenReadingModeForTests());

  it("persists until an explicit exit", () => {
    enterZenReadingMode();
    expect(isZenReadingMode()).toBe(true);

    exitZenReadingMode();
    expect(isZenReadingMode()).toBe(false);
  });

  it("toggles a route-default reader mode off and back on", () => {
    expect(isZenReadingMode(true)).toBe(true);

    toggleZenReadingMode(true);
    expect(isZenReadingMode(true)).toBe(false);

    toggleZenReadingMode(true);
    expect(isZenReadingMode(true)).toBe(true);
  });
});
