declare const __ORG_ZHIXING_BASE_PATH__: string | undefined;

export const orgZhixingBasePath = (): string => {
  const configured =
    typeof __ORG_ZHIXING_BASE_PATH__ === "string" ? __ORG_ZHIXING_BASE_PATH__ : "/";
  return normalizeOrgZhixingBasePath(configured);
};

export const normalizeOrgZhixingBasePath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
};
