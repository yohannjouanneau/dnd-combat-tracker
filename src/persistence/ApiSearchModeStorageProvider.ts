import type { ApiSearchMode } from "../types";

const VALID_MODES: readonly ApiSearchMode[] = ["2014", "2024", "both"];

/** Persists the D&D API ruleset(s) chosen for monster searches. */
export class ApiSearchModeStorageProvider {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  get(): ApiSearchMode | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const value = JSON.parse(raw) as unknown;
      return VALID_MODES.includes(value as ApiSearchMode)
        ? (value as ApiSearchMode)
        : null;
    } catch {
      return null;
    }
  }

  set(mode: ApiSearchMode): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(mode));
    } catch {
      // localStorage quota exceeded or unavailable — silently ignore
    }
  }
}
