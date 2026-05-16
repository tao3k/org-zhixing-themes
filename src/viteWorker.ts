import OrgizeWorker from "orgize/worker?worker";

export const createOrgizeWorker = (): Worker => new OrgizeWorker({ type: "module" });
