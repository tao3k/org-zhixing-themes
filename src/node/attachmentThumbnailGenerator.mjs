import { createHash } from "node:crypto";
import { access, mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

export const attachmentThumbnailPublicDir = "org-zhixing.thumbnails";
export const attachmentThumbnailSize = Object.freeze({ width: 704, height: 440 });

const inFlight = new Map();

export const resetAttachmentThumbnailOutput = async (outputRoot) => {
  inFlight.clear();
  await rm(resolve(outputRoot, attachmentThumbnailPublicDir), {
    recursive: true,
    force: true,
  });
};

export const generateAttachmentThumbnail = async ({ sourcePath, outputRoot }) => {
  try {
    const source = await readFile(sourcePath);
    const digest = createHash("sha256")
      .update(source)
      .update(JSON.stringify({ ...attachmentThumbnailSize, format: "webp", quality: 80 }))
      .digest("hex")
      .slice(0, 20);
    const fileName = `${digest}.webp`;
    const publicPath = `${attachmentThumbnailPublicDir}/${fileName}`;
    const outputPath = resolve(outputRoot, publicPath);

    try {
      await access(outputPath);
      return publicPath;
    } catch {
      // Generate below.
    }

    const pending =
      inFlight.get(outputPath) ??
      (async () => {
        await mkdir(resolve(outputRoot, attachmentThumbnailPublicDir), { recursive: true });
        await sharp(source)
          .rotate()
          .resize({ ...attachmentThumbnailSize, fit: "cover", position: "centre" })
          .webp({ quality: 80 })
          .toFile(outputPath);
      })();
    inFlight.set(outputPath, pending);
    await pending;
    return publicPath;
  } catch {
    return null;
  }
};
