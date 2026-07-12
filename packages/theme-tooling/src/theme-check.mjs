import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateThemePackage } from "./theme-manifest.mjs";

const directory = resolve(process.argv[2] ?? ".");
const packagePath = resolve(directory, "package.json");
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
const theme = validateThemePackage(packageJson, packagePath);

console.log(`theme-check status=ok id=${theme.id} package=${theme.package}`);
