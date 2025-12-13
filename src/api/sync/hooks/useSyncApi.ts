import { dataStore } from "../../../persistence/storage";
import { useToast } from "../../../components/common/Toast/useToast";
import type { SyncApi } from "../types";

interface UseSyncApiProps {
  onSyncSuccess?: () => Promise<void>;
}

export function useSyncApi(props?: UseSyncApiProps): SyncApi {
  const toastApi = useToast();

  const isSyncAuthorized = () => {
    return dataStore.isSyncAuthorized();
  };

  const authorizeSync = async () => {
    if (!dataStore.isSyncAuthorized()) {
      try {
        await dataStore.authorizeSync();
        toastApi.success("Connected to Google Drive");
        return true;
      } catch (error) {
        toastApi.error(`Error while connecting to Google Drive ${error}`);
        return false;
      }
    }
    return true;
  };

  const hasNewRemoteData = async () => {
    return await dataStore.hasNewRemoteData();
  };

  const synchronise = async () => {
    try {
      await dataStore.syncToCloud();

      // Call reload callback if provided
      if (props?.onSyncSuccess) {
        await props.onSyncSuccess();
      }

      toastApi.success(`Sync successful`);
      return true;
    } catch (error) {
      toastApi.error(`Error while syncing data ${error}`);
      return false;
    }
  };

  const getLastSyncTime = () => {
    return dataStore.getLastSyncTime();
  };

  const logout = async () => {
    try {
      await dataStore.logout();
      toastApi.success(`Logout successful`);
      return true;
    } catch (error) {
      toastApi.error(`Error while logging out ${error}`);
      return false;
    }
  };

  return {
    isSyncAuthorized,
    authorizeSync,
    hasNewRemoteData,
    synchronise,
    getLastSyncTime,
    logout,
  };
}
