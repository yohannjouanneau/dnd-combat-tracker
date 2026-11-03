export type StoredTheme = "dark" | "light" | "forest";

const VALID_THEMES: readonly StoredTheme[] = ["dark", "light", "forest"];

/** Persists the UI theme chosen by the user on this device. */
export class ThemeStorageProvider {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  get(): StoredTheme | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      // Accept both JSON ("forest") and the legacy unencoded value (forest)
      let value: unknown = raw;
      try {
        value = JSON.parse(raw);
      } catch {
        // legacy raw string: use as-is
      }
      return VALID_THEMES.includes(value as StoredTheme)
        ? (value as StoredTheme)
        : null;
    } catch {
      return null;
    }
  }

  set(theme: StoredTheme): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(theme));
    } catch {
      // localStorage quota exceeded or unavailable — silently ignore
    }
  }
}
