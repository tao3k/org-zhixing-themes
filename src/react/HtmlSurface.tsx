import { memo, type MouseEventHandler, type ReactNode, type Ref } from "react";

export const HtmlSurface = memo(function HtmlSurface({
  html,
  onClick,
  surfaceRef,
}: {
  html: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  surfaceRef?: Ref<HTMLDivElement>;
}): ReactNode {
  return (
    <div id="view" ref={surfaceRef} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
  );
});
