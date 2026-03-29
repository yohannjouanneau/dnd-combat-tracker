import { useCallback, useEffect, useState } from "react";
import type { BuildingBlock, BuildingBlockInput, Campaign, CampaignInput, CanvasNode } from "../../types/campaign";
import { dataStore } from "../../persistence/storage";

export function useCampaignStore() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [blocks, setBlocks] = useState<BuildingBlock[]>([]);

  const loadCampaigns = useCallback(async () => {
    const list = await dataStore.listCampaign();
    setCampaigns(list);
  }, []);

  const loadBlocks = useCallback(async () => {
    const list = await dataStore.listBlock();
    setBlocks(list);
  }, []);

  useEffect(() => {
    loadCampaigns();
    loadBlocks();
  }, [loadCampaigns, loadBlocks]);

  const createCampaign = useCallback(async (input: CampaignInput): Promise<Campaign> => {
    const created = await dataStore.createCampaign(input);
    setCampaigns((prev) => [...prev, created]);
    return created;
  }, []);

  const updateCampaignMeta = useCallback(async (id: string, name: string, description: string): Promise<void> => {
    const updated = await dataStore.updateCampaign(id, { name, description });
    setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const deleteCampaign = useCallback(async (id: string): Promise<void> => {
    await dataStore.deleteCampaign(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const createBlock = useCallback(async (input: BuildingBlockInput): Promise<BuildingBlock> => {
    const created = await dataStore.createBlock(input);
    setBlocks((prev) => [...prev, created]);
    return created;
  }, []);

  const updateBlock = useCallback(async (id: string, patch: Partial<BuildingBlock>): Promise<BuildingBlock> => {
    const updated = await dataStore.updateBlock(id, patch);
    setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  }, []);

  const deleteBlock = useCallback(async (id: string): Promise<void> => {
    await dataStore.deleteBlock(id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const addBlockToCampaign = useCallback(async (campaignId: string, blockId: string): Promise<void> => {
    const campaign = await dataStore.getCampaign(campaignId);
    if (!campaign) return;
    if (campaign.nodes.some((n) => n.blockId === blockId)) return;
    const newNode: CanvasNode = { blockId, x: 0, y: 0 };
    const updated = await dataStore.updateCampaign(campaignId, {
      nodes: [...campaign.nodes, newNode],
    });
    setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? updated : c)));
  }, []);

  const removeBlockFromCampaign = useCallback(async (campaignId: string, blockId: string): Promise<void> => {
    const campaign = await dataStore.getCampaign(campaignId);
    if (!campaign) return;
    const updatedNodes = campaign.nodes.filter((n) => n.blockId !== blockId);

    // Also remove blockId from parent's children in each block of this campaign
    const blockIdsInCampaign = updatedNodes.map((n) => n.blockId);
    for (const nodeBlockId of blockIdsInCampaign) {
      const block = blocks.find((b) => b.id === nodeBlockId);
      if (block && block.children.includes(blockId)) {
        await updateBlock(nodeBlockId, {
          children: block.children.filter((c) => c !== blockId),
        });
      }
    }

    const updated = await dataStore.updateCampaign(campaignId, { nodes: updatedNodes });
    setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? updated : c)));
  }, [blocks, updateBlock]);

  // Expose a stable helper to add a child link between blocks
  // (used by CampaignDetailPage when creating a child block)
  const _addChildToBlock = useCallback(async (parentId: string, childId: string): Promise<void> => {
    const parent = blocks.find((b) => b.id === parentId);
    if (!parent || parent.children.includes(childId)) return;
    await updateBlock(parentId, { children: [...parent.children, childId] });
  }, [blocks, updateBlock]);

  const reorderCampaignBlocks = useCallback(async (campaignId: string, orderedBlockIds: string[]): Promise<void> => {
    const campaign = await dataStore.getCampaign(campaignId);
    if (!campaign) return;
    const nodeMap = new Map(campaign.nodes.map((n) => [n.blockId, n]));
    const reordered = orderedBlockIds.map((id) => nodeMap.get(id)).filter((n): n is CanvasNode => Boolean(n));
    // Append any nodes not in orderedBlockIds at the end (safety)
    const reorderedSet = new Set(orderedBlockIds);
    campaign.nodes.filter((n) => !reorderedSet.has(n.blockId)).forEach((n) => reordered.push(n));
    const updated = await dataStore.updateCampaign(campaignId, { nodes: reordered });
    setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? updated : c)));
  }, []);

  // Attach helper to the returned object so CampaignDetailPage can call it
  const storeActions = {
    campaigns,
    blocks,
    loadCampaigns,
    loadBlocks,
    createCampaign,
    updateCampaignMeta,
    deleteCampaign,
    createBlock,
    updateBlock,
    deleteBlock,
    addBlockToCampaign,
    removeBlockFromCampaign,
    addChildToBlock: _addChildToBlock,
    reorderCampaignBlocks,
  };

  return storeActions;
}

// Re-export type with addChildToBlock included
export type CampaignStore = ReturnType<typeof useCampaignStore>;
