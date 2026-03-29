import type { Campaign, CampaignInput } from "../types/campaign";
import { safeParse, safeStringify } from "../utils/utils";

export class CampaignStorageProvider {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  private readAll(): Campaign[] {
    return safeParse<Campaign>(localStorage.getItem(this.key));
  }

  private writeAll(items: Campaign[]): void {
    localStorage.setItem(this.key, safeStringify(items));
  }

  async list(): Promise<Campaign[]> {
    return this.readAll();
  }

  async get(id: string): Promise<Campaign | undefined> {
    return this.readAll().find((i) => i.id === id);
  }

  async create(data: CampaignInput): Promise<Campaign> {
    const now = Date.now();
    const item: Campaign = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    const items = this.readAll();
    items.push(item);
    this.writeAll(items);
    return item;
  }

  async update(id: string, patch: Partial<Campaign>): Promise<Campaign> {
    const items = this.readAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error("Not found");
    const merged: Campaign = {
      ...items[idx],
      ...patch,
      updatedAt: Date.now(),
    };
    items[idx] = merged;
    this.writeAll(items);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const items = this.readAll().filter((i) => i.id !== id);
    this.writeAll(items);
  }
}
