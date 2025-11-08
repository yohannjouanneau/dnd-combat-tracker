import type { SavedCombat, SavedCombatInput, SavedPlayer, SavedPlayerInput } from '../types';
import { CombatStorageProvider } from './CombatStorageProvider';
import { PlayerStorageProvider } from './PlayerStorageProvider';

const COMBAT_STORAGE_KEY = 'dnd-ct:combats:v1';
const PLAYER_STORAGE_KEY = 'dnd-ct:players:v1';

export class DataStore {
  private combatProvider: CombatStorageProvider;
  private playerProvider: PlayerStorageProvider;

  constructor(
    combatProvider: CombatStorageProvider = new CombatStorageProvider(COMBAT_STORAGE_KEY),
    playerProvider: PlayerStorageProvider = new PlayerStorageProvider(PLAYER_STORAGE_KEY)
  ) {
    this.combatProvider = combatProvider;
    this.playerProvider = playerProvider;
  }

  listCombat() { return this.combatProvider.list(); }
  getCombat(id: string) { return this.combatProvider.get(id); }
  createCombat(input: SavedCombatInput) { return this.combatProvider.create(input); }
  updateCombat(id: string, patch: Partial<SavedCombat>) { return this.combatProvider.update(id, patch); }
  deleteCombat(id: string) { return this.combatProvider.delete(id); }

  listPlayer() { return this.playerProvider.list(); }
  getPlayer(id: string) { return this.playerProvider.get(id); }
  createPlayer(input: SavedPlayerInput) { return this.playerProvider.create(input); }
  updatePlayer(id: string, patch: Partial<SavedPlayer>) { return this.playerProvider.update(id, patch); }
  deletePlayer(id: string) { return this.playerProvider.delete(id); }
}

export const dataStore = new DataStore();


