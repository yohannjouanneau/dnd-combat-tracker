import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { DEFAULT_CONDITIONS_KEYS } from "../../constants";

type Props = {
  activeConditions: string[];
  onToggle: (condition: string) => void;
};

export default function ConditionsList({ activeConditions, onToggle }: Props) {
  const { t } = useTranslation("conditions");
  const [showAll, setShowAll] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        {activeConditions.map((condition) => (
          <button
            key={condition}
            onClick={() => onToggle(condition)}
            className="px-3 py-1 rounded text-sm bg-accent hover:bg-accent-hover text-accent-text transition flex items-center gap-1"
          >
            {t(`conditions:${condition}`)}
            <X className="w-4 h-4" />
          </button>
        ))}

        <button
          onClick={() => setShowAll(!showAll)}
          className="px-3 py-1 rounded text-sm bg-panel-secondary hover:bg-panel-secondary/80 transition flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          {showAll
            ? t("conditions:hideConditions")
            : t("conditions:addCondition")}
        </button>
      </div>

      {showAll && (
        <div className="mt-2 p-3 bg-app-bg rounded border border-border-primary">
          <div className="text-sm font-semibold mb-2 text-text-muted">
            {t("conditions:availableConditions")}
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CONDITIONS_KEYS.map((condition) => (
              <button
                key={condition}
                onClick={() => {
                  onToggle(condition);
                  if (!activeConditions.includes(condition)) {
                    setShowAll(false);
                  }
                }}
                className={`px-3 py-1 rounded text-sm transition ${
                  activeConditions.includes(condition)
                    ? "bg-accent hover:bg-accent-hover text-accent-text"
                    : "bg-panel-secondary hover:bg-panel-secondary/80"
                }`}
              >
                {t(`conditions:${condition}`)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
