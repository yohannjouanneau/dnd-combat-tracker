import type { SavedPlayer, SavedPlayerInput } from "../types";
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

export class PlayerStorageProvider {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  private readAll(): SavedPlayer[] {
    return safeParse<SavedPlayer>(localStorage.getItem(this.key));
  }

  private writeAll(items: SavedPlayer[]): void {
    localStorage.setItem(this.key, safeStringify(items));
  }

  async list(): Promise<SavedPlayer[]> {
    return this.readAll();
  }

  async get(id: string): Promise<SavedPlayer | undefined> {
    return this.readAll().find((i) => i.id === id);
  }

  async create(data: SavedPlayerInput): Promise<SavedPlayer> {
    const now = Date.now();
    const generatedId = generateId();

    const item: SavedPlayer = {
      id: generatedId,
      groupName: data.groupName,
      initiativeGroups: data.initiativeGroups,
      hp: data.hp,
      maxHp: data.maxHp,
      ac: data.ac,
      color: data.color,
      createdAt: now,
      updatedAt: now,
      imageUrl: data.imageUrl,
      initBonus: data.initBonus,
      externalResourceUrl: data.externalResourceUrl
    };

    const items = this.readAll();
    items.push(item);
    this.writeAll(items);
    return item;
  }

  async update(id: string, patch: Partial<SavedPlayer>): Promise<SavedPlayer> {
    const items = this.readAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error("Player not found");
    const merged = {
      ...items[idx],
      ...patch,
      updatedAt: Date.now(),
    } as SavedPlayer;
    items[idx] = merged;
    this.writeAll(items);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const items = this.readAll().filter((i) => i.id !== id);
    this.writeAll(items);
  }
}
