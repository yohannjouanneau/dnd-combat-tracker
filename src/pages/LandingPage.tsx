import {
  Crosshair,
  Leaf,
  Map,
  Moon,
  Settings,
  Sun,
  Swords,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import logo from "../assets/logo.png";
import SettingsModal from "../components/Settings/SettingsModal";
import SyncButton from "../components/SyncButton";
import { useTheme } from "../hooks/useTheme";
import type { SyncApi } from "../api/sync/types";
import type { CombatStateManager } from "../store/types";
import type { SavedCombat } from "../types";
import Button from "../components/common/Button";
import IconButton from "../components/common/IconButton";

function formatRelativeTime(ts: number): string {
  const diff = (ts - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}

type Props = {
  onOpenCombats: () => void;
  onOpenCampaigns: () => void;
  onOpenMap: () => void;
  onOpenCombat: (id: string) => void;
  onOpenCampaign: (id: string) => void;
  syncApi: SyncApi;
  combatStateManager: CombatStateManager;
};

export default function LandingPage({
  onOpenCombats,
  onOpenCampaigns,
  onOpenMap,
  onOpenCombat,
  onOpenCampaign,
  syncApi,
  combatStateManager,
}: Props) {
  const { t } = useTranslation(["common", "campaigns"]);
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [recentCombat, setRecentCombat] = useState<SavedCombat | undefined>();

  useEffect(() => {
    combatStateManager.listCombat().then((list) => {
      const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
      setRecentCombat(sorted[0]);
    });
  }, [combatStateManager]);

  const recentCampaign = [...combatStateManager.campaigns].sort(
    (a, b) => b.updatedAt - a.updatedAt,
  )[0];

  const hasRecent = recentCampaign || recentCombat;

  return (
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-6 gap-8 relative">
      <div className="absolute top-4 right-4 flex gap-2">
        <IconButton
          onClick={toggleTheme}
          title={
            theme === "dark"
              ? t("common:theme.switchTo.light")
              : theme === "light"
                ? t("common:theme.switchTo.forest")
                : t("common:theme.switchTo.dark")
          }
        >
          {theme === "dark" ? (
            <Moon className="w-5 h-5" />
          ) : theme === "light" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Leaf className="w-5 h-5" />
          )}
        </IconButton>
        <SyncButton
          syncApi={syncApi}
          onOpenSettings={() => setShowSettings(true)}
        />
        <IconButton
          onClick={() => setShowSettings(true)}
          title={t("common:settings.title")}
        >
          <Settings className="w-5 h-5" />
        </IconButton>
      </div>

      <img
        src={logo}
        alt="DnD Combat Tracker"
        className="h-20 md:h-40 rounded-xl"
      />

      <h1 className="text-3xl md:text-4xl font-bold text-text-primary text-center">
        D&D Combat Tracker
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
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
          <Button
            variant="danger"
            size="lg"
            onClick={onOpenCombats}
            className="w-full rounded-lg flex items-center justify-center gap-2 font-semibold"
          >
            <Swords className="w-5 h-5" />
            {t("common:landing.combatButton")}
          </Button>
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
          <Button
            variant="warning"
            size="lg"
            onClick={onOpenCampaigns}
            className="w-full rounded-lg flex items-center justify-center gap-2 font-semibold"
          >
            <Map className="w-5 h-5" />
            {t("common:landing.campaignButton")}
          </Button>
        </div>

        {/* Map Viewer panel */}
        <div className="bg-panel-bg border border-border-primary rounded-xl p-6 flex flex-col gap-4 hover:border-border-secondary transition">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-600/20">
              <Crosshair className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              {t("common:landing.mapTitle")}
            </h2>
          </div>
          <p className="text-text-muted text-sm flex-1">
            {t("common:landing.mapDescription")}
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={onOpenMap}
            className="w-full rounded-lg flex items-center justify-center gap-2 font-semibold"
          >
            <Crosshair className="w-5 h-5" />
            {t("common:landing.mapButton")}
          </Button>
        </div>
      </div>

      {/* Continue your adventures */}
      {hasRecent && (
        <div className="w-full max-w-4xl bg-panel-bg border border-border-primary rounded-xl p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-text-primary">
            {t("common:landing.continueTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentCombat && (
              <button
                onClick={() => onOpenCombat(recentCombat.id)}
                className="flex items-center gap-3 bg-panel-secondary hover:bg-panel-secondary/70 border border-border-secondary rounded-lg px-4 py-3 text-left transition group"
              >
                <Swords className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {recentCombat.name || t("common:noData")}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatRelativeTime(recentCombat.updatedAt)}
                  </p>
                </div>
              </button>
            )}
            {recentCampaign && (
              <button
                onClick={() => onOpenCampaign(recentCampaign.id)}
                className="flex items-center gap-3 bg-panel-secondary hover:bg-panel-secondary/70 border border-border-secondary rounded-lg px-4 py-3 text-left transition group"
              >
                <Map className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {recentCampaign.name || t("common:noData")}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatRelativeTime(recentCampaign.updatedAt)}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={showSettings}
        syncApi={syncApi}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
