import { loadPooFlowWasmRuntime, type PooFlowWasmRuntime } from "@poo-flow/runtime-wasm";
import {
  workflow as browserContributionWorkflow,
  workflowTopology as browserContributionTopology,
} from "@poo-flow/runtime-wasm/workflows/browser-contribution";
import {
  workflow as browserProfileCompositionWorkflow,
  workflowTopology as browserProfileCompositionTopology,
} from "@poo-flow/runtime-wasm/workflows/browser-profile-composition";
import {
  workflow as subagentWorkflow,
  workflowTopology as subagentWorkflowTopology,
} from "@poo-flow/runtime-wasm/workflows/subagent-workflow";
import {
  workflow as funflowWorkflow,
  workflowTopology as funflowTopology,
} from "@poo-flow/runtime-wasm/workflows/funflow";
import type { PooFlowExecutionSession, PooFlowRunner, PooFlowRunResult } from "./pooFlowModel";

interface GeneratedWorkflowStep extends PooFlowGraphObjectIdentity {
  readonly id: string;
  readonly ordinal: number;
  readonly name: string;
  readonly kind: string;
  readonly dependencies: readonly string[];
  readonly parentId?: string;
  readonly sourceId?: string;
  readonly relation?: string;
  readonly detail?: string;
  readonly objectSubtype?: string;
  readonly scope?: string;
  readonly scenario?: string;
  readonly capabilities?: readonly string[];
}

interface GeneratedWorkflowEdge {
  readonly id?: string;
  readonly source: string;
  readonly target: string;
}

interface GeneratedWorkflowDefinition {
  readonly id: string;
  readonly rootId?: string;
  readonly steps: readonly GeneratedWorkflowStep[];
  readonly edges: readonly GeneratedWorkflowEdge[];
}

interface RegisteredWorkflow {
  readonly definition: GeneratedWorkflowDefinition;
  readonly topology: Uint32Array;
}

const workflows = new Map<string, RegisteredWorkflow>([
  [
    browserProfileCompositionWorkflow.id,
    {
      definition: browserProfileCompositionWorkflow,
      topology: browserProfileCompositionTopology,
    },
  ],
  [
    browserContributionWorkflow.id,
    {
      definition: browserContributionWorkflow,
      topology: browserContributionTopology,
    },
  ],
  [
    subagentWorkflow.id,
    {
      definition: subagentWorkflow,
      topology: subagentWorkflowTopology,
    },
  ],
  [
    funflowWorkflow.id,
    {
      definition: funflowWorkflow,
      topology: funflowTopology,
    },
  ],
]);

function abortError(): DOMException {
  return new DOMException("POO Flow execution was aborted", "AbortError");
}

function projectWorkflow({ definition, topology }: RegisteredWorkflow): PooFlowRunResult {
  if (topology[0] !== 1 || topology[1] !== definition.steps.length) {
    throw new Error(`POO-FLOW-E001 invalid topology for workflow ${definition.id}`);
  }

  return {
    rootId: definition.rootId,
    events: definition.steps.map((step) => ({
      id: step.id,
      label: step.name,
      sequence: step.ordinal,
      kind: step.kind,
      objectForm: step.objectForm,
      objectSubtype: step.objectSubtype,
      scope: step.scope,
      scenario: step.scenario,
      definitionId: step.definitionId,
      instanceId: step.instanceId,
      evidenceRef: step.evidenceRef,
      boundaryType: step.boundaryType,
      capabilities: step.capabilities,
      conditions: step.conditions,
      properties: step.properties,
      states: step.states,
      state: "pending" as const,
      parentId: step.parentId,
      sourceId: step.sourceId,
      relation: step.relation,
      detail: step.dependencies.length === 0 ? "entry" : `after ${step.dependencies.join(", ")}`,
    })),
    edges: definition.edges,
  };
}

function workflowSession(runtime: PooFlowWasmRuntime, stepCount: number): PooFlowExecutionSession {
  return runtime.openWorkflow(stepCount);
}

export function createPooFlowWasmRunner(
  runtimeLoader: () => Promise<PooFlowWasmRuntime> = () => loadPooFlowWasmRuntime(),
): PooFlowRunner {
  let runtimePromise: Promise<PooFlowWasmRuntime> | undefined;

  return {
    async run(_source, { signal, workflowId }) {
      if (signal.aborted) throw abortError();
      if (!workflowId) throw new Error("POO-FLOW-E002 workflow id is required");

      const registered = workflows.get(workflowId);
      if (!registered) {
        throw new Error(
          `POO-FLOW-E003 unknown workflow ${workflowId}; available: ${[...workflows.keys()].join(
            ", ",
          )}`,
        );
      }

      runtimePromise ??= runtimeLoader();
      const runtime = await runtimePromise;
      if (signal.aborted) throw abortError();

      const projection = projectWorkflow(registered);
      return {
        ...projection,
        execution: workflowSession(runtime, registered.definition.steps.length),
      };
    },
  };
}

export const pooFlowWorkflowIds = Object.freeze([...workflows.keys()]);
import type { PooFlowGraphObjectIdentity } from "../poo-flow/graphContract";
