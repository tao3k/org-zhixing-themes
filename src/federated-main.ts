import "./styles.css";
import { loadIsolatedThemeRuntime } from "./theme-system/react/ThemeRuntimeProvider";
import { renderThemeStartupFailure } from "./theme-system/react/renderThemeStartupFailure";
import { claimThemeRuntimeBoundary } from "./theme-system/react/themeRuntimeBoundary";
import {
  isolatedSelectedThemeId,
  isolatedSelectedVariant,
  themeIsolationId,
} from "virtual:org-zhixing/theme-runtime";

const themeSelection = {
  isolationId: themeIsolationId,
  themeId: isolatedSelectedThemeId,
  variant: isolatedSelectedVariant,
} as const;

const startFederatedApp = (): void => {
  claimThemeRuntimeBoundary(themeSelection);
  void loadIsolatedThemeRuntime()
    .then(() => import("./react/mountApp"))
    .then(({ mountApp }) => mountApp())
    .catch((error: unknown) => renderThemeStartupFailure(error, startFederatedApp));
};

startFederatedApp();
