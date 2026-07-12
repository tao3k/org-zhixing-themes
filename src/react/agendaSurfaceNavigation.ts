import type { MouseEventHandler } from "react";
import { isAgendaMode, isAgendaPanel } from "../agendaState";

export type AgendaRouteSearch = {
  agenda?: string;
  panel?: string;
  rule?: string;
};

export const createAgendaSurfaceClickHandler = ({
  navigateToAgenda,
  search,
}: {
  navigateToAgenda: (search: AgendaRouteSearch) => void;
  search: AgendaRouteSearch;
}): MouseEventHandler<HTMLDivElement> => {
  return (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-agenda-mode], [data-agenda-panel], [data-agenda-rule-select]",
    );
    if (!target) {
      return;
    }
    if (target.dataset.agendaMode !== undefined) {
      if (!isAgendaMode(target.dataset.agendaMode)) {
        return;
      }
      event.preventDefault();
      navigateToAgenda({
        agenda: target.dataset.agendaMode,
        panel: search.panel,
      });
      return;
    }
    if (target.dataset.agendaPanel !== undefined) {
      if (!isAgendaPanel(target.dataset.agendaPanel)) {
        return;
      }
      event.preventDefault();
      navigateToAgenda({
        agenda: search.agenda,
        panel: target.dataset.agendaPanel,
        rule: search.rule,
      });
      return;
    }
    if (target.dataset.agendaRuleSelect !== undefined) {
      event.preventDefault();
      navigateToAgenda({
        agenda: search.agenda,
        panel: search.panel,
        rule: target.dataset.agendaRuleSelect,
      });
    }
  };
};
