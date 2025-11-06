import type { SavedPlayer } from "../types";

function safeParse<T>(raw: string | null): T[] {
  if (!raw) return [] as unknown as T[];
  try { return JSON.parse(raw) as T[]; } catch { return [] as unknown as T[]; }
}

function safeStringify<T>(data: T[]): string {
  try { return JSON.stringify(data); } catch { return '[]'; }
}

function generateId(): string {
  // Generate a random id: 16 characters, URL-safe
  return ([1,2,3,4,5,6,7,8,9,0].map(() =>
    Math.random().toString(36).slice(2)
  ).join('').slice(0,16));
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
    return this.readAll().find(i => i.id === id);
  }

  async create(data: Omit<SavedPlayer, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<SavedPlayer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SavedPlayer> {
    const now = Date.now();
    const generatedId = generateId();
    const id = data.id as string;
    const playerId = id?.trim() !== '' ? id : generatedId;
    
    const item: SavedPlayer = {
      id: playerId,
      groupName: data.groupName,
      initiativeGroups: data.initiativeGroups,
      hp: data.hp,
      maxHp: data.maxHp,
      ac: data.ac,
      color: data.color,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
      imageUrl: data.imageUrl
    };
    
    const items = this.readAll();
    items.push(item);
    this.writeAll(items);
    return item;
  }

  async update(id: string, patch: Partial<SavedPlayer>): Promise<SavedPlayer> {
    const items = this.readAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) throw new Error('Player not found');
    const merged = { ...items[idx], ...patch, updatedAt: Date.now() } as SavedPlayer;
    items[idx] = merged;
    this.writeAll(items);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const items = this.readAll().filter(i => i.id !== id);
    this.writeAll(items);
  }
}