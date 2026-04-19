import { X, LogOut, Moon, Sun, Leaf, RotateCcw, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import gdriveSignIn from "../../assets/web_neutral_rd_SI@2x.png";
import { useCallback, useEffect, useState } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useTheme } from "../../hooks/useTheme";
import LanguageSwitcher from "../common/LanguageSwitcher";
import SyncButton from "../SyncButton";
import type { SyncApi } from "../../api/sync/types";
import type { CombatantIdentifierType } from "../../types";
import { getLocalStorageSize } from "../../utils/utils";

type Props = {
  isOpen: boolean;
  syncApi: SyncApi;
  onClose: () => void;
};

export default function SettingsModal({ isOpen, syncApi, onClose }: Props) {
  const { t } = useTranslation(["common"]);
  const [isReadyToSync, setIsReadyToSync] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmingRestore, setConfirmingRestore] = useState(false);
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setIsReadyToSync(syncApi.isSyncAuthorized());
  }, [syncApi]);

  const handleConnectGoogle = useCallback(async () => {
    const isAuthenticated = await syncApi.authorizeSync();
    setIsReadyToSync(isAuthenticated);
  }, [syncApi]);

  const handleLogout = useCallback(async () => {
    const isLoggedOut = await syncApi.logout();
    setIsReadyToSync(!isLoggedOut);
  }, [syncApi]);

  const handleRestoreBackup = useCallback(async () => {
    setIsRestoring(true);
    setConfirmingRestore(false);
    await syncApi.restoreBackup();
    setIsRestoring(false);
  }, [syncApi]);

  const handleIdentifierTypeChange = useCallback(
    (type: CombatantIdentifierType) => {
      updateSettings({ combatantIdentifierType: type });
    },
    [updateSettings],
  );

  const storageSize = getLocalStorageSize();
  const lastBackupTime = syncApi.getLastBackupTime();

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

            {/* Storage Section */}
            <div className="space-y-3 pt-3 border-t border-border-primary">
              <h3 className="text-lg font-semibold text-text-secondary">
                {t("common:settings.storage.title")}
              </h3>
              <p className="text-sm text-text-muted">
                {t("common:settings.storage.used", { size: storageSize })}
              </p>
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
                  <SyncButton syncApi={syncApi} variant="full" />

                  {/* Backup Section */}
                  <div className="border-t border-border-primary pt-3 space-y-2">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                      {t("common:settings.googleDrive.backup.title")}
                    </p>
                    <p className="text-xs text-text-muted">
                      {lastBackupTime
                        ? t("common:settings.googleDrive.backup.lastBackup", {
                            date: new Date(lastBackupTime).toLocaleString(),
                          })
                        : t("common:settings.googleDrive.backup.neverBacked")}
                    </p>
                    <p className="text-xs text-text-muted italic">
                      {t("common:settings.googleDrive.backup.restoreWarning")}
                    </p>
                    {confirmingRestore ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRestoreBackup}
                          disabled={isRestoring}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-2"
                        >
                          {isRestoring ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                          {t(
                            "common:settings.googleDrive.backup.confirmRestore",
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmingRestore(false)}
                          className="text-text-muted hover:text-text-primary text-sm transition px-2"
                        >
                          {t(
                            "common:settings.googleDrive.backup.cancelRestore",
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingRestore(true)}
                        disabled={!lastBackupTime || isRestoring}
                        className="w-full bg-panel-secondary hover:bg-panel-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {t("common:settings.googleDrive.backup.restoreBackup")}
                      </button>
                    )}
                  </div>

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
