import { createElement, type ComponentType, type ReactNode } from "react";
import type { ZhixingTheme } from "../library";
import type { ContentShellData } from "../services/contentServices";

export type ReactSpaSlotProps = {
  "site-header": { shell: ContentShellData };
  "site-hero": { title: string; shell?: ContentShellData };
  "runtime-state": { shell: ContentShellData };
  "blog-index": { shell: ContentShellData };
  "theme-controls": {
    activeVariantId: string;
    onEnterZen: () => void;
    onVariantChange: (variantId: string) => void;
    shell: ContentShellData;
    theme: ZhixingTheme;
  };
};

type ReactSpaSlotOverride<K extends keyof ReactSpaSlotProps> =
  | { strategy: "replace"; component: ComponentType<ReactSpaSlotProps[K]> }
  | {
      strategy: "wrap";
      component: ComponentType<ReactSpaSlotProps[K] & { children: ReactNode }>;
    };

export type ReactSpaThemeBinding = {
  kind: "org-zhixing/react-spa/v1";
  slots?: { [K in keyof ReactSpaSlotProps]?: ReactSpaSlotOverride<K> };
  contentRoutes?: ReactSpaContentRouteBinding;
};

export type ReactSpaContentRouteBinding = {
  exclusiveContentRoutes?: boolean;
  loadDocument: (shell: ContentShellData, documentId: string) => Promise<unknown>;
  renderDocument: (data: unknown) => ReactNode;
  renderHome: (shell: ContentShellData) => ReactNode;
};

export const defineReactSpaContentRoutes = <TData,>(binding: {
  exclusiveContentRoutes?: boolean;
  loadDocument: (shell: ContentShellData, documentId: string) => Promise<TData>;
  renderDocument: (data: TData) => ReactNode;
  renderHome: (shell: ContentShellData) => ReactNode;
}): ReactSpaContentRouteBinding => ({
  ...binding,
  renderDocument: (data) => binding.renderDocument(data as TData),
});

export const defineReactSpaThemeBinding = <TBinding extends ReactSpaThemeBinding>(
  binding: TBinding,
): TBinding => binding;

export const renderReactSpaThemeSlot = <K extends keyof ReactSpaSlotProps>(
  theme: ZhixingTheme,
  slot: K,
  props: ReactSpaSlotProps[K],
  original: ReactNode,
): ReactNode => {
  const binding = theme.rendererBindings?.["react-spa"];
  if (!isReactSpaThemeBinding(binding)) return original;
  const override = binding.slots?.[slot] as ReactSpaSlotOverride<K> | undefined;
  if (!override) return original;
  if (override.strategy === "replace") return createElement(override.component, props);
  const Wrapper = override.component as unknown as ComponentType<Record<string, unknown>>;
  return createElement(Wrapper, {
    ...(props as unknown as Record<string, unknown>),
    children: original,
  });
};

export const reactSpaContentRoutes = (theme: ZhixingTheme): ReactSpaContentRouteBinding | null => {
  const binding = theme.rendererBindings?.["react-spa"];
  return isReactSpaThemeBinding(binding) ? (binding.contentRoutes ?? null) : null;
};

const isReactSpaThemeBinding = (value: unknown): value is ReactSpaThemeBinding =>
  typeof value === "object" &&
  value !== null &&
  "kind" in value &&
  value.kind === "org-zhixing/react-spa/v1";
