import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowUpDown,
  Check,
  Plus,
  Library,
  GitGraph,
  List,
  X,
} from "lucide-react";
import TopBar from "../components/TopBar";
import type { CombatStateManager } from "../store/types";
import type { SavedCombat } from "../types";
import type {
  BuildingBlock,
  BuildingBlockInput,
  Campaign,
} from "../types/campaign";
import { generateId, generateDefaultNewCombatant } from "../utils/utils";
import { useToast } from "../components/common/Toast/useToast";
import { useConfirmationDialog } from "../hooks/useConfirmationDialog";
import BlockEditModal from "../components/Campaign/BlockEditModal";
import BlockDetailModal from "../components/Campaign/BlockDetailModal";
import BlockTreeNode, {
  type DragCallbacks,
} from "../components/Campaign/BlockTreeNode";
import LibraryEditModal from "../components/Library/LibraryEditModal";
import LibraryModal from "../components/Library/LibraryModal";
import SettingsModal from "../components/Settings/SettingsModal";
import CampaignCanvas from "../components/Campaign/canvas/CampaignCanvas";
import CampaignFilterBar, {
  type FilterState,
} from "../components/Campaign/CampaignFilterBar";
import type { SavedMonster, SavedPlayer } from "../types";

type Props = {
  campaignId: string;
  combatStateManager: CombatStateManager;
  onBack: () => void;
  onOpenCombat: (combatId: string) => void;
};

type ModalState =
  | { kind: "closed" }
  | { kind: "view"; block: BuildingBlock }
  | { kind: "create" }
  | { kind: "create-child"; parentId: string }
  | { kind: "edit"; block: BuildingBlock }
  | { kind: "library" };

