import { useState, useRef, useEffect } from "react";
import { Edit, Sword, UserMinus } from "lucide-react";
import type { SavedPlayer } from "../../types";
import CombatantAvatar from "../common/CombatantAvatar";
import { useTranslation } from "react-i18next";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";
import Button from "../common/Button";

type Props = {
  player: SavedPlayer;
  onInclude: (player: SavedPlayer) => void;
  onFight: (player: SavedPlayer) => void;
  onRemove: (id: string) => void;
  onUpdateInitiative: (id: string, initiative: number) => Promise<void>;
};

export default function PlayerItem({
  player,
  onInclude,
  onFight,
  onRemove,
  onUpdateInitiative,
}: Props) {
  const { t } = useTranslation(["forms", "common", "combat"]);

  // Initiative editing state
  const initiative = player.initiativeGroups[0]?.initiative ?? "";
  const [isEditingInit, setIsEditingInit] = useState(false);
  const [initValue, setInitValue] = useState(initiative);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-select text when entering edit mode
  useEffect(() => {
    if (isEditingInit && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditingInit]);

  // Update local state when player initiative changes
  useEffect(() => {
    setInitValue(initiative);
  }, [initiative]);

  const handleStartEdit = () => {
    setIsEditingInit(true);
  };

  const handleSave = () => {
    const newInit = parseFloat(initValue);
    if (!isNaN(newInit) && initValue !== initiative) {
      onUpdateInitiative(player.id, newInit);
    } else {
      // Revert to original if invalid or unchanged
      setInitValue(initiative);
    }
    setIsEditingInit(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setInitValue(initiative);
      setIsEditingInit(false);
    }
  };

  const confirmDialog = useConfirmationDialog();
  const confirmRemove = async () => {
    const isConfirmed = await confirmDialog({
      title: t("common:confirmation.removePlayer.title"),
      message: t("common:confirmation.removePlayer.message", {
        name: player.name,
      }),
    });
    if (isConfirmed) {
      onRemove(player.id);
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

        {/* Info Section - Name with stats below, centered */}
        <div className="flex-1 min-w-0 text-center">
          <h3 className="font-semibold text-text-primary truncate text-base">
            {player.name}
          </h3>
          <div className="flex items-center justify-center gap-2 text-text-primary font-light text-sm">
            <span>HP {player.hp}</span>
            <span className="flex items-center gap-1">
              Init{" "}
              {isEditingInit ? (
                <input
                  ref={inputRef}
                  type="number"
                  value={initValue}
                  onChange={(e) => setInitValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  className="text-text-primary font-light text-sm bg-transparent border-b border-text-primary w-8 focus:outline-none text-center"
                  autoFocus
                />
              ) : (
                <span
                  onClick={handleStartEdit}
                  className="cursor-pointer hover:bg-white/30 rounded px-1 -mx-1 transition-colors"
                  title={t("combat:combatant.editInitiative")}
                >
                  {initiative || "—"}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onInclude(player)}
            title={t("forms:players:editTooltip")}
            className="flex items-center justify-center min-w-[44px]"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onFight(player)}
            title={t("forms:players:fightTooltip")}
            className="bg-lime-600 hover:bg-lime-700 flex items-center justify-center min-w-[44px]"
          >
            <Sword className="w-4 h-4" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => confirmRemove()}
            title={t("forms:players:deleteTooltip")}
            className="flex items-center justify-center min-w-[44px]"
          >
            <UserMinus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
