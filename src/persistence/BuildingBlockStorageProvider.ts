import type { BuildingBlock, BuildingBlockInput } from "../types/campaign";
import { safeParse, safeStringify } from "../utils/utils";

export class BuildingBlockStorageProvider {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  private readAll(): BuildingBlock[] {
    return safeParse<BuildingBlock>(localStorage.getItem(this.key));
  }

  private writeAll(items: BuildingBlock[]): void {
    localStorage.setItem(this.key, safeStringify(items));
  }

  async list(): Promise<BuildingBlock[]> {
    return this.readAll();
  }

  async get(id: string): Promise<BuildingBlock | undefined> {
    return this.readAll().find((i) => i.id === id);
  }

  async create(data: BuildingBlockInput): Promise<BuildingBlock> {
    const now = Date.now();
    const item: BuildingBlock = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    const items = this.readAll();
    items.push(item);
    this.writeAll(items);
    return item;
  }

  async update(
    id: string,
    patch: Partial<BuildingBlock>,
  ): Promise<BuildingBlock> {
    const items = this.readAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error("Not found");
    const merged: BuildingBlock = {
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
