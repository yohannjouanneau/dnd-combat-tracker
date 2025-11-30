export interface SyncProvider {
  authorize(): Promise<void>;
  revoke(): Promise<void>;
  isAuthorized(): boolean;
  upload(): Promise<void>;
  download(): Promise<void>;
  hasNewRemoteData(): Promise<boolean>;
  sync(): Promise<void>;
  getLastSyncTime(): number | undefined;
}
