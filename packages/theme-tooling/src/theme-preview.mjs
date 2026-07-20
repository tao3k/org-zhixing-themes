#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, open, readFile, rm, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { discoverThemes, formatThemeList } from "./theme-list.mjs";

export const replaceThemeSelection = (source, theme, variant) => {
  const replace = (text, key, value) => {
    const line = new RegExp(`^${key}\\s*=.*$`, "mu");
    const assignment = `${key} = ${JSON.stringify(value)}`;
    return line.test(text) ? text.replace(line, assignment) : `${assignment}\n${text}`;
  };
  return replace(replace(source, "theme", theme), "theme_variant", variant);
};

export const replaceThemePreviewSelection = (source, theme) => {
  const selected = replaceThemeSelection(source, theme.id, theme.defaultVariant);
  if (theme.content?.routeMode !== "documents") return selected;
  const documentsSelection = replaceSectionAssignment(
    replaceSectionAssignment(selected, "content", "content_dir", theme.content.directory),
    "content",
    "content_base",
    theme.content.base,
  );
  return documentsSelection
    .replace(
      /^content_dirs\s*=.*$/m,
      `content_dirs = [${JSON.stringify(theme.content.directory.startsWith("/") ? "docs" : theme.content.directory)}]`,
    )
    .replace(
      /^content_base\s*=.*$/m,
      `content_base = ${JSON.stringify(theme.content.base === "public" ? "public" : "workspace")}`,
    )
    .replace(
      /^content_dir\s*=.*$/m,
      `content_dir = ${JSON.stringify(theme.content.directory.startsWith("/") ? "docs" : theme.content.directory)}`,
    );
};

