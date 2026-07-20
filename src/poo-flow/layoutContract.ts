export interface PooFlowLayoutNodeInput {
  readonly id: string;
  readonly parentId?: string;
  readonly width: number;
  readonly height: number;
  readonly container: boolean;
}

export interface PooFlowLayoutConnectionInput {
  readonly id: string;
  readonly source: string;
  readonly target: string;
}

export interface PooFlowLayoutRequest {
  readonly nodes: readonly PooFlowLayoutNodeInput[];
  readonly connections: readonly PooFlowLayoutConnectionInput[];
  readonly direction: "DOWN" | "RIGHT";
}

export interface PooFlowLayoutNodeGeometry {
  readonly id: string;
  readonly parentId?: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PooFlowLayoutResult {
  readonly nodes: readonly PooFlowLayoutNodeGeometry[];
}

export interface PooFlowLayoutAdapter {
  readonly id: string;
  layout(request: PooFlowLayoutRequest): Promise<PooFlowLayoutResult>;
}
