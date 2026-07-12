import { access, cp, mkdir, rename, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const source = join(root, "dist");
const output = join(root, ".cache/lighthouse");
const temporaryOutput = `${output}.${process.pid}.tmp`;

await access(join(source, "index.html"));
await rm(temporaryOutput, { recursive: true, force: true });
await cp(source, temporaryOutput, { recursive: true });
await mkdir(join(temporaryOutput, "org-zhixing-themes"), { recursive: true });
await cp(source, join(temporaryOutput, "org-zhixing-themes"), { recursive: true });
await rm(output, { recursive: true, force: true });
await rename(temporaryOutput, output);
console.log("lighthouse-static-root deployment=/org-zhixing-themes");
