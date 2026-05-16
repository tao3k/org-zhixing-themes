import { mountOrgZhixingApp } from "./app";
import { createOrgizeWorker } from "./viteWorker";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("missing #app root");
}

mountOrgZhixingApp(app, {
  createWorker: createOrgizeWorker,
});
