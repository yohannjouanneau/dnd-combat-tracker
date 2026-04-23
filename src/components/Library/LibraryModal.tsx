import {
  X,
  BookOpen,
  Plus,
  Users,
  Swords,
  Search,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";
import Button from "../common/Button";
import IconButton from "../common/IconButton";
import Select from "../common/Select";
import type {
  MonsterCombatant,
  PlayerCombatant,
  SavedCombat,
  SavedMonster,
  SavedPlayer,
  SearchResult,
} from "../../types";
import type {
  BlockTypeDef,
  BuildingBlock,
  BuildingBlockInput,
} from "../../types/campaign";
import type { CustomTypeInput } from "../../persistence/BlockTypeStorageProvider";
import LibraryListItem from "./LibraryListItem";
import LibraryEditModal from "./LibraryEditModal";
import BlockEditModal from "../Campaign/BlockEditModal";
import { generateId } from "../../utils/utils";
import { DEFAULT_COLOR_PRESET } from "../../constants";

type FilterType = "monsters" | "players" | "blocks";

type Props = {
  isOpen: boolean;
  monsters: SavedMonster[];
  players?: SavedPlayer[];
  blocks?: BuildingBlock[];
  blockTypes?: BlockTypeDef[];
  savedCombats?: SavedCombat[];
  canLoadToForm?: boolean;
  onClose: () => void;
  onLoadToForm?: (monster: SavedMonster) => void;
  onUpdate: (id: string, updated: SavedMonster) => void;
  onCreate: (monster: MonsterCombatant) => void;
  onDelete: (id: string) => void;
  onUpdatePlayer?: (id: string, updated: SavedPlayer) => void;
  onCreatePlayer?: (player: PlayerCombatant) => void;
  onDeletePlayer?: (id: string) => void;
  onCreateBlock?: (input: BuildingBlockInput) => Promise<BuildingBlock>;
  onUpdateBlock?: (
    id: string,
    patch: Partial<BuildingBlock>,
  ) => Promise<BuildingBlock>;
  onDeleteBlock?: (id: string) => Promise<void>;
  onCreateBlockType?: (input: CustomTypeInput) => Promise<BlockTypeDef>;
  onUpdateBlockType?: (
    id: string,
    patch: Partial<BlockTypeDef>,
  ) => Promise<BlockTypeDef>;
  onDeleteBlockType?: (id: string) => Promise<void>;
  onAddBlock?: (block: BuildingBlock) => void;
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
  blocks = [],
  blockTypes = [],
  savedCombats = [],
  canLoadToForm = false,
  onClose,
  onLoadToForm,
  onUpdate,
  onCreate,
  onDelete,
  onUpdatePlayer,
  onCreatePlayer,
  onDeletePlayer,
  onCreateBlock,
  onUpdateBlock,
  onDeleteBlock,
  onCreateBlockType,
  onUpdateBlockType,
  onDeleteBlockType,
  onAddBlock,
  onSearchMonsters,
  isUsedAsTemplate,
  isPlayerUsedAsTemplate,
  initialFilter,
  onAddPlayerToFight,
  onToggleAutoAdd,
}: Props) {
  const { t } = useTranslation(["common", "forms"]);
  const confirmDialog = useConfirmationDialog();

  const handleDeleteBlock = useCallback(
    async (block: BuildingBlock) => {
      const confirmed = await confirmDialog({
        title: t("common:confirmation.deleteBlockFromLibrary.title"),
        message: t("common:confirmation.deleteBlockFromLibrary.message", {
          name: block.name,
        }),
      });
      if (confirmed && onDeleteBlock) {
        await onDeleteBlock(block.id);
      }
    },
    [confirmDialog, onDeleteBlock, t],
  );

  const [filter, setFilter] = useState<FilterType>(initialFilter ?? "monsters");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<
    "name" | "hp" | "ac" | "createdAt"
  >("name");
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

  const applySearchSort = <T extends SavedMonster | SavedPlayer>(
    items: T[],
  ): T[] => {
    const q = searchQuery.toLowerCase();
    const matched = q
      ? items.filter((i) => i.name.toLowerCase().includes(q))
      : items;
    return [...matched].sort((a, b) => {
      const av = sortField === "name" ? a.name : (a[sortField] ?? 0);
      const bv = sortField === "name" ? b.name : (b[sortField] ?? 0);
      const cmp =
        typeof av === "string"
          ? av.localeCompare(bv as string)
          : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  };

  const applyBlockSearchSort = (items: BuildingBlock[]): BuildingBlock[] => {
    const q = searchQuery.toLowerCase();
    const matched = q
      ? items.filter((b) => b.name.toLowerCase().includes(q))
      : items;
    return [...matched].sort((a, b) => {
      if (sortField === "createdAt")
        return sortDir === "asc"
          ? a.createdAt - b.createdAt
          : b.createdAt - a.createdAt;
      return sortDir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
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
    };
  };

  const newPlayerTemplate: () => SavedPlayer = () => {
    return {
      type: "player",
      id: generateId(),
      name: "",
      imageUrl: "",
      createdAt: 0,
      updatedAt: 0,
      color:
        DEFAULT_COLOR_PRESET.find((c) => c.key === "purple")?.value ??
        DEFAULT_COLOR_PRESET[0].value,
      externalResourceUrl: "",
      initiativeGroups: [],
    };
  };

  const [editingMonster, setEditingMonster] = useState<
    SavedMonster | undefined
  >();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<SavedPlayer | undefined>();
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BuildingBlock | undefined>();
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);

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

  const isEditingEntity =
    isCreating || editingMonster || isCreatingPlayer || editingPlayer;

  const monsterOnSave = isCreating ? handleCreateMonster : handleUpdateMonster;
  const monsterOnCancel = isCreating
    ? () => setIsCreating(false)
    : () => setEditingMonster(undefined);
  const monsterEntity = isCreating ? newMonsterTemplate() : editingMonster;

  const playerOnSave = isCreatingPlayer
    ? handleCreatePlayer
    : handleUpdatePlayer;
  const playerOnCancel = isCreatingPlayer
    ? () => setIsCreatingPlayer(false)
    : () => setEditingPlayer(undefined);
  const playerEntity = isCreatingPlayer ? newPlayerTemplate() : editingPlayer;

  const editModal = isEditingEntity ? (
    isCreating || editingMonster ? (
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
  const filteredMonsters = applySearchSort(
    filter === "monsters" ? monsters : [],
  );
  const filteredPlayers = applySearchSort(filter === "players" ? players : []);
  const filteredBlocks = applyBlockSearchSort(
    filter === "blocks" ? blocks : [],
  );
  const totalCount =
    filteredMonsters.length + filteredPlayers.length + filteredBlocks.length;

  const getEmptyTitle = () => {
    if (searchQuery)
      return t("forms:library.noSearchResultsTitle", { query: searchQuery });
    if (filter === "blocks") return t("forms:library.emptyListTitleBlocks");
    return filter === "monsters"
      ? t("forms:library.emptyListTitle")
      : t("forms:library.emptyListTitlePlayers");
  };

  const getEmptyMessage = () => {
    if (searchQuery) return t("forms:library.noSearchResultsMessage");
    if (filter === "blocks") return t("forms:library.emptyListMessageBlocks");
    return filter === "monsters"
      ? t("forms:library.emptyListMessage")
      : t("forms:library.emptyListMessagePlayers");
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
                <Button
                  variant="success"
                  size="md"
                  onClick={() => setIsCreating(true)}
                  title={t("forms:library.newHint")}
                  className="px-3 md:px-4 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    {t("forms:library.new")}
                  </span>
                </Button>
              )}
              {filter === "players" && onCreatePlayer && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsCreatingPlayer(true)}
                  title={t("forms:library.newPlayerHint")}
                  className="px-3 md:px-4 bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    {t("forms:library.newPlayer")}
                  </span>
                </Button>
              )}
              {filter === "players" &&
                onAddPlayerToFight &&
                filteredPlayers.length > 0 && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() =>
                      filteredPlayers.forEach((p) => onAddPlayerToFight(p))
                    }
                    title={t("forms:library.addAllHint")}
                    className="px-3 md:px-4 bg-lime-600 hover:bg-lime-700 flex items-center gap-2"
                  >
                    <Swords className="w-5 h-5" />
                    <span className="hidden sm:inline">
                      {t("forms:library.addAll")}
                    </span>
                  </Button>
                )}
              {filter === "blocks" && onCreateBlock && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsCreatingBlock(true)}
                  title={t("forms:library.newBlockHint")}
                  className="px-3 md:px-4 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    {t("forms:library.newBlock")}
                  </span>
                </Button>
              )}
              <IconButton variant="ghost" onClick={onClose}>
                <X className="w-6 h-6" />
              </IconButton>
            </div>
          </div>

          {/* Filter Tabs + Search/Sort */}
          <div className="px-4 md:px-6 pt-3 border-b border-border-primary pb-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
              <div className="flex gap-1 w-full sm:w-auto">
                {(["monsters", "players", "blocks"] as FilterType[]).map(
                  (tab) => (
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
                        {tab === "blocks" && `(${blocks.length})`}
                      </span>
                    </button>
                  ),
                )}
              </div>
              <div className="flex items-center gap-2 pt-2 pb-2 sm:pt-0 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("forms:library.searchPlaceholder")}
                    className="pl-7 pr-2 py-1 text-sm bg-input-bg border border-border-secondary rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-400 w-full sm:w-28 md:w-40"
                  />
                </div>
                <Select
                  value={sortField}
                  onChange={(e) =>
                    setSortField(
                      e.target.value as "name" | "hp" | "ac" | "createdAt",
                    )
                  }
                  className="text-sm px-2 py-1 focus:border-amber-400"
                >
                  <option value="name">{t("forms:library.sort.name")}</option>
                  {filter !== "blocks" && (
                    <option value="hp">{t("forms:library.sort.hp")}</option>
                  )}
                  {filter !== "blocks" && (
                    <option value="ac">{t("forms:library.sort.ac")}</option>
                  )}
                  <option value="createdAt">
                    {t("forms:library.sort.createdAt")}
                  </option>
                </Select>
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                  }
                  title={
                    sortDir === "asc"
                      ? t("forms:library.sort.desc")
                      : t("forms:library.sort.asc")
                  }
                >
                  {sortDir === "asc" ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                </IconButton>
              </div>
            </div>
          </div>

          {/* Content - Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 max-h-[60vh]">
            {totalCount === 0 ? (
              <div className="text-center text-text-muted py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">{getEmptyTitle()}</p>
                <p className="text-sm mt-2">{getEmptyMessage()}</p>
              </div>
            ) : (
              <div className="space-y-2 pr-2">
                {filteredMonsters.map((monster) => (
                  <LibraryListItem
                    key={monster.id}
                    monster={monster}
                    canLoadToForm={canLoadToForm}
                    onLoadToForm={onLoadToForm}
                    onEdit={(entity) =>
                      setEditingMonster(entity as SavedMonster)
                    }
                    onDelete={onDelete}
                    isUsedAsTemplate={isUsedAsTemplate}
                  />
                ))}
                {filteredPlayers.length > 0 && onToggleAutoAdd && (
                  <div className="flex justify-end pr-2 mb-1">
                    <span className="text-xs text-text-muted">
                      {t("forms:library.autoAddHeader")}
                    </span>
                  </div>
                )}
                {filteredPlayers.map((player) => (
                  <LibraryListItem
                    key={player.id}
                    monster={player}
                    onEdit={(entity) => setEditingPlayer(entity as SavedPlayer)}
                    onDelete={onDeletePlayer ?? (() => {})}
                    isUsedAsTemplate={
                      isPlayerUsedAsTemplate ?? (() => Promise.resolve(false))
                    }
                    onAddToFight={onAddPlayerToFight}
                    onToggleAutoAdd={onToggleAutoAdd}
                  />
                ))}
                {filteredBlocks.map((block) => {
                  const blockTypeDef = blockTypes.find(
                    (bt) => bt.id === block.typeId,
                  );
                  const blockTypeName = blockTypeDef
                    ? blockTypeDef.isBuiltIn
                      ? t(`campaigns:block.types.${blockTypeDef.id}`)
                      : blockTypeDef.name
                    : block.typeId;
                  return (
                    <div
                      key={block.id}
                      className="bg-panel-secondary rounded-lg border border-border-primary p-3 hover:border-border-secondary transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl flex-shrink-0">
                          {block.icon ?? blockTypeDef?.icon ?? "📦"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-text-primary truncate">
                            {block.name || (
                              <span className="italic font-normal text-text-muted">
                                Unnamed
                              </span>
                            )}
                          </h3>
                          {block.description && (
                            <p className="text-xs text-text-muted truncate mt-0.5">
                              {block.description.length > 80
                                ? block.description.slice(0, 80) + "…"
                                : block.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-text-muted px-1.5 py-0.5 rounded border border-border-secondary hidden sm:inline-block flex-shrink-0">
                          {blockTypeName}
                        </span>
                        <div className="flex gap-2 flex-shrink-0">
                          {onAddBlock && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => onAddBlock(block)}
                              title={t("common:actions.add")}
                              className="flex items-center justify-center gap-1 min-w-[44px]"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setEditingBlock(block)}
                            title={t("common:actions.edit")}
                            className="flex items-center justify-center gap-1 min-w-[44px]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {onDeleteBlock && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteBlock(block)}
                              title={t("common:actions.delete")}
                              className="flex items-center justify-center gap-1 min-w-[44px]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border-primary p-4 md:p-6">
            <Button
              variant="secondary"
              onClick={onClose}
              className="w-full md:w-auto px-6"
            >
              {t("common:actions.close")}
            </Button>
          </div>
        </div>
      </div>
      {editModal}
      {(isCreatingBlock || editingBlock) && (
        <BlockEditModal
          block={editingBlock}
          allBlocks={blocks}
          blockTypes={blockTypes}
          savedCombats={savedCombats}
          savedPlayers={players}
          savedMonsters={monsters}
          isCreating={isCreatingBlock}
          onSave={async (data) => {
            if (isCreatingBlock) {
              await onCreateBlock?.(data);
              setIsCreatingBlock(false);
            } else {
              await onUpdateBlock?.(data.id, data);
              setEditingBlock(undefined);
            }
          }}
          onCancel={() => {
            setIsCreatingBlock(false);
            setEditingBlock(undefined);
          }}
          onCreateBlockType={
            onCreateBlockType ??
            (async () => {
              throw new Error(
                "Block type creation is not available because onCreateBlockType was not provided.",
              );
            })
          }
          onUpdateBlockType={onUpdateBlockType}
          onDeleteBlockType={onDeleteBlockType}
        />
      )}
    </>
  );
}
