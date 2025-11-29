import { X, LogOut, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import gdriveSignIn from "../../assets/web_neutral_rd_SI@2x.png";
import type { SyncApi } from "../../types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getReadableTimestamp } from "../../utils";

type Props = {
  isOpen: boolean;
  syncApi: SyncApi;
  onClose: () => void;
};

export default function SettingsModal({ isOpen, syncApi, onClose }: Props) {
  const { t } = useTranslation(["common"]);
  const [isReadyToSync, setIsReadyToSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(syncApi.getLastSyncTime());
  const [hasNewRemoteData, setHasRemoteData] = useState(false);

  useEffect(() => {
    const checkGoogleAuth = async () => {
      const authorized = syncApi.isSyncAuthorized();
      setIsReadyToSync(authorized);
      if (authorized) {
        const hasRemote = await syncApi.hasNewRemoteData();
        setHasRemoteData(hasRemote);
      }
    };

    checkGoogleAuth();
  }, [syncApi]);

  const handleConnectGoogle = useCallback(async () => {
    const isAuthenticated = await syncApi.authorizeSync();
    setIsReadyToSync(isAuthenticated);
  }, [syncApi]);

  const handleSyncWithDrive = useCallback(async () => {
    setIsSyncing(true);
    await syncApi.synchronise();
    setLastSyncTime(syncApi.getLastSyncTime());
    setIsSyncing(false);
  }, [syncApi]);

  const handleLogout = useCallback(async () => {
    const isLoggedOut = await syncApi.logout();
    setIsReadyToSync(!isLoggedOut);
  }, [syncApi]);

  const lastSyncText = useMemo(() => {
    return lastSyncTime ? getReadableTimestamp(lastSyncTime) : "-";
  }, [lastSyncTime]);

  const syncButtonText = useMemo(() => {
    const notSyncingText = hasNewRemoteData
      ? t("common:settings.googleDrive.downloadData")
      : t("common:settings.googleDrive.uploadData");
    return isSyncing
      ? t("common:settings.googleDrive.syncing")
      : notSyncingText;
  }, [hasNewRemoteData, isSyncing, t]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="!mt-0 fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {t("common:settings.title")}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-4">
            {/* Google Drive Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-300">
                {t("common:settings.googleDrive.title")}
              </h3>

              <p className="text-lg font-light text-slate-300">
                {t("common:settings.googleDrive.syncExlpaination")}
              </p>

              {!isReadyToSync ? (
                // Sign in button
                <button onClick={handleConnectGoogle} className="w-1/2">
                  <img
                    src={gdriveSignIn}
                    alt={t("common:settings.googleDrive.connect")}
                    className="object-contain"
                  />
                </button>
              ) : (
                <>
                  {/* Sync with Drive Button */}
                  <button
                    onClick={handleSyncWithDrive}
                    disabled={isSyncing}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-4 py-3 rounded font-medium transition flex items-center justify-center gap-3"
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${isSyncing ? "animate-spin" : ""}`}
                    />
                    {syncButtonText}
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded font-medium transition flex items-center justify-center gap-3"
                  >
                    <LogOut className="w-5 h-5" />
                    {t("common:settings.googleDrive.logout")}
                  </button>
                </>
              )}
            </div>

            {/* Connected Status */}
            {isReadyToSync && (
              <div className="pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  {t("common:settings.googleDrive.connected", {
                    lastSync: lastSyncText,
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700 p-4 md:p-6">
            <button
              onClick={onClose}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition font-medium"
            >
              {t("common:actions.close")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
