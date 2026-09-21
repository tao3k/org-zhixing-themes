import { checkOrgStaticRendering } from "../src/node/orgStaticMediaCheck.ts";

const distRoot = process.argv[2] ?? "dist";
try {
  const result = await checkOrgStaticRendering(distRoot);
  console.log(
    `org-static-render ok files=${result.files} mermaid=${result.mermaidBlocks} typst=${result.typstBlocks} previews=${result.previews}`,
  );
} catch (cause) {
  console.error(cause instanceof Error ? cause.message : String(cause));
  process.exitCode = 1;
}
