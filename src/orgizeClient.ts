import type {
  OrgizeAgendaViewJsonRequestDto,
  OrgizeAgendaViewResponseDto,
  OrgizeLintResponseDto,
  OrgizeProjectionName,
  OrgizeViewIndexResponseDto,
} from "orgize/dto";
import type { OrgizeRenderFormat, OrgizeWorkerMessage, OrgizeWorkerRequest } from "orgize/worker";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
};

type WorkerRequestInput = {
  command: OrgizeWorkerRequest["command"];
  source?: string;
  sourceFile?: string;
  projection?: OrgizeProjectionName;
  format?: OrgizeRenderFormat;
  agendaView?: OrgizeAgendaViewJsonRequestDto;
};

export type TimedResult<T> = {
  value: T;
  durationMs: number;
};

export type OrgizeInitInfo = {
  buildTime?: string;
  gitHash?: string;
};

export type OrgizeSessionOptions = {
  createWorker: () => Worker;
  sessionId?: string;
};

export class OrgizeSession {
  #worker: Worker;
  #nextRequestId = 0;
  #pending = new Map<string, PendingRequest>();
  #sessionId: string;

  constructor(options: OrgizeSessionOptions) {
    this.#sessionId = options.sessionId ?? "org-zhixing-demo";
    this.#worker = options.createWorker();
    this.#worker.addEventListener("message", (event) => {
      this.#handleMessage(event.data as OrgizeWorkerMessage);
    });
  }

  init(): Promise<TimedResult<OrgizeInitInfo>> {
    return this.#requestTimed<OrgizeInitInfo>({
      command: "init",
    });
  }

  parseViewIndex(
    source: string,
    sourceFile?: string,
  ): Promise<TimedResult<OrgizeViewIndexResponseDto>> {
    return this.#requestTimed<OrgizeViewIndexResponseDto>({
      command: "parse",
      source,
      sourceFile,
      projection: "viewIndex",
    });
  }

  updateViewIndex(
    source: string,
    sourceFile?: string,
  ): Promise<TimedResult<OrgizeViewIndexResponseDto>> {
    return this.#requestTimed<OrgizeViewIndexResponseDto>({
      command: "update",
      source,
      sourceFile,
      projection: "viewIndex",
    });
  }

  projection<T>(projection: OrgizeProjectionName): Promise<T> {
    return this.#request<T>({
      command: "projection",
      projection,
    });
  }

  lint(): Promise<TimedResult<OrgizeLintResponseDto>> {
    return this.#requestTimed<OrgizeLintResponseDto>({
      command: "projection",
      projection: "lint",
    });
  }

  agendaView(
    request: OrgizeAgendaViewJsonRequestDto,
  ): Promise<TimedResult<OrgizeAgendaViewResponseDto>> {
    return this.#requestTimed<OrgizeAgendaViewResponseDto>({
      command: "projection",
      projection: "agendaView",
      agendaView: request,
    });
  }

  render(format: "html" | "markdown" | "latex" | "org"): Promise<string> {
    return this.#request<string>({
      command: "render",
      format,
    });
  }

  renderTimed(format: "html" | "markdown" | "latex" | "org"): Promise<TimedResult<string>> {
    return this.#requestTimed<string>({
      command: "render",
      format,
    });
  }

  dispose(): void {
    this.#worker.postMessage({
      command: "dispose",
      sessionId: this.#sessionId,
    } satisfies OrgizeWorkerRequest);
    this.#worker.terminate();
    this.#pending.clear();
  }

  #request<T>(request: WorkerRequestInput): Promise<T> {
    return this.#requestTimed<T>(request).then((result) => result.value);
  }

  #requestTimed<T>(request: WorkerRequestInput): Promise<TimedResult<T>> {
    const requestId = String(++this.#nextRequestId);
    const message = {
      ...request,
      requestId,
      sessionId: this.#sessionId,
    } as OrgizeWorkerRequest;
    const startedAt = performance.now();

    return new Promise<TimedResult<T>>((resolve, reject) => {
      this.#pending.set(requestId, {
        resolve: (value) =>
          resolve({
            value: value as T,
            durationMs: performance.now() - startedAt,
          }),
        reject,
      });
      this.#worker.postMessage(message);
    });
  }

  #handleMessage(message: OrgizeWorkerMessage): void {
    const key = String(message.requestId ?? message.id ?? "");
    const pending = this.#pending.get(key);
    if (!pending) {
      return;
    }
    this.#pending.delete(key);

    if (message.ok) {
      pending.resolve(message.result);
    } else {
      pending.reject(new Error(message.error.message));
    }
  }
}
