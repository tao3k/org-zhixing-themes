export type PagesBuildOptions = {
  basePath: string | null;
  configPath: string;
  contentDir: string;
  outputDir: string;
  workspaceRoot: string;
};

export type ValidatedPagesBuildOptions = Omit<PagesBuildOptions, "basePath"> & {
  basePath: string;
};

export const parsePagesBuildArgs: (argv: string[], workspaceRoot?: string) => PagesBuildOptions;

export const validatePagesBuildConfig: (
  options: PagesBuildOptions,
) => Promise<ValidatedPagesBuildOptions>;

export const pagesBuildEnvironment: (
  environment: NodeJS.ProcessEnv,
  options: Pick<ValidatedPagesBuildOptions, "basePath" | "configPath" | "contentDir">,
  cacheRoot: string,
) => NodeJS.ProcessEnv;

export const runPagesBuild: (options: PagesBuildOptions) => Promise<void>;

export const materializePagesRouteShells: (distRoot: string) => Promise<number>;

export const materializeStaticRouteShells: (distRoot: string) => Promise<number>;
