import { FolderOpen, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SavedCombat } from "../../types";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";
import Button from "../common/Button";

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
      className="flex flex-col md:flex-row md:items-center justify-between bg-panel-bg rounded p-3 md:p-4 border border-border-primary hover:border-border-secondary transition gap-3"
    >
      <div className="flex-1 min-w-0 md:mr-4">
        <div className="font-semibold text-base md:text-lg text-text-primary truncate">
          {combat.name}
        </div>
        {combat.description && (
          <div className="text-xs md:text-sm text-text-muted mt-1 line-clamp-2">
            {combat.description}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:flex gap-2 flex-shrink-0">
        <Button
          variant="success"
          onClick={() => onOpen(combat.id)}
          className="px-3 md:px-4 flex items-center justify-center gap-1"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common:actions.open")}</span>
        </Button>
        <Button
          variant="danger"
          onClick={() => confirmRemove()}
          className="px-3 md:px-4 flex items-center justify-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common:actions.delete")}</span>
        </Button>
      </div>
    </div>
  );
}
