import type { BlockTypeDef } from "../types/campaign";
import { safeParse, safeStringify } from "../utils/utils";

type CustomTypeInput = Omit<BlockTypeDef, "isBuiltIn">;

export class BlockTypeStorageProvider {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  private readAll(): BlockTypeDef[] {
    return safeParse<BlockTypeDef>(localStorage.getItem(this.key));
  }

  private writeAll(items: BlockTypeDef[]): void {
    localStorage.setItem(this.key, safeStringify(items));
  }

  async list(): Promise<BlockTypeDef[]> {
    return this.readAll();
  }

  async create(data: CustomTypeInput): Promise<BlockTypeDef> {
    const item: BlockTypeDef = { ...data, isBuiltIn: false };
    const items = this.readAll();
    items.push(item);
    this.writeAll(items);
    return item;
  }

  async update(
    id: string,
    patch: Partial<BlockTypeDef>,
  ): Promise<BlockTypeDef> {
    const items = this.readAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error("Not found");
    const merged: BlockTypeDef = { ...items[idx], ...patch };
    items[idx] = merged;
    this.writeAll(items);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const items = this.readAll().filter((i) => i.id !== id);
    this.writeAll(items);
  }
}
