import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { writeRouteShells } from "../../../src/node/routeShellWriter.mjs";

await import("./prepare-lighthouse.mjs");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const deploymentRoot = join(root, ".cache/lighthouse/org-zhixing-themes");

await writeRouteShells({ distRoot: deploymentRoot });
console.log(`browser-static-root deployment=${deploymentRoot}`);
