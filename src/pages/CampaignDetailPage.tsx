import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus, Library, Check, X } from "lucide-react";
import type { CombatStateManager } from "../store/types";
import type { SavedCombat } from "../types";
import type { BuildingBlock, BuildingBlockInput, Campaign } from "../types/campaign";
import { generateId, generateDefaultNewCombatant } from "../utils/utils";
import { useToast } from "../components/common/Toast/useToast";
import { useConfirmationDialog } from "../hooks/useConfirmationDialog";
import BlockEditModal from "../components/Campaign/BlockEditModal";
import BlockTreeNode from "../components/Campaign/BlockTreeNode";
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
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");

  useEffect(() => {
    combatStateManager.listCombat().then(setSavedCombats);
  }, [combatStateManager]);

  const campaign: Campaign | undefined = combatStateManager.campaigns.find(
    (c) => c.id === campaignId
  );

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
  const rootBlocks = useMemo(() => {
    const childIds = new Set(
      campaignBlocks.flatMap((b) => b.children.filter((id) => blockIdsInCampaign.has(id)))
    );
    return campaignBlocks.filter((b) => !childIds.has(b.id));
  }, [campaignBlocks, blockIdsInCampaign]);

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
        name: campaignBlocks.find((b) => b.id === blockId)?.name ?? "New Combat",
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
      await combatStateManager.updateBlock(blockId, {
        specialFeature: { type: "combat", combatId: newCombat.id },
      });
      onOpenCombat(newCombat.id);
    },
    [campaignBlocks, combatStateManager, onOpenCombat]
  );

  if (!campaign) {
    return (
      <div className="p-6 text-text-secondary">
        {t("common:loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto text-white min-h-screen flex flex-col bg-app-bg">
      {/* Top bar */}
      <div className="flex items-center gap-3 p-4 border-b border-border-primary flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("campaigns:detail.backToCampaigns")}
        </button>

        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    saveCampaignMeta(nameInput, campaign.description);
                    setEditingName(false);
                  }
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="bg-input-bg text-text-primary rounded px-2 py-1 border border-border-secondary focus:border-blue-500 focus:outline-none text-lg font-semibold"
              />
              <button onClick={() => { saveCampaignMeta(nameInput, campaign.description); setEditingName(false); }} className="text-green-400 hover:text-green-300">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingName(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setNameInput(campaign.name); setEditingName(true); }}
              className="text-lg font-semibold text-text-primary hover:text-blue-400 transition text-left truncate max-w-full block"
              title="Click to edit"
            >
              {campaign.name}
            </button>
          )}

          {editingDesc ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                autoFocus
                type="text"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    saveCampaignMeta(campaign.name, descInput);
                    setEditingDesc(false);
                  }
                  if (e.key === "Escape") setEditingDesc(false);
                }}
                className="flex-1 bg-input-bg text-text-primary rounded px-2 py-1 border border-border-secondary focus:border-blue-500 focus:outline-none text-sm"
              />
              <button onClick={() => { saveCampaignMeta(campaign.name, descInput); setEditingDesc(false); }} className="text-green-400 hover:text-green-300">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingDesc(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setDescInput(campaign.description); setEditingDesc(true); }}
              className="text-sm text-text-muted hover:text-text-secondary transition text-left block"
              title="Click to edit"
            >
              {campaign.description || <span className="italic opacity-50">Add a description…</span>}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setModalState({ kind: "library" })}
            className="flex items-center gap-1 bg-panel-secondary hover:bg-panel-secondary/80 px-3 py-2 rounded text-sm transition"
            title={t("campaigns:detail.addFromLibrary")}
          >
            <Library className="w-4 h-4" />
            <span className="hidden sm:inline">{t("campaigns:detail.addFromLibrary")}</span>
          </button>
          <button
            onClick={() => setModalState({ kind: "create" })}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("campaigns:detail.addBlock")}</span>
          </button>
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
                savedPlayers={combatStateManager.savedPlayers}
                savedMonsters={combatStateManager.monsters}
                depth={0}
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

      {/* Block Edit / Create Modal */}
      {(modalState.kind === "create" ||
        modalState.kind === "create-child" ||
        modalState.kind === "edit") && (
        <BlockEditModal
          block={modalState.kind === "edit" ? modalState.block : undefined}
          allBlocks={combatStateManager.blocks}
          savedCombats={savedCombats}
          savedPlayers={combatStateManager.savedPlayers}
          savedMonsters={combatStateManager.monsters}
          isCreating={modalState.kind !== "edit"}
          onSave={handleSaveBlock}
          onCancel={() => setModalState({ kind: "closed" })}
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
        onAddBlock={(block) => {
          handleAddFromLibrary(block.id);
          setModalState({ kind: "closed" });
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
