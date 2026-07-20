import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { parse } from "smol-toml";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const command = process.argv[2] ?? "check";
const scenarioRoot = join(root, "benchmarks/scenarios");
const baselinePath = join(root, "benchmarks/baselines/deterministic.json");
const schema = JSON.parse(await readFile(join(root, "benchmarks/schema/scenario.schema.json")));
const validate = new Ajv2020({ allErrors: true }).compile(schema);
const catalog = await loadThemeCatalog();
const scenarios = await loadScenarios();

if (command === "check") {
  const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
  const current = await collectBuildMetrics();
  const failures = compareMetrics(current, baseline.limits);
  if (failures.length > 0) {
    throw new Error(`SCENARIO-E002 deterministic baseline failed:\n${failures.join("\n")}`);
  }
  console.log(
    `scenario-check status=ok scenarios=${scenarios.length} metrics=${Object.keys(current).length}`,
  );
} else if (command === "update-baseline") {
  const current = await collectBuildMetrics();
  const hardGateFailures = compareMetrics(current, {
    unselectedThemeMarkers: 0,
    federationArtifactCount: 0,
  });
  if (hardGateFailures.length > 0) {
    throw new Error(
      `SCENARIO-E003 refusing to baseline an isolation failure:\n${hardGateFailures.join("\n")}`,
    );
  }
  const previous = await optionalJson(baselinePath);
  const next = {
    schemaVersion: 1,
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    observed: current,
    limits: limitsFor(current),
  };
  await writeFile(baselinePath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`scenario-baseline status=updated scenarios=${scenarios.length}`);
  for (const [name, value] of Object.entries(current)) {
    const oldValue = previous?.observed?.[name];
    const delta =
      typeof oldValue === "number" && oldValue !== 0 ? ((value - oldValue) / oldValue) * 100 : null;
    console.log(
      `metric=${name} old=${oldValue ?? "none"} new=${value} delta=${delta === null ? "new" : `${round(delta)}%`}`,
    );
  }
} else {
  throw new Error(`SCENARIO-E001 unknown command "${command}"`);
}

async function loadScenarios() {
  const sources = [
    ...(await scenarioFiles(scenarioRoot)),
    ...(
      await Promise.all(
        [...catalog.values()].map((theme) =>
          scenarioFiles(join(theme.directory, "benchmarks/scenarios")),
        ),
      )
    ).flat(),
  ].sort((left, right) => left.path.localeCompare(right.path));
  const ids = new Set();
  const loaded = [];
  for (const source of sources) {
    const scenario = JSON.parse(await readFile(source.path, "utf8"));
    if (!validate(scenario)) {
      throw new Error(
        `SCENARIO-E001 ${source.label}: ${validate.errors?.map((error) => `${error.instancePath} ${error.message}`).join("; ")}`,
      );
    }
    if (ids.has(scenario.id))
      throw new Error(`SCENARIO-E001 duplicate scenario id "${scenario.id}"`);
    ids.add(scenario.id);
    const theme = catalog.get(scenario.theme);
    if (!theme) throw new Error(`SCENARIO-E001 ${source.label}: unknown theme "${scenario.theme}"`);
    if (!theme.variants.includes(scenario.variant)) {
      throw new Error(`SCENARIO-E001 ${source.label}: unknown variant "${scenario.variant}"`);
    }
    loaded.push(scenario);
  }
  if (loaded.length === 0) throw new Error("SCENARIO-E001 no scenarios found");
  return loaded;
}

