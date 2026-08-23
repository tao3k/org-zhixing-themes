import { afterEach, describe, expect, it } from "vitest";
import {
  enterZenReadingMode,
  exitZenReadingMode,
  isZenReadingMode,
  resetZenReadingModeForTests,
} from "../src/react/zenReadingMode";

describe("Zen reading mode", () => {
  afterEach(() => resetZenReadingModeForTests());

  it("persists until an explicit exit", () => {
    enterZenReadingMode();
    expect(isZenReadingMode()).toBe(true);

    exitZenReadingMode();
    expect(isZenReadingMode()).toBe(false);
  });
});
