import { resolve } from "node:path";
import { writeRouteShells } from "../../../src/node/routeShellWriter.mjs";

const args = process.argv.slice(2);
const distIndex = args.indexOf("--dist");
const dist = distIndex >= 0 ? args[distIndex + 1] : undefined;

if (!dist) {
  throw new Error("pages-route-shells requires --dist <directory>");
}

await writeRouteShells({ distRoot: resolve(dist), hydrate: true });
