#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
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

export const themePreviewUrl = (port) => `http://127.0.0.1:${port}/blogs`;

export const themePreviewEnvironment = (environment, previewConfig, cacheRoot) => ({
  ...environment,
  ORG_ZHIXING_BASE_PATH: "/",
  ORG_ZHIXING_CACHE_ROOT: cacheRoot,
  ORG_ZHIXING_CONFIG: previewConfig,
});

const parseArgs = (argv) => {
  const value = (flag, fallback) => {
    const index = argv.indexOf(flag);
    return index === -1 ? fallback : argv[index + 1];
  };
  return {
    dryRun: argv.includes("--dry-run"),
    port: value("--port", "5173"),
    theme: argv[0] === "list" ? "list" : value("--theme", "elegant-blog"),
  };
};

const main = async () => {
  const workspaceRoot = process.cwd();
  const { dryRun, port, theme } = parseArgs(process.argv.slice(2));
  if (theme === "list") {
    console.log(formatThemeList(await discoverThemes(workspaceRoot)));
    return;
  }
  if (!/^\d{2,5}$/u.test(port)) throw new Error(`THEME-E022 invalid port ${port}`);
  const selected = await resolveThemePreview({ theme, workspaceRoot });
  const previewConfigName = themePreviewConfigName(selected.id, port);
  const trackedConfig = resolve(workspaceRoot, "public/org-zhixing.toml");
  const previewCacheRoot = resolve(workspaceRoot, ".cache/org-zhixing-preview", port);
  const previewConfig = resolve(previewCacheRoot, previewConfigName);
  const releaseLease = await acquirePreviewLease(workspaceRoot, port);
  try {
    const source = await readFile(trackedConfig, "utf8");
    await mkdir(previewCacheRoot, { recursive: true });
    await writeFile(
      previewConfig,
      replaceThemeSelection(source, selected.id, selected.defaultVariant),
      "utf8",
    );
    const cleanup = () => rm(previewConfig, { force: true });
    console.log(`theme-preview theme=${selected.id} initial-variant=${selected.defaultVariant}`);
    console.log(`open ${themePreviewUrl(port)}`);
    if (dryRun) {
      await cleanup();
      return;
    }
    let exitCode = 1;
    let interrupted = false;
    try {
      const child = spawn("npm", ["run", "dev", "--", "--port", port], {
        cwd: workspaceRoot,
        env: themePreviewEnvironment(process.env, previewConfig, previewCacheRoot),
        stdio: "inherit",
      });
      const stop = (signal) => {
        interrupted = true;
        child.kill(signal);
      };
      process.once("SIGINT", () => stop("SIGINT"));
      process.once("SIGTERM", () => stop("SIGTERM"));
      exitCode = await new Promise((resolveExit, reject) => {
        child.once("error", reject);
        child.once("exit", resolveExit);
      });
    } finally {
      await cleanup();
      await runCanonicalRegistryGeneration(workspaceRoot);
    }
    process.exitCode = interrupted ? 0 : typeof exitCode === "number" ? exitCode : 1;
  } finally {
    await releaseLease();
  }
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

const runCanonicalRegistryGeneration = (workspaceRoot) =>
  new Promise((resolveRun, reject) => {
    const { ORG_ZHIXING_CONFIG: _previewConfig, ...canonicalEnv } = process.env;
    const child = spawn("npm", ["run", "generate:themes"], {
      cwd: workspaceRoot,
      env: canonicalEnv,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolveRun() : reject(new Error(`THEME-E023 registry restore failed: ${code}`)),
    );
  });

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
