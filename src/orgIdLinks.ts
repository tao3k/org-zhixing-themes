import type { SectionRecord } from "./orgHtmlMetadata";

export type OrgIdTargetMap = ReadonlyMap<string, string>;

export type OrgDocumentLinkTarget = {
  file: string;
  id: string;
};

export type OrgLinkResolutionContext = {
  currentFile?: string;
  documents?: readonly OrgDocumentLinkTarget[];
  idTargets?: OrgIdTargetMap;
};

export const orgDocumentIdFromPath = (file: string): string =>
  file
    .replace(/\.org$/i, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export const resolveOrgLinkHref = (
  href: string,
  context: OrgLinkResolutionContext,
): string | null => {
  if (href.startsWith("id:")) {
    return context.idTargets?.get(decodeOrgId(href.slice("id:".length))) ?? null;
  }
  const { path, suffix } = splitOrgHref(href);
  const localPath = localOrgPath(path);
  if (!localPath || !context.documents) return null;
  const targets = new Map(
    context.documents.map((document) => [normalizeOrgPath(document.file), document.id]),
  );
  const direct = normalizeOrgPath(localPath);
  const relative = normalizeOrgPath(
    [...orgDirname(context.currentFile ?? ""), ...localPath.split("/")].join("/"),
  );
  const documentId = targets.get(direct) ?? targets.get(relative);
  return documentId ? `/${documentId}${suffix}` : null;
};

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
    const target = resolveOrgLinkHref(raw, { idTargets: targets });
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

const splitOrgHref = (href: string): { path: string; suffix: string } => {
  const suffixIndex = [href.indexOf("?"), href.indexOf("#")]
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];
  return suffixIndex === undefined
    ? { path: href, suffix: "" }
    : { path: href.slice(0, suffixIndex), suffix: href.slice(suffixIndex) };
};

const localOrgPath = (path: string): string | null => {
  const localPath = path.startsWith("file:") ? path.slice("file:".length) : path;
  if (
    localPath.startsWith("#") ||
    localPath.startsWith("//") ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(localPath) ||
    !localPath.toLowerCase().endsWith(".org")
  ) {
    return null;
  }
  try {
    return decodeURIComponent(localPath).replace(/^\/+/, "");
  } catch {
    return null;
  }
};

const orgDirname = (file: string): string[] => {
  const segments = normalizeOrgPath(file).split("/");
  return segments.length > 1 ? segments.slice(0, -1) : [];
};

const normalizeOrgPath = (path: string): string => {
  const normalized: string[] = [];
  for (const segment of path.replace(/^\/+/, "").split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") normalized.pop();
    else normalized.push(segment);
  }
  return normalized.join("/");
};
