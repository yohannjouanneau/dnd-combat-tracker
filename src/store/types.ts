import type { SyncApi } from "../api/sync/types";
import type { CombatState, SavedCombat, SavedPlayer, NewCombatant, InitiativeGroup, DeathSaves, SavedCombatInput, SavedMonster, MonsterCombatant, SearchResult, SearchSource, GroupSummary } from "../types";

export type CombatStateManager = {
    // State
    state: CombatState;
  
    // Sync
    syncApi: SyncApi;

    // Player Management
    addPlayerFromForm: (isFightModeEnabled: boolean) => Promise<void>;
    removePlayer: (id: string) => Promise<void>;
    includePlayer: (player: SavedPlayer) => void;
    savedPlayers: SavedPlayer[];
    loadPlayers: () => Promise<void>;

    addParkedGroup: (isFightModeEnabled: boolean) => void;
    removeParkedGroup: (name: string) => void;
    includeParkedGroup: (combatant: NewCombatant) => void;
  
    // Saved Combats
    loadCombat: (combatId: string) => Promise<void>;
    saveCombat: (patch: Partial<SavedCombat>) => Promise<void>;
    updateCombat: (name: string, description: string) => void;
  
    // Parked Groups
    
  
    // New Combatant Form
    updateNewCombatant: (patch: Partial<NewCombatant>) => void;
  
    // Initiative Groups
    addInitiativeGroup: () => void;
    removeInitiativeGroup: (id: string) => void;
    updateInitiativeGroup: (id: string, patch: Partial<InitiativeGroup>) => void;
  
    // Combatants
    addCombatant: (combatant?: NewCombatant) => void;
    removeCombatant: (id: number) => void;
    removeGroup: (name: string) => void;
    updateHP: (id: number, change: number) => void;
    updateInitiative: (id: number, newInitiative: number) => void;
    toggleCondition: (id: number, condition: string) => void;
    toggleConcentration: (id: number) => void;
    updateDeathSave: (id: number, type: keyof DeathSaves, value: number) => void;
  
    // Combat List
    listCombat: () => Promise<SavedCombat[]>;
    createCombat: (input: SavedCombatInput) => Promise<SavedCombat>;
    deleteCombat: (id: string) => Promise<void>;
  
    // Turn Management
    nextTurn: () => void;
    prevTurn: () => void;
  
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
  
    // Utility
    getUniqueGroups: () => GroupSummary[];
    getTotalCombatantCount: () => number;
    loadState: (newState: CombatState) => void;
    resetState: () => void;
  
    // Dirty state management
    hasChanges: boolean;
  };
  