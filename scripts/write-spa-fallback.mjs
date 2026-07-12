import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeRouteShells } from "../src/node/routeShellWriter.mjs";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

await writeRouteShells({ distRoot: resolve(projectRoot, "dist") });
