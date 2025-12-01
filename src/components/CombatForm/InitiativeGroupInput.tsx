import { Trash2, Dices } from "lucide-react";
import type { InitiativeGroup } from "../../types";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  group: InitiativeGroup;
  index: number;
  canRemove: boolean;
  initBonus: number | undefined;
  onChange: (id: string, patch: Partial<InitiativeGroup>) => void;
  onRemove: (id: string) => void;
};

export default function InitiativeGroupInput({
  group,
  index,
  canRemove,
  initBonus,
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
    rollInitiative();
  }, [rollInitiative]);

  return (
    <div className="flex flex-col gap-2 p-2 bg-slate-900 rounded border border-slate-600">
      {/* Top row: Index + Initiative + Roll button */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold min-w-[24px] flex-shrink-0">
          #{index + 1}
        </span>

        <input
          type="text"
          value={group.initiative}
          onChange={(e) => onChange(group.id, { initiative: e.target.value })}
          placeholder="Init"
          className="bg-slate-700 text-white rounded px-2 py-2 text-sm border border-slate-600 focus:border-blue-500 focus:outline-none flex-1 min-w-0"
        />

        <button
          onClick={rollInitiative}
          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded border border-slate-600 flex-shrink-0"
          title={t("forms:combatant:rollD20")}
        >
          <Dices className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom row: Count + Delete button */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-slate-400 flex-shrink-0">
          {t("forms:combatant.count")}
        </span>

        <input
          type="number"
          value={group.count}
          onChange={(e) => onChange(group.id, { count: e.target.value })}
          placeholder="1"
          min={1}
          className="bg-slate-700 text-white rounded px-2 py-2 text-sm border border-slate-600 focus:border-blue-500 focus:outline-none flex-1 min-w-0"
        />

        <button
          onClick={() => onRemove(group.id)}
          disabled={!canRemove}
          className={`px-3 py-2 rounded transition flex-shrink-0 ${
            canRemove
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
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
