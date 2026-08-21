export class TtlCache<TKey, TValue> {
  private readonly store = new Map<TKey, { value: TValue; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries?: number,
  ) {
    if (
      maxEntries !== undefined &&
      (!Number.isInteger(maxEntries) || maxEntries < 1)
    ) {
      throw new RangeError("maxEntries must be a positive integer");
    }
  }

  get(key: TKey): TValue | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: TKey, value: TValue, ttlMs = this.ttlMs) {
    if (!this.store.has(key) && this.maxEntries !== undefined) {
      this.deleteExpiredEntries();

      while (this.store.size >= this.maxEntries) {
        const oldestKey = this.store.keys().next().value as TKey | undefined;
        if (oldestKey === undefined) break;
        this.store.delete(oldestKey);
      }
    }

    // Refresh insertion order so frequently updated entries are evicted last.
    this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get size() {
    this.deleteExpiredEntries();
    return this.store.size;
  }

  delete(key: TKey) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  private deleteExpiredEntries() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}
