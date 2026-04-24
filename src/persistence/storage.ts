import type { SyncProvider } from "../api/sync/SyncProvider";
import { GoogleDriveSyncProvider } from "../api/sync/gdrive/GoogleDriveSyncProvider";
import {
  BLOCK_TYPE_STORAGE_KEY,
  BUILDING_BLOCK_STORAGE_KEY,
  CAMPAIGN_STORAGE_KEY,
  COMBAT_STORAGE_KEY,
  MAP_STATE_STORAGE_KEY,
  MONSTER_STORAGE_KEY,
  PLAYER_STORAGE_KEY,
} from "../constants";
import type {
  MonsterCombatant,
  PlayerCombatant,
  SavedCombat,
  SavedCombatInput,
} from "../types";
import type {
  BlockTypeDef,
  BuildingBlock,
  BuildingBlockInput,
  Campaign,
  CampaignInput,
} from "../types/campaign";
import { CombatStorageProvider } from "./CombatStorageProvider";
import { CombatantTemplateStorageProvider } from "./CombatantTemplateStorageProvider";
import { BuildingBlockStorageProvider } from "./BuildingBlockStorageProvider";
import {
  BlockTypeStorageProvider,
  type CustomTypeInput,
} from "./BlockTypeStorageProvider";
import { CampaignStorageProvider } from "./CampaignStorageProvider";
import {
  MapStateStorageProvider,
  type PersistedMapMeta,
} from "./MapStateStorageProvider";
import {
  cleanCombatStateForStorage,
  restoreCombatState,
} from "./combatStateOptimizer";

export class DataStore {
  private combatProvider: CombatStorageProvider;
  private playerProvider: CombatantTemplateStorageProvider<"player">;
  private monsterProvider: CombatantTemplateStorageProvider<"monster">;
  private blockProvider: BuildingBlockStorageProvider;
  private blockTypeProvider: BlockTypeStorageProvider;
  private campaignProvider: CampaignStorageProvider;
  private mapStateProvider: MapStateStorageProvider;
  private syncProvider: SyncProvider;

  constructor(
    clientId: string,
    combatProvider: CombatStorageProvider = new CombatStorageProvider(
      COMBAT_STORAGE_KEY,
    ),
    playerProvider = new CombatantTemplateStorageProvider<"player">(
      PLAYER_STORAGE_KEY,
    ),
    monsterProvider = new CombatantTemplateStorageProvider<"monster">(
      MONSTER_STORAGE_KEY,
    ),
    blockProvider: BuildingBlockStorageProvider = new BuildingBlockStorageProvider(
      BUILDING_BLOCK_STORAGE_KEY,
    ),
    blockTypeProvider: BlockTypeStorageProvider = new BlockTypeStorageProvider(
      BLOCK_TYPE_STORAGE_KEY,
    ),
    campaignProvider: CampaignStorageProvider = new CampaignStorageProvider(
      CAMPAIGN_STORAGE_KEY,
    ),
    mapStateProvider: MapStateStorageProvider = new MapStateStorageProvider(
      MAP_STATE_STORAGE_KEY,
    ),
  ) {
    this.combatProvider = combatProvider;
    this.playerProvider = playerProvider;
    this.monsterProvider = monsterProvider;
    this.blockProvider = blockProvider;
    this.blockTypeProvider = blockTypeProvider;
    this.campaignProvider = campaignProvider;
    this.mapStateProvider = mapStateProvider;
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

  async restoreBackup() {
    if (!this.syncProvider) {
      throw new Error("Sync not initialized. Call initSync() first.");
    }
    await this.syncProvider.restoreBackup();
  }

  getLastBackupTime(): number | undefined {
    return this.syncProvider?.getLastBackupTime();
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
      return undefined;
    }

    return {
      ...savedCombat,
      data: restoredData,
    };
  }
  async createCombat(input: SavedCombatInput) {
    const optimizedData = await cleanCombatStateForStorage(input.data, this);

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
      const optimizedData = await cleanCombatStateForStorage(patch.data, this);
      const optimizedPatch = {
        ...patch,
        data: optimizedData,
      };
      const otpmizedSavedCombat = await this.combatProvider.update(
        id,
        optimizedPatch,
      );
      return {
        ...otpmizedSavedCombat,
        data: patch.data,
      };
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

  // Block methods
  listBlock(): Promise<BuildingBlock[]> {
    return this.blockProvider.list();
  }
  getBlock(id: string): Promise<BuildingBlock | undefined> {
    return this.blockProvider.get(id);
  }
  createBlock(input: BuildingBlockInput): Promise<BuildingBlock> {
    return this.blockProvider.create(input);
  }
  updateBlock(
    id: string,
    patch: Partial<BuildingBlock>,
  ): Promise<BuildingBlock> {
    return this.blockProvider.update(id, patch);
  }
  deleteBlock(id: string): Promise<void> {
    return this.blockProvider.delete(id);
  }

  // Block type methods
  listBlockTypes(): Promise<BlockTypeDef[]> {
    return this.blockTypeProvider.list();
  }
  createBlockType(input: CustomTypeInput): Promise<BlockTypeDef> {
    return this.blockTypeProvider.create(input);
  }
  updateBlockType(
    id: string,
    patch: Partial<BlockTypeDef>,
  ): Promise<BlockTypeDef> {
    return this.blockTypeProvider.update(id, patch);
  }
  deleteBlockType(id: string): Promise<void> {
    return this.blockTypeProvider.delete(id);
  }

  // Campaign methods
  listCampaign(): Promise<Campaign[]> {
    return this.campaignProvider.list();
  }
  getCampaign(id: string): Promise<Campaign | undefined> {
    return this.campaignProvider.get(id);
  }
  createCampaign(input: CampaignInput): Promise<Campaign> {
    return this.campaignProvider.create(input);
  }
  updateCampaign(id: string, patch: Partial<Campaign>): Promise<Campaign> {
    return this.campaignProvider.update(id, patch);
  }
  deleteCampaign(id: string): Promise<void> {
    return this.campaignProvider.delete(id);
  }

  // Map state methods
  getMapState(): PersistedMapMeta | null {
    return this.mapStateProvider.get();
  }
  setMapState(meta: PersistedMapMeta): void {
    this.mapStateProvider.set(meta);
  }
}

export const dataStore = new DataStore(import.meta.env.VITE_GOOGLE_CLIENT_ID);
