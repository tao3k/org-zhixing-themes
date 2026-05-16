export const createOrgizeWorker = (): Worker =>
  new Worker(new URL("./orgizeWorkerEntry.ts", import.meta.url), {
    name: "orgize-parser",
    type: "module",
  });
