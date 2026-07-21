import { describe, expect, expectTypeOf, it } from "vitest";
import {
  defineFederatedContentRoutes,
  type FederatedContentRoutes,
} from "../packages/theme-contract/src/index";

describe("public federated theme contracts", () => {
  it("preserves framework-neutral application content route types", async () => {
    type Shell = { readonly siteId: string };
    type DocumentData = { readonly id: string; readonly siteId: string };
    type Rendered = { readonly kind: "home" | "document"; readonly id: string };

    const binding: FederatedContentRoutes<Shell, DocumentData, Rendered> = {
      exclusiveContentRoutes: true,
      loadDocument: async (shell, documentId) => ({
        id: documentId,
        siteId: shell.siteId,
      }),
      renderDocument: (document) => ({ kind: "document", id: document.id }),
      renderHome: (shell) => ({ kind: "home", id: shell.siteId }),
    };
    const routes = defineFederatedContentRoutes(binding);

    expect(routes).toBe(binding);
    expect(await routes.loadDocument({ siteId: "tao3k" }, "platform")).toEqual({
      id: "platform",
      siteId: "tao3k",
    });
    expect(routes.renderHome({ siteId: "tao3k" })).toEqual({
      kind: "home",
      id: "tao3k",
    });
    expectTypeOf(routes.renderDocument).returns.toEqualTypeOf<Rendered>();
  });
});
