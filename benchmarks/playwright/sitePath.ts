import { normalizeOrgZhixingBasePath } from "../../src/deploymentBasePath";

const deploymentBasePath = normalizeOrgZhixingBasePath(
  process.env.ORG_ZHIXING_BASE_PATH ?? "/org-zhixing-themes",
);

export const scenarioSitePath = (path: string): string => {
  const suffix = path.replace(/^\/+/, "");
  return suffix ? `${deploymentBasePath}/${suffix}` : `${deploymentBasePath}/`;
};
