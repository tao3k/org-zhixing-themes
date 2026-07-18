import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const normalizeBasePath = (value) => {
  const path = value?.trim() || "/";
  const leading = path.startsWith("/") ? path : `/${path}`;
  return leading.endsWith("/") ? leading : `${leading}/`;
};

export const spaShellBasePath = (environment = process.env) =>
  normalizeBasePath(environment.ORG_ZHIXING_BASE_PATH ?? environment.PUBLIC_BASE_PATH);

export const normalizeSpaShells = async ({
  distRoot = resolve(process.env.ORG_ZHIXING_DIST_ROOT ?? "dist"),
  basePath = spaShellBasePath(),
} = {}) => {
  const baseElement = `<base href="${normalizeBasePath(basePath)}" />`;
  for (const name of ["index.html", "404.html"]) {
    const path = resolve(distRoot, name);
    const html = await readFile(path, "utf8");
    const normalized = /<base\s/i.test(html)
      ? html.replace(/<base\s[^>]*>/i, baseElement)
      : html.replace(/<head>/i, `<head>\n    ${baseElement}`);
    await writeFile(path, normalized);
  }
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) await normalizeSpaShells();
