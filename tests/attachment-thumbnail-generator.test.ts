import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  attachmentThumbnailPublicDir,
  attachmentThumbnailSize,
  generateAttachmentThumbnail,
} from "../src/node/attachmentThumbnailGenerator.mjs";

describe("attachment thumbnail generator", () => {
  it("writes a cache-stable 2x card WebP with cover dimensions", async () => {
    const root = await mkdtemp(resolve(tmpdir(), "org-zhixing-thumbnail-"));
    const sourcePath = resolve(root, "source.png");
    await sharp({
      create: {
        width: 1200,
        height: 600,
        channels: 3,
        background: "#7b61ff",
      },
    })
      .png()
      .toFile(sourcePath);

    const first = await generateAttachmentThumbnail({ sourcePath, outputRoot: root });
    const second = await generateAttachmentThumbnail({ sourcePath, outputRoot: root });

    expect(first).toBe(second);
    expect(first).toMatch(new RegExp(`^${attachmentThumbnailPublicDir}/[a-f0-9]{20}\\.webp$`));
    const metadata = await sharp(await readFile(resolve(root, first!))).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(attachmentThumbnailSize.width);
    expect(metadata.height).toBe(attachmentThumbnailSize.height);
  });

  it("returns null for unsupported input", async () => {
    const root = await mkdtemp(resolve(tmpdir(), "org-zhixing-thumbnail-"));
    const sourcePath = resolve(root, "source.txt");
    await writeFile(sourcePath, "not an image", "utf8");

    await expect(generateAttachmentThumbnail({ sourcePath, outputRoot: root })).resolves.toBeNull();
  });
});
