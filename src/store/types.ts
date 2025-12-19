import type { SyncApi } from "../api/sync/types";
import type { CombatState, SavedCombat, SavedPlayer, NewCombatant, InitiativeGroup, DeathSaves, SavedCombatInput, SavedMonster, MonsterCombatant, SearchResult, SearchSource, GroupSummary } from "../types";

export type CombatStateManager = {
    // State
    state: CombatState;
  
    // Sync
    syncApi: SyncApi;

    // Player Management
    savePlayerFromForm: (isFightModeEnabled: boolean) => Promise<void>;
    removePlayer: (id: string) => Promise<void>;
    includePlayer: (player: SavedPlayer) => void;
    savedPlayers: SavedPlayer[];
    loadPlayers: () => Promise<void>;

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
    addCombatant: (combatant?: NewCombatant) => void;
    removeCombatant: (id: number) => void;
    removeGroup: (name: string) => void;
    updateHP: (id: number, change: number) => void;
    updateInitiative: (id: number, newInitiative: number) => void;
    toggleCondition: (id: number, condition: string) => void;
    toggleConcentration: (id: number) => void;
    updateDeathSave: (id: number, type: keyof DeathSaves, value: number) => void;
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
  };
  