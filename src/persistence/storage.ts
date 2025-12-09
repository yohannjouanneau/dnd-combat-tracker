import type { SyncProvider } from "../api/sync/SyncProvider";
import { GoogleDriveSyncProvider } from "../api/sync/gdrive/GoogleDriveSyncProvider";
import {
  COMBAT_STORAGE_KEY,
  MONSTER_STORAGE_KEY,
  PLAYER_STORAGE_KEY,
} from "../constants";
import type {
  MonsterCombatant,
  PlayerCombatant,
  SavedCombat,
  SavedCombatInput,
} from "../types";
import { CombatStorageProvider } from "./CombatStorageProvider";
import { CombatantTemplateStorageProvider } from "./CombatantTemplateStorageProvider";
import {
  cleanCombatStateForStorage,
  restoreCombatState,
} from "./combatStateOptimizer";

export class DataStore {
  private combatProvider: CombatStorageProvider;
  private playerProvider: CombatantTemplateStorageProvider<"player">;
  private monsterProvider: CombatantTemplateStorageProvider<"monster">;
  private syncProvider: SyncProvider;

  constructor(
    clientId: string,
    combatProvider: CombatStorageProvider = new CombatStorageProvider(
      COMBAT_STORAGE_KEY
    ),
    playerProvider = new CombatantTemplateStorageProvider<"player">(
      PLAYER_STORAGE_KEY
    ),
    monsterProvider = new CombatantTemplateStorageProvider<"monster">(
      MONSTER_STORAGE_KEY
    )
  ) {
    this.combatProvider = combatProvider;
    this.playerProvider = playerProvider;
    this.monsterProvider = monsterProvider;
    this.syncProvider = new GoogleDriveSyncProvider(clientId);
  }

  // Sync methods
  async authorizeSync() {
    await this.syncProvider.authorize();
  }

  async logout() {
    await this.syncProvider?.revoke();
  }

  async hasNewRemoteData() {
    if (!this.syncProvider) {
      throw new Error("Sync not initialized. Call initSync() first.");
    }
    return this.syncProvider.hasNewRemoteData();
  }

  async syncToCloud() {
    if (!this.syncProvider) {
      throw new Error("Sync not initialized. Call initSync() first.");
    }
    await this.syncProvider.sync();
  }

  async uploadToCloud() {
    if (!this.syncProvider) {
      throw new Error("Sync not initialized. Call initSync() first.");
    }
    await this.syncProvider.upload();
  }

  async downloadFromCloud() {
    if (!this.syncProvider) {
      throw new Error("Sync not initialized. Call initSync() first.");
    }
    await this.syncProvider.download();
  }

  isSyncAuthorized(): boolean {
    return this.syncProvider?.isAuthorized() ?? false;
  }

  getLastSyncTime(): number | undefined {
    return this.syncProvider?.getLastSyncTime();
  }

  // Combat methods
  listCombat() {
    return this.combatProvider.list();
  }
  async getCombat(id: string) {
    const savedCombat = await this.combatProvider.get(id);

    if (!savedCombat) {
      return undefined;
    }

    // Restore optimized data
    const restoredData = await restoreCombatState(savedCombat.data, this);

    if (!restoredData) {
      return undefined
    }

    return {
      ...savedCombat,
      data: restoredData,
    };
  }
  async createCombat(input: SavedCombatInput) {
    const optimizedData = cleanCombatStateForStorage(input.data);

    const savedCombat = await this.combatProvider.create({
      ...input,
      data: optimizedData,
    });

    return {
      ...savedCombat,
      data: input.data,
    };
  }
  async updateCombat(id: string, patch: Partial<SavedCombat>) {
    if (patch.data) {
      const optimizedData = cleanCombatStateForStorage(patch.data);
      const optimizedPatch = {
        ...patch,
        data: optimizedData,
      };
      const otpmizedSavedCombat = await this.combatProvider.update(id, optimizedPatch);
      return {
        ...otpmizedSavedCombat,
        data: patch.data
      }
    }
    const savedCombat = await this.combatProvider.update(id, patch);
    return savedCombat;
  }

  deleteCombat(id: string) {
    return this.combatProvider.delete(id);
  }

  // Player methods
  listPlayer() {
    return this.playerProvider.list();
  }
  getPlayer(id: string) {
    return this.playerProvider.get(id);
  }
  createPlayer(input: PlayerCombatant) {
    return this.playerProvider.create(input);
  }
  updatePlayer(id: string, patch: Partial<PlayerCombatant>) {
    return this.playerProvider.update(id, patch);
  }
  deletePlayer(id: string) {
    return this.playerProvider.delete(id);
  }

  // Monster methods
  listMonster() {
    return this.monsterProvider.list();
  }
  getMonster(id: string) {
    return this.monsterProvider.get(id);
  }
  searchMonster(query: string) {
    return this.monsterProvider.search(query);
  }
  createMonster(input: MonsterCombatant) {
    return this.monsterProvider.create(input);
  }
  updateMonster(id: string, patch: Partial<MonsterCombatant>) {
    return this.monsterProvider.update(id, patch);
  }
  deleteMonster(id: string) {
    return this.monsterProvider.delete(id);
  }
}

export const dataStore = new DataStore(import.meta.env.VITE_GOOGLE_CLIENT_ID);