async function scenarioFiles(directory) {
  try {
    return (await readdir(directory))
      .filter((file) => extname(file) === ".json")
      .map((file) => ({ label: file, path: join(directory, file) }));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function loadThemeCatalog() {
  const catalog = new Map();
  const themeRoot = join(root, "themes");
  for (const entry of await readdir(themeRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const packageJson = await optionalJson(join(themeRoot, entry.name, "package.json"));
    if (!packageJson?.orgZhixing) continue;
    catalog.set(packageJson.orgZhixing.id, {
      directory: join(themeRoot, entry.name),
      variants: packageJson.orgZhixing.variants ?? [],
      package: packageJson.name,
    });
  }
  return catalog;
}

async function collectBuildMetrics() {
  const distRoot = join(root, "dist");
  const files = await filesBelow(distRoot);
  const js = files.filter((file) => extname(file) === ".js");
  const css = files.filter((file) => extname(file) === ".css");
  const manifest = JSON.parse(await readFile(join(distRoot, "asset-manifest.json"), "utf8"));
  const initial = manifest.entries?.app?.initial;
  if (!Array.isArray(initial?.js) || !Array.isArray(initial?.css)) {
    throw new Error("SCENARIO-E003 asset manifest is missing the app initial asset set");
  }
  const initialJs = buildAssetPaths(distRoot, initial.js);
  const initialCss = buildAssetPaths(distRoot, initial.css);
  const config = parse(await readFile(join(root, "public/org-zhixing.toml"), "utf8"));
  const selectedTheme = typeof config.theme === "string" ? config.theme : "elegant-blog";
  const unselectedPackages = [...catalog.entries()]
    .filter(([id]) => id !== selectedTheme)
    .map(([, theme]) => theme.package);
  let unselectedThemeMarkers = 0;
  for (const file of js) {
    const source = await readFile(file, "utf8");
    for (const marker of unselectedPackages) {
      const count = occurrences(source, marker);
      unselectedThemeMarkers += count;
      if (count > 0) {
        console.error(
          `scenario-isolation-leak file=${file.slice(root.length + 1)} marker=${marker} count=${count}`,
        );
      }
    }
  }
  return {
    artifactJsBytes: await totalBytes(js),
    artifactCssBytes: await totalBytes(css),
    artifactJsAssetCount: js.length,
    artifactCssAssetCount: css.length,
    initialJsBytes: await totalBytes(initialJs),
    entryJsBytes: await totalBytes(initialJs.filter((file) => /\/app\.[^.]+\.js$/.test(file))),
    initialCssBytes: await totalBytes(initialCss),
    initialJsAssetCount: initialJs.length,
    initialCssAssetCount: initialCss.length,
    unselectedThemeMarkers,
    federationArtifactCount: files.filter((file) => /\/mf-(?:manifest|stats)\.json$/u.test(file))
      .length,
  };
}

function limitsFor(metrics) {
  return {
    artifactJsBytes: Math.ceil(metrics.artifactJsBytes * 1.05),
    artifactCssBytes: Math.ceil(metrics.artifactCssBytes * 1.05),
    artifactJsAssetCount: metrics.artifactJsAssetCount,
    artifactCssAssetCount: metrics.artifactCssAssetCount,
    initialJsBytes: Math.ceil(metrics.initialJsBytes * 1.05),
    entryJsBytes: Math.ceil(metrics.entryJsBytes * 1.05),
    initialCssBytes: Math.ceil(metrics.initialCssBytes * 1.05),
    initialJsAssetCount: metrics.initialJsAssetCount,
    initialCssAssetCount: metrics.initialCssAssetCount,
    unselectedThemeMarkers: 0,
    federationArtifactCount: 0,
  };
}

function buildAssetPaths(distRoot, assets) {
  return assets.map((asset) => {
    if (typeof asset !== "string") {
      throw new Error("SCENARIO-E004 asset manifest contains a non-string path");
    }
    const path = resolve(distRoot, asset);
    const localPath = relative(distRoot, path);
    if (localPath.startsWith("..") || isAbsolute(localPath)) {
      throw new Error(`SCENARIO-E005 asset manifest path escapes dist: ${asset}`);
    }
    return path;
  });
}

function compareMetrics(current, limits) {
  return Object.entries(limits).flatMap(([name, limit]) =>
    current[name] > limit ? [`metric=${name} current=${current[name]} limit=${limit}`] : [],
  );
}

async function filesBelow(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(path)));
    else files.push(path);
  }
  return files;
}

async function totalBytes(files) {
  let total = 0;
  for (const file of files) total += (await stat(file)).size;
  return total;
}

async function optionalJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function occurrences(source, marker) {
  return source.split(marker).length - 1;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
