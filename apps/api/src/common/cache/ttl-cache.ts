export class TtlCache<TKey, TValue> {
  private readonly store = new Map<TKey, { value: TValue; expiresAt: number }>();

  constructor(private readonly ttlMs: number) {}

  get(key: TKey): TValue | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: TKey, value: TValue) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: TKey) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}
