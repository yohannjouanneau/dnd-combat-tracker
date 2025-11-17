import type { SavedCombat, SavedCombatInput } from "../types";
import { generateId } from "../utils";

function safeParse<T>(raw: string | null): T[] {
  if (!raw) return [] as unknown as T[];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [] as unknown as T[];
  }
}

function safeStringify<T>(data: T[]): string {
  try {
    return JSON.stringify(data);
  } catch {
    return "[]";
  }
}

export class CombatStorageProvider {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  private readAll(): SavedCombat[] {
    return safeParse<SavedCombat>(localStorage.getItem(this.key));
  }

  private writeAll(items: SavedCombat[]): void {
    localStorage.setItem(this.key, safeStringify(items));
  }

  async list(): Promise<SavedCombat[]> {
    return this.readAll();
  }

  async get(id: string): Promise<SavedCombat | undefined> {
    return this.readAll().find((i) => i.id === id);
  }

  async create(data: SavedCombatInput): Promise<SavedCombat> {
    const now = Date.now();
    const generatedId = generateId();
    const item: SavedCombat = {
      id: generatedId,
      createdAt: now,
      updatedAt: now,
      description: data.description ?? "",
      name: data.name ?? "",
      data: {
        ...data.data,
        combatId: generatedId,
        combatName: data.name,
        combatDescription: data.description,
      },
    };
    const items = this.readAll();
    items.push(item);
    this.writeAll(items);
    return item;
  }

  async update(id: string, patch: Partial<SavedCombat>): Promise<SavedCombat> {
    const items = this.readAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error("Not found");
    const merged = {
      ...items[idx],
      ...patch,
      updatedAt: Date.now(),
    } as SavedCombat;
    items[idx] = merged;
    this.writeAll(items);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const items = this.readAll().filter((i) => i.id !== id);
    this.writeAll(items);
  }
}
