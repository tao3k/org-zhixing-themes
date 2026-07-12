import type { ZhixingTheme } from "../library";

type VariantStorage = Pick<Storage, "getItem" | "setItem">;

export const themeVariantStorageKey = (themeId: string): string =>
  `org-zhixing:theme-variant:${themeId}`;

export const loadThemeVariantPreference = (
  theme: ZhixingTheme,
  fallback: string,
  storage?: VariantStorage,
): string => {
  const variants = theme.variants ?? [];
  const fallbackId = variants.some(({ id }) => id === fallback) ? fallback : variants[0]?.id;
  if (!fallbackId) throw new Error(`THEME-E005 theme "${theme.name}" has no variants`);
  try {
    const selected = (storage ?? window.localStorage).getItem(themeVariantStorageKey(theme.name));
    return variants.some(({ id }) => id === selected) ? (selected as string) : fallbackId;
  } catch {
    return fallbackId;
  }
};

export const storeThemeVariantPreference = (
  themeId: string,
  variantId: string,
  storage?: VariantStorage,
): void => {
  try {
    (storage ?? window.localStorage).setItem(themeVariantStorageKey(themeId), variantId);
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
};
