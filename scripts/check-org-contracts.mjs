import { readFileSync } from "node:fs";

import { Org, initSync } from "orgize";

import {
  formatOrgContractDiagnostic,
  validateOrgContracts,
} from "../src/node/orgContractValidation.ts";

const orgizeModuleUrl = import.meta.resolve("orgize");
initSync({ module: readFileSync(new URL("orgize_bg.wasm", orgizeModuleUrl)) });

const configPath = process.argv[2] ?? process.env.ORG_ZHIXING_CONFIG ?? "public/org-zhixing.toml";
const reportFatalContractError = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(/^CONTRACT-E\d{3}\b/.test(message) ? message : `CONTRACT-E003 ${message}`);
  process.exitCode = 1;
};
process.once("uncaughtException", reportFatalContractError);
process.once("unhandledRejection", reportFatalContractError);

const result = await validateOrgContracts({
  configPath,
  evaluate(source, request) {
    const document = new Org(source);
    if (typeof document.contractEvaluationsJson !== "function") {
      throw new Error(
        "CONTRACT-E004 installed orgize WASM package does not expose contractEvaluationsJson; update dependencies.orgize",
      );
    }
    return JSON.parse(document.contractEvaluationsJson(JSON.stringify(request)));
  },
});

if (result.skipped) {
  console.log(`org-contract skipped config=${configPath}`);
} else {
  for (const diagnostic of result.diagnostics) {
    console.error(formatOrgContractDiagnostic(diagnostic));
  }
  const errors = result.diagnostics.filter(({ severity }) => severity === "error").length;
  console.log(
    `org-contract checked=${result.checked} failures=${result.diagnostics.length} errors=${errors}`,
  );
  if (errors > 0) process.exitCode = 1;
}
