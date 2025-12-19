import { X, LogOut, RefreshCw, Moon, Sun, Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";
import gdriveSignIn from "../../assets/web_neutral_rd_SI@2x.png";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getReadableTimestamp } from "../../utils/utils";
import { useSettings } from "../../hooks/useSettings";
import { useTheme } from "../../hooks/useTheme";
import LanguageSwitcher from "../common/LanguageSwitcher";
import type { SyncApi } from "../../api/sync/types";
import type { CombatantIdentifierType } from "../../types";

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
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();

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
    if (isAuthenticated) {
      const hasRemote = await syncApi.hasNewRemoteData();
      setHasRemoteData(hasRemote);
    }
  }, [syncApi]);

  const handleSyncWithDrive = useCallback(async () => {
    setIsSyncing(true);
    await syncApi.synchronise();
    setLastSyncTime(syncApi.getLastSyncTime());
    setHasRemoteData(await syncApi.hasNewRemoteData());
    setIsSyncing(false);
  }, [syncApi]);

  const handleLogout = useCallback(async () => {
    const isLoggedOut = await syncApi.logout();
    setIsReadyToSync(!isLoggedOut);
  }, [syncApi]);

  const handleIdentifierTypeChange = useCallback(
    (type: CombatantIdentifierType) => {
      updateSettings({ combatantIdentifierType: type });
    },
    [updateSettings]
  );

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
        <div className="bg-panel-bg rounded-lg border border-border-primary max-w-md w-full shadow-xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border-primary flex-shrink-0">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary">
              {t("common:settings.title")}
            </h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1">
            {/* Language Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-text-secondary">
                {t("common:settings.language.title")}
              </h3>

              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
            </div>

            {/* Theme Section */}
            <div className="space-y-3 pt-3 border-t border-border-primary">
              <h3 className="text-lg font-semibold text-text-secondary">
                {t("common:settings.theme.title")}
              </h3>

              <p className="text-sm font-light text-text-muted">
                {t("common:settings.theme.description")}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 px-4 py-3 rounded font-medium transition flex items-center justify-center gap-2 ${
                    theme === "dark"
                      ? "bg-blue-600 text-white"
                      : "bg-panel-secondary text-text-secondary hover:bg-panel-secondary/80"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  {t("common:settings.theme.dark")}
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 px-4 py-3 rounded font-medium transition flex items-center justify-center gap-2 ${
                    theme === "light"
                      ? "bg-blue-600 text-white"
                      : "bg-panel-secondary text-text-secondary hover:bg-panel-secondary/80"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  {t("common:settings.theme.light")}
                </button>
                <button
                  onClick={() => setTheme("forest")}
                  className={`flex-1 px-4 py-3 rounded font-medium transition flex items-center justify-center gap-2 ${
                    theme === "forest"
                      ? "bg-blue-600 text-white"
                      : "bg-panel-secondary text-text-secondary hover:bg-panel-secondary/80"
                  }`}
                >
                  <Leaf className="w-4 h-4" />
                  {t("common:settings.theme.forest")}
                </button>
              </div>
            </div>

            {/* Combatant Identifier Section */}
            <div className="space-y-3 pt-3 border-t border-border-primary">
              <h3 className="text-lg font-semibold text-text-secondary">
                {t("common:settings.combatantIdentifier.title")}
              </h3>

              <p className="text-sm font-light text-text-muted">
                {t("common:settings.combatantIdentifier.description")}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleIdentifierTypeChange("letters")}
                  className={`flex-1 px-4 py-3 rounded font-medium transition ${
                    settings.combatantIdentifierType === "letters"
                      ? "bg-blue-600 text-white"
                      : "bg-panel-secondary text-text-secondary hover:bg-panel-secondary/80"
                  }`}
                >
                  {t("common:settings.combatantIdentifier.letters")}
                </button>
                <button
                  onClick={() => handleIdentifierTypeChange("numbers")}
                  className={`flex-1 px-4 py-3 rounded font-medium transition ${
                    settings.combatantIdentifierType === "numbers"
                      ? "bg-blue-600 text-white"
                      : "bg-panel-secondary text-text-secondary hover:bg-panel-secondary/80"
                  }`}
                >
                  {t("common:settings.combatantIdentifier.numbers")}
                </button>
              </div>
            </div>

            {/* Google Drive Section */}
            <div className="space-y-3 pt-3 border-t border-border-primary">
              <h3 className="text-lg font-semibold text-text-secondary">
                {t("common:settings.googleDrive.title")}
              </h3>

              <p className="text-sm font-light text-text-muted">
                {t("common:settings.googleDrive.syncExlpaination")}
              </p>

              {!isReadyToSync ? (
                // Sign in button
                <div className="bg-app-bg rounded-lg p-4 flex justify-center">
                  <button onClick={handleConnectGoogle} className="w-1/2">
                    <img
                      src={gdriveSignIn}
                      alt={t("common:settings.googleDrive.connect")}
                      className="object-contain"
                    />
                  </button>
                </div>
              ) : (
                <div className="bg-app-bg border-border-primary rounded-lg p-4 space-y-3">
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
                </div>
              )}
            </div>

            {/* Connected Status */}
            {isReadyToSync && (
              <div className="pt-3 border-t border-border-primary">
                <div className="flex items-center gap-2 text-sm font-normal text-text-primary">
                  <div className="w-2 h-2 rounded-full"></div>
                  {t("common:settings.googleDrive.connected", {
                    lastSync: lastSyncText,
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border-primary p-4 md:p-6 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary px-4 py-2 rounded transition font-medium"
            >
              {t("common:actions.close")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
