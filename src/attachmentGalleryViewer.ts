import PhotoSwipeLightbox from "photoswipe/lightbox";
import type { Padding, Point, SlideData } from "photoswipe";
import type { AppDomNodes } from "./appDom";

const imageOpenerSelector = 'a[data-attachment-open][data-attachment-kind="image"]';

type ImageDimensions = {
  height: number;
  width: number;
};

export const bindAttachmentGalleryViewer = (dom: AppDomNodes, signal: AbortSignal): void => {
  const lightbox = new PhotoSwipeLightbox({
    gallery: dom.view,
    children: imageOpenerSelector,
    pswpModule: () => import("photoswipe"),
    bgOpacity: 0.92,
    imageClickAction: "zoom",
    showHideAnimationType: "none",
    wheelToZoom: true,
    paddingFn: attachmentLightboxPadding,
  });

  lightbox.addFilter("domItemData", (itemData, _element, linkElement) =>
    enrichSlideData(itemData, linkElement),
  );
  dom.view.addEventListener("load", handleAttachmentImageLoad, { capture: true, signal });
  dom.view.addEventListener("click", handleAttachmentImageClick, { capture: true, signal });
  lightbox.init();
  dom.view.dataset.attachmentViewerReady = "true";
  signal.addEventListener(
    "abort",
    () => {
      delete dom.view.dataset.attachmentViewerReady;
      lightbox.destroy();
    },
    { once: true },
  );
};

const attachmentLightboxPadding = (viewportSize: Point): Padding => {
  const narrow = (viewportSize.x ?? 0) < 760;
  const inline = narrow ? 12 : 28;
  const block = narrow ? 18 : 30;
  return { top: block, bottom: block, left: inline, right: inline };
};

const handleAttachmentImageLoad = (event: Event): void => {
  const image = event.target instanceof HTMLImageElement ? event.target : null;
  const opener = image?.closest<HTMLAnchorElement>(imageOpenerSelector);
  if (image && opener) {
    updateOpenerDimensions(opener, image);
  }
};

const handleAttachmentImageClick = (event: MouseEvent): void => {
  const opener = (event.target as HTMLElement).closest<HTMLAnchorElement>(imageOpenerSelector);
  if (!opener || hasPhotoSwipeDimensions(opener) || usesBrowserOpen(event)) {
    return;
  }

  const image = opener.querySelector("img");
  if (!image) {
    return;
  }
  if (updateOpenerDimensions(opener, image)) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  void loadImageDimensions(opener.href).then((dimensions) => {
    setPhotoSwipeDimensions(opener, dimensions);
    opener.dispatchEvent(replayClick(event));
  });
};

const enrichSlideData = (itemData: SlideData, linkElement: HTMLAnchorElement): SlideData => {
  const image = linkElement.querySelector("img");
  if (image) {
    updateOpenerDimensions(linkElement, image);
  }
  const dimensions = dimensionsFromOpener(linkElement);
  if (dimensions) {
    itemData.width = dimensions.width;
    itemData.height = dimensions.height;
    itemData.w = dimensions.width;
    itemData.h = dimensions.height;
  }
  itemData.alt = linkElement.dataset.attachmentTitle ?? itemData.alt ?? "";
  itemData.msrc = itemData.src;
  itemData.thumbCropped = true;
  return itemData;
};

const updateOpenerDimensions = (opener: HTMLAnchorElement, image: HTMLImageElement): boolean => {
  if (
    (image.currentSrc || image.src) !== opener.href ||
    !image.naturalWidth ||
    !image.naturalHeight
  ) {
    return false;
  }
  setPhotoSwipeDimensions(opener, { width: image.naturalWidth, height: image.naturalHeight });
  return true;
};

const setPhotoSwipeDimensions = (
  opener: HTMLAnchorElement,
  { height, width }: ImageDimensions,
): void => {
  opener.dataset.pswpWidth = String(width);
  opener.dataset.pswpHeight = String(height);
};

const hasPhotoSwipeDimensions = (opener: HTMLAnchorElement): boolean =>
  Boolean(dimensionsFromOpener(opener));

const dimensionsFromOpener = (opener: HTMLAnchorElement): ImageDimensions | null => {
  const width = Number(opener.dataset.pswpWidth ?? 0);
  const height = Number(opener.dataset.pswpHeight ?? 0);
  return width > 0 && height > 0 ? { width, height } : null;
};

const loadImageDimensions = (src: string): Promise<ImageDimensions> =>
  new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      resolve({
        width: Math.max(1, image.naturalWidth),
        height: Math.max(1, image.naturalHeight),
      });
    };
    image.onerror = () => resolve({ width: 1, height: 1 });
    image.src = src;
  });

const replayClick = (event: MouseEvent): MouseEvent =>
  new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: event.button,
    buttons: event.buttons,
    clientX: event.clientX,
    clientY: event.clientY,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
  });

const usesBrowserOpen = (event: MouseEvent): boolean =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
