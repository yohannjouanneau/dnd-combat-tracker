import { FileEdit, Trash2, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SavedMonster } from "../../types";
import CombatantAvatar from "../common/CombatantAvatar";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";
import { AbilityScore } from "../common/AbilityScore";

type Props = {
  monster: SavedMonster;
  canLoadToForm?: boolean;
  onLoadToForm?: (monster: SavedMonster) => void;
  onEdit?: (monster: SavedMonster) => void;
  onDelete: (id: string) => void;
  isUsedAsTemplate: (id: string) => Promise<boolean>
};

export default function MonsterListItem({
  monster,
  canLoadToForm = false,
  onLoadToForm,
  onEdit,
  onDelete,
  isUsedAsTemplate
}: Props) {
  const { t } = useTranslation(["forms", "common"]);

  const confirmDialog = useConfirmationDialog();
  const confirmRemove = async () => {
    // Await the async check before using in ternary
    const isUsed = await isUsedAsTemplate(monster.id);

    const isConfirmed = isUsed ? confirmDialog({
      title: t("common:confirmation.cannotDeleteFromLibrary.title"),
      message: t("common:confirmation.cannotDeleteFromLibrary.message", {
        name: monster.name,
      }),
      noConfirmButton: true  // Shows only cancel button
    }) : confirmDialog({
      title: t("common:confirmation.deleteFromLibrary.title"),
      message: t("common:confirmation.deleteFromLibrary.message", {
        name: monster.name,
      }),
    });
    if (await isConfirmed) {
      onDelete(monster.id);
    }
  };

  return (
    <div className="bg-panel-secondary rounded-lg border border-border-primary p-3 hover:border-border-secondary transition-colors">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <CombatantAvatar
          imageUrl={monster.imageUrl}
          name={monster.name}
          color={monster.color}
          size="sm"
        />

        {/* Name */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-text-primary truncate">
            {monster.name}
          </h3>
        </div>

        {/* HP & AC */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <div className="flex flex-col items-center">
            <span className="text-xs text-text-muted leading-none">
              {t("library.listItem.stats.hp")}
            </span>
            <span className="font-semibold text-text-primary text-base leading-none mt-1">
              {monster.hp}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-text-muted leading-none">
              {t("library.listItem.stats.ac")}
            </span>
            <span className="font-semibold text-text-primary text-base leading-none mt-1">
              {monster.ac}
            </span>
          </div>
        </div>

        {/* Ability Scores */}
        <AbilityScore
          scores={{
            cha: monster.cha,
            con: monster.con,
            dex: monster.dex,
            str: monster.str,
            int: monster.int,
            wis: monster.wis,
          }}
        />

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          {/* Edit Button */}
          {onEdit && (
            <button
              onClick={() => onEdit(monster)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition min-w-[44px]"
              title={t("library.listItem.actions.edit")}
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {/* Load to Form Button */}
          {canLoadToForm && onLoadToForm && (
            <button
              onClick={() => onLoadToForm(monster)}
              className="bg-lime-600 hover:bg-lime-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition min-w-[44px]"
              title={t("library.listItem.actions.load")}
            >
              <FileEdit className="w-4 h-4" />
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => confirmRemove()}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition min-w-[44px]"
            title={t("library.listItem.actions.delete")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
