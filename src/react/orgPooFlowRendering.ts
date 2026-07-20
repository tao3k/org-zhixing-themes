import { createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";

import type { PooFlowRunResult, PooFlowRunner } from "./pooFlowModel";

type GraphComponent = ComponentType<{ result: PooFlowRunResult; workflowId?: string }>;
export type PooFlowGraphLoader = () => Promise<{ PooFlowGraph: GraphComponent }>;

let configuredRunner: PooFlowRunner | undefined;
const configuredWorkflowRunners = new Map<string, PooFlowRunner>();
const projectionType = "application/vnd.poo-flow.projection+json";
const previewRegistryKey = "__orgZhixingPooFlowPreviews__";
type PreviewRegistryGlobal = typeof globalThis & {
  [previewRegistryKey]?: WeakMap<HTMLElement, () => void>;
};
const previewRegistry = ((globalThis as PreviewRegistryGlobal)[previewRegistryKey] ??=
  new WeakMap());

export function configureOrgPooFlowRunner(runner: PooFlowRunner | undefined): () => void {
  const previous = configuredRunner;
  configuredRunner = runner;
  return () => {
    if (configuredRunner === runner) configuredRunner = previous;
  };
}

export function configureOrgPooFlowWorkflow(workflowId: string, runner: PooFlowRunner): () => void {
  const previous = configuredWorkflowRunners.get(workflowId);
  configuredWorkflowRunners.set(workflowId, runner);
  return () => {
    if (configuredWorkflowRunners.get(workflowId) !== runner) return;
    if (previous) configuredWorkflowRunners.set(workflowId, previous);
    else configuredWorkflowRunners.delete(workflowId);
  };
}

export function findOrgPooFlowBlocks(root: ParentNode): HTMLElement[] {
  const matches = new Set(root.querySelectorAll<HTMLElement>("pre[data-poo-flow]"));
  root
    .querySelectorAll<HTMLElement>("pre.src-scheme, pre > code.language-scheme")
    .forEach((candidate) => {
      const block = candidate.matches("pre") ? candidate : candidate.closest<HTMLElement>("pre");
      if (block && (block.dataset.pooFlow !== undefined || readPooFlowProjection(block)))
        matches.add(block);
    });
  root.querySelectorAll<HTMLElement>("pre[data-poo-flow] > code").forEach((code) => {
    const block = code.closest<HTMLElement>("pre");
    if (block) matches.add(block);
  });
  return [...matches];
}

function sourceText(block: HTMLElement): string {
  const code = block.querySelector("code");
  return (code?.textContent ?? block.textContent ?? "").trim();
}

function isRunResult(value: unknown): value is PooFlowRunResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { events?: unknown; edges?: unknown };
  if (!Array.isArray(candidate.events) || candidate.events.length === 0) return false;
  const eventIds = new Set<string>();
  for (const event of candidate.events) {
    if (!event || typeof event !== "object") return false;
    const item = event as { id?: unknown; label?: unknown; state?: unknown };
    if (typeof item.id !== "string" || typeof item.label !== "string" || eventIds.has(item.id))
      return false;
    if (
      item.state !== undefined &&
      !["pending", "running", "completed", "failed"].includes(String(item.state))
    ) {
      return false;
    }
    eventIds.add(item.id);
  }
  if (candidate.edges === undefined) return true;
  if (!Array.isArray(candidate.edges)) return false;
  return candidate.edges.every((edge) => {
    if (!edge || typeof edge !== "object") return false;
    const item = edge as { source?: unknown; target?: unknown };
    return (
      typeof item.source === "string" &&
      typeof item.target === "string" &&
      eventIds.has(item.source) &&
      eventIds.has(item.target)
    );
  });
}

