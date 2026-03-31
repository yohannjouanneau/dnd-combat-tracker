import { useTranslation } from "react-i18next";
import LabeledTextInput from "./common/LabeledTextInput";
import SyncButton from "./SyncButton";
import { useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { ArrowLeft, Moon, Sun, Leaf } from "lucide-react";
import type { SyncApi } from "../api/sync/types";
import logoSrc from "../assets/logo.png";

type Props = {
  name: string;
  description: string;
  onChange: (patch: { name?: string; description?: string }) => void;
  onBack: () => void;
  onSave: () => Promise<void>;
  hasChanges: boolean;
  logo?: boolean;
  syncApi?: SyncApi;
  onOpenSettings?: () => void;
  actions?: React.ReactNode;
  nameLabel?: string;
  descriptionLabel?: string;
};

export default function TopBar({
  name,
  description,
  onChange,
  onBack,
  onSave,
  hasChanges,
  logo,
  syncApi,
  onOpenSettings,
  actions,
  nameLabel,
  descriptionLabel,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!hasChanges) return;
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, onSave]);

  const { t } = useTranslation(["forms", "common"]);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-full bg-panel-bg rounded-lg p-4 mb-6 border border-border-primary">
      {/* Mobile: back button + centered logo row */}
      {logo && (
        <div className="flex items-center mb-4 md:hidden">
          <button
            onClick={onBack}
            className="bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary p-2 rounded transition flex-shrink-0"
            title={t("common:actions.back")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex justify-center">
            <img
              src={logoSrc}
              alt="D&D Combat Tracker Logo"
              className="h-20 rounded-xl"
            />
          </div>
          {/* Spacer to balance the back button */}
          <div className="w-9 flex-shrink-0" />
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Back button — far left (desktop, or mobile without logo) */}
        {!logo && (
          <button
            onClick={onBack}
            className="bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary p-2 rounded transition flex-shrink-0"
            title={t("common:actions.back")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {logo && (
          <button
            onClick={onBack}
            className="hidden md:flex bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary p-2 rounded transition flex-shrink-0"
            title={t("common:actions.back")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Desktop logo */}
        {logo && (
          <div className="hidden md:flex flex-shrink-0">
            <img
              src={logoSrc}
              alt="D&D Combat Tracker Logo"
              className="h-24 rounded-xl"
            />
          </div>
        )}

        {/* Inputs + right buttons */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-3 flex-1">
          <div className="flex gap-3 flex-1 w-full md:w-auto items-end">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
              <LabeledTextInput
                id="topbarName"
                label={nameLabel ?? t("forms:combat.name")}
                value={name}
                placeholder={t("forms:combat.namePlaceholder")}
                onChange={(v) => onChange({ name: v })}
              />
              <LabeledTextInput
                id="topbarDesc"
                label={descriptionLabel ?? t("forms:combat.description")}
                value={description}
                placeholder={t("forms:combat.descriptionPlaceholder")}
                onChange={(v) => onChange({ description: v })}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 w-full md:w-auto justify-end items-center">
            {actions}
            {syncApi && (
              <SyncButton
                syncApi={syncApi}
                onOpenSettings={onOpenSettings}
                hasChanges={hasChanges}
                onSave={onSave}
              />
            )}
            <button
              onClick={toggleTheme}
              className="bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary p-2 rounded transition"
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
            </button>
            <button
              onClick={onSave}
              className="disabled:opacity-50 disabled:pointer-events-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition font-medium h-[38px] flex items-center justify-center"
              disabled={!hasChanges}
            >
              {t("common:actions.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
