export const attachmentThumbnailPublicDir: "org-zhixing.thumbnails";
export const attachmentThumbnailSize: Readonly<{ width: 704; height: 440 }>;

export const prepareAttachmentThumbnailOutput: () => void;
export const pruneAttachmentThumbnailOutput: (
  outputRoot: string,
  referencedPaths: readonly string[],
) => Promise<void>;

export const generateAttachmentThumbnail: (options: {
  sourcePath: string;
  outputRoot: string;
}) => Promise<string | null>;
