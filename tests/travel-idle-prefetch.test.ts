import { afterEach, describe, expect, it, vi } from "vitest";
import { scheduleTravelIdleTask } from "../src/travelGlance";

describe("Travel idle prefetch scheduling", () => {
  afterEach(() => vi.useRealTimers());

  it("waits for the fallback idle window", () => {
    vi.useFakeTimers();
    const task = vi.fn();
    const controller = new AbortController();

    scheduleTravelIdleTask(task, controller.signal);
    expect(task).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_000);
    expect(task).toHaveBeenCalledOnce();
  });

  it("cancels pending work when the route unmounts", () => {
    vi.useFakeTimers();
    const task = vi.fn();
    const controller = new AbortController();

    scheduleTravelIdleTask(task, controller.signal);
    controller.abort();
    vi.runAllTimers();
    expect(task).not.toHaveBeenCalled();
  });
});
