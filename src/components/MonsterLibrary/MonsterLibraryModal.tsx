import { X, BookOpen, Plus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { MonsterCombatant, PlayerCombatant, SavedMonster, SavedPlayer, SearchResult } from "../../types";
import MonsterListItem from "./MonsterListItem";
import MonsterEditModal from "./MonsterEditModal";
import { generateId } from "../../utils/utils";
import { DEFAULT_COLOR_PRESET } from "../../constants";

type FilterType = "all" | "monsters" | "players";

type Props = {
  isOpen: boolean;
  monsters: SavedMonster[];
  players?: SavedPlayer[];
  canLoadToForm?: boolean;
  onClose: () => void;
  onLoadToForm?: (monster: SavedMonster) => void;
  onUpdate: (id: string, updated: SavedMonster) => void;
  onCreate: (
    monster: MonsterCombatant
  ) => void;
  onDelete: (id: string) => void;
  onUpdatePlayer?: (id: string, updated: SavedPlayer) => void;
  onCreatePlayer?: (player: PlayerCombatant) => void;
  onDeletePlayer?: (id: string) => void;
  onSearchMonsters: (searchName: string) => Promise<SearchResult[]>;
  isUsedAsTemplate: (id: string) => Promise<boolean>;
  isPlayerUsedAsTemplate?: (id: string) => Promise<boolean>;
};

export default function MonsterLibraryModal({
  isOpen,
  monsters,
  players = [],
  canLoadToForm = false,
  onClose,
  onLoadToForm,
  onUpdate,
  onCreate,
  onDelete,
  onUpdatePlayer,
  onCreatePlayer,
  onDeletePlayer,
  onSearchMonsters,
  isUsedAsTemplate,
  isPlayerUsedAsTemplate,
}: Props) {
  const { t } = useTranslation(["common", "forms"]);

  const [filter, setFilter] = useState<FilterType>("all");

  const newMonsterTemplate: () => SavedMonster = () => {
    return {
      type: "monster",
      id: generateId(),
      name: "",
      imageUrl: "",
      createdAt: 0,
      updatedAt: 0,
      color: "red",
      externalResourceUrl: "",
      initiativeGroups: [],
    }
  };

  const newPlayerTemplate: () => SavedPlayer = () => {
    return {
      type: "player",
      id: generateId(),
      name: "",
      imageUrl: "",
      createdAt: 0,
      updatedAt: 0,
      color: DEFAULT_COLOR_PRESET.find((c) => c.key === "purple")?.value ?? DEFAULT_COLOR_PRESET[0].value,
      externalResourceUrl: "",
      initiativeGroups: [],
    }
  };

  const [editingMonster, setEditingMonster] = useState<SavedMonster | undefined>();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<SavedPlayer | undefined>();
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);

  if (!isOpen) return null;

  const handleUpdateMonster = (updated: SavedMonster | SavedPlayer) => {
    onUpdate((updated as SavedMonster).id, updated as SavedMonster);
    setEditingMonster(undefined);
  };

  const handleCreateMonster = (newMonster: SavedMonster | SavedPlayer) => {
    onCreate(newMonster as MonsterCombatant);
    setIsCreating(false);
  };

  const handleUpdatePlayer = (updated: SavedMonster | SavedPlayer) => {
    onUpdatePlayer?.((updated as SavedPlayer).id, updated as SavedPlayer);
    setEditingPlayer(undefined);
  };

  const handleCreatePlayer = (newPlayer: SavedMonster | SavedPlayer) => {
    onCreatePlayer?.(newPlayer as PlayerCombatant);
    setIsCreatingPlayer(false);
  };

  const isEditingEntity = isCreating || editingMonster || isCreatingPlayer || editingPlayer;

  const monsterOnSave = isCreating ? handleCreateMonster : handleUpdateMonster;
  const monsterOnCancel = isCreating
    ? () => setIsCreating(false)
    : () => setEditingMonster(undefined);
  const monsterEntity = isCreating ? newMonsterTemplate() : editingMonster;

  const playerOnSave = isCreatingPlayer ? handleCreatePlayer : handleUpdatePlayer;
  const playerOnCancel = isCreatingPlayer
    ? () => setIsCreatingPlayer(false)
    : () => setEditingPlayer(undefined);
  const playerEntity = isCreatingPlayer ? newPlayerTemplate() : editingPlayer;

  const editModal = isEditingEntity ? (
    (isCreating || editingMonster) ? (
      <MonsterEditModal
        monster={monsterEntity ?? newMonsterTemplate()}
        onSave={monsterOnSave}
        onCancel={monsterOnCancel}
        isCreating={isCreating}
        templateType="monster"
        onSearchMonsters={onSearchMonsters}
      />
    ) : (
      <MonsterEditModal
        monster={playerEntity ?? newPlayerTemplate()}
        onSave={playerOnSave}
        onCancel={playerOnCancel}
        isCreating={isCreatingPlayer}
        templateType="player"
      />
    )
  ) : undefined;

  // Filtered lists
  const showMonsters = filter === "all" || filter === "monsters";
  const showPlayers = filter === "all" || filter === "players";

  const filteredMonsters = showMonsters ? monsters : [];
  const filteredPlayers = showPlayers ? players : [];
  const totalCount = filteredMonsters.length + filteredPlayers.length;

  const getEmptyTitle = () => {
    if (filter === "monsters") return t("forms:library.emptyListTitle");
    if (filter === "players") return t("forms:library.emptyListTitlePlayers");
    return t("forms:library.emptyListTitleAll");
  };

  const getEmptyMessage = () => {
    if (filter === "monsters") return t("forms:library.emptyListMessage");
    if (filter === "players") return t("forms:library.emptyListMessagePlayers");
    return t("forms:library.emptyListMessageAll");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="!mt-0 fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
        <div className="bg-panel-bg rounded-lg border border-border-primary max-w-4xl w-full max-h-[90vh] shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border-primary">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl md:text-2xl font-bold text-text-primary">
                {t("forms:library.title")}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {(filter === "all" || filter === "monsters") && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded transition font-medium flex items-center gap-2"
                  title={t("forms:library.newHint")}
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    {t("forms:library.new")}
                  </span>
                </button>
              )}
              {(filter === "all" || filter === "players") && onCreatePlayer && (
                <button
                  onClick={() => setIsCreatingPlayer(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded transition font-medium flex items-center gap-2"
                  title={t("forms:library.newPlayerHint")}
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    {t("forms:library.newPlayer")}
                  </span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 px-4 md:px-6 pt-3 border-b border-border-primary pb-0">
            {(["all", "monsters", "players"] as FilterType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors border-b-2 -mb-px ${
                  filter === tab
                    ? "border-amber-400 text-amber-400"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {t(`forms:library.filter.${tab}`)}
                <span className="ml-1 text-xs opacity-70">
                  {tab === "all" && `(${monsters.length + players.length})`}
                  {tab === "monsters" && `(${monsters.length})`}
                  {tab === "players" && `(${players.length})`}
                </span>
              </button>
            ))}
          </div>

          {/* Content - Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 max-h-[60vh]">
            {totalCount === 0 ? (
              <div className="text-center text-text-muted py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">
                  {getEmptyTitle()}
                </p>
                <p className="text-sm mt-2">
                  {getEmptyMessage()}
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-2">
                {filteredMonsters.map((monster) => (
                  <MonsterListItem
                    key={monster.id}
                    monster={monster}
                    canLoadToForm={canLoadToForm}
                    onLoadToForm={onLoadToForm}
                    onEdit={(entity) => setEditingMonster(entity as SavedMonster)}
                    onDelete={onDelete}
                    isUsedAsTemplate={isUsedAsTemplate}
                  />
                ))}
                {filteredPlayers.map((player) => (
                  <MonsterListItem
                    key={player.id}
                    monster={player}
                    onEdit={(entity) => setEditingPlayer(entity as SavedPlayer)}
                    onDelete={onDeletePlayer ?? (() => {})}
                    isUsedAsTemplate={isPlayerUsedAsTemplate ?? (() => Promise.resolve(false))}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border-primary p-4 md:p-6">
            <button
              onClick={onClose}
              className="w-full md:w-auto bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary px-6 py-2 rounded transition font-medium"
            >
              {t("common:actions.close")}
            </button>
          </div>
        </div>
      </div>
      {editModal}
    </>
  );
}
