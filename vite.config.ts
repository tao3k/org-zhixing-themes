import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const orgizeRoot = resolve(projectRoot, "../..");
const orgizeWasmRoot = resolve(orgizeRoot, "wasm");
const orgizeWasmDistRoot = resolve(orgizeWasmRoot, "dist");
const sourceRoot = resolve(projectRoot, "src");
const publicRoot = resolve(projectRoot, "public");
const publicBlogRoot = resolve(publicRoot, "blog");
const watchedRootFiles = new Set([
  resolve(projectRoot, "index.html"),
  resolve(projectRoot, "package.json"),
  resolve(projectRoot, "vite.config.ts"),
  resolve(orgizeWasmRoot, "dto.js"),
  resolve(orgizeWasmRoot, "package.json"),
  resolve(orgizeWasmRoot, "worker.js"),
]);

export default defineConfig({
  cacheDir: ".cache/vite",
  optimizeDeps: {
    exclude: ["orgize"],
  },
  server: {
    fs: {
      strict: true,
      allow: [projectRoot, orgizeWasmRoot],
      deny: ["**/.git/**", "**/target/**", "**/.devenv/**", "**/.cache/**"],
    },
    watch: {
      ignored: (path, stats) => shouldIgnoreWatch(path, stats?.isDirectory() ?? false),
    },
  },
});

function shouldIgnoreWatch(path: string, isDirectory: boolean): boolean {
  const candidate = resolve(path);
  if (candidate === orgizeWasmDistRoot || isInside(candidate, orgizeWasmDistRoot)) {
    return false;
  }
  if (isGeneratedPath(candidate)) {
    return true;
  }

  if (isDirectory) {
    return ![sourceRoot, publicBlogRoot, orgizeWasmDistRoot].some(
      (root) => isAncestor(candidate, root) || isInside(candidate, root),
    );
  }

  if (watchedRootFiles.has(candidate)) {
    return false;
  }
  if (isInside(candidate, sourceRoot)) {
    return false;
  }
  if (isPublicRootToml(candidate)) {
    return false;
  }
  if (isInside(candidate, publicBlogRoot)) {
    return !candidate.endsWith(".org");
  }
  if (isInside(candidate, orgizeWasmDistRoot)) {
    return false;
  }
  return true;
}

function isGeneratedPath(path: string): boolean {
  return [".cache", ".devenv", ".git", "dist", "dist-ssr", "node_modules", "target"].some(
    (segment) => path.includes(`${sep}${segment}${sep}`) || path.endsWith(`${sep}${segment}`),
  );
}

function isAncestor(candidate: string, target: string): boolean {
  return isInside(target, candidate);
}

function isPublicRootToml(candidate: string): boolean {
  return (
    candidate.endsWith(".toml") &&
    !relative(publicRoot, candidate).includes(sep) &&
    isInside(candidate, publicRoot)
  );
}

function isInside(candidate: string, root: string): boolean {
  const path = relative(root, candidate);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}
