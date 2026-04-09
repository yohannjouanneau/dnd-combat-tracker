import { useCallback, useEffect, useState } from "react";
import type {
  BlockTypeDef,
  BuildingBlock,
  BuildingBlockInput,
  Campaign,
  CampaignInput,
  CanvasEdge,
  CanvasNode,
} from "../../types/campaign";
import { BUILT_IN_BLOCK_TYPES } from "../../constants";
import { dataStore } from "../../persistence/storage";

export function useCampaignStore() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [blocks, setBlocks] = useState<BuildingBlock[]>([]);
  const [blockTypes, setBlockTypes] =
    useState<BlockTypeDef[]>(BUILT_IN_BLOCK_TYPES);

  const loadCampaigns = useCallback(async () => {
    const list = await dataStore.listCampaign();
    setCampaigns(list);
  }, []);

  const loadBlockTypes = useCallback(async () => {
    const custom = await dataStore.listBlockTypes();
    setBlockTypes([...BUILT_IN_BLOCK_TYPES, ...custom]);
  }, []);

  const loadBlocks = useCallback(async () => {
    const list = await dataStore.listBlock();
    setBlocks(list);
  }, []);

  useEffect(() => {
    loadCampaigns();
    loadBlockTypes();
    loadBlocks();
  }, [loadCampaigns, loadBlockTypes, loadBlocks]);

  const createBlockType = useCallback(
    async (input: Omit<BlockTypeDef, "isBuiltIn">): Promise<BlockTypeDef> => {
      const created = await dataStore.createBlockType(input);
      setBlockTypes((prev) => [...prev, created]);
      return created;
    },
    [],
  );

  const updateBlockType = useCallback(
    async (id: string, patch: Partial<BlockTypeDef>): Promise<BlockTypeDef> => {
      const type = blockTypes.find((t) => t.id === id);
      if (type?.isBuiltIn) throw new Error("Cannot update built-in block type");
      const updated = await dataStore.updateBlockType(id, patch);
      setBlockTypes((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    },
    [blockTypes],
  );

  const deleteBlockType = useCallback(
    async (id: string): Promise<void> => {
      const type = blockTypes.find((t) => t.id === id);
      if (type?.isBuiltIn) return; // guard: cannot delete built-ins
      await dataStore.deleteBlockType(id);
      setBlockTypes((prev) => prev.filter((t) => t.id !== id));
    },
    [blockTypes],
  );

  const createCampaign = useCallback(
    async (input: CampaignInput): Promise<Campaign> => {
      const created = await dataStore.createCampaign(input);
      setCampaigns((prev) => [...prev, created]);
      return created;
    },
    [],
  );

  const updateCampaignMeta = useCallback(
    async (id: string, name: string, description: string): Promise<void> => {
      const updated = await dataStore.updateCampaign(id, { name, description });
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
    },
    [],
  );

  const deleteCampaign = useCallback(async (id: string): Promise<void> => {
    await dataStore.deleteCampaign(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const createBlock = useCallback(
    async (input: BuildingBlockInput): Promise<BuildingBlock> => {
      const created = await dataStore.createBlock(input);
      setBlocks((prev) => [...prev, created]);
      return created;
    },
    [],
  );

  const updateBlock = useCallback(
    async (
      id: string,
      patch: Partial<BuildingBlock>,
    ): Promise<BuildingBlock> => {
      const updated = await dataStore.updateBlock(id, patch);
      setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      return updated;
    },
    [],
  );

  const deleteBlock = useCallback(async (id: string): Promise<void> => {
    await dataStore.deleteBlock(id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const addBlockToCampaign = useCallback(
    async (campaignId: string, blockId: string): Promise<void> => {
      const campaign = await dataStore.getCampaign(campaignId);
      if (!campaign) return;
      if (campaign.nodes.some((n) => n.blockId === blockId)) return;
      const newNode: CanvasNode = { blockId, x: 0, y: 0 };
      const updated = await dataStore.updateCampaign(campaignId, {
        nodes: [...campaign.nodes, newNode],
      });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? updated : c)),
      );
    },
    [],
  );

  const removeBlockFromCampaign = useCallback(
    async (campaignId: string, blockId: string): Promise<void> => {
      const campaign = await dataStore.getCampaign(campaignId);
      if (!campaign) return;
      const updatedNodes = campaign.nodes.filter((n) => n.blockId !== blockId);

      const blockIdsInCampaign = updatedNodes.map((n) => n.blockId);
      for (const nodeBlockId of blockIdsInCampaign) {
        const block = blocks.find((b) => b.id === nodeBlockId);
        if (block && block.children.includes(blockId)) {
          await updateBlock(nodeBlockId, {
            children: block.children.filter((c) => c !== blockId),
          });
        }
      }

      const updated = await dataStore.updateCampaign(campaignId, {
        nodes: updatedNodes,
      });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? updated : c)),
      );
    },
    [blocks, updateBlock],
  );

  const _addChildToBlock = useCallback(
    async (parentId: string, childId: string): Promise<void> => {
      const parent = blocks.find((b) => b.id === parentId);
      if (!parent || parent.children.includes(childId)) return;
      await updateBlock(parentId, { children: [...parent.children, childId] });
    },
    [blocks, updateBlock],
  );

  const _removeChildFromBlock = useCallback(
    async (parentId: string, childId: string): Promise<void> => {
      const parent = blocks.find((b) => b.id === parentId);
      if (!parent) return;
      await updateBlock(parentId, {
        children: parent.children.filter((id) => id !== childId),
      });
    },
    [blocks, updateBlock],
  );

  const updateCanvasNodes = useCallback(
    async (campaignId: string, nodes: CanvasNode[]): Promise<void> => {
      const updated = await dataStore.updateCampaign(campaignId, { nodes });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? updated : c)),
      );
    },
    [],
  );

  const addCanvasEdge = useCallback(
    async (campaignId: string, edge: CanvasEdge): Promise<void> => {
      const campaign = await dataStore.getCampaign(campaignId);
      if (!campaign) return;
      const updated = await dataStore.updateCampaign(campaignId, {
        edges: [...campaign.edges, edge],
      });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? updated : c)),
      );
    },
    [],
  );

  const removeCanvasEdge = useCallback(
    async (campaignId: string, edgeId: string): Promise<void> => {
      const campaign = await dataStore.getCampaign(campaignId);
      if (!campaign) return;
      const updated = await dataStore.updateCampaign(campaignId, {
        edges: campaign.edges.filter((e) => e.id !== edgeId),
      });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? updated : c)),
      );
    },
    [],
  );

  const reorderCampaignBlocks = useCallback(
    async (campaignId: string, orderedBlockIds: string[]): Promise<void> => {
      const campaign = await dataStore.getCampaign(campaignId);
      if (!campaign) return;
      const nodeMap = new Map(campaign.nodes.map((n) => [n.blockId, n]));
      const reordered = orderedBlockIds
        .map((id) => nodeMap.get(id))
        .filter((n): n is CanvasNode => Boolean(n));
      const reorderedSet = new Set(orderedBlockIds);
      campaign.nodes
        .filter((n) => !reorderedSet.has(n.blockId))
        .forEach((n) => reordered.push(n));
      const updated = await dataStore.updateCampaign(campaignId, {
        nodes: reordered,
      });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? updated : c)),
      );
    },
    [],
  );

  const storeActions = {
    campaigns,
    blocks,
    blockTypes,
    loadCampaigns,
    loadBlocks,
    loadBlockTypes,
    createBlockType,
    updateBlockType,
    deleteBlockType,
    createCampaign,
    updateCampaignMeta,
    deleteCampaign,
    createBlock,
    updateBlock,
    deleteBlock,
    addBlockToCampaign,
    removeBlockFromCampaign,
    addChildToBlock: _addChildToBlock,
    removeChildFromBlock: _removeChildFromBlock,
    reorderCampaignBlocks,
    updateCanvasNodes,
    addCanvasEdge,
    removeCanvasEdge,
  };

  return storeActions;
}

export type CampaignStore = ReturnType<typeof useCampaignStore>;
