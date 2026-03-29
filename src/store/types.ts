import type { SyncApi } from "../api/sync/types";
import type { CombatState, SavedCombat, SavedPlayer, NewCombatant, InitiativeGroup, DeathSaves, SavedCombatInput, SavedMonster, MonsterCombatant, PlayerCombatant, SearchResult, SearchSource, GroupSummary, TemplateOrigin } from "../types";
import type { BuildingBlock, BuildingBlockInput, Campaign, CampaignInput } from "../types/campaign";

export type CombatStateManager = {
    // State
    state: CombatState;
  
    // Sync
    syncApi: SyncApi;

    // Player Management
    removePlayer: (id: string) => Promise<void>;
    savedPlayers: SavedPlayer[];
    linkedPlayers: SavedPlayer[];
    linkPlayer: (id: string) => void;
    unlinkPlayer: (id: string) => void;
    loadPlayers: () => Promise<void>;
    updatePlayerInitiative: (id: string, initiative: number) => Promise<void>;
    createPlayer: (player: PlayerCombatant) => Promise<void>;
    updatePlayer: (id: string, player: SavedPlayer) => Promise<void>;
    isPlayerUsedAsTemplate: (id: string) => Promise<boolean>;

    // Parked Groups
    addParkedGroupFromForm: (isFightModeEnabled: boolean) => void;
    removeParkedGroup: (name: string) => void;
    includeParkedGroup: (combatant: NewCombatant) => void;
  
    // Saved Combats
    loadCombat: (combatId: string) => Promise<void>;
    saveCombat: () => Promise<void>;
    updateCombat: (name: string, description: string) => void;
    listCombat: () => Promise<SavedCombat[]>;
    createCombat: (input: SavedCombatInput) => Promise<SavedCombat>;
    deleteCombat: (id: string) => Promise<void>;
    
    // New Combatant Form and Initiative Groups
    updateNewCombatant: (patch: Partial<NewCombatant>) => void;
    addInitiativeGroup: () => void;
    removeInitiativeGroup: (id: string) => void;
    updateInitiativeGroup: (id: string, patch: Partial<InitiativeGroup>) => void;
    getTotalCombatantCount: () => number;
  
    // Combatants and Turn Management
    addCombatant: (combatant?: NewCombatant, templateOrigin?: TemplateOrigin) => void;
    removeCombatant: (id: number) => void;
    removeGroup: (name: string) => void;
    updateHP: (id: number, change: number) => void;
    updateInitiative: (id: number, newInitiative: number) => void;
    toggleCondition: (id: number, condition: string) => void;
    updateDeathSave: (id: number, type: keyof DeathSaves, value: number) => void;
    updateCombatantNotes: (id: number, notes: string) => void;
    nextTurn: () => void;
    prevTurn: () => void;
    getUniqueGroups: () => GroupSummary[];
  
    // Monster Library
    monsters: SavedMonster[];
    loadMonsters: () => Promise<void>;
    createMonster: (monster: MonsterCombatant) => Promise<void>;
    removeMonster: (id: string) => Promise<void>;
    updateMonster: (id: string, monster: SavedMonster) => Promise<void>;
    loadMonsterToForm: (searchTerm: SearchResult) => void;
    searchWithLibrary: (
      query: string,
      source?: SearchSource
    ) => Promise<SearchResult[]>;
    addCombatantToLibrary: () => Promise<void>;
    isUsedAsTemplate: (id: string) => Promise<boolean>;
  
    // Utility
    resetState: () => void;

    // Dirty state management
    hasChanges: boolean;

    // Campaign Manager
    campaigns: Campaign[];
    blocks: BuildingBlock[];
    loadCampaigns: () => Promise<void>;
    loadBlocks: () => Promise<void>;
    createCampaign: (input: CampaignInput) => Promise<Campaign>;
    updateCampaignMeta: (id: string, name: string, description: string) => Promise<void>;
    deleteCampaign: (id: string) => Promise<void>;
    createBlock: (input: BuildingBlockInput) => Promise<BuildingBlock>;
    updateBlock: (id: string, patch: Partial<BuildingBlock>) => Promise<BuildingBlock>;
    deleteBlock: (id: string) => Promise<void>;
    addBlockToCampaign: (campaignId: string, blockId: string) => Promise<void>;
    removeBlockFromCampaign: (campaignId: string, blockId: string) => Promise<void>;
    addChildToBlock: (parentId: string, childId: string) => Promise<void>;
    reorderCampaignBlocks: (campaignId: string, orderedBlockIds: string[]) => Promise<void>;
  };
  