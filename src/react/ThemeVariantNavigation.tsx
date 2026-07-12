import type { ReactNode } from "react";
import type { ZhixingTheme } from "../library";

export function ThemeVariantNavigation({
  activeVariantId,
  onVariantChange,
  theme,
}: {
  activeVariantId: string;
  onVariantChange: (variantId: string) => void;
  theme: ZhixingTheme;
}): ReactNode {
  const variants = theme.variants ?? [];
  if (variants.length <= 1) return null;
  return (
    <nav className="theme-variant-navigation" aria-label="Theme color scheme">
      <span>Appearance</span>
      <div>
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            aria-pressed={variant.id === activeVariantId}
            data-theme-variant-option={variant.id}
            onClick={() => onVariantChange(variant.id)}
          >
            {variant.label ?? variant.id}
          </button>
        ))}
      </div>
    </nav>
  );
}
