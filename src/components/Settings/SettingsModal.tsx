import { X, LogOut, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import gdriveSignIn from "../../assets/web_neutral_sq_na@2x.png";

type Props = {
  isOpen: boolean;
  isConnected: boolean;
  onClose: () => void;
  onConnectGoogle: () => void;
  onSyncWithDrive: () => void;
  onLogout: () => void;
};

export default function SettingsModal({
  isOpen,
  isConnected,
  onClose,
  onConnectGoogle,
  onSyncWithDrive,
  onLogout,
}: Props) {
  const { t } = useTranslation(["common"]);

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

              {!isConnected ? (
                // Continue with Google Button - Per Google guidelines
                <button
                  onClick={onConnectGoogle}
                  className=""
                >
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
                    onClick={onSyncWithDrive}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded font-medium transition flex items-center justify-center gap-3"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {t("common:settings.googleDrive.sync")}
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={onLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded font-medium transition flex items-center justify-center gap-3"
                  >
                    <LogOut className="w-5 h-5" />
                    {t("common:settings.googleDrive.logout")}
                  </button>
                </>
              )}
            </div>

            {/* Connected Status */}
            {isConnected && (
              <div className="pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  {t("common:settings.googleDrive.connected")}
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
