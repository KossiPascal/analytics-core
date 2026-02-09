type Collection<T> = {
  items: T[];
};

const store: Record<string, Collection<any>> = {};

export const db = {
  list<T>(name: string): Collection<T> {
    if (!store[name]) store[name] = { items: [] };
    return store[name];
  },

  create<T>(name: string, item: T) {
    if (!store[name]) store[name] = { items: [] };
    store[name].items.push(item);
  },
};
