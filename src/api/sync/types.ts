export interface SyncData {
  combats: string | null;
  players: string | null;
  monsters: string | null;
  lastSynced: number;
}

export interface SyncApi {
  isSyncAuthorized: () => boolean;
  authorizeSync: () => Promise<boolean>;
  hasNewRemoteData: () => Promise<boolean>;
  synchronise: () => Promise<boolean>;
  getLastSyncTime: () => number | undefined;
  logout: () => Promise<boolean>;
}
