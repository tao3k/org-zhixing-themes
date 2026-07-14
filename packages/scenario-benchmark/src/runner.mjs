import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
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
  const config = parse(await readFile(join(root, "public/org-zhixing.toml"), "utf8"));
  const selectedTheme = typeof config.theme === "string" ? config.theme : "elegant-blog";
  const unselectedPackages = [...catalog.entries()]
    .filter(([id]) => id !== selectedTheme)
    .map(([, theme]) => theme.package);
  let unselectedThemeMarkers = 0;
  for (const file of js) {
    const source = await readFile(file, "utf8");
    for (const marker of unselectedPackages) unselectedThemeMarkers += occurrences(source, marker);
  }
  return {
    totalJsBytes: await totalBytes(js),
    entryJsBytes: await totalBytes(js.filter((file) => /\/app\.[^.]+\.js$/.test(file))),
    totalCssBytes: await totalBytes(css),
    jsAssetCount: js.length,
    cssAssetCount: css.length,
    unselectedThemeMarkers,
  };
}

function limitsFor(metrics) {
  return {
    totalJsBytes: Math.ceil(metrics.totalJsBytes * 1.05),
    entryJsBytes: Math.ceil(metrics.entryJsBytes * 1.05),
    totalCssBytes: Math.ceil(metrics.totalCssBytes * 1.05),
    jsAssetCount: metrics.jsAssetCount,
    cssAssetCount: metrics.cssAssetCount,
    unselectedThemeMarkers: 0,
  };
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
