import type { MouseEventHandler, ReactNode } from "react";

export function HtmlSurface({
  html,
  onClick,
}: {
  html: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}): ReactNode {
  return <div id="view" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
