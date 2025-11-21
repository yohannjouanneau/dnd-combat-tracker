import type { MonsterData, MonsterDataInput } from "../types";
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

export class MonsterStorageProvider {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  private readAll(): MonsterData[] {
    return safeParse<MonsterData>(localStorage.getItem(this.key));
  }

  private writeAll(items: MonsterData[]): void {
    localStorage.setItem(this.key, safeStringify(items));
  }

  async list(): Promise<MonsterData[]> {
    return this.readAll();
  }

  async get(id: string): Promise<MonsterData | undefined> {
    return this.readAll().find((i) => i.id === id);
  }

  async search(query: string): Promise<MonsterData[]> {
    const lowerQuery = query.toLowerCase();
    return this.readAll().filter((monster) =>
      monster.name.toLowerCase().includes(lowerQuery)
    );
  }

  async create(data: MonsterDataInput): Promise<MonsterData> {
    const now = Date.now();
    const generatedId = generateId();

    const item: MonsterData = {
      id: generatedId,
      name: data.name,
      hp: data.hp,
      ac: data.ac,
      imageUrl: data.imageUrl,
      str: data.str,
      dex: data.dex,
      con: data.con,
      int: data.int,
      wis: data.wis,
      cha: data.cha,
      createdAt: now,
      updatedAt: now,
    };

    const items = this.readAll();
    items.push(item);
    this.writeAll(items);
    return item;
  }

  async update(id: string, patch: Partial<MonsterData>): Promise<MonsterData> {
    const items = this.readAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error("Monster not found");
    const merged = {
      ...items[idx],
      ...patch,
      updatedAt: Date.now(),
    } as MonsterData;
    items[idx] = merged;
    this.writeAll(items);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const items = this.readAll().filter((i) => i.id !== id);
    this.writeAll(items);
  }
}
