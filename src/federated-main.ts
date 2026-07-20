import "./styles.css";
import { loadIsolatedThemeRuntime } from "./theme-system/react/ThemeRuntimeProvider";
import { renderThemeStartupFailure } from "./theme-system/react/renderThemeStartupFailure";

const startFederatedApp = (): void => {
  void loadIsolatedThemeRuntime()
    .then(() => import("./react/mountApp"))
    .then(({ mountApp }) => mountApp())
    .catch((error: unknown) => renderThemeStartupFailure(error, startFederatedApp));
};

startFederatedApp();
