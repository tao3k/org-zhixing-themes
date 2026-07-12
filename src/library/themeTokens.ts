import type { ZhixingTheme } from "./theme";

export type ThemeTokens = {
  color: {
    canvas: string;
    surface: string;
    text: string;
    accent: string;
  };
  typography: {
    body: string;
    heading: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
  };
};

export type ThemeVariant = {
  id: string;
  label?: string;
  tokens: ThemeTokens;
};

export type ThemeStyleTarget = {
  dataset: DOMStringMap;
  style: Pick<CSSStyleDeclaration, "setProperty">;
};

export const resolveThemeVariant = (theme: ZhixingTheme, variantId: string): ThemeVariant => {
  const variant = theme.variants?.find((candidate) => candidate.id === variantId);
  if (!variant) {
    const available = theme.variants?.map((candidate) => candidate.id) ?? [];
    throw new Error(
      `THEME-E005 unknown variant "${variantId}" for theme "${theme.name}"; available: ${available.join(", ")}`,
    );
  }
  return variant;
};

export const applyThemeVariant = (
  theme: ZhixingTheme,
  variantId: string,
  target: ThemeStyleTarget = document.documentElement,
): ThemeVariant => {
  const variant = resolveThemeVariant(theme, variantId);
  target.dataset.theme = theme.name;
  target.dataset.themeVariant = variant.id;
  for (const [property, value] of Object.entries(themeTokenCssVariables(variant.tokens))) {
    target.style.setProperty(property, value);
  }
  return variant;
};

export const themeTokenCssVariables = (tokens: ThemeTokens): Readonly<Record<string, string>> => ({
  "--surface-canvas": tokens.color.canvas,
  "--surface-paper": tokens.color.surface,
  "--face-normal": tokens.color.text,
  "--face-strong": tokens.color.text,
  "--face-salient": tokens.color.accent,
  "--font-sans": tokens.typography.body,
  "--font-heading": tokens.typography.heading,
  "--font-mono": tokens.typography.mono,
  "--space-1": tokens.spacing.xs,
  "--space-2": tokens.spacing.sm,
  "--space-4": tokens.spacing.md,
  "--space-6": tokens.spacing.lg,
});
