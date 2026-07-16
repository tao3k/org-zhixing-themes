import { describe, expect, it } from "vitest";
import { renderAttachmentGallery } from "../src/attachmentGalleryRender";
import type { AttachmentGalleryView } from "../src/attachmentGalleryModel";
import type { AttachmentDisplayRecord } from "../src/model";

const imageRecord = (
  linkPath: string,
  sectionTitle: string,
  thumbnailPath?: string,
): AttachmentDisplayRecord =>
  ({
    directoryPath: "attachments",
    effectiveTags: ["gallery"],
    linkPath,
    mediaKind: "image",
    outlinePath: [sectionTitle],
    sectionTitle,
    thumbnailPath,
  }) as unknown as AttachmentDisplayRecord;

describe("attachment gallery render contract", () => {
  it("prioritizes only the first attachment thumbnail", () => {
    const gallery: AttachmentGalleryView = {
      records: [
        {
          record: imageRecord(
            "first photo.jpg",
            "First <photo>",
            "org-zhixing.thumbnails/first.webp",
          ),
          sourceFile: "blog/gallery.org",
          sourceId: "gallery",
          sourceName: "Gallery",
        },
        {
          record: imageRecord("second-photo.jpg", "Second photo"),
          sourceFile: "blog/gallery.org",
          sourceId: "gallery",
          sourceName: "Gallery",
        },
      ],
      entryCount: 2,
      sourceCount: 1,
      label: "Gallery",
      siteWide: false,
    };

    const html = renderAttachmentGallery(gallery);
    const thumbnails = [...html.matchAll(/<img[^>]*data-attachment-thumbnail>/g)].map(
      ([thumbnail]) => thumbnail,
    );

    expect(html).toContain('class="attachment-grid"');
    expect(thumbnails).toHaveLength(2);
    expect(thumbnails[0]).toContain(
      'src="http://localhost:3000/org-zhixing.thumbnails/first.webp"',
    );
    expect(thumbnails[0]).toContain('alt="First &lt;photo&gt;"');
    expect(thumbnails[0]).toContain('loading="eager"');
    expect(thumbnails[0]).toContain('fetchpriority="high"');
    expect(thumbnails[1]).toContain(
      'src="http://localhost:3000/org-zhixing.media/blog/attachments/second-photo.jpg"',
    );
    expect(thumbnails[1]).toContain('alt="Second photo"');
    expect(thumbnails[1]).toContain('loading="lazy"');
    expect(thumbnails[1]).not.toContain("fetchpriority");
    expect(html).toContain(
      'href="http://localhost:3000/org-zhixing.media/blog/attachments/first%20photo.jpg"',
    );
  });
});
