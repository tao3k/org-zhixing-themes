export const ORG_SEARCH_REQUEST_EVENT = "org-zhixing:search-request";

export const isOrgSearchShortcut = (
  event: Pick<KeyboardEvent, "ctrlKey" | "key" | "metaKey">,
): boolean => event.key.toLowerCase() === "f" && (event.ctrlKey || event.metaKey);

export const requestOrgSearch = (): void => {
  window.dispatchEvent(new Event(ORG_SEARCH_REQUEST_EVENT));
};
