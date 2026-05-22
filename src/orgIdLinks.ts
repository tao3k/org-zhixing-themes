import type { SectionRecord } from "./orgHtmlMetadata";

export type OrgIdTargetMap = ReadonlyMap<string, string>;

export const orgIdTargetsForRecord = (
  record: SectionRecord,
  fragment: string,
): Array<readonly [string, string]> =>
  record.properties
    .filter((property) => ["ID", "CUSTOM_ID"].includes(property.key.toUpperCase()))
    .map((property) => [property.value.trim(), fragment] as const)
    .filter(([id]) => id.length > 0);

export const rewriteOrgIdLinks = (root: ParentNode, targets: OrgIdTargetMap): void => {
  for (const link of root.querySelectorAll<HTMLAnchorElement>('a[href^="id:"]')) {
    const raw = link.getAttribute("href") ?? "";
    const id = decodeOrgId(raw.slice("id:".length));
    link.classList.add("org-id-link");
    link.dataset.orgLink = "id";
    link.dataset.orgId = id;
    const target = targets.get(id);
    if (target) {
      link.setAttribute("href", target);
    } else {
      link.dataset.orgMissingTarget = "true";
    }
  }
};

const decodeOrgId = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
