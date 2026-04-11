import { useCallback, useState } from "react";
import type { DragCallbacks } from "../components/Campaign/BlockTreeNode";
import type { CombatStateManager } from "../store/types";
import type { BuildingBlock } from "../types/campaign";

interface UseBlockReorderParams {
  campaignId: string;
  campaignBlocks: BuildingBlock[];
  parentMap: Map<string, string | null>;
  rootBlocks: BuildingBlock[];
  combatStateManager: Pick<
    CombatStateManager,
    "updateBlock" | "reorderCampaignBlocks"
  >;
}

interface UseBlockReorderResult {
  reorderMode: boolean;
  toggleReorderMode: () => void;
  selectedBlockIds: Set<string>;
  dragCallbacks: DragCallbacks;
  handleBlockSelect: (blockId: string) => void;
}

export function useBlockReorder({
  campaignId,
  campaignBlocks,
  parentMap,
  rootBlocks,
  combatStateManager,
}: UseBlockReorderParams): UseBlockReorderResult {
  const [reorderMode, setReorderMode] = useState(false);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(
    new Set(),
  );
  const [dragState, setDragState] = useState<{
    blockId: string;
    sourceParentId: string | null;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    targetId: string;
    position: "before" | "after" | "child";
  } | null>(null);

  const toggleReorderMode = useCallback(() => {
    setReorderMode((v) => !v);
    setDragState(null);
    setDropTarget(null);
    setSelectedBlockIds(new Set());
  }, []);

  const handleBlockSelect = useCallback(
    (blockId: string) => {
      const parentId = parentMap.get(blockId) ?? null;
      setSelectedBlockIds((prev) => {
        if (prev.size === 0) {
          return new Set([blockId]);
        }
        const existingId = prev.values().next().value as string;
        const existingParentId = parentMap.get(existingId) ?? null;
        if (existingParentId !== parentId) {
          // Different level — clear and start fresh
          return new Set([blockId]);
        }
        // Same level — toggle
        const next = new Set(prev);
        if (next.has(blockId)) {
          next.delete(blockId);
        } else {
          next.add(blockId);
        }
        return next;
      });
    },
    [parentMap],
  );

  const handleGlobalDrop = useCallback(async () => {
    if (!dragState || !dropTarget) return;
    const { blockId, sourceParentId } = dragState;
    const { targetId, position } = dropTarget;
    if (blockId === targetId) return;

    // Determine which blocks to move (group if dragged block is part of selection)
    const blocksToMove =
      selectedBlockIds.has(blockId) && selectedBlockIds.size > 1
        ? Array.from(selectedBlockIds)
        : [blockId];
    const blocksToMoveSet = new Set(blocksToMove);

    // Bail if the drop target is one of the blocks being moved
    if (blocksToMoveSet.has(targetId)) {
      setDragState(null);
      setDropTarget(null);
      return;
    }

    if (blocksToMove.length === 1) {
      // Single block — original logic
      if (sourceParentId) {
        const src = campaignBlocks.find((b) => b.id === sourceParentId);
        if (src) {
          await combatStateManager.updateBlock(sourceParentId, {
            children: src.children.filter((id) => id !== blockId),
          });
        }
      }

      if (position === "child") {
        const target = campaignBlocks.find((b) => b.id === targetId);
        if (target && !target.children.includes(blockId)) {
          await combatStateManager.updateBlock(targetId, {
            children: [...target.children, blockId],
          });
        }
      } else {
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
          const rootIds = rootBlocks
            .map((b) => b.id)
            .filter((id) => id !== blockId);
          const idx = rootIds.indexOf(targetId);
          rootIds.splice(position === "before" ? idx : idx + 1, 0, blockId);
          await combatStateManager.reorderCampaignBlocks(campaignId, rootIds);
        }
      }
    } else {
      // Multi-block move — all selected blocks share the same source parent
      // Compute sibling order from source for stable relative ordering
      const siblingOrder = sourceParentId
        ? (campaignBlocks.find((b) => b.id === sourceParentId)?.children ?? [])
        : rootBlocks.map((b) => b.id);
      const sorted = [...blocksToMove].sort(
        (a, b) => siblingOrder.indexOf(a) - siblingOrder.indexOf(b),
      );

      if (position === "child") {
        // Remove from source parent
        if (sourceParentId) {
          const src = campaignBlocks.find((b) => b.id === sourceParentId);
          if (src) {
            await combatStateManager.updateBlock(sourceParentId, {
              children: src.children.filter((id) => !blocksToMoveSet.has(id)),
            });
          }
        }
        // Add all as last children of target
        const target = campaignBlocks.find((b) => b.id === targetId);
        if (target) {
          const newChildren = [
            ...target.children.filter((id) => !blocksToMoveSet.has(id)),
            ...sorted,
          ];
          await combatStateManager.updateBlock(targetId, {
            children: newChildren,
          });
        }
      } else {
        // before | after
        const targetParentId = parentMap.get(targetId) ?? null;
        if (targetParentId) {
          // Remove from source parent if different
          if (sourceParentId && sourceParentId !== targetParentId) {
            const src = campaignBlocks.find((b) => b.id === sourceParentId);
            if (src) {
              await combatStateManager.updateBlock(sourceParentId, {
                children: src.children.filter((id) => !blocksToMoveSet.has(id)),
              });
            }
          }
          const parent = campaignBlocks.find((b) => b.id === targetParentId);
          if (parent) {
            const children = parent.children.filter(
              (id) => !blocksToMoveSet.has(id),
            );
            const idx = children.indexOf(targetId);
            children.splice(
              position === "before" ? idx : idx + 1,
              0,
              ...sorted,
            );
            await combatStateManager.updateBlock(targetParentId, { children });
          }
        } else {
          const rootIds = rootBlocks.map((b) => b.id);
          const newRootIds = rootIds.filter((id) => !blocksToMoveSet.has(id));
          const idx = newRootIds.indexOf(targetId);
          newRootIds.splice(
            position === "before" ? idx : idx + 1,
            0,
            ...sorted,
          );
          await combatStateManager.reorderCampaignBlocks(
            campaignId,
            newRootIds,
          );
        }
      }
    }

    setDragState(null);
    setDropTarget(null);
    setSelectedBlockIds(new Set());
  }, [
    dragState,
    dropTarget,
    selectedBlockIds,
    campaignBlocks,
    parentMap,
    rootBlocks,
    combatStateManager,
    campaignId,
  ]);

  const dragCallbacks: DragCallbacks = {
    onDragStart: (blockId) =>
      setDragState({
        blockId,
        sourceParentId: parentMap.get(blockId) ?? null,
      }),
    onDragOver: (targetId, position) => setDropTarget({ targetId, position }),
    onDrop: handleGlobalDrop,
    onDragEnd: () => {
      setDragState(null);
      setDropTarget(null);
      setSelectedBlockIds(new Set());
    },
    draggedId: dragState?.blockId ?? null,
    dropTarget,
  };

  return {
    reorderMode,
    toggleReorderMode,
    selectedBlockIds,
    dragCallbacks,
    handleBlockSelect,
  };
}
