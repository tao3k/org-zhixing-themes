export type TypstRenderRequest = {
  id: number;
  source: string;
};

export type TypstRenderResponse =
  | { id: number; ok: true; svg: string }
  | { id: number; message: string; ok: false };
