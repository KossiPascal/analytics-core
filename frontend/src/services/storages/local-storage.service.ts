import Cookies from "js-cookie";

export type LocalDbName = "local" | "session" | "cookie";

interface StorageOptions {
  db: LocalDbName;
  name: string;
  value?: string;
}

export class StorageService {
  // Get value
  get({ db, name }: { db: LocalDbName; name: string }): string {
    if (db === "local") {
      return localStorage.getItem(name) ?? "";
    } else if (db === "session") {
      return sessionStorage.getItem(name) ?? "";
    } else if (db === "cookie") {
      return Cookies.get(name) ?? "";
    }
    return "";
  }

  // Set value
  set({ db, name, value }: StorageOptions) {
    if (db === "local") {
      sessionStorage.removeItem(name);
      Cookies.remove(name);
      localStorage.setItem(name, value!);
    } else if (db === "session") {
      localStorage.removeItem(name);
      Cookies.remove(name);
      sessionStorage.setItem(name, value!);
    } else if (db === "cookie") {
      localStorage.removeItem(name);
      sessionStorage.removeItem(name);
      Cookies.set(name, value!);
    }
  }

  // Delete single item
  delete({ db, name }: { db: LocalDbName; name: string }) {
    if (db === "local") localStorage.removeItem(name);
    else if (db === "session") sessionStorage.removeItem(name);
    else if (db === "cookie") Cookies.remove(name);
  }

  // Delete multiple items
  deleteSelected({ db, names }: { db: LocalDbName; names: string[] }) {
    names.forEach((name) => this.delete({ db, name }));
  }

  // Delete all items
  deleteAll(db: LocalDbName) {
    if (db === "local") localStorage.clear();
    else if (db === "session") sessionStorage.clear();
    else if (db === "cookie") {
      Object.keys(Cookies.get()).forEach((name) => Cookies.remove(name));
    }
  }
}

// Singleton instance for app-wide usage
export const appStorageService = new StorageService();
