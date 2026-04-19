import { useTranslation } from "react-i18next";
import LabeledTextInput from "./common/LabeledTextInput";
import SyncButton from "./SyncButton";
import { useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { ArrowLeft, Moon, Sun, Leaf, Pencil, Check } from "lucide-react";
import type { SyncApi } from "../api/sync/types";

type Props = {
  name: string;
  description: string;
  onChange: (patch: { name?: string; description?: string }) => void;
  onBack: () => void;
  onSave: () => Promise<void>;
  hasChanges: boolean;
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
  syncApi,
  onOpenSettings,
  actions,
  nameLabel,
  descriptionLabel,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);

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
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary p-2 rounded transition flex-shrink-0"
          title={t("common:actions.back")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Title / inputs + right buttons */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 flex-1 min-w-0">
          {isEditing ? (
            <div className="flex-1 w-full md:w-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          ) : (
            <div className="flex flex-col min-w-0 flex-1">
              <span
                className={`text-lg font-semibold truncate leading-tight ${name ? "text-text-primary" : "text-text-secondary italic"}`}
              >
                {name || t("forms:combat.name")}
              </span>
              {description && (
                <span className="text-sm text-text-secondary truncate mt-0.5">
                  {description}
                </span>
              )}
            </div>
          )}

          <div className="flex gap-2 flex-shrink-0 w-full md:w-auto justify-end items-center">
            {actions}
            {isEditing ? (
              <button
                onClick={() => setIsEditing(false)}
                className="bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary p-2 rounded transition"
                title={t("common:actions.confirm")}
              >
                <Check className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary p-2 rounded transition"
                title={t("common:actions.edit")}
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
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
