import type { AgendaPanelKey } from "./agendaTypes";
import type { AgendaModeKey } from "./config";

export const isAgendaMode = (value: unknown): value is AgendaModeKey =>
  value === "classic" || value === "strict" || value === "auto" || value === "agent";

export const isAgendaPanel = (value: unknown): value is AgendaPanelKey =>
  value === "trace" ||
  value === "selectors" ||
  value === "source" ||
  value === "agent" ||
  value === "records";

export const resolveInitialAgendaPanel = (): AgendaPanelKey => {
  const candidate = new URLSearchParams(window.location.search).get("panel");
  return isAgendaPanel(candidate) ? candidate : "trace";
};

export const resolveInitialAgendaRuleId = (): string | null => {
  const candidate = new URLSearchParams(window.location.search).get("rule");
  return candidate && /^[a-z0-9-]+$/i.test(candidate) ? candidate : null;
};
