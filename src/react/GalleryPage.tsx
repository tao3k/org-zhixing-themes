import { useEffect, type ReactNode } from "react";
import { renderAttachmentGallery } from "../attachmentGalleryRender";
import { viewDomNodes } from "./routeViewHelpers";
import { galleryRoute } from "./router";
import { HtmlSurface } from "./HtmlSurface";

export default function GalleryPage(): ReactNode {
  const attachmentGallery = galleryRoute.useLoaderData();
  const html = renderAttachmentGallery(attachmentGallery);
  useEffect(() => {
    if (!html.includes("data-attachment-open")) return;
    const controller = new AbortController();
    void import("../attachmentGalleryViewer").then(({ bindAttachmentGalleryViewer }) => {
      if (!controller.signal.aborted)
        bindAttachmentGalleryViewer(viewDomNodes(), controller.signal);
    });
    return () => controller.abort();
  }, [html]);
  return <HtmlSurface html={html} />;
}
