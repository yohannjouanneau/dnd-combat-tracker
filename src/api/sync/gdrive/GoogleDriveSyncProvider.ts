// src/persistence/GoogleDriveSyncProvider.ts
import {
  BACKUP_FILE_NAME,
  BLOCK_TYPE_STORAGE_KEY,
  BUILDING_BLOCK_STORAGE_KEY,
  CAMPAIGN_STORAGE_KEY,
  COMBAT_STORAGE_KEY,
  LAST_BACKUP_STORAGE_KEY,
  LAST_SYNC_STORAGE_KEY,
  MAP_STATE_STORAGE_KEY,
  MONSTER_STORAGE_KEY,
  PLAYER_STORAGE_KEY,
} from "../../../constants";
import type { SyncProvider } from "../SyncProvider";
import type { SyncData } from "../types";
import { GoogleDriveSyncClient } from "./GoogleDriveSyncClient";
import { mergeSyncData } from "./mergeSyncData";

export class GoogleDriveSyncProvider implements SyncProvider {
  private client: GoogleDriveSyncClient;
  private syncInProgress = false;
  private lastRemoteData: SyncData | null = null;

  constructor(clientId: string) {
    this.client = new GoogleDriveSyncClient(
      clientId,
      "dnd-combat-tracker.json",
    );
  }

  /**
   * Authorize with Google Drive
   */
  async authorize(): Promise<void> {
    await this.client.authorize();
  }

  async revoke(): Promise<void> {
    await this.client.revoke();
  }

  /**
   * Check if authorized
   */
  isAuthorized(): boolean {
    return this.client.isAuthorized();
  }

  private getLocalSyncData(): SyncData {
    return {
      combats: localStorage.getItem(COMBAT_STORAGE_KEY),
      players: localStorage.getItem(PLAYER_STORAGE_KEY),
      monsters: localStorage.getItem(MONSTER_STORAGE_KEY),
      blocks: localStorage.getItem(BUILDING_BLOCK_STORAGE_KEY),
      campaigns: localStorage.getItem(CAMPAIGN_STORAGE_KEY),
      blockTypes: localStorage.getItem(BLOCK_TYPE_STORAGE_KEY),
      mapState: localStorage.getItem(MAP_STATE_STORAGE_KEY),
      lastSynced: Date.now(),
    };
  }

  async upload(): Promise<void> {
    if (this.syncInProgress) {
      throw new Error("Sync already in progress");
    }
    await this.uploadInternal();
  }

  private async uploadInternal(): Promise<void> {
    await this.client.save(this.getLocalSyncData());
  }

  /**
   * Download data from Google Drive and merge with localStorage
   */
  async download(): Promise<void> {
    if (this.syncInProgress) {
      throw new Error("Sync already in progress");
    }

    await this.downloadInternal();
  }

  private async downloadInternal(): Promise<void> {
    const data = await this.client.load<SyncData>();
    if (!data) return;
    this.applyRemoteData(data);
  }

  private async loadData(): Promise<SyncData | null> {
    try {
      this.lastRemoteData = await this.client.load<SyncData>();
      return this.lastRemoteData;
    } catch (error) {
      console.error(`Unable to load remote data`, error);
      return null;
    }
  }

  async hasNewRemoteData(): Promise<boolean> {
    const localLastSynced = parseInt(
      localStorage.getItem(LAST_SYNC_STORAGE_KEY) || "0",
    );

    this.lastRemoteData = await this.loadData();

    if (!this.lastRemoteData) {
      return false;
    }
    return this.lastRemoteData.lastSynced > localLastSynced;
  }

  // Errors are swallowed so a backup failure never blocks the main sync.
  private async createBackupInternal(): Promise<void> {
    try {
      await this.client.saveToFile(BACKUP_FILE_NAME, this.getLocalSyncData());
      localStorage.setItem(LAST_BACKUP_STORAGE_KEY, Date.now().toString());
    } catch (error) {
      console.error("Backup failed (non-blocking):", error);
    }
  }

  async restoreBackup(): Promise<void> {
    if (this.syncInProgress) {
      throw new Error("Sync already in progress");
    }
    const data = await this.client.loadFromFile<SyncData>(BACKUP_FILE_NAME);
    if (!data) throw new Error("No backup found on Google Drive");

    this.applyRemoteData(data);
    localStorage.setItem(LAST_SYNC_STORAGE_KEY, Date.now().toString());
  }

  getLastBackupTime(): number | undefined {
    const time = localStorage.getItem(LAST_BACKUP_STORAGE_KEY);
    return time ? parseInt(time) : undefined;
  }

  async sync(): Promise<void> {
    if (this.syncInProgress) {
      throw new Error("Sync already in progress");
    }

    this.syncInProgress = true;
    try {
      await this.createBackupInternal();

      const remoteData = this.lastRemoteData ?? (await this.loadData());

      if (!remoteData) {
        await this.uploadInternal();
        localStorage.setItem(LAST_SYNC_STORAGE_KEY, Date.now().toString());
        return;
      }

      const localLastSynced = parseInt(
        localStorage.getItem(LAST_SYNC_STORAGE_KEY) || "0",
      );

      const merged = mergeSyncData(
        { ...this.getLocalSyncData(), lastSynced: localLastSynced },
        remoteData,
        localLastSynced,
      );

      this.applyRemoteData(merged);
      await this.client.save(merged);
      localStorage.setItem(LAST_SYNC_STORAGE_KEY, merged.lastSynced.toString());
    } finally {
      this.syncInProgress = false;
    }
  }

  getLastSyncTime(): number | undefined {
    const time = localStorage.getItem(LAST_SYNC_STORAGE_KEY);
    return time ? parseInt(time) : undefined;
  }

  private applyRemoteData(data: SyncData): void {
    if (data.combats) localStorage.setItem(COMBAT_STORAGE_KEY, data.combats);
    if (data.players) localStorage.setItem(PLAYER_STORAGE_KEY, data.players);
    if (data.monsters) localStorage.setItem(MONSTER_STORAGE_KEY, data.monsters);
    if (data.blocks)
      localStorage.setItem(BUILDING_BLOCK_STORAGE_KEY, data.blocks);
    if (data.campaigns)
      localStorage.setItem(CAMPAIGN_STORAGE_KEY, data.campaigns);
    if (data.blockTypes)
      localStorage.setItem(BLOCK_TYPE_STORAGE_KEY, data.blockTypes);
    if (data.mapState)
      localStorage.setItem(MAP_STATE_STORAGE_KEY, data.mapState);
  }
}
