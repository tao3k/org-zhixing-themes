import { mkdir, readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import init, { Org } from "../../../wasm/dist/orgize.js";

const args = new Map(
  process.argv
    .slice(2)
    .map((arg) => arg.split("="))
    .filter(([key, value]) => key && value)
    .map(([key, value]) => [key.replace(/^--/, ""), value]),
);

const iterations = numberArg("iterations", 20);
const warmups = numberArg("warmups", 3);
const repeat = numberArg("repeat", 1);
const sourceFile = args.get("source") ?? "blog/org-zhixing-demo.org";
const sourcePath = new URL(`../public/${sourceFile}`, import.meta.url);
const wasmPath = new URL("../../../wasm/dist/orgize_bg.wasm", import.meta.url);
const artifactPath = new URL("../.cache/perf/org-zhixing-wasm.json", import.meta.url);

const rawSource = await readFile(sourcePath, "utf8");
const source = repeatSource(rawSource, repeat);
const wasmBytes = await readFile(wasmPath);

const initStarted = performance.now();
await init({ module_or_path: wasmBytes });
const initMs = performance.now() - initStarted;

const parseNew = sample("parseNew", () => {
  const org = new Org(source);
  org.free();
});
const parseViewIndexNew = sampleJson("parseViewIndexNew", () => {
  const org = new Org(source);
  try {
    return org.viewIndexJson(sourceFile);
  } finally {
    org.free();
  }
});

const org = new Org(source);
const update = sample("update", () => org.update(source));
const updateViewIndex = sampleJson("updateViewIndex", () => {
  org.update(source);
  return org.viewIndexJson(sourceFile);
});
const sectionIndexJson = sampleJson("sectionIndexJson", () => org.sectionIndexJson(sourceFile));
const viewIndexJson = sampleJson("viewIndexJson", () => org.viewIndexJson(sourceFile));
const viewIndexPayload = org.viewIndexJson(sourceFile);
const sectionIndexPayload = org.sectionIndexJson(sourceFile);
const viewIndexJsonParse = sampleJsonParse("viewIndexJsonParse", viewIndexPayload);
const sectionIndexJsonParse = sampleJsonParse("sectionIndexJsonParse", sectionIndexPayload);
const lintJson = sampleJson("lintJson", () => org.lintJson());
const html = sampleText("html", () => org.html());
org.free();

const report = {
  schemaVersion: 1,
  source: sourceFile,
  sourceBytes: Buffer.byteLength(source),
  repeat,
  iterations,
  warmups,
  initMs: round(initMs),
  measurements: {
    parseNew,
    parseViewIndexNew,
    update,
    updateViewIndex,
    sectionIndexJson,
    viewIndexJson,
    viewIndexJsonParse,
    sectionIndexJsonParse,
    lintJson,
    html,
  },
};

await mkdir(new URL("../.cache/perf/", import.meta.url), { recursive: true });
await writeFile(artifactPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`org-zhixing wasm perf (${sourceFile}, repeat=${repeat})`);
console.log(`init ${formatMs(report.initMs)}`);
for (const [name, measurement] of Object.entries(report.measurements)) {
  console.log(
    `${name.padEnd(22)} p50 ${formatMs(measurement.p50Ms).padStart(8)} p95 ${formatMs(
      measurement.p95Ms,
    ).padStart(8)} avg ${formatMs(measurement.avgMs).padStart(8)} size ${
      measurement.lastSize ?? "-"
    }`,
  );
}
console.log(`artifact ${fileURLToPath(artifactPath)}`);

function sampleJson(name, fn) {
  return sample(name, fn, (value) => Buffer.byteLength(value));
}

function sampleJsonParse(name, payload) {
  return sample(
    name,
    () => JSON.parse(payload),
    (value) => {
      if (Array.isArray(value.records)) {
        return value.records.length;
      }
      return 0;
    },
  );
}

function sampleText(name, fn) {
  return sample(name, fn, (value) => Buffer.byteLength(value));
}

function sample(name, fn, sizeOf = () => undefined) {
  for (let index = 0; index < warmups; index += 1) {
    fn();
  }

  const values = [];
  let lastSize;
  for (let index = 0; index < iterations; index += 1) {
    const started = performance.now();
    const value = fn();
    values.push(performance.now() - started);
    lastSize = sizeOf(value);
  }
  values.sort((left, right) => left - right);

  return {
    name,
    minMs: round(values[0] ?? 0),
    p50Ms: round(percentile(values, 0.5)),
    p95Ms: round(percentile(values, 0.95)),
    maxMs: round(values.at(-1) ?? 0),
    avgMs: round(values.reduce((sum, value) => sum + value, 0) / values.length),
    lastSize,
  };
}

function percentile(values, ratio) {
  if (values.length === 0) {
    return 0;
  }
  const index = Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1);
  return values[index];
}

function repeatSource(source, count) {
  if (count <= 1) {
    return source;
  }
  return Array.from({ length: count }, (_, index) =>
    source.replace("#+TITLE: Org Zhixing Demo", `#+TITLE: Org Zhixing Demo ${index + 1}`),
  ).join("\n");
}

function numberArg(name, fallback) {
  const value = Number(args.get(name) ?? process.env[`ORG_ZHIXING_${name.toUpperCase()}`]);
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function formatMs(value) {
  return `${value.toFixed(value < 10 ? 2 : 1)}ms`;
}
