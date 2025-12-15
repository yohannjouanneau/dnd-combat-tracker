import { useTranslation } from "react-i18next";
import type { GroupSummary } from "../../types";
import { Users } from "lucide-react";
import GroupBadge from "./GroupBadge";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";

type Props = {
  groups: GroupSummary[];
  onRemoveGroup: (name: string) => void;
  onClearAll: () => void;
};

export default function GroupsOverview({ groups, onRemoveGroup, onClearAll }: Props) {
  const { t } = useTranslation(["combat", "common"]);
  const confirmDialog = useConfirmationDialog();

  const handleClearAll = async () => {
    const isConfirmed = await confirmDialog({
      title: t("common:confirmation.clearAllGroups.title"),
      message: t("common:confirmation.clearAllGroups.message"),
    });
    if (isConfirmed) {
      onClearAll();
    }
  };

  if (groups.length === 0) return null;

  return (
    <div className="bg-panel-bg rounded-lg p-4 mb-6 border border-border-primary">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t("combat:groups.title")}
        </h3>
        <button
          onClick={handleClearAll}
          className="text-red-400 hover:text-red-300 text-sm font-medium"
        >
          {t("combat:groups.clearAll")}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <GroupBadge key={g.name} group={g} onRemove={onRemoveGroup} />
        ))}
      </div>
    </div>
  );
}
