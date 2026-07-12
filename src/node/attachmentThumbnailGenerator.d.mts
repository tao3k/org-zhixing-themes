export const attachmentThumbnailPublicDir: "org-zhixing.thumbnails";
export const attachmentThumbnailSize: Readonly<{ width: 704; height: 440 }>;

export const resetAttachmentThumbnailOutput: (outputRoot: string) => Promise<void>;

export const generateAttachmentThumbnail: (options: {
  sourcePath: string;
  outputRoot: string;
}) => Promise<string | null>;
