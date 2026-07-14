export type OrgSectionAnchor = {
  id: string;
  title: string;
};

const normalizedHeading = (value: string): string => value.replace(/\s+/g, " ").trim();

const bindOrgSectionAnchorsPipeline = (
  root: HTMLElement,
  anchors: readonly OrgSectionAnchor[],
  onActive?: (id: string) => void,
): (() => void) => {
  let intersectionObserver: IntersectionObserver | null = null;
  let initialHashHandled = false;

  const bind = (): void => {
    const headings = [...root.querySelectorAll<HTMLHeadingElement>("h1,h2,h3,h4,h5,h6")];
    const remaining = [...anchors];
    for (const heading of headings) {
      const title = normalizedHeading(heading.textContent ?? "");
      const matchIndex = remaining.findIndex((anchor) => normalizedHeading(anchor.title) === title);
      if (matchIndex < 0) continue;
      const [anchor] = remaining.splice(matchIndex, 1);
      heading.id = anchor.id;
    }

    intersectionObserver?.disconnect();
    if ("IntersectionObserver" in window) {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries.find((entry) => entry.isIntersecting);
          if (visible?.target.id) onActive?.(visible.target.id);
        },
        { rootMargin: "-16% 0px -72%", threshold: 0 },
      );
      for (const heading of headings) {
        if (heading.id) intersectionObserver.observe(heading);
      }
    }

    if (!initialHashHandled && window.location.hash) {
      const target = root.querySelector<HTMLElement>(window.location.hash);
      if (target) {
        initialHashHandled = true;
        requestAnimationFrame(() => target.scrollIntoView());
      }
    }
  };

  bind();
  const mutationObserver = new MutationObserver(bind);
  mutationObserver.observe(root, { childList: true, subtree: true });
  return () => {
    mutationObserver.disconnect();
    intersectionObserver?.disconnect();
  };
};

export const bindOrgSectionAnchors = (
  root: HTMLElement,
  anchors: readonly OrgSectionAnchor[],
  onActive?: (id: string) => void,
): (() => void) => bindOrgSectionAnchorsPipeline(root, anchors, onActive);
