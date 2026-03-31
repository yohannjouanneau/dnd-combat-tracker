import { Map, Settings, Swords } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import logo from "../assets/logo.png";
import SettingsModal from "../components/Settings/SettingsModal";
import type { SyncApi } from "../api/sync/types";

type Props = {
  onOpenCombats: () => void;
  onOpenCampaigns: () => void;
  syncApi: SyncApi;
};

export default function LandingPage({
  onOpenCombats,
  onOpenCampaigns,
  syncApi,
}: Props) {
  const { t } = useTranslation(["common", "campaigns"]);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-6 gap-8 relative">
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-4 right-4 bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary p-2 rounded transition"
        title={t("common:settings.title")}
      >
        <Settings className="w-5 h-5" />
      </button>

      <img
        src={logo}
        alt="DnD Combat Tracker"
        className="w-24 h-24 object-contain"
      />

      <h1 className="text-3xl md:text-4xl font-bold text-text-primary text-center">
        D&D Combat Tracker
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Combat Tracker panel */}
        <div className="bg-panel-bg border border-border-primary rounded-xl p-6 flex flex-col gap-4 hover:border-border-secondary transition">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-600/20">
              <Swords className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              {t("common:landing.combatTitle")}
            </h2>
          </div>
          <p className="text-text-muted text-sm flex-1">
            {t("common:landing.combatDescription")}
          </p>
          <button
            onClick={onOpenCombats}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2"
          >
            <Swords className="w-5 h-5" />
            {t("common:landing.combatButton")}
          </button>
        </div>

        {/* Campaign Manager panel */}
        <div className="bg-panel-bg border border-border-primary rounded-xl p-6 flex flex-col gap-4 hover:border-border-secondary transition">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-600/20">
              <Map className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              {t("common:landing.campaignTitle")}
            </h2>
          </div>
          <p className="text-text-muted text-sm flex-1">
            {t("common:landing.campaignDescription")}
          </p>
          <button
            onClick={onOpenCampaigns}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2"
          >
            <Map className="w-5 h-5" />
            {t("common:landing.campaignButton")}
          </button>
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        syncApi={syncApi}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
