declare module "*?url" {
  const url: string;
  export default url;
}

interface ImportMeta {
  readonly webpackHot?: {
    accept(): void;
    dispose(callback: () => void): void;
  };
}
