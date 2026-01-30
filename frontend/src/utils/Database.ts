/* src/utils/Database.ts */

type SortDir = "asc" | "desc";

export type QueryOptions<T> = {
  where?: Partial<T> | ((row: T) => boolean);
  sortBy?: keyof T;
  sortDir?: SortDir;
  page?: number;      // 1-based
  pageSize?: number;  // default 50
};

export class DatabaseError extends Error {
  public readonly code:
    | "INVALID_COLLECTION"
    | "INVALID_KEY"
    | "NOT_FOUND"
    | "VALIDATION_ERROR"
    | "STORAGE_UNAVAILABLE"
    | "QUOTA_EXCEEDED"
    | "CORRUPTED_DATA"
    | "UNKNOWN";
  public readonly details?: unknown;

  constructor(
    code: DatabaseError["code"],
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
    this.details = details;
  }
}

type WithId = { id: string };

type DBConfig = {
  namespace?: string; // prefix in localStorage
  version?: number;
  /**
   * Hook optional: validation per collection
   * Example: { users: (u) => { if(!u.email) throw ... } }
   */
  validators?: Record<string, (row: any) => void>;
  /**
   * If true: will write a checksum and verify on read
   */
  integrityCheck?: boolean;
};

type StoredPayload<T> = {
  meta: {
    version: number;
    updatedAt: string;
    checksum?: string;
  };
  data: T[];
};

export class Database {
  private readonly ns: string;
  private readonly version: number;
  private readonly validators: Record<string, (row: any) => void>;
  private readonly integrityCheck: boolean;

  // a simple logical lock (best effort)
  private lockKey: string;

  constructor(config: DBConfig = {}) {
    this.ns = config.namespace ?? "app_db";
    this.version = config.version ?? 1;
    this.validators = config.validators ?? {};
    this.integrityCheck = !!config.integrityCheck;
    this.lockKey = `${this.ns}::__lock__`;

    this.assertStorageAvailable();
  }

  // -----------------------------
  // Public API
  // -----------------------------

  /** CREATE: insert a new row in a collection */
  public create<T extends object>(
    collection: string,
    row: Omit<T, "id"> & Partial<Pick<WithId, "id">>
  ): T & WithId {
    this.assertCollection(collection);

    const newRow: T & WithId = {
      ...(row as T),
      id: row.id ?? this.generateId(),
    };

    this.validate(collection, newRow);

    return this.withLock(() => {
      const all = this.readAll<T & WithId>(collection);
      if (all.some((r) => r.id === newRow.id)) {
        throw new DatabaseError(
          "VALIDATION_ERROR",
          `Duplicate id "${newRow.id}" in "${collection}".`,
          { id: newRow.id }
        );
      }
      all.push(newRow);
      this.writeAll(collection, all);
      return newRow;
    });
  }

  /** CREATE MANY */
  public createMany<T extends object>(
    collection: string,
    rows: Array<Omit<T, "id"> & Partial<Pick<WithId, "id">>>
  ): Array<T & WithId> {
    this.assertCollection(collection);

    const prepared = rows.map((r) => {
      const row: T & WithId = { ...(r as T), id: r.id ?? this.generateId() };
      this.validate(collection, row);
      return row;
    });

    return this.withLock(() => {
      const all = this.readAll<T & WithId>(collection);
      const existingIds = new Set(all.map((x) => x.id));
      for (const r of prepared) {
        if (existingIds.has(r.id)) {
          throw new DatabaseError(
            "VALIDATION_ERROR",
            `Duplicate id "${r.id}" in "${collection}".`,
            { id: r.id }
          );
        }
      }
      const merged = [...all, ...prepared];
      this.writeAll(collection, merged);
      return prepared;
    });
  }

  /** READ: get one by id */
  public getById<T extends object>(
    collection: string,
    id: string
  ): (T & WithId) | null {
    this.assertCollection(collection);
    this.assertKey(id);

    const all = this.readAll<T & WithId>(collection);
    return all.find((r) => r.id === id) ?? null;
  }

