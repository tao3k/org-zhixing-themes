import { agendaViewRequest, type AgendaSettings } from "./config";
import { sameAgendaRange, sourcePlanningAgendaRange } from "./agendaRange";
import { withAgendaView, type OrgizeDocumentView } from "./model";
import { type OrgizeSession } from "./orgizeClient";

export type ProjectAgendaResult = {
  document: OrgizeDocumentView;
  durationMs: number;
};

export const projectAgendaDocument = async (
  session: OrgizeSession,
  document: OrgizeDocumentView,
  configuredRange: AgendaSettings,
): Promise<ProjectAgendaResult> => {
  let agendaRange = configuredRange;
  let agenda = await session.agendaView(agendaViewRequest(agendaRange));
  const sourceRange = sourcePlanningAgendaRange(document.agenda, configuredRange);
  if (
    agenda.value.cards.length === 0 &&
    sourceRange &&
    !sameAgendaRange(sourceRange, configuredRange)
  ) {
    agendaRange = sourceRange;
    const sourceAgenda = await session.agendaView(agendaViewRequest(sourceRange));
    agenda = {
      value: sourceAgenda.value,
      durationMs: agenda.durationMs + sourceAgenda.durationMs,
    };
  }
  return {
    document: withAgendaView(document, agenda.value, agendaRange),
    durationMs: agenda.durationMs,
  };
};
