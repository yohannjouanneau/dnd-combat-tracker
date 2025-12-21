import { dataStore } from "../../../persistence/storage";
import { useToast } from "../../../components/common/Toast/useToast";
import { useTranslation } from "react-i18next";
import type { SyncApi } from "../types";

interface UseSyncApiProps {
  onSyncSuccess?: () => Promise<void>;
}

export function useSyncApi(props?: UseSyncApiProps): SyncApi {
  const toastApi = useToast();
  const { t } = useTranslation(["common"]);

  const isSyncAuthorized = () => {
    return dataStore.isSyncAuthorized();
  };

  const authorizeSync = async () => {
    if (!dataStore.isSyncAuthorized()) {
      try {
        await dataStore.authorizeSync();
        toastApi.success(t("toast.sync.connectSuccess"));
        return true;
      } catch (error) {
        toastApi.error(t("toast.sync.connectError", { error: String(error) }));
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

      toastApi.success(t("toast.sync.syncSuccess"));
      return true;
    } catch (error) {
      toastApi.error(t("toast.sync.syncError", { error: String(error) }));
      return false;
    }
  };

  const getLastSyncTime = () => {
    return dataStore.getLastSyncTime();
  };

  const logout = async () => {
    try {
      await dataStore.logout();
      toastApi.success(t("toast.sync.logoutSuccess"));
      return true;
    } catch (error) {
      toastApi.error(t("toast.sync.logoutError", { error: String(error) }));
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
