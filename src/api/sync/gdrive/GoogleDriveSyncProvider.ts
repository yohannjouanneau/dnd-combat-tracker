// src/persistence/GoogleDriveSyncProvider.ts
import { GoogleDriveSyncClient } from './GoogleDriveSyncClient';

interface SyncData {
  combats: string | null;
  players: string | null;
  monsters: string | null;
  lastSynced: number;
}

export class GoogleDriveSyncProvider {
  private client: GoogleDriveSyncClient;
  private syncInProgress = false;

  constructor(clientId: string) {
    this.client = new GoogleDriveSyncClient(clientId, 'dnd-combat-tracker.json');
  }

  /**
   * Authorize with Google Drive
   */
  async authorize(): Promise<void> {
    await this.client.authorize();
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
      throw new Error('Sync already in progress');
    }

    await this.uploadInternal();
  }

  /**
   * Internal upload without lock check
   */
  private async uploadInternal(): Promise<void> {
    const data: SyncData = {
      combats: localStorage.getItem('dnd-ct:combats:v1'),
      players: localStorage.getItem('dnd-ct:players:v1'),
      monsters: localStorage.getItem('dnd-ct:monsters:v1'),
      lastSynced: Date.now(),
    };

    await this.client.save(data);
  }

  /**
   * Download data from Google Drive and merge with localStorage
   */
  async download(): Promise<void> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    await this.downloadInternal();
  }

  /**
   * Internal download without lock check
   */
  private async downloadInternal(): Promise<void> {
    const data = await this.client.load<SyncData>();

    if (!data) {
      console.log('No data found in Google Drive');
      return;
    }

    // Restore each key if it exists
    if (data.combats) {
      localStorage.setItem('dnd-ct:combats:v1', data.combats);
    }
    if (data.players) {
      localStorage.setItem('dnd-ct:players:v1', data.players);
    }
    if (data.monsters) {
      localStorage.setItem('dnd-ct:monsters:v1', data.monsters);
    }
  }

  /**
   * Smart sync: merge local and remote data
   * Uses "last write wins" strategy based on timestamps
   */
  async sync(): Promise<void> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    try {
      const remoteData = await this.client.load<SyncData>();
      
      if (!remoteData) {
        // No remote data, upload local
        await this.uploadInternal();
        return;
      }

      const localLastSynced = parseInt(
        localStorage.getItem('dnd-ct:lastSynced') || '0'
      );

      // If remote is newer, download
      if (remoteData.lastSynced > localLastSynced) {
        await this.downloadInternal();
        localStorage.setItem('dnd-ct:lastSynced', remoteData.lastSynced.toString());
      } else {
        // Local is newer or same, upload
        await this.uploadInternal();
        localStorage.setItem('dnd-ct:lastSynced', Date.now().toString());
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get last sync timestamp
   */
  getLastSyncTime(): number | null {
    const time = localStorage.getItem('dnd-ct:lastSynced');
    return time ? parseInt(time) : null;
  }
}