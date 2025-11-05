import type { SavedPlayer } from '../types';
import { PlayerStorageProvider } from './PlayerStorageProvider';

const STORAGE_KEY = 'dnd-ct:players:v1';

export class PlayerStore {
  private provider: PlayerStorageProvider;

  constructor(provider: PlayerStorageProvider = new PlayerStorageProvider(STORAGE_KEY)) {
    this.provider = provider;
  }

  list(): Promise<SavedPlayer[]> {
    return this.provider.list();
  }

  get(id: string): Promise<SavedPlayer | undefined> {
    return this.provider.get(id);
  }

  create(input: Omit<SavedPlayer, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedPlayer> {
    return this.provider.create(input);
  }

  update(id: string, patch: Partial<SavedPlayer>): Promise<SavedPlayer> {
    return this.provider.update(id, patch);
  }

  delete(id: string): Promise<void> {
    return this.provider.delete(id);
  }
}

export const playerStore = new PlayerStore();