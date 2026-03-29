import { useCallback, useEffect, useState } from "react";
import type { BlockFeatureData, BlockTypeDef, BuildingBlock, BuildingBlockInput, Campaign, CampaignInput, CanvasNode } from "../../types/campaign";
import { BUILT_IN_BLOCK_TYPES } from "../../constants";
import { dataStore } from "../../persistence/storage";

export function useCampaignStore() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [blocks, setBlocks] = useState<BuildingBlock[]>([]);
  const [blockTypes, setBlockTypes] = useState<BlockTypeDef[]>(BUILT_IN_BLOCK_TYPES);

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

    type LegacyBlock = {
      id: string;
      typeId?: string;
      type?: string;
      specialFeature?: {
        type?: string;
        combatId?: string | null;
        linkedNpcIds?: string[];
        linkedNpcId?: string;
        items?: string[];
      };
    };

    // Migrate legacy blocks that still have old shape (type + specialFeature instead of typeId + featureData)
    const toMigrate = (list as LegacyBlock[]).filter((b) => b.typeId == null);
    for (const b of toMigrate) {
      const oldType: string = b.type ?? "environment";
      const typeId =
        oldType === "npc" ? "character" :
        oldType === "object" ? "loot" :
        oldType;

      const sf = b.specialFeature;
      let featureData: BlockFeatureData | undefined;
      if (sf) {
        if (sf.type === "combat") featureData = { combatId: sf.combatId };
        else if (sf.type === "character") featureData = { linkedNpcIds: sf.linkedNpcIds ?? [] };
        else if (sf.type === "loot") featureData = { items: sf.items ?? [] };
        else if (sf.type === "scene") featureData = { linkedNpcIds: sf.linkedNpcIds ?? [], combatId: sf.combatId, items: sf.items ?? [] };
        else if (sf.linkedNpcId) featureData = { linkedNpcIds: [sf.linkedNpcId] };
      }

      await dataStore.updateBlock(b.id, { typeId, featureData } as Partial<BuildingBlock>);
    }

    const final = toMigrate.length > 0 ? await dataStore.listBlock() : list;
    setBlocks(final);
  }, []);

  useEffect(() => {
    loadCampaigns();
    loadBlockTypes();
    loadBlocks();
  }, [loadCampaigns, loadBlockTypes, loadBlocks]);

  const createBlockType = useCallback(async (input: Omit<BlockTypeDef, "isBuiltIn">): Promise<BlockTypeDef> => {
    const created = await dataStore.createBlockType(input);
    setBlockTypes((prev) => [...prev, created]);
    return created;
  }, []);

  const deleteBlockType = useCallback(async (id: string): Promise<void> => {
    const type = blockTypes.find((t) => t.id === id);
    if (type?.isBuiltIn) return; // guard: cannot delete built-ins
    await dataStore.deleteBlockType(id);
    setBlockTypes((prev) => prev.filter((t) => t.id !== id));
  }, [blockTypes]);

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
    const reorderedSet = new Set(orderedBlockIds);
    campaign.nodes.filter((n) => !reorderedSet.has(n.blockId)).forEach((n) => reordered.push(n));
    const updated = await dataStore.updateCampaign(campaignId, { nodes: reordered });
    setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? updated : c)));
  }, []);

  const storeActions = {
    campaigns,
    blocks,
    blockTypes,
    loadCampaigns,
    loadBlocks,
    loadBlockTypes,
    createBlockType,
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
    reorderCampaignBlocks,
  };

  return storeActions;
}

export type CampaignStore = ReturnType<typeof useCampaignStore>;
