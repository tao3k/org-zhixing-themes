import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const normalizeBasePath = (value) => {
  const path = value?.trim() || "/";
  const leading = path.startsWith("/") ? path : `/${path}`;
  return leading.endsWith("/") ? leading : `${leading}/`;
};

const distRoot = resolve(process.env.ORG_ZHIXING_DIST_ROOT ?? "dist");
const basePath = normalizeBasePath(process.env.PUBLIC_BASE_PATH);
const baseElement = `<base href="${basePath}" />`;

for (const name of ["index.html", "404.html"]) {
  const path = resolve(distRoot, name);
  const html = await readFile(path, "utf8");
  const normalized = /<base\s/i.test(html)
    ? html.replace(/<base\s[^>]*>/i, baseElement)
    : html.replace(/<head>/i, `<head>\n    ${baseElement}`);
  await writeFile(path, normalized);
}