const replaceSectionAssignment = (source, section, key, value) => {
  const header = new RegExp(`^\\[${section}\\]\\s*$`, "mu");
  const match = header.exec(source);
  if (!match) return `${source.trimEnd()}\n\n[${section}]\n${key} = ${JSON.stringify(value)}\n`;
  const bodyStart = match.index + match[0].length;
  const nextHeaderOffset = source.slice(bodyStart).search(/^\s*\[/mu);
  const bodyEnd = nextHeaderOffset === -1 ? source.length : bodyStart + nextHeaderOffset;
  const body = source.slice(bodyStart, bodyEnd);
  const assignment = `${key} = ${JSON.stringify(value)}`;
  const line = new RegExp(`^${key}\\s*=.*$`, "mu");
  const nextBody = line.test(body)
    ? body.replace(line, assignment)
    : `${body.trimEnd()}\n${assignment}\n`;
  return `${source.slice(0, bodyStart)}${nextBody}${source.slice(bodyEnd)}`;
};

export const resolveThemePreview = async ({ theme, workspaceRoot = process.cwd() }) => {
  const themes = await discoverThemes(workspaceRoot);
  const selected = themes.find(
    (candidate) => candidate.id === theme || candidate.directory === resolve(workspaceRoot, theme),
  );
  if (!selected) {
    throw new Error(
      `THEME-E020 unknown theme ${theme}; available: ${themes.map(({ id }) => id).join(", ")}`,
    );
  }
  return selected;
};

export const themePreviewConfigName = (theme, port) => `org-zhixing-preview-${theme}-${port}.toml`;

export const themePreviewUrl = (port, theme) =>
  `http://127.0.0.1:${port}${theme?.content?.routeMode === "documents" ? "/" : "/blogs"}`;

export const themePreviewEnvironment = (
  environment,
  previewConfig,
  cacheRoot,
  contentDir = null,
) => ({
  ...environment,
  ORG_ZHIXING_BASE_PATH: "/",
  ORG_ZHIXING_CACHE_ROOT: cacheRoot,
  ORG_ZHIXING_CONFIG: previewConfig,
  ...(contentDir ? { ORG_ZHIXING_CONTENT_DIR: contentDir } : {}),
});

const parseArgs = (argv) => {
  const value = (flag, fallback) => {
    const index = argv.indexOf(flag);
    return index === -1 ? fallback : argv[index + 1];
  };
  return {
    contentDir: value("--content-dir", null),
    dryRun: argv.includes("--dry-run"),
    port: value("--port", "5173"),
    theme: argv[0] === "list" ? "list" : value("--theme", "elegant-blog"),
  };
};

const main = async () => {
  const workspaceRoot = process.cwd();
  const { contentDir, dryRun, port, theme } = parseArgs(process.argv.slice(2));
  if (theme === "list") {
    console.log(formatThemeList(await discoverThemes(workspaceRoot)));
    return;
  }
  if (!/^\d{2,5}$/u.test(port)) throw new Error(`THEME-E022 invalid port ${port}`);
  const selected = await resolveThemePreview({ theme, workspaceRoot });
  if (contentDir && selected.content?.routeMode !== "documents") {
    throw new Error("THEME-E025 --content-dir requires a documents theme");
  }
  const externalContentDir = contentDir ? resolve(workspaceRoot, contentDir) : null;
  if (externalContentDir) await assertContentDirectory(externalContentDir);
  if (externalContentDir) {
    process.env.ORG_ZHIXING_CONTENT_DIR = externalContentDir;
  }
  const previewTheme = externalContentDir
    ? {
        ...selected,
        content: {
          ...selected.content,
          base: "filesystem",
          directory: externalContentDir,
        },
      }
    : selected;
  const previewConfigName = themePreviewConfigName(selected.id, port);
  const trackedConfig = resolve(workspaceRoot, "public/org-zhixing.toml");
  const previewCacheRoot = resolve(workspaceRoot, ".cache/org-zhixing-preview", port);
  const previewConfig = resolve(previewCacheRoot, previewConfigName);
  const releaseLease = await acquirePreviewLease(workspaceRoot, port);
  try {
    const source = await readFile(trackedConfig, "utf8");
    await mkdir(previewCacheRoot, { recursive: true });
    await writeFile(previewConfig, replaceThemePreviewSelection(source, previewTheme), "utf8");
    const cleanup = () => rm(previewConfig, { force: true });
    console.log(`theme-preview theme=${selected.id} initial-variant=${selected.defaultVariant}`);
    if (externalContentDir) console.log(`content ${externalContentDir}`);
    console.log(`open ${themePreviewUrl(port, selected)}`);
    if (dryRun) {
      await cleanup();
      return;
    }
    let exitCode = 1;
    let interrupted = false;
    try {
      const previewEnvironment = themePreviewEnvironment(
        process.env,
        previewConfig,
        previewCacheRoot,
      );
      const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
      for (const [command, arguments_] of [
        [npmCommand, ["run", "generate:theme-assets"]],
        [process.execPath, ["--import", "tsx", "scripts/generate-static-site.mjs"]],
      ]) {
        const preparation = spawn(command, arguments_, {
          cwd: workspaceRoot,
          env: previewEnvironment,
          stdio: "inherit",
        });
        const preparationExitCode = await new Promise((resolveExit, reject) => {
          preparation.once("error", reject);
          preparation.once("exit", resolveExit);
        });
        if (preparationExitCode !== 0) {
          throw new Error(
            `THEME-E026 preview preparation failed with exit code ${preparationExitCode}`,
          );
        }
      }
      const child = spawn(
        resolve(workspaceRoot, "node_modules/.bin/rsbuild"),
        ["dev", "--port", port],
        {
          cwd: workspaceRoot,
          env: previewEnvironment,
          stdio: "inherit",
        },
      );
      let forceStopTimer;
      const signalChildTree = (signal) => {
        if (child.pid === undefined || child.exitCode !== null || child.signalCode !== null) return;
        try {
          child.kill(signal);
        } catch (error) {
          if (error?.code !== "ESRCH") throw error;
        }
      };
      const stop = (signal) => {
        interrupted = true;
        signalChildTree(signal);
        if (forceStopTimer === undefined) {
          forceStopTimer = setTimeout(() => signalChildTree("SIGKILL"), 2_000);
          forceStopTimer.unref();
        }
      };
      const stopOnInterrupt = () => stop("SIGINT");
      const stopOnTerminate = () => stop("SIGTERM");
      process.once("SIGINT", stopOnInterrupt);
      process.once("SIGTERM", stopOnTerminate);
      try {
        exitCode = await new Promise((resolveExit, reject) => {
          child.once("error", reject);
          child.once("exit", resolveExit);
        });
      } finally {
        process.removeListener("SIGINT", stopOnInterrupt);
        process.removeListener("SIGTERM", stopOnTerminate);
        if (forceStopTimer !== undefined) clearTimeout(forceStopTimer);
      }
    } finally {
      await cleanup();
    }
    process.exitCode = interrupted ? 0 : typeof exitCode === "number" ? exitCode : 1;
  } finally {
    await releaseLease();
  }
};

const assertContentDirectory = async (directory) => {
  try {
    if ((await stat(directory)).isDirectory()) return;
  } catch {
    // Normalize missing and inaccessible paths to the public tooling error.
  }
  throw new Error(`THEME-E026 content directory is not a directory: ${directory}`);
};

const acquirePreviewLease = async (workspaceRoot, port) => {
  const leaseRoot = resolve(workspaceRoot, ".cache/org-zhixing-preview");
  const leasePath = resolve(leaseRoot, `${port}.lock`);
  await mkdir(leaseRoot, { recursive: true });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = await open(leasePath, "wx");
      await handle.writeFile(`${process.pid}\n`, "utf8");
      return async () => {
        await handle.close();
        await rm(leasePath, { force: true });
      };
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const owner = Number.parseInt(await readFile(leasePath, "utf8"), 10);
      if (Number.isInteger(owner) && processIsAlive(owner)) {
        throw new Error(`THEME-E024 preview port ${port} is already owned by process ${owner}`);
      }
      await rm(leasePath, { force: true });
    }
  }
  throw new Error(`THEME-E024 unable to acquire preview port ${port}`);
};

const processIsAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
