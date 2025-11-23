import { useTranslation } from "react-i18next";
import LabeledTextInput from "./common/LabeledTextInput";
import LanguageSwitcher from "./common/LanguageSwitcher";
import { useEffect } from "react";

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

  return (
    <div className="w-full bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
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
            onClick={onBack}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition font-medium"
          >
            {t("common:actions.back")}
          </button>
          <button
            onClick={onSave}
            className="disabled:opacity-50 disabled:pointer-events-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition font-medium"
            disabled={!hasChanges}
          >
            {t("common:actions.save")}
          </button>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
