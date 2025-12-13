import { useState, useCallback } from "react";
import type { CombatState } from "../types";
import { generateDefaultNewCombatant } from "../utils";
import type { CombatStateManager } from "./types";
import { usePlayerStore } from "./hooks/usePlayerStore";
import { useSyncApi } from "../api/sync/hooks/useSyncApi";
import { useParkedGroupStore } from "./hooks/useParkedGroupStore";
import { useCombatStore } from "./hooks/useCombatStore";
import { useCombatantFormStore } from "./hooks/useCombatantFormStore";
import { useCombatantStore } from "./hooks/useCombatantStore";
import { useMonsterStore } from "./hooks/useMonsterStore";

const getInitialState = (): CombatState => ({
  combatants: [],
  currentTurn: 0,
  round: 1,
  parkedGroups: [],
  newCombatant: generateDefaultNewCombatant(),
});

export function useCombatState(): CombatStateManager {
  const [state, setState] = useState<CombatState>(getInitialState());

  // Helper to update state from child hooks
  const updateState = useCallback((patch: Partial<CombatState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  // Initialize player state hook early (needs to be before it's used in synchronise)
  const playerStore = usePlayerStore({
    combatState: state,
    updateState,
  });

  // Initialize parked group store
  const parkedGroupStore = useParkedGroupStore({
    combatState: state,
    updateState,
  });

  // Initialize combat store
  const combatStore = useCombatStore({
    state,
    setState,
  });

  // Initialize combatant form store
  const combatantFormStore = useCombatantFormStore({
    setState,
    combatState: state,
  });

  // Initialize combatant store (needs combatantFormStore)
  const combatantStore = useCombatantStore({
    state,
    setState,
    combatantFormStore,
  });

  // Initialize monster store (needs combatantFormStore)
  const monsterStore = useMonsterStore({
    state,
    setState,
    combatantFormStore,
  });

  // Initialize sync API hook with reload callback (needs playerStore and monsterStore)
  const syncApi = useSyncApi({
    onSyncSuccess: async () => {
      // Reload data after sync to reflect any downloaded changes
      await playerStore.actions.loadPlayers();
      await monsterStore.actions.loadMonsters();
    },
  });

  // Parked Groups Management - Wrapper that handles combat logic
  const addParkedGroupFromForm = useCallback(
    (isFightModeEnabled: boolean) => {
      const nc = state.newCombatant;

      // Call hook to add parked group
      parkedGroupStore.actions.addParkedGroup();

      // Handle combat logic and form clearing in wrapper
      const combatants = isFightModeEnabled
        ? combatantStore.actions.prepareCombatantList(state, {
            ...nc,
            maxHp: nc.maxHp || nc.hp,
            templateOrigin:
              state.newCombatant.templateOrigin.origin !== "no_template"
                ? state.newCombatant.templateOrigin
                : {
                    origin: "parked_group",
                    id: nc.id,
                  },
          })
        : state.combatants;

      combatantFormStore.actions.resetForm();
      setState((prev) => ({
        ...prev,
        combatants,
      }));
    },
    [state, parkedGroupStore.actions, combatantStore.actions, combatantFormStore]
  );

  // Player Management - wrapper around playerStore to add combat logic
  const savePlayerFromForm = useCallback(
    async (isFightModeEnabled: boolean) => {
      // Get the current newCombatant before we clear it
      const nc = state.newCombatant;

      // Call the hook's action to save player
      await playerStore.actions.addPlayerFromForm();

      // Clear form and optionally add to combat
      const combatants = isFightModeEnabled
        ? combatantStore.actions.prepareCombatantList(state, nc)
        : state.combatants;

      combatantFormStore.actions.resetForm();
      setState((prev) => ({
        ...prev,
        combatants,
      }));
    },
    [state, playerStore.actions, combatantStore.actions, combatantFormStore]
  );

  const resetState = useCallback(() => {
    setState(getInitialState());
  }, []);

  return {
    // State
    state,

    // Sync
    syncApi,

    // Player Management
    savePlayerFromForm, // wrapper function
    removePlayer: playerStore.actions.removePlayer,
    includePlayer: playerStore.actions.includePlayer,
    savedPlayers: playerStore.state.savedPlayers,
    loadPlayers: playerStore.actions.loadPlayers,

    // Saved combats
    loadCombat: combatStore.actions.loadCombat,
    saveCombat: combatStore.actions.saveCombat,
    updateCombat: combatStore.actions.updateCombat,
    listCombat: combatStore.actions.listCombat,
    createCombat: combatStore.actions.createCombat,
    deleteCombat: combatStore.actions.deleteCombat,

    // Parked Groups
    addParkedGroupFromForm, // wrapper function
    removeParkedGroup: parkedGroupStore.actions.removeParkedGroup,
    includeParkedGroup: parkedGroupStore.actions.includeParkedGroup,

    // New Combatant Form and Initiative Groups
    updateNewCombatant: combatantFormStore.actions.updateNewCombatant,
    addInitiativeGroup: combatantFormStore.actions.addInitiativeGroup,
    removeInitiativeGroup: combatantFormStore.actions.removeInitiativeGroup,
    updateInitiativeGroup: combatantFormStore.actions.updateInitiativeGroup,
    getTotalCombatantCount: combatantFormStore.actions.getTotalCombatantCount,

    // Monster Library
    monsters: monsterStore.state.monsters,
    loadMonsters: monsterStore.actions.loadMonsters,
    createMonster: monsterStore.actions.createMonster,
    removeMonster: monsterStore.actions.removeMonster,
    updateMonster: monsterStore.actions.updateMonster,
    loadMonsterToForm: monsterStore.actions.loadMonsterToForm,
    searchWithLibrary: monsterStore.actions.searchWithLibrary,
    addCombatantToLibrary: monsterStore.actions.addCombatantToLibrary,

    // Combatants and Turn Management
    addCombatant: combatantStore.actions.addCombatant,
    removeCombatant: combatantStore.actions.removeCombatant,
    removeGroup: combatantStore.actions.removeGroup,
    updateHP: combatantStore.actions.updateHP,
    updateInitiative: combatantStore.actions.updateInitiative,
    toggleCondition: combatantStore.actions.toggleCondition,
    toggleConcentration: combatantStore.actions.toggleConcentration,
    updateDeathSave: combatantStore.actions.updateDeathSave,
    nextTurn: combatantStore.actions.nextTurn,
    prevTurn: combatantStore.actions.prevTurn,
    getUniqueGroups: combatantStore.actions.getUniqueGroups,
    
    resetState,

    // Dirty state management
    hasChanges: combatStore.hasChanges,
  };
}
