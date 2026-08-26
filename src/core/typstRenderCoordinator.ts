import { BoundedLruCache } from "./boundedLruCache";

export type TypstCompiler = (source: string) => Promise<string>;

export type TypstPersistentCache = {
  read: (source: string) => Promise<string | undefined>;
  write: (source: string, svg: string) => Promise<void>;
};

export type TypstRenderCoordinator = {
  render: TypstCompiler;
};

type TypstRenderCoordinatorOptions = {
  cache?: BoundedLruCache<string, string>;
  capacity?: number;
  compile: TypstCompiler;
  persistentCache?: TypstPersistentCache;
};

/**
 * Keeps the non-reentrant Typst compiler serialized without making cache hits
 * wait behind an unrelated cold compilation.
 */
export const createTypstRenderCoordinator = ({
  cache = new BoundedLruCache<string, string>(64),
  capacity = 64,
  compile,
  persistentCache,
}: TypstRenderCoordinatorOptions): TypstRenderCoordinator => {
  const memoryCache =
    cache.capacity === capacity ? cache : new BoundedLruCache<string, string>(capacity);
  const inFlight = new Map<string, Promise<string>>();
  let compileTail: Promise<unknown> = Promise.resolve();

  const enqueueCompilation = (source: string): Promise<string> => {
    const compilation = compileTail.then(async () => {
      const warmedWhileQueued = memoryCache.get(source);
      if (warmedWhileQueued !== undefined) return warmedWhileQueued;

      const svg = await compile(source);
      memoryCache.set(source, svg);
      if (persistentCache) {
        void persistentCache.write(source, svg).catch(() => undefined);
      }
      return svg;
    });
    compileTail = compilation.catch(() => undefined);
    return compilation;
  };

  const render: TypstCompiler = (source) => {
    const cached = memoryCache.get(source);
    if (cached !== undefined) return Promise.resolve(cached);

    const duplicate = inFlight.get(source);
    if (duplicate) return duplicate;

    const request = (async () => {
      let persisted: string | undefined;
      try {
        persisted = await persistentCache?.read(source);
      } catch {
        // Persistent storage is an acceleration layer, never a compiler dependency.
      }
      if (persisted !== undefined) {
        memoryCache.set(source, persisted);
        return persisted;
      }
      return enqueueCompilation(source);
    })().finally(() => {
      if (inFlight.get(source) === request) inFlight.delete(source);
    });
    inFlight.set(source, request);
    return request;
  };

  return { render };
};
