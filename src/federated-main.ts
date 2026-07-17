import "./styles.css";
import { renderThemeStartupFailure } from "./theme-system/react/renderThemeStartupFailure";

const startFederatedApp = (): void => {
  void import("./react/mountApp")
    .then(({ mountApp }) => mountApp())
    .catch((error: unknown) => renderThemeStartupFailure(error, startFederatedApp));
};

startFederatedApp();
