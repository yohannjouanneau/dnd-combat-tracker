import { useTranslation } from "react-i18next";
import { Users, Plus } from "lucide-react";
import type { SavedPlayer } from "../../types";
import SavedPlayerItem from "./SavedPlayerItem";

type Props = {
  savedPlayers: SavedPlayer[];
  onInclude: (player: SavedPlayer) => void;
  onFight: (player: SavedPlayer) => void;
  onRemove: (id: string) => void;
  onOpenAddModal: () => void;
  onUpdateInitiative: (id: string, initiative: number) => Promise<void>;
};

export default function SavedPlayersPanel({
  savedPlayers,
  onInclude,
  onFight,
  onRemove,
  onOpenAddModal,
  onUpdateInitiative,
}: Props) {
  const { t } = useTranslation("forms");

  return (
    <div className="bg-panel-bg rounded-lg p-6 mb-6 border border-border-primary">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-semibold">
            {t("forms:savedPlayers.title")}
          </h2>
        </div>
        <button
          onClick={onOpenAddModal}
          className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition flex items-center justify-center"
          title={t("forms:savedPlayers.addNew")}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {savedPlayers.length === 0 ? (
        <div className="text-center text-text-secondary py-3">
          <Users className="w-8 h-8 mx-auto mb-4 opacity-50" />
          <p className="text-m">{t("forms:savedPlayers.empty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
          {savedPlayers.map((player) => (
            <SavedPlayerItem
              key={player.id}
              player={player}
              onInclude={onInclude}
              onFight={onFight}
              onRemove={onRemove}
              onUpdateInitiative={onUpdateInitiative}
            />
          ))}
        </div>
      )}
    </div>
  );
}
