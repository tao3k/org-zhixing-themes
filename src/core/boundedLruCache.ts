export class BoundedLruCache<Key, Value> {
  readonly #entries = new Map<Key, Value>();

  constructor(readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError("BoundedLruCache capacity must be a positive integer");
    }
  }

  get size(): number {
    return this.#entries.size;
  }

  get(key: Key): Value | undefined {
    const value = this.#entries.get(key);
    if (value === undefined) return undefined;

    this.#entries.delete(key);
    this.#entries.set(key, value);
    return value;
  }

  set(key: Key, value: Value): void {
    this.#entries.delete(key);
    this.#entries.set(key, value);

    while (this.#entries.size > this.capacity) {
      const oldestKey = this.#entries.keys().next().value as Key | undefined;
      if (oldestKey === undefined) return;
      this.#entries.delete(oldestKey);
    }
  }
}
