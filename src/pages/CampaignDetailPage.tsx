import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpDown, Check, Plus, Library } from "lucide-react";
import TopBar from "../components/TopBar";
import type { CombatStateManager } from "../store/types";
import type { SavedCombat } from "../types";
import type { BuildingBlock, BuildingBlockInput, Campaign } from "../types/campaign";
import { generateId, generateDefaultNewCombatant } from "../utils/utils";
import { useToast } from "../components/common/Toast/useToast";
import { useConfirmationDialog } from "../hooks/useConfirmationDialog";
import BlockEditModal from "../components/Campaign/BlockEditModal";
import BlockDetailModal from "../components/Campaign/BlockDetailModal";
import BlockTreeNode, { type DragCallbacks } from "../components/Campaign/BlockTreeNode";
import LibraryEditModal from "../components/Library/LibraryEditModal";
import LibraryModal from "../components/Library/LibraryModal";
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

  const [modalState, setModalState] = useState<ModalState>({ kind: "closed" });
  const [savedCombats, setSavedCombats] = useState<SavedCombat[]>([]);
  const [editingNpc, setEditingNpc] = useState<SavedPlayer | SavedMonster | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [dragState, setDragState] = useState<{ blockId: string; sourceParentId: string | null } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ targetId: string; position: "before" | "after" | "child" } | null>(null);

  const campaign: Campaign | undefined = combatStateManager.campaigns.find(
    (c) => c.id === campaignId
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

  // Block IDs in this campaign
  const blockIdsInCampaign = useMemo(
    () => new Set(campaign?.nodes.map((n) => n.blockId) ?? []),
    [campaign]
  );

  // Full block objects for campaign nodes
  const campaignBlocks = useMemo(
    () => combatStateManager.blocks.filter((b) => blockIdsInCampaign.has(b.id)),
    [combatStateManager.blocks, blockIdsInCampaign]
  );

  // Root blocks: in campaign but not listed as a child of another campaign block
  // Ordered according to campaign.nodes array
  const rootBlocks = useMemo(() => {
    const childIds = new Set(
      campaignBlocks.flatMap((b) => b.children.filter((id) => blockIdsInCampaign.has(id)))
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

  // Library blocks not yet in the campaign
  const libraryBlocksNotInCampaign = useMemo(
    () => combatStateManager.blocks.filter((b) => !blockIdsInCampaign.has(b.id)),
    [combatStateManager.blocks, blockIdsInCampaign]
  );

  const saveCampaignMeta = useCallback(
    async (name: string, description: string) => {
      if (!campaign) return;
      await combatStateManager.updateCampaignMeta(campaign.id, name, description);
    },
    [campaign, combatStateManager]
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
        await combatStateManager.addChildToBlock(modalState.parentId, created.id);
        toast.success(t("campaigns:toast.blockSaved"));
      } else if (modalState.kind === "edit") {
        await combatStateManager.updateBlock(data.id, data);
        toast.success(t("campaigns:toast.blockSaved"));
      }
      setModalState({ kind: "closed" });
    },
    [modalState, campaignId, combatStateManager, t, toast]
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
    [campaignId, combatStateManager, confirmDialog, t, toast]
  );

  const handleAddFromLibrary = useCallback(
    async (blockId: string) => {
      await combatStateManager.addBlockToCampaign(campaignId, blockId);
      toast.success(t("campaigns:toast.blockSaved"));
    },
    [campaignId, combatStateManager, t, toast]
  );

  const handleOpenNpc = useCallback(
    (npcId: string) => {
      const entity =
        combatStateManager.savedPlayers.find((p) => p.id === npcId) ??
        combatStateManager.monsters.find((m) => m.id === npcId);
      if (entity) setEditingNpc(entity);
    },
    [combatStateManager.savedPlayers, combatStateManager.monsters]
  );

  const handleCreateCombatForBlock = useCallback(
    async (blockId: string) => {
      const newCombat = await combatStateManager.createCombat({
        id: generateId(),
        name: campaignBlocks.find((b) => b.id === blockId)?.name ?? t("campaigns:block.combatFeature.newCombat"),
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
        featureData: { ...(currentBlock?.featureData ?? {}), combatId: newCombat.id },
      });
      onOpenCombat(newCombat.id);
    },
    [campaignBlocks, combatStateManager, onOpenCombat]
  );

  const handleMetaChange = useCallback(
    (patch: { name?: string; description?: string }) => {
      if (patch.name !== undefined) setLocalName(patch.name);
      if (patch.description !== undefined) setLocalDesc(patch.description);
      setMetaHasChanges(true);
    },
    []
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
        const rootIds = rootBlocks.map((b) => b.id).filter((id) => id !== blockId);
        const idx = rootIds.indexOf(targetId);
        rootIds.splice(position === "before" ? idx : idx + 1, 0, blockId);
        await combatStateManager.reorderCampaignBlocks(campaignId, rootIds);
      }
    }

    setDragState(null);
    setDropTarget(null);
  }, [dragState, dropTarget, campaignBlocks, parentMap, rootBlocks, combatStateManager, campaignId]);

  if (!campaign) {
    return (
      <div className="p-6 text-text-secondary">
        {t("common:loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto text-white min-h-screen flex flex-col bg-app-bg">
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
        />
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => { setReorderMode((v) => !v); setDragState(null); setDropTarget(null); }}
            className={`flex items-center gap-1 px-3 py-2 rounded text-sm transition ${
              reorderMode
                ? "bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary ring-1 ring-border-secondary"
                : "bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary"
            }`}
          >
            {reorderMode ? <Check className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {reorderMode ? t("common:actions.confirm") : t("campaigns:detail.reorder")}
            </span>
          </button>
          {!reorderMode && (
            <>
              <button
                onClick={() => setModalState({ kind: "library" })}
                className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded text-sm transition"
                title={t("campaigns:detail.addFromLibrary")}
              >
                <Library className="w-4 h-4" />
                <span className="hidden sm:inline">{t("campaigns:detail.addFromLibrary")}</span>
              </button>
              <button
                onClick={() => setModalState({ kind: "create" })}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t("campaigns:detail.addBlock")}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-4">
        {rootBlocks.length === 0 ? (
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
                dragCallbacks={reorderMode ? ({
                  onDragStart: (blockId) => setDragState({ blockId, sourceParentId: parentMap.get(blockId) ?? null }),
                  onDragOver: (targetId, position) => setDropTarget({ targetId, position }),
                  onDrop: handleGlobalDrop,
                  onDragEnd: () => { setDragState(null); setDropTarget(null); },
                  draggedId: dragState?.blockId ?? null,
                  dropTarget,
                } satisfies DragCallbacks) : undefined}
                onView={(b) => setModalState({ kind: "view", block: b })}
                onEdit={(b) => setModalState({ kind: "edit", block: b })}
                onAddChild={(parentId) => setModalState({ kind: "create-child", parentId })}
                onRemove={handleRemoveBlock}
                onOpenCombat={onOpenCombat}
                onCreateCombat={handleCreateCombatForBlock}
                onOpenNpc={handleOpenNpc}
              />
            ))}
          </div>
        )}
      </div>

      {/* Block Detail Modal */}
      {modalState.kind === "view" && (
        <BlockDetailModal
          block={modalState.block}
          allBlocks={campaignBlocks}
          blockTypes={combatStateManager.blockTypes}
          savedPlayers={combatStateManager.savedPlayers}
          savedMonsters={combatStateManager.monsters}
          onClose={() => setModalState({ kind: "closed" })}
          onEdit={(b) => setModalState({ kind: "edit", block: b })}
          onOpenCombat={(id) => { setModalState({ kind: "closed" }); onOpenCombat(id); }}
          onOpenBlock={(blockId) => {
            const b = campaignBlocks.find((x) => x.id === blockId);
            if (b) setModalState({ kind: "view", block: b });
          }}
          onUpdateBlock={combatStateManager.updateBlock}
        />
      )}

      {/* Block Edit / Create Modal */}
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
          onOpenCombat={(combatId) => { setModalState({ kind: "closed" }); onOpenCombat(combatId); }}
        />
      )}

      {/* Library picker */}
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
      {/* NPC / Player edit modal */}
      {editingNpc && (
        <LibraryEditModal
          monster={editingNpc}
          isCreating={false}
          templateType={editingNpc.type === "player" ? "player" : "monster"}
          onSave={async (updated) => {
            if (updated.type === "player") {
              await combatStateManager.updatePlayer(updated.id, updated as SavedPlayer);
            } else {
              await combatStateManager.updateMonster(updated.id, updated as SavedMonster);
            }
            setEditingNpc(null);
          }}
          onCancel={() => setEditingNpc(null)}
          onSearchMonsters={combatStateManager.searchWithLibrary}
        />
      )}
    </div>
  );
}
