export type DiscoveredTheme = {
  capabilities: string[];
  content: {
    base: "public" | "workspace";
    directory: string;
    routeMode: "application" | "documents";
  } | null;
  directory: string;
  defaultVariant: string;
  id: string;
  name: string;
  variants: string[];
};

export const replaceThemeSelection: (source: string, theme: string, variant: string) => string;
export const replaceThemePreviewSelection: (source: string, theme: DiscoveredTheme) => string;

export const resolveThemePreview: (options: {
  theme: string;
  workspaceRoot?: string;
}) => Promise<DiscoveredTheme>;

export const themePreviewConfigName: (theme: string, port: string) => string;
export const themePreviewUrl: (port: string, theme?: DiscoveredTheme) => string;
export const themePreviewEnvironment: (
  environment: NodeJS.ProcessEnv,
  previewConfig: string,
  cacheRoot: string,
  contentDir?: string | null,
) => NodeJS.ProcessEnv;
