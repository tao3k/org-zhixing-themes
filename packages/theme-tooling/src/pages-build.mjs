#!/usr/bin/env node
import { spawn } from "node:child_process";
import { copyFile, cp, mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve } from "node:path";
import { parse } from "smol-toml";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

export const parsePagesBuildArgs = (argv, workspaceRoot = process.cwd()) => {
  const required = (flag) => {
    const index = argv.indexOf(flag);
    const value = index === -1 ? null : argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`PAGES-E001 missing required ${flag}`);
    }
    return value;
  };
  const optional = (flag) => {
    const index = argv.indexOf(flag);
    const value = index === -1 ? null : argv[index + 1];
    if (index !== -1 && (!value || value.startsWith("--"))) {
      throw new Error(`PAGES-E001 missing value for ${flag}`);
    }
    return value;
  };
  const known = new Set(["--base", "--config", "--content", "--out"]);
  for (let index = 0; index < argv.length; index += 2) {
    if (!known.has(argv[index])) throw new Error(`PAGES-E001 unknown option ${argv[index]}`);
  }
  return {
    basePath: optional("--base"),
    configPath: resolve(workspaceRoot, required("--config")),
    contentDir: resolve(workspaceRoot, required("--content")),
    outputDir: resolve(workspaceRoot, required("--out")),
    workspaceRoot: resolve(workspaceRoot),
  };
};

export const validatePagesBuildConfig = async (options) => {
  await assertFile(options.configPath, "config");
  await assertDirectory(options.contentDir, "content");
  assertSafeOutput(options);
  const source = await readFile(options.configPath, "utf8");
  const config = parse(source);
  const configuredBasePath = basePathFromConfig(config);
  const requestedBasePath = options.basePath ? normalizeBasePath(options.basePath) : null;
  if (requestedBasePath && requestedBasePath !== configuredBasePath) {
    throw new Error(
      `PAGES-E003 --base ${requestedBasePath} does not match config base ${configuredBasePath}`,
    );
  }
  return { ...options, basePath: requestedBasePath ?? configuredBasePath };
};

export const pagesBuildEnvironment = (environment, options, cacheRoot) => ({
  ...environment,
  ORG_ZHIXING_BASE_PATH: options.basePath,
  ORG_ZHIXING_CACHE_ROOT: cacheRoot,
  ORG_ZHIXING_CONFIG: options.configPath,
  ORG_ZHIXING_CONTENT_DIR: options.contentDir,
});

export const runPagesBuild = async (options) => {
  const validated = await validatePagesBuildConfig(options);
  const cacheRoot = await mkdtemp(join(tmpdir(), "org-zhixing-pages-"));
  const internalDist = resolve(cacheRoot, "dist");
  const buildEnv = {
    ...pagesBuildEnvironment(process.env, validated, cacheRoot),
    ORG_ZHIXING_DIST_ROOT: internalDist,
  };
  let buildStarted = false;
  try {
    await runNpm(
      ["run", "test:docs", "--", validated.contentDir],
      validated.workspaceRoot,
      buildEnv,
    );
    await runNpm(
      ["run", "test:contracts", "--", validated.configPath],
      options.workspaceRoot,
      buildEnv,
    );
    buildStarted = true;
    await runNpm(["run", "build"], validated.workspaceRoot, buildEnv);
    const routeShells = await materializeStaticRouteShells(internalDist);
    if (validated.outputDir !== internalDist) {
      await rm(validated.outputDir, { force: true, recursive: true });
      await cp(internalDist, validated.outputDir, { recursive: true });
    }
    console.log(
      `pages-build ok base=${validated.basePath} out=${validated.outputDir} routes=${routeShells}`,
    );
  } finally {
    await rm(cacheRoot, { force: true, recursive: true });
    if (buildStarted) await restoreCanonicalRegistry(validated.workspaceRoot);
  }
};

export const materializeStaticRouteShells = async (distRoot) => {
  const projection = JSON.parse(
    await readFile(resolve(distRoot, "org-zhixing.static.json"), "utf8"),
  );
  const sourceIds = new Set(
    (projection.blog?.articles ?? [])
      .map((article) => article.sourceId)
      .filter((sourceId) => typeof sourceId === "string" && sourceId.length > 0),
  );

  for (const sourceId of sourceIds) {
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(sourceId)) {
      throw new Error(`PAGES-E005 unsafe static route: ${sourceId}`);
    }
    await copyFile(resolve(distRoot, "index.html"), resolve(distRoot, `${sourceId}.html`));
    const routeDirectory = resolve(distRoot, sourceId);
    await mkdir(routeDirectory, { recursive: true });
    await copyFile(resolve(distRoot, "index.html"), resolve(routeDirectory, "index.html"));
  }

  return sourceIds.size;
};

const runNpm = (args, cwd, env) =>
  new Promise((resolveRun, reject) => {
    const child = spawn(npmCommand, args, { cwd, env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolveRun()
        : reject(new Error(`PAGES-E004 npm ${args.join(" ")} failed with ${code}`)),
    );
  });

const restoreCanonicalRegistry = async (workspaceRoot) => {
  const canonicalEnv = { ...process.env };
  delete canonicalEnv.ORG_ZHIXING_BASE_PATH;
  delete canonicalEnv.ORG_ZHIXING_CACHE_ROOT;
  delete canonicalEnv.ORG_ZHIXING_CONFIG;
  delete canonicalEnv.ORG_ZHIXING_CONTENT_DIR;
  await runNpm(["run", "generate:theme-assets"], workspaceRoot, canonicalEnv);
};

const basePathFromConfig = (config) => {
  const site = config.site && typeof config.site === "object" ? config.site : {};
  if (typeof site.base_path === "string") return normalizeBasePath(site.base_path);
  if (typeof site.base_url === "string") {
    try {
      return normalizeBasePath(new URL(site.base_url).pathname);
    } catch {
      return normalizeBasePath(site.base_url);
    }
  }
  return "/";
};

const normalizeBasePath = (value) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "/";
  return `/${trimmed.replace(/^\/+|\/+$/gu, "")}`;
};

const assertFile = async (path, label) => {
  try {
    if ((await stat(path)).isFile()) return;
  } catch {
    // Normalize inaccessible paths to the public Pages error.
  }
  throw new Error(`PAGES-E002 ${label} is not a file: ${path}`);
};

const assertDirectory = async (path, label) => {
  try {
    if ((await stat(path)).isDirectory()) return;
  } catch {
    // Normalize inaccessible paths to the public Pages error.
  }
  throw new Error(`PAGES-E002 ${label} is not a directory: ${path}`);
};

const assertSafeOutput = ({ configPath, contentDir, outputDir, workspaceRoot }) => {
  const protectedPaths = [workspaceRoot, contentDir, resolve(configPath, "..")];
  if (protectedPaths.some((path) => path === outputDir || isInside(outputDir, path))) {
    throw new Error(`PAGES-E002 unsafe output directory: ${outputDir}`);
  }
  if (basename(outputDir).length === 0) throw new Error(`PAGES-E002 unsafe output directory`);
};

const isInside = (parent, candidate) => {
  const path = relative(parent, candidate);
  return path !== "" && !path.startsWith("..") && !path.startsWith("/");
};

if (import.meta.url === `file://${process.argv[1]}`) {
  await runPagesBuild(parsePagesBuildArgs(process.argv.slice(2)));
}
