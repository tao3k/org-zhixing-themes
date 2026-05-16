/// <reference types="vite/client" />

declare module "orgize/worker?worker" {
  const WorkerFactory: {
    new (options?: WorkerOptions): Worker;
  };
  export default WorkerFactory;
}
