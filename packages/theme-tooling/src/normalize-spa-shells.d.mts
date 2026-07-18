export const normalizeBasePath: (value?: string) => string;

export const spaShellBasePath: (
  environment?: Pick<NodeJS.ProcessEnv, "ORG_ZHIXING_BASE_PATH" | "PUBLIC_BASE_PATH">,
) => string;

export const normalizeSpaShells: (options?: {
  basePath?: string;
  distRoot?: string;
}) => Promise<void>;
