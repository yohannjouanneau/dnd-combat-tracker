import { useTranslation } from "react-i18next";
import type { GroupSummary } from "../../types";

type Props = {
  group: GroupSummary;
  onRemove: (name: string) => void;
};

export default function GroupBadge({ group, onRemove }: Props) {
  const { t } = useTranslation("combat");

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
      <span className="text-sm text-slate-400">×{group.count}</span>
      <button
        onClick={() => onRemove(group.name)}
        className="ml-2 text-red-400 hover:text-red-300 text-sm"
      >
        {t("combat:groups.removeAll")}
      </button>
    </div>
  );
}
