import { useTranslation } from "react-i18next";
import type { GroupSummary } from "../../types";
import { Users } from "lucide-react";
import GroupBadge from "./GroupBadge";

type Props = {
  groups: GroupSummary[];
  onRemoveGroup: (name: string) => void;
};

export default function GroupsOverview({ groups, onRemoveGroup }: Props) {
  const { t } = useTranslation("combat");

  if (groups.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Users className="w-5 h-5" />
        {t("combat:groups.title")}
      </h3>
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <GroupBadge key={g.name} group={g} onRemove={onRemoveGroup} />
        ))}
      </div>
    </div>
  );
}
