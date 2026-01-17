import { useState, useCallback, useMemo } from "react";
import type { CombatState } from "../types";
import { generateDefaultNewCombatant } from "../utils/utils";
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
    setState,
  });

  // Initialize combat store
  const combatStore = useCombatStore({
    state,
    setState,
  });

  // Initialize combatant form store
  const combatantFormStore = useCombatantFormStore({
    setState,
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

      // Reload current combat if one is loaded
      if (state.combatId) {
        await combatStore.actions.loadCombat(state.combatId);
      }
    },
  });

  // Parked Groups Management - Wrapper that calls store orchestration action
  const addParkedGroupFromForm = useCallback(
    (isFightModeEnabled: boolean) => {
      parkedGroupStore.actions.addParkedGroupFromForm({
        isFightModeEnabled,
        prepareCombatantList: combatantStore.actions.prepareCombatantList,
        resetForm: combatantFormStore.actions.resetForm,
      });
    },
    [
      parkedGroupStore.actions,
      combatantStore.actions,
      combatantFormStore.actions,
    ]
  );

  // Player Management - wrapper that calls store orchestration action
  const savePlayerFromForm = useCallback(
    async (isFightModeEnabled: boolean) => {
      await playerStore.actions.savePlayerFromForm({
        isFightModeEnabled,
        prepareCombatantList: combatantStore.actions.prepareCombatantList,
        resetForm: combatantFormStore.actions.resetForm,
      });
    },
    [playerStore.actions, combatantStore.actions, combatantFormStore.actions]
  );

  const resetState = useCallback(() => {
    setState(getInitialState());
  }, []);

  // Wrapper for getTotalCombatantCount to pass current state
  const getTotalCombatantCount = useCallback(() => {
    return combatantFormStore.actions.getTotalCombatantCount(state);
  }, [state, combatantFormStore.actions]);

  return useMemo(
    () => ({
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
      updatePlayerInitiative: playerStore.actions.updatePlayerInitiative,

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
      getTotalCombatantCount,

      // Monster Library
      monsters: monsterStore.state.monsters,
      loadMonsters: monsterStore.actions.loadMonsters,
      createMonster: monsterStore.actions.createMonster,
      removeMonster: monsterStore.actions.removeMonster,
      updateMonster: monsterStore.actions.updateMonster,
      loadMonsterToForm: monsterStore.actions.loadMonsterToForm,
      searchWithLibrary: monsterStore.actions.searchWithLibrary,
      addCombatantToLibrary: monsterStore.actions.addCombatantToLibrary,
      isUsedAsTemplate: monsterStore.actions.isUsedAsTemplate,

      // Combatants and Turn Management
      addCombatant: combatantStore.actions.addCombatant,
      removeCombatant: combatantStore.actions.removeCombatant,
      removeGroup: combatantStore.actions.removeGroup,
      updateHP: combatantStore.actions.updateHP,
      updateInitiative: combatantStore.actions.updateInitiative,
      toggleCondition: combatantStore.actions.toggleCondition,
      updateDeathSave: combatantStore.actions.updateDeathSave,
      nextTurn: combatantStore.actions.nextTurn,
      prevTurn: combatantStore.actions.prevTurn,
      getUniqueGroups: combatantStore.actions.getUniqueGroups,

      resetState,

      // Dirty state management
      hasChanges: combatStore.hasChanges,
    }),
    [
      addParkedGroupFromForm,
      combatStore.actions.createCombat,
      combatStore.actions.deleteCombat,
      combatStore.actions.listCombat,
      combatStore.actions.loadCombat,
      combatStore.actions.saveCombat,
      combatStore.actions.updateCombat,
      combatStore.hasChanges,
      combatantFormStore.actions.addInitiativeGroup,
      combatantFormStore.actions.removeInitiativeGroup,
      combatantFormStore.actions.updateInitiativeGroup,
      combatantFormStore.actions.updateNewCombatant,
      combatantStore.actions.addCombatant,
      combatantStore.actions.getUniqueGroups,
      combatantStore.actions.nextTurn,
      combatantStore.actions.prevTurn,
      combatantStore.actions.removeCombatant,
      combatantStore.actions.removeGroup,
      combatantStore.actions.toggleCondition,
      combatantStore.actions.updateDeathSave,
      combatantStore.actions.updateHP,
      combatantStore.actions.updateInitiative,
      getTotalCombatantCount,
      monsterStore.actions.addCombatantToLibrary,
      monsterStore.actions.createMonster,
      monsterStore.actions.loadMonsterToForm,
      monsterStore.actions.loadMonsters,
      monsterStore.actions.removeMonster,
      monsterStore.actions.searchWithLibrary,
      monsterStore.actions.updateMonster,
      monsterStore.actions.isUsedAsTemplate,
      monsterStore.state.monsters,
      parkedGroupStore.actions.includeParkedGroup,
      parkedGroupStore.actions.removeParkedGroup,
      playerStore.actions.includePlayer,
      playerStore.actions.loadPlayers,
      playerStore.actions.removePlayer,
      playerStore.actions.updatePlayerInitiative,
      playerStore.state.savedPlayers,
      resetState,
      savePlayerFromForm,
      state,
      syncApi,
    ]
  );
}
