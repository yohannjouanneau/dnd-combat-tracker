import type { SavedCombat } from '../types';
import { LocalStorageProvider } from './LocalStorageProvider';

const STORAGE_KEY = 'dnd-ct:combats:v1';

export class CombatStore {
  private provider: LocalStorageProvider;

  constructor(provider: LocalStorageProvider = new LocalStorageProvider(STORAGE_KEY)) {
    this.provider = provider;
  }

  list() { return this.provider.list(); }
  get(id: string) { return this.provider.get(id); }
  create(input: Omit<SavedCombat, 'id' | 'createdAt' | 'updatedAt'>) { return this.provider.create(input); }
  update(id: string, patch: Partial<SavedCombat>) { return this.provider.update(id, patch); }
  delete(id: string) { return this.provider.delete(id); }
}

export const combatStore = new CombatStore();


