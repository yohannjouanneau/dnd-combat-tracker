export interface PersistedMapToken {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  label?: string;
  hidden: boolean;
  revealsFog: boolean;
}

export interface PersistedMapMeta {
  tokens: PersistedMapToken[];
  revealedZones: { x: number; y: number; radius: number }[];
  rooms?: { id: string; name?: string; points: { x: number; y: number }[] }[];
  camera: { x: number; y: number; scale: number };
  updatedAt?: number;
}

export class MapStateStorageProvider {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  get(): PersistedMapMeta | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      return JSON.parse(raw) as PersistedMapMeta;
    } catch {
      return null;
    }
  }

  set(meta: PersistedMapMeta): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(meta));
    } catch {
      // localStorage quota exceeded — silently ignore
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.key);
    } catch {
      // ignore
    }
  }
}
