import { useTranslation } from "react-i18next";
import type { NewCombatant } from "../../types";

type Props = {
  group: NewCombatant;
  onInclude: (group: NewCombatant) => void;
  onFight: (group: NewCombatant) => void;
  onRemove: (name: string) => void;
};

export default function ParkedGroupChip({
  group,
  onInclude,
  onFight,
  onRemove,
}: Props) {
  const { t } = useTranslation("forms");
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded border-2"
      style={{ borderColor: group.color, backgroundColor: `${group.color}20` }}
    >
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: group.color }}
      />
      <span className="font-semibold">{group.groupName}</span>
      <button
        onClick={() => onInclude(group)}
        className="text-blue-400 hover:text-blue-300 text-sm"
      >
        {t("forms:parkedGroups:edit")}
      </button>
      <button
        onClick={() => onFight(group)}
        className="text-lime-400 hover:text-lime-300 text-sm"
      >
        {t("forms:parkedGroups:fight")}
      </button>
      <button
        onClick={() => onRemove(group.groupName)}
        className="text-red-400 hover:text-red-300 text-sm"
      >
        {t("forms:parkedGroups:remove")}
      </button>
    </div>
  );
}
