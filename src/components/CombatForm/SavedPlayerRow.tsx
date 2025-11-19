import { Edit, Sword, Trash2 } from "lucide-react";
import type { SavedPlayer } from "../../types";
import CombatantAvatar from "../common/CombatantAvatar";
import { useTranslation } from "react-i18next";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";

type Props = {
  player: SavedPlayer;
  onInclude: (player: SavedPlayer) => void;
  onFight: (player: SavedPlayer) => void;
  onRemove: (id: string) => void;
};

export default function SavedPlayerRow({
  player,
  onInclude,
  onFight,
  onRemove,
}: Props) {
  const { t } = useTranslation(["forms", "common"]);
  
  const confirmDialog = useConfirmationDialog();
  const confirmRemove = async () => {
    const isConfirmed = await confirmDialog({
      title: t("common:confirmation.removePlayer.title"),
      message: t("common:confirmation.removePlayer.message", {
        name: player.groupName,
      }),
    });
    if (isConfirmed) {
      onRemove(player.id)
    }
  };
  const getInitiativeSummary = () => {
    const totalCount = player.initiativeGroups.reduce(
      (sum, g) => sum + (parseInt(g.count) || 0),
      0
    );
    const groupCount = player.initiativeGroups.length;
    if (groupCount === 1) {
      return `${totalCount} combatant${totalCount !== 1 ? "s" : ""}`;
    }
    return `${groupCount} groups, ${totalCount} total`;
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-3 hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <CombatantAvatar
          imageUrl={player.imageUrl}
          name={player.groupName}
          color={player.color}
          size="sm"
        />
        
        {/* Info Section - Grows to fill space */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate text-base">
            {player.groupName}
          </h3>
          <div className="text-xs text-slate-400 mt-0.5">
            {getInitiativeSummary()}
          </div>
        </div>

        {/* Stats and Buttons Container */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 text-sm text-slate-300">
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-500">HP</span>
              <span className="font-semibold">{player.hp}/{player.maxHp || player.hp}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-500">AC</span>
              <span className="font-semibold">{player.ac || 10}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onInclude(player)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition min-w-[44px]"
              title={t("forms:savedPlayers:editTooltip")}
            >
              <Edit className="w-4 h-4" />
              <span className="hidden md:inline">{t("forms:savedPlayers:edit")}</span>
            </button>
            <button
              onClick={() => onFight(player)}
              className="bg-lime-600 hover:bg-lime-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition min-w-[44px]"
              title={t("forms:savedPlayers:fightTooltip")}
            >
              <Sword className="w-4 h-4" />
              <span className="hidden md:inline">{t("forms:savedPlayers:fight")}</span>
            </button>
            <button
              onClick={() => confirmRemove()}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition min-w-[44px] flex items-center justify-center"
              title={t("forms:savedPlayers:deleteTooltip")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
