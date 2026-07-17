import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distRoot = resolve(projectRoot, process.env.ORG_ZHIXING_DIST_ROOT ?? "dist");

await copyFile(resolve(distRoot, "index.html"), resolve(distRoot, "404.html"));
