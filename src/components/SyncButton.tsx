import { CloudOff, CloudDownload, CloudUpload, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { useConfirmationDialog } from "../hooks/useConfirmationDialog";
import { getReadableTimestamp } from "../utils/utils";
import type { SyncApi } from "../api/sync/types";

type SyncButtonVariant = "icon" | "full";

type Props = {
  syncApi: SyncApi;
  variant?: SyncButtonVariant;

  // Optional props (for icon variant compatibility)
  onOpenSettings?: () => void;
  hasChanges?: boolean;
  onSave?: () => Promise<void>;

  // Optional props (for full variant)
  className?: string;
};

export default function SyncButton({
  syncApi,
  variant = "icon",
  onOpenSettings,
  hasChanges,
  onSave,
  className,
}: Props) {
  const { t } = useTranslation(["common"]);
  const confirmDialog = useConfirmationDialog();
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasNewRemoteData, setHasNewRemoteData] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(syncApi.getLastSyncTime());
  const [isCheckingRemoteData, setIsCheckingRemoteData] = useState(false);
  const isAuthorized = syncApi.isSyncAuthorized();

  // Check for new remote data on mount and every 5 minutes
  useEffect(() => {
    const checkRemoteData = async () => {
      if (syncApi.isSyncAuthorized()) {
        setIsCheckingRemoteData(true)
        const hasRemote = await syncApi.hasNewRemoteData();
        setHasNewRemoteData(hasRemote);
        setIsCheckingRemoteData(false)
      }
    };

    // Check immediately on mount
    checkRemoteData();

    // Set up 5-minute interval (300000ms)
    const interval = setInterval(checkRemoteData, 60 * 1000 * 5);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [syncApi]);

  const handleSync = async () => {
    // Check for unsaved changes
    if (hasChanges && onSave) {
      const isConfirmed = await confirmDialog({
        title: t("confirmation.syncWithUnsavedChanges.title"),
        message: t("confirmation.syncWithUnsavedChanges.message"),
        confirm: t("confirmation.syncWithUnsavedChanges.confirm"),
        cancel: t("confirmation.syncWithUnsavedChanges.cancel"),
      });

      if (!isConfirmed) {
        return; // User cancelled
      }

      // Save first before syncing
      await onSave();
    }

    // Check fresh sync state before proceeding
    // Only check if user expects to upload (hasNewRemoteData is false)
    if (!hasNewRemoteData) {
      let freshHasNewRemoteData;
      try {
        setIsCheckingRemoteData(true);
        freshHasNewRemoteData = await syncApi.hasNewRemoteData();
      } catch (error) {
        // Network error - fall back to cached state
        console.warn("Failed to check fresh sync state:", error);
        freshHasNewRemoteData = false;
      } finally {
        setIsCheckingRemoteData(false);
      }

      // Detect upload → download mismatch
      if (freshHasNewRemoteData) {
        const isConfirmed = await confirmDialog({
          title: t("confirmation.syncStateMismatch.title"),
          message: t("confirmation.syncStateMismatch.downloadNeeded"),
          confirm: t("confirmation.syncStateMismatch.confirm"),
          cancel: t("confirmation.syncStateMismatch.cancel"),
        });

        if (!isConfirmed) {
          // Update cached state to reflect reality
          setHasNewRemoteData(true);
          return; // User cancelled
        }
      }
    }

    // Perform sync
    setIsSyncing(true);
    await syncApi.synchronise();
    setHasNewRemoteData(await syncApi.hasNewRemoteData());
    setLastSyncTime(syncApi.getLastSyncTime());
    setIsSyncing(false);
  };

  const handleClick = () => {
    if (!isAuthorized) {
      // Only open settings for icon variant
      if (variant === "icon" && onOpenSettings) {
        onOpenSettings();
      }
      // For full variant when not authorized, button is disabled
    } else {
      handleSync();
    }
  };

  const getIcon = useCallback(() => {
    if (isSyncing) {
      return <RefreshCw className="w-5 h-5 animate-spin" />;
    }
    if (!isAuthorized) {
      return <CloudOff className="w-5 h-5" />;
    }
    if (hasNewRemoteData) {
      return <CloudDownload className="w-5 h-5" />;
    }
    return <CloudUpload className="w-5 h-5" />;
  },[hasNewRemoteData, isAuthorized, isSyncing]);

  const getTooltip = useCallback(() => {
    if (isCheckingRemoteData) {
      return t("settings.sync.checkingRemote");
    }
    if (isSyncing) {
      return t("settings.sync.syncing");
    }
    if (!isAuthorized) {
      return t("settings.sync.notConnected");
    }
    if (hasNewRemoteData) {
      return t("settings.sync.downloadAvailable");
    }
    return t("settings.sync.uploadData");
  },[hasNewRemoteData, isAuthorized, isCheckingRemoteData, isSyncing, t])

  const getSyncText = useCallback(() => {
    if (isCheckingRemoteData) return t("settings.sync.checkingRemote");
    if (isSyncing) return t("settings.googleDrive.syncing");
    if (hasNewRemoteData) return t("settings.googleDrive.downloadData");
    return t("settings.googleDrive.uploadData");
  },[hasNewRemoteData, isCheckingRemoteData, isSyncing, t]);

  if (variant === "full") {
    return (
      <div className={className}>
        <button
          onClick={handleClick}
          disabled={isSyncing || isCheckingRemoteData || !isAuthorized}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-4 py-3 rounded font-medium transition flex items-center justify-center gap-3"
        >
          <RefreshCw className={`w-5 h-5 ${isSyncing ? "animate-spin" : ""}`} />
          {getSyncText()}
        </button>

        {lastSyncTime && (
          <div className="text-sm text-text-primary mt-2">
            {t("settings.googleDrive.connected", {
              lastSync: getReadableTimestamp(lastSyncTime),
            })}
          </div>
        )}
      </div>
    );
  }

  // Icon variant (default)
  return (
    <button
      onClick={handleClick}
      disabled={isSyncing || isCheckingRemoteData}
      className="bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary p-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
      title={getTooltip()}
    >
      {getIcon()}
    </button>
  );
}
