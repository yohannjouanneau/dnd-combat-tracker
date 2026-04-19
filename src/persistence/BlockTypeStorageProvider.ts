import type { BlockTypeDef } from "../types/campaign";
import type { TimestampedEntity } from "../types";
import { safeParse, safeStringify } from "../utils/utils";

export type CustomTypeInput = Omit<
  BlockTypeDef,
  "isBuiltIn" | keyof TimestampedEntity
>;

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
    const now = Date.now();
    const item: BlockTypeDef = {
      ...data,
      isBuiltIn: false,
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
    patch: Partial<BlockTypeDef>,
  ): Promise<BlockTypeDef> {
    const items = this.readAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error("Not found");
    const merged: BlockTypeDef = {
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