export default function CampaignDetailPage({
  campaignId,
  combatStateManager,
  onBack,
  onOpenCombat,
}: Props) {
  const { t } = useTranslation(["campaigns", "common"]);
  const toast = useToast();
  const confirmDialog = useConfirmationDialog();

  const canvasLayout =
    window.innerWidth < 640
      ? "mobile"
      : window.innerWidth < 1024
        ? "intermediate"
        : "desktop";
  const [viewMode, setViewMode] = useState<"tree" | "canvas">("tree");
  const [modalState, setModalState] = useState<ModalState>({ kind: "closed" });
  const [showSettings, setShowSettings] = useState(false);
  const [savedCombats, setSavedCombats] = useState<SavedCombat[]>([]);
  const [editingNpc, setEditingNpc] = useState<
    SavedPlayer | SavedMonster | null
  >(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [dragState, setDragState] = useState<{
    blockId: string;
    sourceParentId: string | null;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    targetId: string;
    position: "before" | "after" | "child";
  } | null>(null);

  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: "",
    selectedTypeIds: [],
    selectedTags: [],
  });

  const campaign: Campaign | undefined = combatStateManager.campaigns.find(
    (c) => c.id === campaignId,
  );

  const [localName, setLocalName] = useState(campaign?.name ?? "");
  const [localDesc, setLocalDesc] = useState(campaign?.description ?? "");
  const [metaHasChanges, setMetaHasChanges] = useState(false);

  useEffect(() => {
    if (!metaHasChanges) {
      setLocalName(campaign?.name ?? "");
      setLocalDesc(campaign?.description ?? "");
    }
  }, [campaign, metaHasChanges]);

  useEffect(() => {
    combatStateManager.listCombat().then(setSavedCombats);
  }, [combatStateManager]);

  const blockIdsInCampaign = useMemo(
    () => new Set(campaign?.nodes.map((n) => n.blockId) ?? []),
    [campaign],
  );

  const campaignBlocks = useMemo(
    () => combatStateManager.blocks.filter((b) => blockIdsInCampaign.has(b.id)),
    [combatStateManager.blocks, blockIdsInCampaign],
  );

  const rootBlocks = useMemo(() => {
    const childIds = new Set(
      campaignBlocks.flatMap((b) =>
        b.children.filter((id) => blockIdsInCampaign.has(id)),
      ),
    );
    const nodeOrder = campaign?.nodes.map((n) => n.blockId) ?? [];
    const rootSet = campaignBlocks.filter((b) => !childIds.has(b.id));
    return [...rootSet].sort((a, b) => {
      const ai = nodeOrder.indexOf(a.id);
      const bi = nodeOrder.indexOf(b.id);
      return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
    });
  }, [campaignBlocks, blockIdsInCampaign, campaign?.nodes]);

  const parentMap = useMemo(() => {
    const map = new Map<string, string | null>();
    campaignBlocks.forEach((b) => {
      if (!map.has(b.id)) map.set(b.id, null);
      b.children.forEach((childId) => map.set(childId, b.id));
    });
    return map;
  }, [campaignBlocks]);

  const libraryBlocksNotInCampaign = useMemo(
    () =>
      combatStateManager.blocks.filter((b) => !blockIdsInCampaign.has(b.id)),
    [combatStateManager.blocks, blockIdsInCampaign],
  );

  const campaignBlockTypes = useMemo(
    () =>
      combatStateManager.blockTypes.filter((t) =>
        campaignBlocks.some((b) => b.typeId === t.id),
      ),
    [campaignBlocks, combatStateManager.blockTypes],
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    campaignBlocks.forEach((b) =>
      (b.tags ?? []).forEach((tag) => set.add(tag)),
    );
    return [...set].sort();
  }, [campaignBlocks]);

  const hasActiveFilters =
    filterState.searchQuery.trim() !== "" ||
    filterState.selectedTypeIds.length > 0 ||
    filterState.selectedTags.length > 0;

  const filteredCampaignBlocks = useMemo(() => {
    if (!hasActiveFilters) return campaignBlocks;
    const searchQuery = filterState.searchQuery.trim().toLowerCase();
    const directlyMatchingBlocks = campaignBlocks.filter((block) => {
      if (searchQuery && !block.name.toLowerCase().includes(searchQuery))
        return false;
      if (
        filterState.selectedTypeIds.length > 0 &&
        !filterState.selectedTypeIds.includes(block.typeId)
      )
        return false;
      if (
        filterState.selectedTags.length > 0 &&
        !filterState.selectedTags.some((tag) =>
          (block.tags ?? []).includes(tag),
        )
      )
        return false;
      return true;
    });
    // BFS: include all descendants of matched blocks so canvas arrows are intact
    const matchingBlockIds = new Set(directlyMatchingBlocks.map((b) => b.id));
    const bfsQueue = [...directlyMatchingBlocks];
    while (bfsQueue.length > 0) {
      const currentBlock = bfsQueue.shift()!;
      for (const childBlockId of currentBlock.children) {
        if (!matchingBlockIds.has(childBlockId)) {
          const childBlock = campaignBlocks.find((b) => b.id === childBlockId);
          if (childBlock) {
            matchingBlockIds.add(childBlockId);
            bfsQueue.push(childBlock);
          }
        }
      }
    }
    return campaignBlocks.filter((block) => matchingBlockIds.has(block.id));
  }, [campaignBlocks, filterState, hasActiveFilters]);

  const filteredBlockIds = useMemo(
    () => new Set(filteredCampaignBlocks.map((b) => b.id)),
    [filteredCampaignBlocks],
  );

  const filteredCampaign = useMemo(
    () =>
      hasActiveFilters
        ? {
            ...campaign,
            nodes: (campaign?.nodes ?? []).filter((n) =>
              filteredBlockIds.has(n.blockId),
            ),
          }
        : campaign,
    [campaign, filteredBlockIds, hasActiveFilters],
  ) as Campaign | undefined;

  const saveCampaignMeta = useCallback(
    async (name: string, description: string) => {
      if (!campaign) return;
      await combatStateManager.updateCampaignMeta(
        campaign.id,
        name,
        description,
      );
    },
    [campaign, combatStateManager],
  );

  const handleSaveBlock = useCallback(
    async (data: BuildingBlockInput) => {
      if (modalState.kind === "create") {
        const created = await combatStateManager.createBlock(data);
        await combatStateManager.addBlockToCampaign(campaignId, created.id);
        toast.success(t("campaigns:toast.blockSaved"));
      } else if (modalState.kind === "create-child") {
        const created = await combatStateManager.createBlock(data);
        await combatStateManager.addBlockToCampaign(campaignId, created.id);
        await combatStateManager.addChildToBlock(
          modalState.parentId,
          created.id,
        );
        toast.success(t("campaigns:toast.blockSaved"));
      } else if (modalState.kind === "edit") {
        await combatStateManager.updateBlock(data.id, data);
        toast.success(t("campaigns:toast.blockSaved"));
      }
      setModalState({ kind: "closed" });
    },
    [modalState, campaignId, combatStateManager, t, toast],
  );

  const handleRemoveBlock = useCallback(
    async (blockId: string) => {
      const confirmed = await confirmDialog({
        title: t("campaigns:delete.blockTitle"),
        message: t("campaigns:delete.blockMessage"),
      });
      if (!confirmed) return;
      await combatStateManager.removeBlockFromCampaign(campaignId, blockId);
      toast.success(t("campaigns:toast.blockRemoved"));
    },
    [campaignId, combatStateManager, confirmDialog, t, toast],
  );

  const handleAddFromLibrary = useCallback(
    async (blockId: string) => {
      await combatStateManager.addBlockToCampaign(campaignId, blockId);
      toast.success(t("campaigns:toast.blockSaved"));
    },
    [campaignId, combatStateManager, t, toast],
  );

  const handleOpenNpc = useCallback(
    (npcId: string) => {
      const entity =
        combatStateManager.savedPlayers.find((p) => p.id === npcId) ??
        combatStateManager.monsters.find((m) => m.id === npcId);
      if (entity) setEditingNpc(entity);
    },
    [combatStateManager.savedPlayers, combatStateManager.monsters],
  );

  const handleCreateCombatForBlock = useCallback(
    async (blockId: string) => {
      const newCombat = await combatStateManager.createCombat({
        id: generateId(),
        name:
          campaignBlocks.find((b) => b.id === blockId)?.name ??
          t("campaigns:block.combatFeature.newCombat"),
        description: "",
        data: {
          combatants: [],
          linkedPlayerIds: [],
          currentTurn: 0,
          round: 1,
          parkedGroups: [],
          newCombatant: generateDefaultNewCombatant(),
        },
      });
      const currentBlock = campaignBlocks.find((b) => b.id === blockId);
      await combatStateManager.updateBlock(blockId, {
        featureData: {
          ...(currentBlock?.featureData ?? {}),
          combatId: newCombat.id,
        },
      });
      onOpenCombat(newCombat.id);
    },
    [campaignBlocks, combatStateManager, onOpenCombat, t],
  );

  const handleMetaChange = useCallback(
    (patch: { name?: string; description?: string }) => {
      if (patch.name !== undefined) setLocalName(patch.name);
      if (patch.description !== undefined) setLocalDesc(patch.description);
      setMetaHasChanges(true);
    },
    [],
  );

  const handleSaveMeta = useCallback(async () => {
    await saveCampaignMeta(localName, localDesc);
    setMetaHasChanges(false);
  }, [localName, localDesc, saveCampaignMeta]);

  const handleGlobalDrop = useCallback(async () => {
    if (!dragState || !dropTarget) return;
    const { blockId, sourceParentId } = dragState;
    const { targetId, position } = dropTarget;
    if (blockId === targetId) return;

    // Remove from source parent if it had one
    if (sourceParentId) {
      const src = campaignBlocks.find((b) => b.id === sourceParentId);
      if (src) {
        await combatStateManager.updateBlock(sourceParentId, {
          children: src.children.filter((id) => id !== blockId),
        });
      }
    }

    if (position === "child") {
      // Add as last child of target
      const target = campaignBlocks.find((b) => b.id === targetId);
      if (target && !target.children.includes(blockId)) {
        await combatStateManager.updateBlock(targetId, {
          children: [...target.children, blockId],
        });
      }
    } else {
      // Insert before or after target at target's level
      const targetParentId = parentMap.get(targetId) ?? null;
      if (targetParentId) {
        const parent = campaignBlocks.find((b) => b.id === targetParentId);
        if (parent) {
          const children = parent.children.filter((id) => id !== blockId);
          const idx = children.indexOf(targetId);
          children.splice(position === "before" ? idx : idx + 1, 0, blockId);
          await combatStateManager.updateBlock(targetParentId, { children });
        }
      } else {
        // Target is at root level — reorder campaign.nodes
        const rootIds = rootBlocks
          .map((b) => b.id)
          .filter((id) => id !== blockId);
        const idx = rootIds.indexOf(targetId);
        rootIds.splice(position === "before" ? idx : idx + 1, 0, blockId);
        await combatStateManager.reorderCampaignBlocks(campaignId, rootIds);
      }
    }

    setDragState(null);
    setDropTarget(null);
  }, [
    dragState,
    dropTarget,
    campaignBlocks,
    parentMap,
    rootBlocks,
    combatStateManager,
    campaignId,
  ]);

  if (!campaign) {
    return <div className="p-6 text-text-secondary">{t("common:loading")}</div>;
  }

  return (
    <div className="mx-auto text-white h-screen flex flex-col bg-app-bg">
      <div className="p-4 md:p-6 flex-shrink-0">
        <TopBar
          logo
          name={localName}
          description={localDesc}
          onChange={handleMetaChange}
          onBack={onBack}
          onSave={handleSaveMeta}
          hasChanges={metaHasChanges}
          nameLabel={t("campaigns:list.new")}
          syncApi={combatStateManager.syncApi}
          onOpenSettings={() => setShowSettings(true)}
        />
        <div className="flex justify-between gap-2 mb-4">
          <div className="flex items-center gap-1 bg-panel-secondary rounded p-0.5 border border-border-secondary">
            <button
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm transition ${
                viewMode === "tree"
                  ? "bg-accent text-accent-text"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {t("campaigns:canvas.tree")}
              </span>
            </button>
            <button
              onClick={() => setViewMode("canvas")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm transition ${
                viewMode === "canvas"
                  ? "bg-accent text-accent-text"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <GitGraph className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {t("campaigns:canvas.toggle")}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "tree" && (
              <button
                onClick={() => {
                  setReorderMode((v) => !v);
                  setDragState(null);
                  setDropTarget(null);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded text-sm transition ${
                  reorderMode
                    ? "bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary ring-1 ring-border-secondary"
                    : "bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary"
                }`}
              >
                {reorderMode ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ArrowUpDown className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {reorderMode
                    ? t("common:actions.confirm")
                    : t("campaigns:detail.reorder")}
                </span>
              </button>
            )}
            {!reorderMode && (
              <>
                <button
                  onClick={() => setModalState({ kind: "library" })}
                  className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded text-sm transition"
                  title={t("campaigns:detail.addFromLibrary")}
                >
                  <Library className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t("campaigns:detail.addFromLibrary")}
                  </span>
                </button>
                <button
                  onClick={() => setModalState({ kind: "create" })}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t("campaigns:detail.addBlock")}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        <CampaignFilterBar
          searchQuery={filterState.searchQuery}
          selectedTypeIds={filterState.selectedTypeIds}
          selectedTags={filterState.selectedTags}
          blockTypes={campaignBlockTypes}
          allTags={allTags}
          onChange={(patch) =>
            setFilterState((prev) => ({ ...prev, ...patch }))
          }
          onClear={() =>
            setFilterState({
              searchQuery: "",
              selectedTypeIds: [],
              selectedTags: [],
            })
          }
        />
      </div>

      {viewMode === "canvas" && canvasLayout === "desktop" && (
        <div className="flex-1">
          <CampaignCanvas
            campaign={filteredCampaign!}
            blocks={filteredCampaignBlocks}
            blockTypes={combatStateManager.blockTypes}
            onUpdateNodes={combatStateManager.updateCanvasNodes}
            onAddChild={combatStateManager.addChildToBlock}
            onRemoveChild={combatStateManager.removeChildFromBlock}
            onViewBlock={(b) => setModalState({ kind: "view", block: b })}
            onEditBlock={(b) => setModalState({ kind: "edit", block: b })}
          />
        </div>
      )}

      {/* Overlay canvas: mobile (read-only) and intermediate */}
      {viewMode === "canvas" && canvasLayout !== "desktop" && (
        <div className="fixed inset-0 z-50 bg-app-bg flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary flex-shrink-0">
            <span className="font-semibold text-text-primary truncate">
              {campaign.name}
            </span>
            <button
              onClick={() => setViewMode("tree")}
              className="p-1 text-text-muted hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1">
            <CampaignCanvas
              campaign={filteredCampaign!}
              blocks={filteredCampaignBlocks}
              blockTypes={combatStateManager.blockTypes}
              onUpdateNodes={combatStateManager.updateCanvasNodes}
              onAddChild={combatStateManager.addChildToBlock}
              onRemoveChild={combatStateManager.removeChildFromBlock}
              onViewBlock={(b) => setModalState({ kind: "view", block: b })}
              onEditBlock={(b) => setModalState({ kind: "edit", block: b })}
              readOnly={canvasLayout === "mobile"}
            />
          </div>
        </div>
      )}

      {viewMode !== "canvas" && (
        <div className="flex-1 overflow-y-auto p-4">
          {hasActiveFilters ? (
            // Flat filtered list
            <>
              {filteredCampaignBlocks.length === 0 ? (
                <div className="text-center text-text-muted py-12">
                  <p className="text-base">{t("campaigns:filter.noResults")}</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-text-muted mb-3">
                    {t("campaigns:filter.activeCount", {
                      count: filteredCampaignBlocks.length,
                      total: campaignBlocks.length,
                    })}
                  </p>
                  <div className="space-y-2">
                    {filteredCampaignBlocks.map((block) => (
                      <BlockTreeNode
                        key={block.id}
                        block={block}
                        allBlocks={campaignBlocks}
                        blockTypes={combatStateManager.blockTypes}
                        savedPlayers={combatStateManager.savedPlayers}
                        savedMonsters={combatStateManager.monsters}
                        depth={0}
                        reorderMode={false}
                        onView={(b) =>
                          setModalState({ kind: "view", block: b })
                        }
                        onEdit={(b) =>
                          setModalState({ kind: "edit", block: b })
                        }
                        onAddChild={(parentId) =>
                          setModalState({ kind: "create-child", parentId })
                        }
                        onRemove={handleRemoveBlock}
                        onOpenCombat={onOpenCombat}
                        onCreateCombat={handleCreateCombatForBlock}
                        onOpenNpc={handleOpenNpc}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : rootBlocks.length === 0 ? (
            <div className="text-center text-text-muted py-12">
              <p className="text-base">{t("campaigns:detail.noBlocks")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rootBlocks.map((block) => (
                <BlockTreeNode
                  key={block.id}
                  block={block}
                  allBlocks={campaignBlocks}
                  blockTypes={combatStateManager.blockTypes}
                  savedPlayers={combatStateManager.savedPlayers}
                  savedMonsters={combatStateManager.monsters}
                  depth={0}
                  reorderMode={reorderMode}
                  dragCallbacks={
                    reorderMode
                      ? ({
                          onDragStart: (blockId) =>
                            setDragState({
                              blockId,
                              sourceParentId: parentMap.get(blockId) ?? null,
                            }),
                          onDragOver: (targetId, position) =>
                            setDropTarget({ targetId, position }),
                          onDrop: handleGlobalDrop,
                          onDragEnd: () => {
                            setDragState(null);
                            setDropTarget(null);
                          },
                          draggedId: dragState?.blockId ?? null,
                          dropTarget,
                        } satisfies DragCallbacks)
                      : undefined
                  }
                  onView={(b) => setModalState({ kind: "view", block: b })}
                  onEdit={(b) => setModalState({ kind: "edit", block: b })}
                  onAddChild={(parentId) =>
                    setModalState({ kind: "create-child", parentId })
                  }
                  onRemove={handleRemoveBlock}
                  onOpenCombat={onOpenCombat}
                  onCreateCombat={handleCreateCombatForBlock}
                  onOpenNpc={handleOpenNpc}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {modalState.kind === "view" && (
        <BlockDetailModal
          block={modalState.block}
          allBlocks={campaignBlocks}
          blockTypes={combatStateManager.blockTypes}
          savedPlayers={combatStateManager.savedPlayers}
          savedMonsters={combatStateManager.monsters}
          onClose={() => setModalState({ kind: "closed" })}
          onEdit={(b) => setModalState({ kind: "edit", block: b })}
          onOpenCombat={(id) => {
            setModalState({ kind: "closed" });
            onOpenCombat(id);
          }}
          onOpenBlock={(blockId) => {
            const b = campaignBlocks.find((x) => x.id === blockId);
            if (b) setModalState({ kind: "view", block: b });
          }}
          onUpdateBlock={combatStateManager.updateBlock}
        />
      )}

      {(modalState.kind === "create" ||
        modalState.kind === "create-child" ||
        modalState.kind === "edit") && (
        <BlockEditModal
          block={modalState.kind === "edit" ? modalState.block : undefined}
          allBlocks={combatStateManager.blocks}
          blockTypes={combatStateManager.blockTypes}
          savedCombats={savedCombats}
          savedPlayers={combatStateManager.savedPlayers}
          savedMonsters={combatStateManager.monsters}
          isCreating={modalState.kind !== "edit"}
          onSave={handleSaveBlock}
          onCancel={() => setModalState({ kind: "closed" })}
          onCreateBlockType={combatStateManager.createBlockType}
          onDeleteBlockType={combatStateManager.deleteBlockType}
          onOpenNpc={handleOpenNpc}
          onOpenCombat={(combatId) => {
            setModalState({ kind: "closed" });
            onOpenCombat(combatId);
          }}
        />
      )}

      <LibraryModal
        isOpen={modalState.kind === "library"}
        monsters={combatStateManager.monsters}
        players={combatStateManager.savedPlayers}
        blocks={libraryBlocksNotInCampaign}
        blockTypes={combatStateManager.blockTypes}
        savedCombats={savedCombats}
        initialFilter="blocks"
        onClose={() => setModalState({ kind: "closed" })}
        onCreate={combatStateManager.createMonster}
        onDelete={combatStateManager.removeMonster}
        onUpdate={combatStateManager.updateMonster}
        onCreatePlayer={combatStateManager.createPlayer}
        onUpdatePlayer={combatStateManager.updatePlayer}
        onDeletePlayer={combatStateManager.removePlayer}
        onCreateBlock={async (data) => {
          const created = await combatStateManager.createBlock(data);
          await combatStateManager.addBlockToCampaign(campaignId, created.id);
          return created;
        }}
        onUpdateBlock={combatStateManager.updateBlock}
        onDeleteBlock={combatStateManager.deleteBlock}
        onCreateBlockType={combatStateManager.createBlockType}
        onDeleteBlockType={combatStateManager.deleteBlockType}
        onAddBlock={(block) => {
          handleAddFromLibrary(block.id);
        }}
        onSearchMonsters={combatStateManager.searchWithLibrary}
        isUsedAsTemplate={combatStateManager.isUsedAsTemplate}
        isPlayerUsedAsTemplate={combatStateManager.isPlayerUsedAsTemplate}
      />
      {editingNpc && (
        <LibraryEditModal
          monster={editingNpc}
          isCreating={false}
          templateType={editingNpc.type === "player" ? "player" : "monster"}
          onSave={async (updated) => {
            if (updated.type === "player") {
              await combatStateManager.updatePlayer(
                updated.id,
                updated as SavedPlayer,
              );
            } else {
              await combatStateManager.updateMonster(
                updated.id,
                updated as SavedMonster,
              );
            }
            setEditingNpc(null);
          }}
          onCancel={() => setEditingNpc(null)}
          onSearchMonsters={combatStateManager.searchWithLibrary}
        />
      )}
      <SettingsModal
        isOpen={showSettings}
        syncApi={combatStateManager.syncApi}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
