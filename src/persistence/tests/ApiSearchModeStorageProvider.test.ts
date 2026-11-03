import { ApiSearchModeStorageProvider } from "../ApiSearchModeStorageProvider";

const KEY = "dnd-ct:api-search-mode:v1";

function installLocalStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
  (global as unknown as { localStorage: typeof storage }).localStorage =
    storage;
  return data;
}

describe("ApiSearchModeStorageProvider", () => {
  afterEach(() => {
    delete (global as unknown as { localStorage?: unknown }).localStorage;
  });

  it("returns null when nothing is stored", () => {
    installLocalStorage();
    expect(new ApiSearchModeStorageProvider(KEY).get()).toBeNull();
  });

  it("round-trips each valid mode", () => {
    installLocalStorage();
    const provider = new ApiSearchModeStorageProvider(KEY);
    for (const mode of ["2014", "2024", "both"] as const) {
      provider.set(mode);
      expect(provider.get()).toBe(mode);
    }
  });

  it("ignores stored values that are not a known mode", () => {
    installLocalStorage({ [KEY]: JSON.stringify("2099") });
    expect(new ApiSearchModeStorageProvider(KEY).get()).toBeNull();
  });

  it("returns null for corrupted JSON", () => {
    installLocalStorage({ [KEY]: "{not json" });
    expect(new ApiSearchModeStorageProvider(KEY).get()).toBeNull();
  });

  it("does not throw when localStorage is unavailable", () => {
    const provider = new ApiSearchModeStorageProvider(KEY);
    expect(provider.get()).toBeNull();
    expect(() => provider.set("both")).not.toThrow();
  });
});