export function readPooFlowProjection(block: HTMLElement): PooFlowRunResult | undefined {
  const packet = block.nextElementSibling;
  if (!(packet instanceof HTMLScriptElement) || packet.type !== projectionType) return undefined;
  try {
    const value: unknown = JSON.parse(packet.textContent ?? "");
    return isRunResult(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function projectionRunner(result: PooFlowRunResult): PooFlowRunner {
  return {
    async run(_source, { signal }) {
      if (signal.aborted) throw new DOMException("Workflow projection cancelled", "AbortError");
      return result;
    },
  };
}

function createPreview(
  block: HTMLElement,
  runner: PooFlowRunner | undefined,
  loadGraph: PooFlowGraphLoader,
) {
  previewRegistry.get(block)?.();
  const controller = new AbortController();
  const workflowId = block.dataset.pooFlow;
  const embeddedProjection = readPooFlowProjection(block);
  const runtimeRunner =
    (workflowId ? configuredWorkflowRunners.get(workflowId) : undefined) ?? runner;
  const activeRunner =
    runtimeRunner ?? (embeddedProjection ? projectionRunner(embeddedProjection) : undefined);
  let execution: PooFlowRunResult["execution"];
  const figure = document.createElement("figure");
  figure.className = "org-poo-flow org-poo-flow--source-collapsed";
  figure.dataset.state = activeRunner ? "ready" : "unavailable";

  const toolbar = document.createElement("figcaption");
  toolbar.className = "org-poo-flow__toolbar";
  const title = document.createElement("strong");
  title.textContent = "Poo Flow · Scheme";
  const status = document.createElement("span");
  status.className = "org-poo-flow__status";
  status.textContent = runtimeRunner
    ? "Runtime ready · loading graph"
    : embeddedProjection
      ? "Projection ready · loading graph"
      : "Runtime adapter not connected";
  const sourceButton = document.createElement("button");
  sourceButton.type = "button";
  sourceButton.className = "org-poo-flow__source-toggle";
  sourceButton.textContent = "Source code";
  sourceButton.setAttribute("aria-expanded", "false");
  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.className = "org-poo-flow__retry";
  retryButton.textContent = "Retry graph";
  retryButton.hidden = true;
  toolbar.append(title, status, sourceButton, retryButton);

  const graphHost = document.createElement("div");
  graphHost.className = "org-poo-flow__graph-host";
  graphHost.hidden = true;
  block.before(figure);
  figure.append(toolbar, graphHost, block);

  let reactRoot: Root | undefined;
  let observer: IntersectionObserver | undefined;
  const run = async () => {
    if (!activeRunner || controller.signal.aborted) return;
    figure.dataset.state = "running";
    status.textContent = "Loading interactive graph";
    retryButton.hidden = true;
    try {
      execution?.release();
      execution = undefined;
      const graphModule = loadGraph();
      const result = await activeRunner.run(sourceText(block), {
        signal: controller.signal,
        workflowId,
      });
      execution = result.execution;
      let module: Awaited<ReturnType<PooFlowGraphLoader>>;
      try {
        module = await graphModule;
      } catch (error) {
        execution?.release();
        execution = undefined;
        throw error;
      }
      if (controller.signal.aborted) return;
      graphHost.hidden = false;
      reactRoot ??= createRoot(graphHost);
      reactRoot.render(createElement(module.PooFlowGraph, { result, workflowId }));
      requestAnimationFrame(() => window.dispatchEvent(new Event("org-zhixing:poo-flow-reveal")));
      figure.dataset.state = "complete";
      status.textContent = `${result.events.length}-node composition ready`;
    } catch (error) {
      if (controller.signal.aborted) return;
      figure.dataset.state = "error";
      status.textContent = error instanceof Error ? error.message : "Workflow failed";
      retryButton.hidden = false;
    }
  };
  const toggleSource = () => {
    const collapsed = figure.classList.toggle("org-poo-flow--source-collapsed");
    sourceButton.setAttribute("aria-expanded", String(!collapsed));
  };
  const retry = () => void run();
  sourceButton.addEventListener("click", toggleSource);
  retryButton.addEventListener("click", retry);
  if (activeRunner) {
    if (typeof IntersectionObserver === "undefined" || figure.getBoundingClientRect().width === 0) {
      queueMicrotask(() => void run());
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          observer = undefined;
          void run();
        },
        { rootMargin: "320px 0px" },
      );
      observer.observe(figure);
    }
  }

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    controller.abort();
    execution?.release();
    execution = undefined;
    sourceButton.removeEventListener("click", toggleSource);
    retryButton.removeEventListener("click", retry);
    reactRoot?.unmount();
    figure.before(block);
    figure.remove();
    if (previewRegistry.get(block) === dispose) previewRegistry.delete(block);
  };
  previewRegistry.set(block, dispose);
  return dispose;
}

export function installOrgPooFlowRendering(
  root: ParentNode,
  runner: PooFlowRunner | undefined = configuredRunner,
  loadGraph: PooFlowGraphLoader = () => import("./PooFlowGraph"),
): () => void {
  const dispose = findOrgPooFlowBlocks(root).map((block) =>
    createPreview(block, runner, loadGraph),
  );
  return () => {
    [...dispose].reverse().forEach((stop) => stop());
  };
}

export type { PooFlowEdge, PooFlowEvent, PooFlowRunResult, PooFlowRunner } from "./pooFlowModel";

if (import.meta.webpackHot) {
  import.meta.webpackHot.dispose(() => window.location.reload());
  import.meta.webpackHot.accept();
}
