import { describe, expect, it, vi } from "vitest";

import { createTypstRenderCoordinator } from "../src/core/typstRenderCoordinator";

describe("Typst render coordinator", () => {
  it("coalesces duplicate cold renders into one persistent lookup and compilation", async () => {
    const compile = vi.fn(async (source: string) => `<svg>${source}</svg>`);
    const read = vi.fn(async () => undefined);
    const coordinator = createTypstRenderCoordinator({
      compile,
      persistentCache: { read, write: vi.fn(async () => undefined) },
    });

    const first = coordinator.render("= Diagram");
    const duplicate = coordinator.render("= Diagram");

    expect(duplicate).toBe(first);
    await expect(first).resolves.toBe("<svg>= Diagram</svg>");
    expect(read).toHaveBeenCalledOnce();
    expect(compile).toHaveBeenCalledOnce();
  });

  it("returns a persistent hit while an unrelated cold compilation is still running", async () => {
    let releaseCold: ((svg: string) => void) | undefined;
    const compile = vi.fn(
      (source: string) =>
        new Promise<string>((resolve) => {
          if (source === "cold") releaseCold = resolve;
        }),
    );
    const coordinator = createTypstRenderCoordinator({
      compile,
      persistentCache: {
        read: vi.fn(async (source: string) => (source === "warm" ? "<svg>warm</svg>" : undefined)),
        write: vi.fn(async () => undefined),
      },
    });

    const cold = coordinator.render("cold");
    await vi.waitFor(() => expect(compile).toHaveBeenCalledWith("cold"));

    await expect(coordinator.render("warm")).resolves.toBe("<svg>warm</svg>");
    expect(compile).toHaveBeenCalledOnce();

    releaseCold?.("<svg>cold</svg>");
    await expect(cold).resolves.toBe("<svg>cold</svg>");
  });

  it("publishes the compiled SVG without waiting for Cache Storage writes", async () => {
    let releaseWrite: (() => void) | undefined;
    const write = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseWrite = resolve;
        }),
    );
    const coordinator = createTypstRenderCoordinator({
      compile: async () => "<svg>cold</svg>",
      persistentCache: { read: async () => undefined, write },
    });

    await expect(coordinator.render("cold")).resolves.toBe("<svg>cold</svg>");
    expect(write).toHaveBeenCalledWith("cold", "<svg>cold</svg>");
    releaseWrite?.();
  });
});
