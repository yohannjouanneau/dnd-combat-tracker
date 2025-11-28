import type {
  CombatantTemplate,
  CombatantTemplateType,
  SavedCombatantTemplate,
} from "../types";
import { generateId, safeParse, safeStringify } from "../utils";

export class CombatantTemplateStorageProvider<T extends CombatantTemplateType> {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  private readAll(): SavedCombatantTemplate<T>[] {
    return safeParse<SavedCombatantTemplate<T>>(localStorage.getItem(this.key));
  }

  private writeAll(items: SavedCombatantTemplate<T>[]): void {
    localStorage.setItem(this.key, safeStringify(items));
  }

  async list(): Promise<SavedCombatantTemplate<T>[]> {
    return this.readAll();
  }

  async get(id: string): Promise<SavedCombatantTemplate<T> | undefined> {
    return this.readAll().find((i) => i.id === id);
  }

  async search(query: string): Promise<SavedCombatantTemplate<T>[]> {
    const lowerQuery = query.toLowerCase();
    return this.readAll().filter((monster) =>
      monster.name.toLowerCase().includes(lowerQuery)
    );
  }

  async create(
    data: CombatantTemplate<T>
  ): Promise<SavedCombatantTemplate<T>> {
    const now = Date.now();
    const generatedId = generateId();

    const item: SavedCombatantTemplate<T> = {
      ...data,
      id: generatedId,
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
    patch: Partial<CombatantTemplate<T>>
  ): Promise<SavedCombatantTemplate<T>> {
    const items = this.readAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error("CombatantTemplate not found");
    const merged = {
      ...items[idx],
      ...patch,
      updatedAt: Date.now(),
    } as SavedCombatantTemplate<T>;
    items[idx] = merged;
    this.writeAll(items);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const items = this.readAll().filter((i) => i.id !== id);
    this.writeAll(items);
  }
}
