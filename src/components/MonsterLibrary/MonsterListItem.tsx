import { Sword, Trash2, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SavedMonster } from "../../types";
import CombatantAvatar from "../common/CombatantAvatar";
import { getStatModifier } from "../../utils";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";

type Props = {
  monster: SavedMonster;
  canLoadToForm?: boolean;
  onLoadToForm?: (monster: SavedMonster) => void;
  onEdit?: (monster: SavedMonster) => void;
  onDelete: (id: string) => void;
};

export default function MonsterListItem({
  monster,
  canLoadToForm = false,
  onLoadToForm,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation(["forms", "common"]);

  const confirmDialog = useConfirmationDialog();
  const confirmRemove = async () => {
    const isConfirmed = await confirmDialog({
      title: t("common:confirmation.deleteFromLibrary.title"),
      message: t("common:confirmation.deleteFromLibrary.message", {
        name: monster.name
      }),
    });
    if (isConfirmed) {
        onDelete(monster.id)
    }
  };

  const getAbilityModifier = (score: number) => {
    const num = score || 10;
    const mod = getStatModifier(num);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-3 hover:border-slate-600 transition-colors">
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
          <h3 className="text-base font-bold text-white truncate">
            {monster.name}
          </h3>
        </div>

        {/* HP & AC */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 leading-none">
              {t("library.listItem.stats.hp")}
            </span>
            <span className="font-semibold text-white text-base leading-none mt-1">
              {monster.hp}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 leading-none">
              {t("library.listItem.stats.ac")}
            </span>
            <span className="font-semibold text-white text-base leading-none mt-1">
              {monster.ac}
            </span>
          </div>
        </div>

        {/* Ability Scores */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {[
            { label: t("library.listItem.abilities.str"), value: monster.str ?? 0 },
            { label: t("library.listItem.abilities.dex"), value: monster.dex ?? 0},
            { label: t("library.listItem.abilities.con"), value: monster.con ?? 0},
            { label: t("library.listItem.abilities.int"), value: monster.int ?? 0},
            { label: t("library.listItem.abilities.wis"), value: monster.wis ?? 0},
            { label: t("library.listItem.abilities.cha"), value: monster.cha ?? 0},
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-slate-800 rounded px-2 py-1 text-center min-w-[48px]"
            >
              <div className="text-xs text-slate-400 leading-none">{label}</div>
              <div className="text-sm font-semibold text-white leading-none mt-0.5">
                {value}
              </div>
              <div className="text-xs text-blue-400 leading-none mt-0.5">
                {getAbilityModifier(value)}
              </div>
            </div>
          ))}
        </div>

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
              <Sword className="w-4 h-4" />
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