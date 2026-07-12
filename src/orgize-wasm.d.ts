declare module "orgize" {
  export type InitOptions = {
    module_or_path?: unknown;
  };

  export default function init(input?: InitOptions): Promise<unknown>;

  export class Org {
    constructor(source: string);
    html(): string;
    free(): void;
  }
}