  /** READ: list with filters/sort/pagination */
  public list<T extends object>(
    collection: string,
    options: QueryOptions<T & WithId> = {}
  ): { items: Array<T & WithId>; total: number; page: number; pageSize: number } {
    this.assertCollection(collection);

    const pageSize = options.pageSize ?? 50;
    const page = options.page ?? 1;

    if (page <= 0 || pageSize <= 0) {
      throw new DatabaseError(
        "VALIDATION_ERROR",
        "page and pageSize must be positive integers.",
        { page, pageSize }
      );
    }

    let all = this.readAll<T & WithId>(collection);

    // where filter
    if (options.where) {
      if (typeof options.where === "function") {
        all = all.filter(options.where);
      } else {
        const whereObj = options.where;
        all = all.filter((row) => {
          return Object.entries(whereObj).every(([k, v]) => {
            return (row as any)[k] === v;
          });
        });
      }
    }

    // sort
    if (options.sortBy) {
      const key = options.sortBy as string;
      const dir = options.sortDir ?? "asc";
      all = [...all].sort((a: any, b: any) => {
        const av = a[key];
        const bv = b[key];
        if (av === bv) return 0;
        if (av === undefined) return 1;
        if (bv === undefined) return -1;
        return dir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    }

    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    return { items, total, page, pageSize };
  }

  /** UPDATE: replace fields by id (patch) */
  public update<T extends object>(
    collection: string,
    id: string,
    patch: Partial<Omit<T, "id">>
  ): T & WithId {
    this.assertCollection(collection);
    this.assertKey(id);

    return this.withLock(() => {
      const all = this.readAll<T & WithId>(collection);
      const idx = all.findIndex((r) => r.id === id);
      if (idx === -1) {
        throw new DatabaseError(
          "NOT_FOUND",
          `Row "${id}" not found in "${collection}".`,
          { id, collection }
        );
      }

      const updated: T & WithId = { ...all[idx], ...(patch as any), id };
      this.validate(collection, updated);

      all[idx] = updated;
      this.writeAll(collection, all);
      return updated;
    });
  }

  /** UPSERT: update if exists else create */
  public upsert<T extends object>(
    collection: string,
    row: (T & WithId) | (Omit<T, "id"> & Partial<Pick<WithId, "id">>)
  ): T & WithId {
    this.assertCollection(collection);

    const id = (row as any).id ?? this.generateId();
    const candidate: T & WithId = { ...(row as any), id };
    this.validate(collection, candidate);

    return this.withLock(() => {
      const all = this.readAll<T & WithId>(collection);
      const idx = all.findIndex((r) => r.id === id);
      if (idx === -1) {
        all.push(candidate);
        this.writeAll(collection, all);
        return candidate;
      } else {
        all[idx] = candidate;
        this.writeAll(collection, all);
        return candidate;
      }
    });
  }

  /** DELETE: by id */
  public delete(collection: string, id: string): boolean {
    this.assertCollection(collection);
    this.assertKey(id);

    return this.withLock(() => {
      const all = this.readAll<WithId>(collection);
      const before = all.length;
      const after = all.filter((r) => r.id !== id);
      if (after.length === before) return false;
      this.writeAll(collection, after);
      return true;
    });
  }

  /** DELETE MANY: by filter */
  public deleteWhere<T extends object>(
    collection: string,
    where: Partial<T & WithId> | ((row: T & WithId) => boolean)
  ): number {
    this.assertCollection(collection);

    return this.withLock(() => {
      const all = this.readAll<T & WithId>(collection);
      const keep = all.filter((row) => {
        if (typeof where === "function") return !where(row);
        return !Object.entries(where).every(([k, v]) => (row as any)[k] === v);
      });
      const deleted = all.length - keep.length;
      this.writeAll(collection, keep);
      return deleted;
    });
  }

  /** COUNT */
  public count<T extends object>(
    collection: string,
    where?: Partial<T & WithId> | ((row: T & WithId) => boolean)
  ): number {
    this.assertCollection(collection);
    const all = this.readAll<T & WithId>(collection);

    if (!where) return all.length;
    if (typeof where === "function") return all.filter(where).length;

    return all.filter((row) =>
      Object.entries(where).every(([k, v]) => (row as any)[k] === v)
    ).length;
  }

  /** Clear one collection */
  public clear(collection: string): void {
    this.assertCollection(collection);
    this.withLock(() => {
      this.writeAll(collection, []);
    });
  }

  /** Clear all data in this namespace */
  public clearAll(): void {
    this.withLock(() => {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(this.ns + "::")) {
          localStorage.removeItem(k);
        }
      }
      localStorage.removeItem(this.lockKey);
    });
  }

