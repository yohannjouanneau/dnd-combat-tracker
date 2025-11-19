import { FolderOpen, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SavedCombat } from "../../types";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";

interface Props {
  combat: SavedCombat;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CombatListItem({ combat, onOpen, onDelete }: Props) {
  const { t } = useTranslation(["common"]);
  const confirmDialog = useConfirmationDialog();
  const confirmRemove = async () => {
    const isConfirmed = await confirmDialog({
      title: t("common:confirmation.deleteCombat.title"),
      message: t("common:confirmation.deleteCombat.message", {
        name: combat.name,
      }),
    });
    if (isConfirmed) {
      onDelete(combat.id);
    }
  };

  return (
    <div
      key={combat.id}
      className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 rounded p-3 md:p-4 border border-slate-700 hover:border-slate-600 transition gap-3"
    >
      <div className="flex-1 min-w-0 md:mr-4">
        <div className="font-semibold text-base md:text-lg text-white truncate">
          {combat.name}
        </div>
        {combat.description && (
          <div className="text-xs md:text-sm text-slate-400 mt-1 line-clamp-2">
            {combat.description}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:flex gap-2 flex-shrink-0">
        <button
          onClick={() => onOpen(combat.id)}
          className="bg-green-600 hover:bg-green-700 px-3 md:px-4 py-2 rounded transition font-medium text-sm flex items-center justify-center gap-1"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common:actions.open")}</span>
        </button>
        <button
          onClick={() => confirmRemove()}
          className="bg-red-600 hover:bg-red-700 px-3 md:px-4 py-2 rounded transition font-medium text-sm flex items-center justify-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common:actions.delete")}</span>
        </button>
      </div>
    </div>
  );
}
