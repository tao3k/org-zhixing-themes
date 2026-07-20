import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";
import type { RsbuildPlugin } from "@rsbuild/core";
import type { FederatedThemeTransport, ThemeIsolationSnapshot } from "../isolation";

export const createThemeFederationPlugin = (
  snapshot: ThemeIsolationSnapshot,
): RsbuildPlugin | null => {
  const remoteDefinitions = selectedThemeFederationRemotes(snapshot);
  if (Object.keys(remoteDefinitions).length === 0) return null;

  return pluginModuleFederation({
    name: federationHostName(snapshot.instanceId),
    remotes: remoteDefinitions,
    dts: { consumeTypes: false },
    shareStrategy: "loaded-first",
    shared: {
      react: {
        singleton: true,
        requiredVersion: false,
      },
      "react/": {
        singleton: true,
        requiredVersion: false,
      },
      "react-dom": {
        singleton: true,
        requiredVersion: false,
      },
      "react-dom/": {
        singleton: true,
        requiredVersion: false,
      },
    },
  });
};

export const selectedThemeFederationRemotes = (
  snapshot: ThemeIsolationSnapshot,
): Readonly<Record<string, string>> => {
  const selectedTransport = snapshot.catalog.find(
    ({ id }) => id === snapshot.selectedThemeId,
  )?.transport;
  const remotes: FederatedThemeTransport[] =
    selectedTransport?.kind === "federated" ? [selectedTransport] : [];
  return Object.freeze(
    Object.fromEntries(
      remotes.map(({ remoteName, entry }) => [remoteName, `${remoteName}@${entry}`]),
    ),
  );
};

const federationHostName = (instanceId: string): string => {
  let hash = 2166136261;
  for (const character of instanceId) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return `org_zhixing_host_${(hash >>> 0).toString(16)}`;
};