  /** Backup entire namespace as JSON string */
  public export(): string {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(this.ns + "::"));
    const dump: Record<string, string> = {};
    for (const k of keys) dump[k] = localStorage.getItem(k) ?? "";
    return JSON.stringify({ namespace: this.ns, version: this.version, dump });
  }

  /** Restore from export() */
  public import(json: string, { overwrite = false } = {}): void {
    this.withLock(() => {
      let parsed: any;
      try {
        parsed = JSON.parse(json);
      } catch (e) {
        throw new DatabaseError("CORRUPTED_DATA", "Invalid backup JSON.", e);
      }
      if (!parsed?.dump || typeof parsed.dump !== "object") {
        throw new DatabaseError("CORRUPTED_DATA", "Backup format invalid.", parsed);
      }

      if (!overwrite) {
        // prevent accidental overwrite
        const existing = Object.keys(localStorage).some((k) => k.startsWith(this.ns + "::"));
        if (existing) {
          throw new DatabaseError(
            "VALIDATION_ERROR",
            "Data already exists. Use overwrite=true to replace.",
            { namespace: this.ns }
          );
        }
      } else {
        this.clearAll();
      }

      for (const [k, v] of Object.entries(parsed.dump)) {
        if (typeof k === "string" && typeof v === "string") {
          localStorage.setItem(k, v);
        }
      }
    });
  }

  // -----------------------------
  // Internals
  // -----------------------------

  private collectionKey(collection: string): string {
    return `${this.ns}::${collection}`;
  }

  private assertCollection(collection: string): void {
    if (!collection || typeof collection !== "string") {
      throw new DatabaseError(
        "INVALID_COLLECTION",
        "Collection name must be a non-empty string.",
        { collection }
      );
    }
    // keep keys safe-ish
    if (!/^[a-zA-Z0-9_\-]+$/.test(collection)) {
      throw new DatabaseError(
        "INVALID_COLLECTION",
        "Collection name contains invalid characters. Use letters, numbers, _ or -.",
        { collection }
      );
    }
  }

  private assertKey(id: string): void {
    if (!id || typeof id !== "string") {
      throw new DatabaseError("INVALID_KEY", "Invalid id.", { id });
    }
  }

  private assertStorageAvailable(): void {
    try {
      const testKey = `${this.ns}::__test__`;
      localStorage.setItem(testKey, "1");
      localStorage.removeItem(testKey);
    } catch (e: any) {
      throw new DatabaseError(
        "STORAGE_UNAVAILABLE",
        "localStorage is not available (private mode, blocked, or disabled).",
        e
      );
    }
  }

  private readAll<T>(collection: string): T[] {
    const key = this.collectionKey(collection);
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    let payload: StoredPayload<T>;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      throw new DatabaseError(
        "CORRUPTED_DATA",
        `Corrupted JSON in collection "${collection}".`,
        { raw, error: e }
      );
    }

    if (!payload || !Array.isArray(payload.data) || !payload.meta?.version) {
      throw new DatabaseError(
        "CORRUPTED_DATA",
        `Invalid payload format in "${collection}".`,
        payload
      );
    }

    if (this.integrityCheck) {
      const checksum = payload.meta.checksum;
      const computed = this.computeChecksum(payload.data);
      if (checksum && checksum !== computed) {
        throw new DatabaseError(
          "CORRUPTED_DATA",
          `Integrity check failed for "${collection}".`,
          { checksum, computed }
        );
      }
    }

    return payload.data;
  }

  private writeAll<T>(collection: string, data: T[]): void {
    const key = this.collectionKey(collection);

    const payload: StoredPayload<T> = {
      meta: {
        version: this.version,
        updatedAt: new Date().toISOString(),
        checksum: this.integrityCheck ? this.computeChecksum(data) : undefined,
      },
      data,
    };

    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e: any) {
      // Quota exceeded is common
      const isQuota =
        e?.name === "QuotaExceededError" ||
        e?.code === 22 ||
        e?.code === 1014; // Firefox
      throw new DatabaseError(
        isQuota ? "QUOTA_EXCEEDED" : "UNKNOWN",
        isQuota
          ? "localStorage quota exceeded. Data too large."
          : "Failed to write to localStorage.",
        e
      );
    }
  }

  private validate(collection: string, row: any): void {
    if (!row?.id || typeof row.id !== "string") {
      throw new DatabaseError(
        "VALIDATION_ERROR",
        `Row must have a string id in "${collection}".`,
        row
      );
    }
    const validator = this.validators[collection];
    if (validator) {
      try {
        validator(row);
      } catch (e: any) {
        throw new DatabaseError(
          "VALIDATION_ERROR",
          e?.message ?? `Validation failed for "${collection}".`,
          e
        );
      }
    }
  }

  private withLock<T>(fn: () => T): T {
    // Best-effort lock to avoid quick successive writes
    const lockValue = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const now = Date.now();
    const ttlMs = 1500;

    try {
      const current = localStorage.getItem(this.lockKey);
      if (current) {
        const [tsStr] = current.split("_");
        const ts = Number(tsStr);
        if (!Number.isNaN(ts) && now - ts < ttlMs) {
          throw new DatabaseError(
            "UNKNOWN",
            "Database is busy (lock active). Retry shortly.",
            { lock: current }
          );
        }
      }
      localStorage.setItem(this.lockKey, lockValue);

      const result = fn();

      // release
      if (localStorage.getItem(this.lockKey) === lockValue) {
        localStorage.removeItem(this.lockKey);
      }
      return result;
    } catch (e) {
      // ensure release if we own it
      if (localStorage.getItem(this.lockKey) === lockValue) {
        localStorage.removeItem(this.lockKey);
      }
      if (e instanceof DatabaseError) throw e;
      throw new DatabaseError("UNKNOWN", "Unexpected database error.", e);
    }
  }

  private generateId(): string {
    // uuid-like (good enough for local dev)
    const a = Math.random().toString(16).slice(2);
    const b = Date.now().toString(16);
    const c = Math.random().toString(16).slice(2);
    return `${b}-${a}-${c}`.slice(0, 36);
  }

  private computeChecksum(data: unknown): string {
    // Tiny non-crypto hash for integrity check
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16);
  }
}
