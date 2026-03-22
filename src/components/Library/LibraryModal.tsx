import { X, BookOpen, Plus, Users, Swords, Search, ArrowUp, ArrowDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import type { MonsterCombatant, PlayerCombatant, SavedMonster, SavedPlayer, SearchResult } from "../../types";
import LibraryListItem from "./LibraryListItem";
import LibraryEditModal from "./LibraryEditModal";
import { generateId } from "../../utils/utils";
import { DEFAULT_COLOR_PRESET } from "../../constants";

type FilterType = "monsters" | "players";

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
  initialFilter?: FilterType;
  onAddPlayerToFight?: (player: SavedPlayer) => void;
  onToggleAutoAdd?: (player: SavedPlayer) => void;
};

export default function LibraryModal({
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
  initialFilter,
  onAddPlayerToFight,
  onToggleAutoAdd,
}: Props) {
  const { t } = useTranslation(["common", "forms"]);

  const [filter, setFilter] = useState<FilterType>(initialFilter ?? "monsters");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"name" | "hp" | "ac" | "createdAt">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (isOpen) {
      setFilter(initialFilter ?? "monsters");
      setSearchQuery("");
      setSortField("name");
      setSortDir("asc");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSetFilter = (f: FilterType) => {
    setFilter(f);
    setSearchQuery("");
    setSortField("name");
    setSortDir("asc");
  };

  const applySearchSort = <T extends SavedMonster | SavedPlayer>(items: T[]): T[] => {
    const q = searchQuery.toLowerCase();
    const matched = q ? items.filter(i => i.name.toLowerCase().includes(q)) : items;
    return [...matched].sort((a, b) => {
      const av = sortField === "name" ? a.name : (a[sortField] ?? 0);
      const bv = sortField === "name" ? b.name : (b[sortField] ?? 0);
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  };

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
      <LibraryEditModal
        monster={monsterEntity ?? newMonsterTemplate()}
        onSave={monsterOnSave}
        onCancel={monsterOnCancel}
        isCreating={isCreating}
        templateType="monster"
        onSearchMonsters={onSearchMonsters}
      />
    ) : (
      <LibraryEditModal
        monster={playerEntity ?? newPlayerTemplate()}
        onSave={playerOnSave}
        onCancel={playerOnCancel}
        isCreating={isCreatingPlayer}
        templateType="player"
      />
    )
  ) : undefined;

  // Filtered + sorted lists
  const filteredMonsters = applySearchSort(filter === "monsters" ? monsters : []);
  const filteredPlayers = applySearchSort(filter === "players" ? players : []);
  const totalCount = filteredMonsters.length + filteredPlayers.length;

  const getEmptyTitle = () => {
    if (searchQuery) return t("forms:library.noSearchResultsTitle", { query: searchQuery });
    return filter === "monsters" ? t("forms:library.emptyListTitle") : t("forms:library.emptyListTitlePlayers");
  };

  const getEmptyMessage = () => {
    if (searchQuery) return t("forms:library.noSearchResultsMessage");
    return filter === "monsters" ? t("forms:library.emptyListMessage") : t("forms:library.emptyListMessagePlayers");
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
              {filter === "monsters" && (
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
              {filter === "players" && onCreatePlayer && (
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
              {filter === "players" && onAddPlayerToFight && filteredPlayers.length > 0 && (
                <button
                  onClick={() => filteredPlayers.forEach(p => onAddPlayerToFight(p))}
                  className="bg-lime-600 hover:bg-lime-700 text-white px-3 md:px-4 py-2 rounded transition font-medium flex items-center gap-2"
                  title={t("forms:library.addAllHint")}
                >
                  <Swords className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    {t("forms:library.addAll")}
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

          {/* Filter Tabs + Search/Sort */}
          <div className="px-4 md:px-6 pt-3 border-b border-border-primary pb-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
            <div className="flex gap-1 w-full sm:w-auto">
              {(["monsters", "players"] as FilterType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleSetFilter(tab)}
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-t transition-colors border-b-2 -mb-px ${
                    filter === tab
                      ? "border-amber-400 text-amber-400"
                      : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  {t(`forms:library.filter.${tab}`)}
                  <span className="ml-1 text-xs opacity-70">
                    {tab === "monsters" && `(${monsters.length})`}
                    {tab === "players" && `(${players.length})`}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 pb-2 sm:pt-0 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t("forms:library.searchPlaceholder")}
                  className="pl-7 pr-2 py-1 text-sm bg-input-bg border border-border-secondary rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-400 w-full sm:w-28 md:w-40"
                />
              </div>
              <select
                value={sortField}
                onChange={e => setSortField(e.target.value as "name" | "hp" | "ac" | "createdAt")}
                className="text-sm bg-input-bg border border-border-secondary rounded px-2 py-1 text-text-primary focus:outline-none focus:border-amber-400"
              >
                <option value="name">{t("forms:library.sort.name")}</option>
                <option value="hp">{t("forms:library.sort.hp")}</option>
                <option value="ac">{t("forms:library.sort.ac")}</option>
                <option value="createdAt">{t("forms:library.sort.createdAt")}</option>
              </select>
              <button
                onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                className="p-1 rounded text-text-muted hover:text-text-primary transition"
                title={sortDir === "asc" ? t("forms:library.sort.desc") : t("forms:library.sort.asc")}
              >
                {sortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </button>
            </div>
            </div>
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
                  <LibraryListItem
                    key={monster.id}
                    monster={monster}
                    canLoadToForm={canLoadToForm}
                    onLoadToForm={onLoadToForm}
                    onEdit={(entity) => setEditingMonster(entity as SavedMonster)}
                    onDelete={onDelete}
                    isUsedAsTemplate={isUsedAsTemplate}
                  />
                ))}
                {filteredPlayers.length > 0 && onToggleAutoAdd && (
                  <div className="flex justify-end pr-2 mb-1">
                    <span className="text-xs text-text-muted">{t("forms:library.autoAddHeader")}</span>
                  </div>
                )}
                {filteredPlayers.map((player) => (
                  <LibraryListItem
                    key={player.id}
                    monster={player}
                    onEdit={(entity) => setEditingPlayer(entity as SavedPlayer)}
                    onDelete={onDeletePlayer ?? (() => {})}
                    isUsedAsTemplate={isPlayerUsedAsTemplate ?? (() => Promise.resolve(false))}
                    onAddToFight={onAddPlayerToFight}
                    onToggleAutoAdd={onToggleAutoAdd}
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
