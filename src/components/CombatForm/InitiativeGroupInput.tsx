import { Trash2, Dices } from "lucide-react";
import type { InitiativeGroup } from "../../types";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  group: InitiativeGroup;
  index: number;
  canRemove: boolean;
  initBonus: number | undefined;
  disableCount: boolean
  onChange: (id: string, patch: Partial<InitiativeGroup>) => void;
  onRemove: (id: string) => void;
};

export default function InitiativeGroupInput({
  group,
  index,
  canRemove,
  initBonus,
  disableCount,
  onChange,
  onRemove,
}: Props) {
  const { t } = useTranslation("form");

  const rollInitiative = useCallback(() => {
    const bonus = initBonus ?? 0;
    const roll = Math.floor(Math.random() * 20) + 1;
    onChange(group.id, { initiative: String(roll + bonus) });
  }, [initBonus, group.id, onChange]);

  useEffect(() => {
    // Only auto-roll if initiative is empty (not when loading saved player)
    if (!group.initiative) {
      rollInitiative();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-2 p-2 bg-panel-secondary rounded border border-border-secondary">
      {/* Top row: Index + Initiative + Roll button */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted font-semibold min-w-[24px] flex-shrink-0">
          #{index + 1}
        </span>

        <input
          type="text"
          value={group.initiative}
          onChange={(e) => onChange(group.id, { initiative: e.target.value })}
          placeholder="Init"
          className="bg-input-bg text-text-primary rounded px-2 py-2 text-sm border border-border-secondary focus:border-blue-500 focus:outline-none flex-1 min-w-0"
        />

        <button
          onClick={rollInitiative}
          className="bg-panel-bg hover:bg-panel-bg/80 text-text-primary px-3 py-2 rounded border border-border-secondary flex-shrink-0"
          title={t("forms:combatant:rollD20")}
        >
          <Dices className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom row: Count + Delete button */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-text-muted flex-shrink-0">
          {t("forms:combatant.count")}
        </span>

        <input
          type="number"
          value={group.count}
          onChange={(e) => onChange(group.id, { count: e.target.value })}
          placeholder="1"
          min={1}
          disabled={disableCount}
          className="bg-input-bg text-text-primary rounded px-2 py-2 text-sm border border-border-secondary focus:border-blue-500 focus:outline-none flex-1 min-w-0 disabled:opacity-50"
        />

        <button
          onClick={() => onRemove(group.id)}
          disabled={!canRemove}
          className={`px-3 py-2 rounded transition flex-shrink-0 ${
            canRemove
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-panel-secondary text-text-muted cursor-not-allowed"
          }`}
          title={
            canRemove
              ? t("forms:combatant.removeInitGroup")
              : t("forms:combatant.atLeastOneGroup")
          }
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
