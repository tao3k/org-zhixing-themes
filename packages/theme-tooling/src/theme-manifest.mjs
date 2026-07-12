// Shared by registry generation and theme authoring commands.
export const stableShellSlots = new Set(["site-header", "site-hero", "runtime-state"]);
const strategies = new Set(["wrap", "replace"]);
const runtimes = new Set(["server", "client", "universal"]);
const stabilities = new Set(["stable", "experimental", "internal"]);

export function validateThemePackage(packageJson, source = "package.json") {
  const manifest = packageJson.orgZhixing;
  if (!manifest || typeof manifest !== "object") {
    throw new Error(`THEME-E009 ${source}: missing orgZhixing manifest`);
  }
  if (manifest.schemaVersion !== 1) {
    throw new Error(`THEME-E009 ${source}: unsupported schemaVersion ${manifest.schemaVersion}`);
  }
  const id = requiredString(manifest.id, `${source}#orgZhixing.id`);
  const packageName = requiredString(packageJson.name, `${source}#name`);
  if (!packageJson.exports?.["."]) {
    throw new Error(`THEME-E007 ${source}: theme package must export "."`);
  }
  const variants = requiredStringArray(manifest.variants, `${source}#orgZhixing.variants`);
  const defaultVariant = requiredString(
    manifest.defaultVariant,
    `${source}#orgZhixing.defaultVariant`,
  );
  if (!variants.includes(defaultVariant)) {
    throw new Error(`THEME-E005 ${source}: default variant "${defaultVariant}" is not declared`);
  }
  requiredString(manifest.engine, `${source}#orgZhixing.engine`);
  requiredStringArray(manifest.capabilities, `${source}#orgZhixing.capabilities`);
  validateSlots(manifest.publicSlots, `${source}#orgZhixing.publicSlots`);
  requiredStringArray(manifest.renderModes, `${source}#orgZhixing.renderModes`);
  if (
    !manifest.renderers ||
    typeof manifest.renderers !== "object" ||
    Array.isArray(manifest.renderers)
  ) {
    throw new Error(`THEME-E009 ${source}#orgZhixing.renderers must be an object`);
  }
  return { id, package: packageName, defaultVariant, variants };
}

function validateSlots(value, path) {
  if (!Array.isArray(value)) throw new Error(`THEME-E009 ${path} must be an array`);
  const ids = new Set();
  for (const slot of value) {
    if (!slot || typeof slot !== "object" || Array.isArray(slot)) {
      throw new Error(`THEME-E009 ${path} entries must be objects`);
    }
    const id = requiredString(slot.id, `${path}.id`);
    if (ids.has(id)) throw new Error(`THEME-E009 duplicate theme slot "${id}"`);
    ids.add(id);
    const declaredStrategies = requiredStringArray(slot.strategies, `${path}.${id}.strategies`);
    if (declaredStrategies.some((strategy) => !strategies.has(strategy))) {
      throw new Error(`THEME-E009 theme slot "${id}" has an unsupported strategy`);
    }
    if (!runtimes.has(slot.runtime))
      throw new Error(`THEME-E009 theme slot "${id}" has an invalid runtime`);
    if (!stabilities.has(slot.stability))
      throw new Error(`THEME-E009 theme slot "${id}" has an invalid stability`);
    if (slot.stability === "stable" && !stableShellSlots.has(id)) {
      throw new Error(`THEME-E009 unknown stable theme slot "${id}"`);
    }
  }
}

function requiredString(value, path) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`THEME-E009 ${path} must be a non-empty string`);
  }
  return value.trim();
}

function requiredStringArray(value, path) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error(`THEME-E009 ${path} must be an array of non-empty strings`);
  }
  return value;
}
