import { useTranslation } from "react-i18next";
import type { GroupSummary } from "../../types";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";

type Props = {
  group: GroupSummary;
  onRemove: (name: string) => void;
};

export default function GroupBadge({ group, onRemove }: Props) {
  const { t } = useTranslation(["combat", "common"]);
  const confirmDialog = useConfirmationDialog();
  const confirmRemove = async () => {
    const isConfirmed = await confirmDialog({
      title: t("common:confirmation.removeGroup.title"),
      message: t("common:confirmation.removeGroup.message", {
        count: group.count,
        name: group.name,
      }),
    });
    if (isConfirmed) {
      onRemove(group.name);
    }
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded border-2"
      style={{
        borderColor: group.color,
        backgroundColor: `${group.color}20`,
      }}
    >
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: group.color }}
      />
      <span className="font-semibold">{group.name}</span>
      <span className="text-sm text-text-muted">×{group.count}</span>
      <button
        onClick={() => confirmRemove()}
        className="ml-2 text-red-400 hover:text-red-300 text-sm"
      >
        {t("combat:groups.removeAll")}
      </button>
    </div>
  );
}
