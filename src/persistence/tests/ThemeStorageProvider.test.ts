import { ThemeStorageProvider } from "../ThemeStorageProvider";

const KEY = "dnd-ct:theme:v1";

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

describe("ThemeStorageProvider", () => {
  afterEach(() => {
    delete (global as unknown as { localStorage?: unknown }).localStorage;
  });

  it("returns null when nothing is stored", () => {
    installLocalStorage();
    expect(new ThemeStorageProvider(KEY).get()).toBeNull();
  });

  it("round-trips each theme", () => {
    installLocalStorage();
    const provider = new ThemeStorageProvider(KEY);
    for (const theme of ["dark", "light", "forest"] as const) {
      provider.set(theme);
      expect(provider.get()).toBe(theme);
    }
  });

  it("reads themes saved by the previous implementation (same key, raw string)", () => {
    // The old code stored the theme unencoded; users must keep their theme.
    installLocalStorage({ [KEY]: "forest" });
    expect(new ThemeStorageProvider(KEY).get()).toBe("forest");
  });

  it("ignores unknown themes and corrupted JSON", () => {
    installLocalStorage({ [KEY]: JSON.stringify("solarized") });
    expect(new ThemeStorageProvider(KEY).get()).toBeNull();
    installLocalStorage({ [KEY]: "{bad" });
    expect(new ThemeStorageProvider(KEY).get()).toBeNull();
  });

  it("does not throw when localStorage is unavailable", () => {
    const provider = new ThemeStorageProvider(KEY);
    expect(provider.get()).toBeNull();
    expect(() => provider.set("dark")).not.toThrow();
  });
});
