import { Edit2, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BuildingBlock } from "../../types/campaign";

const TYPE_COLORS: Record<string, string> = {
  environment:
    "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  room: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
  character:
    "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
  combat: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
  loot: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30",
};

interface Props {
  block: BuildingBlock;
  /** Show Edit + Delete actions (used in campaign detail list) */
  onEdit?: (block: BuildingBlock) => void;
  onDelete?: (block: BuildingBlock) => void;
  /** Show Add action (used in library picker) */
  onAdd?: (block: BuildingBlock) => void;
}

export default function BlockCard({ block, onEdit, onDelete, onAdd }: Props) {
  const { t } = useTranslation(["campaigns", "common"]);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between bg-panel-bg rounded p-3 md:p-4 border border-border-primary hover:border-border-secondary transition gap-3">
      <div className="flex-1 min-w-0 md:mr-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-base text-text-primary truncate">
            {block.name || (
              <span className="italic text-text-muted">Unnamed</span>
            )}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[block.typeId] ?? "text-text-muted bg-panel-secondary"}`}
          >
            {block.typeId}
          </span>
          {block.tags &&
            block.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs text-text-muted bg-panel-secondary rounded px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
        </div>
        {block.description && (
          <div className="text-xs md:text-sm text-text-muted mt-1 line-clamp-2">
            {block.description}
          </div>
        )}
        {block.statChecks.length > 0 && (
          <div className="text-xs text-text-muted mt-1">
            {block.statChecks.length} stat check
            {block.statChecks.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {onAdd && (
          <button
            onClick={() => onAdd(block)}
            className="bg-green-600 hover:bg-green-700 px-3 md:px-4 py-2 rounded transition font-medium text-sm flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("common:actions.add")}</span>
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(block)}
            className="bg-panel-secondary hover:bg-panel-secondary/80 px-3 md:px-4 py-2 rounded transition font-medium text-sm flex items-center justify-center gap-1"
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t("common:actions.edit")}</span>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(block)}
            className="bg-red-600 hover:bg-red-700 px-3 md:px-4 py-2 rounded transition font-medium text-sm flex items-center justify-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t("common:actions.delete")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
