const store: Record<string, string> = {};

export async function getItem(key: string): Promise<string | null> {
  return store[key] ?? null;
}

export async function setItem(key: string, value: string): Promise<void> {
  store[key] = value;
}

export async function removeItem(key: string): Promise<void> {
  delete store[key];
}

export async function getAllKeys(): Promise<string[]> {
  return Object.keys(store);
}

export async function multiGet(keys: string[]): Promise<[string, string | null][]> {
  return keys.map((k) => [k, store[k] ?? null]);
}

export async function multiSet(pairs: [string, string][]): Promise<void> {
  for (const [k, v] of pairs) store[k] = v;
}

export async function multiRemove(keys: string[]): Promise<void> {
  for (const k of keys) delete store[k];
}

export async function clear(): Promise<void> {
  for (const k of Object.keys(store)) delete store[k];
}

export default {
  getItem,
  setItem,
  removeItem,
  getAllKeys,
  multiGet,
  multiSet,
  multiRemove,
  clear,
};
