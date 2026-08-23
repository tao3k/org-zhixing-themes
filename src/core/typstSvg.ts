export const sanitizeTypstSvg = (svg: string, foreground?: string): string => {
  const xmlSafe = svg.replace(/&(?!(?:#\d+|#x[0-9a-f]+|amp|lt|gt|quot|apos);)/gi, "&amp;");
  return foreground
    ? xmlSafe.replace(
        /\b(fill|stroke)=(['"])(?:#000(?:000)?|black)\2/gi,
        (_match, property: string) => `${property}="${foreground}"`,
      )
    : xmlSafe;
};
