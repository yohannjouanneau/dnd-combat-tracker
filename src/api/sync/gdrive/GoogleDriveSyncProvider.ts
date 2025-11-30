// src/persistence/GoogleDriveSyncProvider.ts
import {
  COMBAT_STORAGE_KEY,
  LAST_SYNC_STORAGE_KEY,
  MONSTER_STORAGE_KEY,
  PLAYER_STORAGE_KEY,
} from "../../../constants";
import type { SyncProvider } from "../SyncProvider";
import type { SyncData } from "../types";
import { GoogleDriveSyncClient } from "./GoogleDriveSyncClient";

export class GoogleDriveSyncProvider implements SyncProvider {
  private client: GoogleDriveSyncClient;
  private syncInProgress = false;
  private lastRemoteData: SyncData | null = null;

  constructor(clientId: string) {
    this.client = new GoogleDriveSyncClient(
      clientId,
      "dnd-combat-tracker.json"
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

  /**
   * Upload current localStorage data to Google Drive
   */
  async upload(): Promise<void> {
    if (this.syncInProgress) {
      throw new Error("Sync already in progress");
    }

    await this.uploadInternal();
  }

  /**
   * Internal upload without lock check
   */
  private async uploadInternal(): Promise<void> {
    const data: SyncData = {
      combats: localStorage.getItem(COMBAT_STORAGE_KEY),
      players: localStorage.getItem(PLAYER_STORAGE_KEY),
      monsters: localStorage.getItem(MONSTER_STORAGE_KEY),
      lastSynced: Date.now(),
    };

    await this.client.save(data);
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

  /**
   * Internal download without lock check
   */
  private async downloadInternal(): Promise<void> {
    const data = await this.client.load<SyncData>();

    if (!data) {
      console.log("No data found in Google Drive");
      return;
    }

    // Restore each key if it exists
    if (data.combats) {
      localStorage.setItem(COMBAT_STORAGE_KEY, data.combats);
    }
    if (data.players) {
      localStorage.setItem(PLAYER_STORAGE_KEY, data.players);
    }
    if (data.monsters) {
      localStorage.setItem(MONSTER_STORAGE_KEY, data.monsters);
    }
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
      localStorage.getItem(LAST_SYNC_STORAGE_KEY) || "0"
    );

    if (!this.lastRemoteData) {
      this.lastRemoteData = await this.loadData()
    }

    if (!this.lastRemoteData) {
      return false
    }
    return this.lastRemoteData.lastSynced > localLastSynced
  }

  /**
   * Uses "last write wins" strategy based on timestamps
   */
  async sync(): Promise<void> {
    if (this.syncInProgress) {
      throw new Error("Sync already in progress");
    }

    this.syncInProgress = true;
    try {
      const remoteData = this.lastRemoteData ?? await this.loadData()

      if (!remoteData) {
        // No remote data, upload local
        await this.uploadInternal();
        return;
      }

      const localLastSynced = parseInt(
        localStorage.getItem(LAST_SYNC_STORAGE_KEY) || "0"
      );

      // If remote is newer, download
      if (remoteData.lastSynced > localLastSynced) {
        await this.downloadInternal();
        localStorage.setItem(
          LAST_SYNC_STORAGE_KEY,
          remoteData.lastSynced.toString()
        );
      } else {
        // Local is newer or same, upload
        await this.uploadInternal();
        localStorage.setItem(LAST_SYNC_STORAGE_KEY, Date.now().toString());
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get last sync timestamp
   */
  getLastSyncTime(): number | undefined {
    const time = localStorage.getItem(LAST_SYNC_STORAGE_KEY);
    return time ? parseInt(time) : undefined;
  }
}
