import { useTranslation } from "react-i18next";
import type { NewCombatant } from "../../types";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";

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
  const { t } = useTranslation(["combat", "common"]);

  const confirmDialog = useConfirmationDialog();
  const confirmRemove = async () => {
    const isConfirmed = await confirmDialog({
      title: t("common:confirmation.removeParkedGroup.title"),
      message: t("common:confirmation.removeParkedGroup.message", {
        name: group.name,
      }),
    });
    if (isConfirmed) {
      onRemove(group.name);
    }
  };

  const totalCount = group.initiativeGroups.reduce(
    (sum, g) => sum + (parseInt(g.count, 10) || 0),
    0
  );
  
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded border-2"
      style={{ borderColor: group.color, backgroundColor: `${group.color}20` }}
    >
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: group.color }}
      />
      <span className="font-semibold">{group.name}</span>
      {totalCount > 1 && (
        <span className="text-text-muted text-sm">x {totalCount}</span>
      )}
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
        onClick={() => confirmRemove()}
        className="text-red-400 hover:text-red-300 text-sm"
      >
        {t("forms:parkedGroups:remove")}
      </button>
    </div>
  );
}
