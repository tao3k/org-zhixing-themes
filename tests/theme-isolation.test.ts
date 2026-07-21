import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  defineThemeIsolationSnapshot,
  renderThemeRuntimeModule,
  type ThemeIsolationSnapshot,
} from "../src/theme-system/isolation";
import {
  createThemeFederationPlugin,
  selectedThemeFederationRemotes,
} from "../src/theme-system/build/themeFederationPlugin";
import { resolveThemeIsolation } from "../src/theme-system/build/resolveThemeIsolation";

const workspaceSnapshot = (
  instanceId: string,
  selectedThemeId: "documents" | "elegant-blog",
): ThemeIsolationSnapshot =>
  defineThemeIsolationSnapshot({
    instanceId,
    selectedThemeId,
    selectedVariant: selectedThemeId === "documents" ? "mocha" : "default",
    watchFiles: [`/${instanceId}/org-zhixing.toml`],
    catalog: [
      {
        id: "documents",
        package: "@org-zhixing/theme-documents",
        defaultVariant: "mocha",
        variants: ["latte", "mocha"],
        transport: { kind: "workspace", module: "@org-zhixing/theme-documents" },
      },
      {
        id: "elegant-blog",
        package: "@org-zhixing/theme-elegant-blog",
        defaultVariant: "default",
        variants: ["default"],
        transport: { kind: "workspace", module: "@org-zhixing/theme-elegant-blog" },
      },
    ],
  });

describe("theme isolation framework", () => {
  it("creates independent compiler module graphs without shared generated files", () => {
    const documents = renderThemeRuntimeModule(workspaceSnapshot("preview-5199", "documents"));
    const blog = renderThemeRuntimeModule(workspaceSnapshot("preview-5200", "elegant-blog"));

    expect(documents).toContain('from "@org-zhixing/theme-documents"');
    expect(documents).toContain('"preview-5199"');
    expect(documents.match(/^import .+$/gmu)).toEqual([
      'import isolatedWorkspaceTheme from "@org-zhixing/theme-documents";',
    ]);
    expect(blog).toContain('from "@org-zhixing/theme-elegant-blog"');
    expect(blog).toContain('"preview-5200"');
    expect(blog.match(/^import .+$/gmu)).toEqual([
      'import isolatedWorkspaceTheme from "@org-zhixing/theme-elegant-blog";',
    ]);
  });

  it("fails before bundling when the selected theme is outside the instance catalog", () => {
    expect(() =>
      defineThemeIsolationSnapshot({
        ...workspaceSnapshot("preview", "documents"),
        selectedThemeId: "missing",
      }),
    ).toThrow('THEME-E001 unknown theme "missing"; available: documents, elegant-blog');
  });

  it("enables Module Federation only for independently deployed themes", () => {
    const local = workspaceSnapshot("local", "documents");
    expect(createThemeFederationPlugin(local)).toBeNull();

    const remote = defineThemeIsolationSnapshot({
      instanceId: "remote-documents",
      selectedThemeId: "documents-pro",
      selectedVariant: "mocha",
      watchFiles: ["/site/org-zhixing.toml"],
      catalog: [
        {
          id: "documents-pro",
          package: "@downstream/documents-pro",
          defaultVariant: "mocha",
          variants: ["mocha"],
          transport: {
            kind: "federated",
            module: "documents_pro/theme",
            remoteName: "documents_pro",
            entry: "https://themes.example.com/mf-manifest.json",
            exposedModule: "./theme",
          },
        },
        {
          id: "unused-remote",
          package: "@downstream/unused-theme",
          defaultVariant: "default",
          variants: ["default"],
          transport: {
            kind: "federated",
            module: "unused_remote/theme",
            remoteName: "unused_remote",
            entry: "https://unused.example.com/mf-manifest.json",
            exposedModule: "./theme",
          },
        },
      ],
    });

    expect(renderThemeRuntimeModule(remote)).toContain(
      'from "@module-federation/enhanced/runtime"',
    );
    expect(renderThemeRuntimeModule(remote)).toContain('loadRemote("documents_pro/theme")');
    expect(renderThemeRuntimeModule(remote)).toContain("org-zhixing/theme-module/v1");
    expect(createThemeFederationPlugin(remote)?.name).toBe("rsbuild:module-federation-enhanced");
    expect(selectedThemeFederationRemotes(remote)).toEqual({
      documents_pro: "documents_pro@https://themes.example.com/mf-manifest.json",
    });
  });

  it("resolves a federated theme from the public TOML contract", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "org-zhixing-federation-"));
    try {
      await mkdir(join(workspaceRoot, "themes"));
      await writeFile(
        join(workspaceRoot, "package.json"),
        JSON.stringify({ workspaces: ["themes/*"] }),
      );
      const configPath = join(workspaceRoot, "org-zhixing.toml");
      await writeFile(
        configPath,
        `theme = "documents-pro"
theme_variant = "mocha"

[theme_remotes.documents-pro]
remote = "documents_pro"
entry = "https://themes.example.com/mf-manifest.json"
expose = "./theme"
package = "@downstream/documents-pro"
default_variant = "mocha"
variants = ["latte", "mocha"]
`,
      );

      const snapshot = await resolveThemeIsolation({ workspaceRoot, configPath });
      expect(snapshot.selectedThemeId).toBe("documents-pro");
      expect(snapshot.catalog).toEqual([
        expect.objectContaining({
          id: "documents-pro",
          transport: {
            kind: "federated",
            module: "documents_pro/theme",
            remoteName: "documents_pro",
            entry: "https://themes.example.com/mf-manifest.json",
            exposedModule: "./theme",
          },
        }),
      ]);
      const overridden = await resolveThemeIsolation({
        workspaceRoot,
        configPath,
        themeEntryOverride: "https://preview.example.com/tao3k/mf-manifest.json",
      });
      expect(overridden.catalog[0]?.transport).toMatchObject({
        kind: "federated",
        entry: "https://preview.example.com/tao3k/mf-manifest.json",
      });
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
