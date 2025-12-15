import { useTranslation } from "react-i18next";
import LabeledTextInput from "./common/LabeledTextInput";
import { useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { Moon, Sun } from "lucide-react";

type Props = {
  name: string;
  description: string;
  onChange: (patch: { name?: string; description?: string }) => void;
  onBack: () => void;
  onSave: () => void;
  hasChanges: boolean;
};

export default function SaveBar({
  name,
  description,
  onChange,
  onBack,
  onSave,
  hasChanges,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if there are no changes
      if (!hasChanges) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        onSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasChanges, onSave]);
  const { t } = useTranslation(["forms", "common"]);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-full bg-panel-bg rounded-lg p-4 mb-6 border border-border-primary">
      <div className="flex flex-col md:flex-row justify-between items-end gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 w-full md:w-auto">
          <LabeledTextInput
            id="combatName"
            label={t("forms:combat.name")}
            value={name}
            placeholder={t("forms:combat.namePlaceholder")}
            onChange={(v) => onChange({ name: v })}
          />
          <LabeledTextInput
            id="combatDesc"
            label={t("forms:combat.description")}
            value={description}
            placeholder={t("forms:combat.descriptionPlaceholder")}
            onChange={(v) => onChange({ description: v })}
          />
        </div>

        <div className="flex gap-2 flex-shrink-0 w-full md:w-auto justify-end items-center">
          <button
            onClick={toggleTheme}
            className="bg-panel-secondary hover:bg-panel-secondary/80 text-white p-2 rounded transition"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={onBack}
            className="bg-panel-secondary hover:bg-panel-secondary/80 text-white px-4 py-2 rounded transition font-medium"
          >
            {t("common:actions.back")}
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
  );
}
