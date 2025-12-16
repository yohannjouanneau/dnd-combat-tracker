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

export default function SavedPlayerItem({
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
        name: player.name,
      }),
    });
    if (isConfirmed) {
      onRemove(player.id)
    }
  };
  
  return (
    <div className="bg-panel-secondary rounded-lg border border-border-primary p-2 hover:border-border-secondary transition-colors">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <CombatantAvatar
          imageUrl={player.imageUrl}
          name={player.name}
          color={player.color}
          size="sm"
        />

        {/* Info Section - Grows to fill space */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary truncate text-base">
            {player.name}
          </h3>
        </div>

        {/* Stats and Buttons Container */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 text-sm text-text-secondary">
            <div className="flex flex-col items-center">
              <span className="text-xs text-text-muted">HP</span>
              <span className="font-semibold">{player.hp}/{player.maxHp || player.hp}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-text-muted">AC</span>
              <span className="font-semibold">{player.ac || 10}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onInclude(player)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center transition min-w-[44px]"
              title={t("forms:savedPlayers:editTooltip")}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onFight(player)}
              className="bg-lime-600 hover:bg-lime-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center transition min-w-[44px]"
              title={t("forms:savedPlayers:fightTooltip")}
            >
              <Sword className="w-4 h-4" />
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
