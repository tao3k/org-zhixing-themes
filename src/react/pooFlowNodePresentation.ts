import type { PooFlowGraphNodeKind, PooFlowGraphObjectIdentity } from "../poo-flow/graphContract";

export interface PooFlowNodePresentation {
  readonly width: number;
  readonly height: number;
  readonly semanticType: PooFlowGraphNodeKind;
}

const presentations: Record<PooFlowGraphNodeKind, PooFlowNodePresentation> = {
  composition: { semanticType: "composition", width: 268, height: 118 },
  case: { semanticType: "case", width: 260, height: 112 },
  "profile-instance": { semanticType: "profile-instance", width: 250, height: 104 },
  evidence: { semanticType: "evidence", width: 244, height: 112 },
  boundary: { semanticType: "boundary", width: 92, height: 92 },
  step: { semanticType: "step", width: 196, height: 80 },
};

function visibleFacetRows(identity?: PooFlowGraphObjectIdentity): number {
  if (!identity) return 0;

  const conditionRows = identity.conditions?.length ? 1 : 0;
  const stateCount = Math.min(identity.states?.length ?? 0, 2);
  return conditionRows + Math.ceil(stateCount / 2);
}

export function getPooFlowNodePresentation(
  kind: PooFlowGraphNodeKind,
  identity?: PooFlowGraphObjectIdentity,
): PooFlowNodePresentation {
  const presentation = presentations[kind];
  const facetRows = visibleFacetRows(identity);

  return facetRows === 0
    ? presentation
    : {
        ...presentation,
        height: presentation.height + 8 + facetRows * 21,
      };
}
