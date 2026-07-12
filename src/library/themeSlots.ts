export type ThemeSlotStrategy = "wrap" | "replace";
export type ThemeSlotRuntime = "server" | "client" | "universal";
export type ThemeSlotStability = "stable" | "experimental" | "internal";

export type ThemeSlotManifest = {
  id: string;
  strategies: readonly ThemeSlotStrategy[];
  runtime: ThemeSlotRuntime;
  stability: ThemeSlotStability;
};

export const stableShellSlots = [
  "site-header",
  "site-hero",
  "runtime-state",
  "blog-index",
] as const;
export type StableShellSlot = (typeof stableShellSlots)[number];

export type ThemeSlotOverride<TContext, TOutput> =
  | {
      strategy: "replace";
      render: (context: TContext) => TOutput;
    }
  | {
      strategy: "wrap";
      render: (context: TContext, original: TOutput) => TOutput;
    };

export const renderThemeSlot = <TContext, TOutput>(
  context: TContext,
  original: (context: TContext) => TOutput,
  override?: ThemeSlotOverride<TContext, TOutput>,
): TOutput => {
  if (!override) return original(context);
  if (override.strategy === "replace") return override.render(context);
  return override.render(context, original(context));
};

export const validateThemeSlotManifest = (slot: ThemeSlotManifest): ThemeSlotManifest => {
  const id = slot.id.trim();
  if (!id) throw new Error("THEME-E009 theme slot id must not be empty");
  if (slot.strategies.length === 0) {
    throw new Error(`THEME-E009 theme slot "${id}" must declare a strategy`);
  }
  if (new Set(slot.strategies).size !== slot.strategies.length) {
    throw new Error(`THEME-E009 theme slot "${id}" declares duplicate strategies`);
  }
  if (slot.stability === "stable" && !stableShellSlots.includes(id as StableShellSlot)) {
    throw new Error(`THEME-E009 unknown stable theme slot "${id}"`);
  }
  return { ...slot, id, strategies: [...slot.strategies] };
};
