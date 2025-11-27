import type { SyncProvider } from "../api/sync/SyncProvider";
import { GoogleDriveSyncProvider } from "../api/sync/gdrive/GoogleDriveSyncProvider";
import { GOOGLE_DRIVE_APP_CLIENT_ID } from "../constants";
import type {
  MonsterCombatant,
  PlayerCombatant,
  SavedCombat,
  SavedCombatInput,
} from "../types";
import { CombatStorageProvider } from "./CombatStorageProvider";
import { CombatantTemplateStorageProvider } from "./CombatantTemplateStorageProvider";

const COMBAT_STORAGE_KEY = "dnd-ct:combats:v1";
const PLAYER_STORAGE_KEY = "dnd-ct:players:v1";
const MONSTER_STORAGE_KEY = "dnd-ct:monsters:v1";

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
    await this.syncProvider?.revoke()
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
  getCombat(id: string) {
    return this.combatProvider.get(id);
  }
  createCombat(input: SavedCombatInput) {
    return this.combatProvider.create(input);
  }
  updateCombat(id: string, patch: Partial<SavedCombat>) {
    return this.combatProvider.update(id, patch);
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

export const dataStore = new DataStore(GOOGLE_DRIVE_APP_CLIENT_ID);
