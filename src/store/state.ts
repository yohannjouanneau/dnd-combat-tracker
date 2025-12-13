import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  CombatState,
  Combatant,
  DeathSaves,
  SavedMonster,
  SearchResult,
  NewCombatant,
  MonsterCombatant,
  SearchSource,
} from "../types";
import { dataStore } from "../persistence/storage";
import type { ApiMonster } from "../api/types";
import { createGraphQLClient } from "../api/DnD5eGraphQLClient";
import {
  getStatModifier,
  getApiImageUrl,
  indexToLetter,
  generateDefaultNewCombatant,
} from "../utils";
import { useToast } from "../components/common/Toast/useToast";
import { useTranslation } from "react-i18next";
import { getSettings } from "../hooks/useSettings";
import type { CombatStateManager } from "./types";
import { usePlayerStore } from "./hooks/usePlayerStore";
import { useSyncApi } from "../api/sync/hooks/useSyncApi";
import { useParkedGroupStore } from "./hooks/useParkedGroupStore";
import { useCombatStore } from "./hooks/useCombatStore";
import { useCombatantFormStore } from "./hooks/useCombatantFormStore";


const getInitialState = (): CombatState => ({
  combatants: [],
  currentTurn: 0,
  round: 1,
  parkedGroups: [],
  newCombatant: generateDefaultNewCombatant()
});

export function useCombatState(): CombatStateManager {
  const apiClient = useMemo(() => createGraphQLClient(), []);
  const [state, setState] = useState<CombatState>(getInitialState());
  const [monsters, setMonsters] = useState<SavedMonster[]>([]);

  // Helper to update state from child hooks
  const updateState = useCallback((patch: Partial<CombatState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const { t } = useTranslation(["common"]);
  const toastApi = useToast();

  // Initialize player state hook early (needs to be before it's used in synchronise)
  const playerStore = usePlayerStore({
    combatState: state,
    updateState,
  });

  // Initialize sync API hook with reload callback
  const syncApi = useSyncApi({
    onSyncSuccess: async () => {
      // Reload data after sync to reflect any downloaded changes
      await playerStore.actions.loadPlayers();
      await loadMonsters();
    }
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

  const loadMonsters = useCallback(async () => {
    const monsterList = await dataStore.listMonster();
    setMonsters(monsterList);
  }, []);

  const createMonster = useCallback(
    async (monster: MonsterCombatant) => {
      await dataStore.createMonster(monster);
      await loadMonsters();
    },
    [loadMonsters]
  );

  // Load monsters on mount
  useEffect(() => {
    loadMonsters();
  }, [loadMonsters]);

  const prepareCombatantList = useCallback(
    (prev: CombatState, combatant?: NewCombatant) => {
      const nc = combatant ?? state.newCombatant;
      if (!nc.name || !nc.hp) return prev.combatants;
      if (nc.initiativeGroups.length === 0) return prev.combatants;
      if (nc.initiativeGroups.some((g) => !g.initiative || !g.count))
        return prev.combatants;

      // If maxHp is empty, use hp as maxHp
      const effectiveMaxHp = nc.maxHp || nc.hp;

      // Calculate total count across all initiative groups
      const totalCount = nc.initiativeGroups.reduce(
        (sum, g) => sum + (parseInt(g.count) || 0),
        0
      );
      if (totalCount === 0) return prev.combatants;

      // Find highest existing index for this group
      const existingGroupMembers = prev.combatants.filter(
        (c) => c.name === nc.name
      );
      const maxGroupIndex =
        existingGroupMembers.length > 0
          ? Math.max(...existingGroupMembers.map((c) => c.groupIndex))
          : -1;

      const baseId = Date.now();
      let globalIndex = maxGroupIndex + 1;
      const newCombatants: Combatant[] = [];

      // Get identifier type from settings
      const settings = getSettings();
      const useNumbers = settings.combatantIdentifierType === "numbers";

      // Create combatants for each initiative group
      nc.initiativeGroups.forEach((group) => {
        const count = parseInt(group.count) || 0;
        for (let i = 0; i < count; i++) {
          const identifier = useNumbers
            ? String(globalIndex + 1)
            : indexToLetter(globalIndex);
          newCombatants.push({
            id: baseId + globalIndex,
            name: nc.name,
            displayName: totalCount > 1 ? `${nc.name} ${identifier}` : nc.name,
            initiative: parseFloat(group.initiative),
            hp: nc.hp,
            maxHp: effectiveMaxHp,
            ac: nc.ac ? nc.ac : 10,
            conditions: [],
            concentration: false,
            deathSaves: { successes: 0, failures: 0 },
            color: nc.color,
            groupIndex: globalIndex,
            imageUrl: nc.imageUrl,
            externalResourceUrl: nc.externalResourceUrl,
            cha: nc.cha,
            con: nc.con,
            dex: nc.dex,
            int: nc.int,
            str: nc.str,
            wis: nc.wis,
            notes: nc.notes,
            templateOrigin: nc.templateOrigin
          });
          globalIndex++;
        }
      });

      // Merge and sort all combatants
      const updated = [...prev.combatants, ...newCombatants].sort((a, b) => {
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        if (a.name !== b.name) {
          return a.name.localeCompare(b.name);
        }
        return a.groupIndex - b.groupIndex;
      });

      return updated;
    },
    [state.newCombatant]
  );

  // Parked Groups Management - Wrapper that handles combat logic
  const addParkedGroup = useCallback(
    (isFightModeEnabled: boolean) => {
      const nc = state.newCombatant;

      // Call hook to add parked group
      parkedGroupStore.actions.addParkedGroup();

      // Handle combat logic and form clearing in wrapper
      const combatants = isFightModeEnabled
        ? prepareCombatantList(state, {
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
    [state, parkedGroupStore.actions, prepareCombatantList, combatantFormStore]
  );

  // Player Management - wrapper around playerStore to add combat logic
  const addPlayerFromForm = useCallback(
    async (isFightModeEnabled: boolean) => {
      // Get the current newCombatant before we clear it
      const nc = state.newCombatant;

      // Call the hook's action to save player
      await playerStore.actions.addPlayerFromForm();

      // Clear form and optionally add to combat
      const combatants = isFightModeEnabled
        ? prepareCombatantList(state, nc)
        : state.combatants;

      combatantFormStore.actions.resetForm();
      setState((prev) => ({
        ...prev,
        combatants,
      }));
    },
    [state, playerStore.actions, prepareCombatantList, combatantFormStore]
  );

  // Library Management

  const removeMonster = useCallback(
    async (id: string) => {
      await dataStore.deleteMonster(id);
      await loadMonsters();
    },
    [loadMonsters]
  );

  const syncMonsterNotesToCombat = useCallback((monsterId: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      // Update active combatants
      combatants: prev.combatants.map((combatant) => {
        // Check if combatant references this monster
        if (
          combatant.templateOrigin?.origin === "monster_library" &&
          combatant.templateOrigin.id === monsterId
        ) {
          return { ...combatant, notes };
        }
        return combatant;
      }),
      // Update parked groups
      parkedGroups: prev.parkedGroups.map((group) => {
        // Check if parked group references this monster
        if (
          group.templateOrigin?.origin === "monster_library" &&
          group.templateOrigin.id === monsterId
        ) {
          return { ...group, notes };
        }
        return group;
      }),
    }));
  }, []);

  const updateMonster = useCallback(
    async (id: string, monster: SavedMonster) => {
      await dataStore.updateMonster(id, monster);
      await loadMonsters();

      // Sync notes to active combatants and parked groups
      syncMonsterNotesToCombat(id, monster.notes || "");
    },
    [loadMonsters, syncMonsterNotesToCombat]
  );

  const fillFormWithMonsterRemoteData = useCallback((monster: ApiMonster) => {
    combatantFormStore.actions.updateNewCombatant({
      name: monster.name,
      hp: monster.hit_points ?? 0,
      maxHp: monster.hit_points ?? 0,
      initBonus: monster.dexterity
        ? getStatModifier(monster.dexterity)
        : undefined,
      ac: monster.armor_class?.at(0)?.value ?? 0,
      imageUrl: getApiImageUrl(monster),
    });
  }, [combatantFormStore]);

  const fillFormWithMonsterLibraryData = useCallback((monster: SavedMonster) => {
    const dexMod = getStatModifier(monster.dex);
    combatantFormStore.actions.updateNewCombatant({
      name: monster.name,
      hp: monster.hp,
      maxHp: monster.hp,
      ac: monster.ac,
      imageUrl: monster.imageUrl,
      externalResourceUrl: monster.externalResourceUrl,
      initBonus: dexMod,
      str: monster.str,
      dex: monster.dex,
      con: monster.con,
      int: monster.int,
      wis: monster.wis,
      cha: monster.cha,
      notes: monster.notes,
      templateOrigin: {
        origin: "monster_library",
        id: monster.id,
      },
    });
  }, [combatantFormStore]);

  const loadMonsterToForm = useCallback((searchResult: SearchResult) => {
    if (searchResult.source === "api") {
      fillFormWithMonsterRemoteData(searchResult.monster as ApiMonster);
    } else {
      fillFormWithMonsterLibraryData(searchResult.monster as SavedMonster);
    }
  }, [fillFormWithMonsterRemoteData, fillFormWithMonsterLibraryData]);

  const searchWithLibrary = useCallback(
    async (query: string, source?: SearchSource) => {
      const results: SearchResult[] = [];

      if (source === "api" || !source) {
        // Search API
        try {
          const apiMonsters = await apiClient.searchMonsters(query);
          results.push(
            ...apiMonsters.map((m) => ({
              source: "api" as const,
              monster: m,
            }))
          );
        } catch (error) {
          console.error("API search failed:", error);
        }
      }

      if (source === "library" || !source) {
        // Search local library
        try {
          const libraryMonsters = await dataStore.searchMonster(query);
          results.push(
            ...libraryMonsters.map((m) => ({
              source: "library" as const,
              monster: m,
            }))
          );
        } catch (error) {
          console.error("Library search failed:", error);
        }
      }

      return results;
    },
    [apiClient]
  );

  const addCombatantToLibrary = useCallback(async () => {
    const nc = state.newCombatant;
    const someInitAreIncomplete = nc.initiativeGroups.some(
      (g) => !g.initiative || !g.count
    );
    if (
      !nc.name ||
      !nc.hp ||
      nc.initiativeGroups.length === 0 ||
      someInitAreIncomplete
    ) {
      return;
    }

    await createMonster({
      ...nc,
      maxHp: nc.maxHp || nc.hp,
      type: "monster",
    });
    toastApi.success(t("common:confirmation.addToLibrary.success"));
  }, [state.newCombatant, createMonster, toastApi, t]);

  // Combatant Management
  const addCombatant = useCallback(
    (combatant?: NewCombatant) => {
      setState((prev) => {
        const updated = prepareCombatantList(prev, combatant);
        return {
          ...prev,
          combatants: updated,
        };
      });
      combatantFormStore.actions.resetForm();
      toastApi.success(t("common:confirmation.addedToCombat.success"));
    },
    [prepareCombatantList, combatantFormStore, toastApi, t]
  );

  // Helper function to create combatants state update with reset when empty
  const createCombatantsUpdate = (
    prev: CombatState,
    newCombatants: Combatant[],
    defaultTurn: number
  ): CombatState => {
    if (newCombatants.length === 0) {
      return {
        ...prev,
        combatants: newCombatants,
        currentTurn: 0,
        round: 1,
      };
    }
    return {
      ...prev,
      combatants: newCombatants,
      currentTurn: defaultTurn,
    };
  };

  const removeCombatant = useCallback((id: number) => {
    setState((prev) => {
      const newCombatants = prev.combatants.filter((c) => c.id !== id);
      let newTurn = prev.currentTurn;
      if (newTurn >= prev.combatants.length - 1) {
        newTurn = Math.max(0, prev.combatants.length - 2);
      }
      return createCombatantsUpdate(prev, newCombatants, newTurn);
    });
  }, []);

  const removeGroup = useCallback((name: string) => {
    setState((prev) => {
      const newCombatants = prev.combatants.filter((c) => c.name !== name);
      return createCombatantsUpdate(prev, newCombatants, 0);
    });
  }, []);

  const updateHP = useCallback((id: number, change: number) => {
    setState((prev) => ({
      ...prev,
      combatants: prev.combatants.map((c) => {
        if (c.id === id) {
          const newHp = Math.max(
            0,
            Math.min(c.maxHp ?? 0, (c.hp ?? 0) + change)
          );
          return { ...c, hp: newHp };
        }
        return c;
      }),
    }));
  }, []);

  // Add this function after updateHP
  const updateInitiative = (id: number, newInitiative: number) => {
    setState((prev) => {
      // Update the combatant's initiative
      const updatedCombatants = prev.combatants.map((c) =>
        c.id === id ? { ...c, initiative: newInitiative } : c
      );

      // Re-sort the combatants by initiative (descending), then by group name, then by index
      const sortedCombatants = updatedCombatants.sort((a, b) => {
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        if (a.name !== b.name) {
          return a.name.localeCompare(b.name);
        }
        return a.groupIndex - b.groupIndex;
      });

      // Find the new index of the currently active combatant
      const activeCombatant = prev.combatants[prev.currentTurn];
      const newCurrentTurn = sortedCombatants.findIndex(
        (c) => c.id === activeCombatant?.id
      );

      return {
        ...prev,
        combatants: sortedCombatants,
        currentTurn: newCurrentTurn >= 0 ? newCurrentTurn : prev.currentTurn,
      };
    });
  };

  const toggleCondition = useCallback((id: number, condition: string) => {
    setState((prev) => ({
      ...prev,
      combatants: prev.combatants.map((c) => {
        if (c.id === id) {
          const hasCondition = c.conditions.includes(condition);
          return {
            ...c,
            conditions: hasCondition
              ? c.conditions.filter((cond) => cond !== condition)
              : [...c.conditions, condition],
          };
        }
        return c;
      }),
    }));
  }, []);

  const toggleConcentration = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      combatants: prev.combatants.map((c) =>
        c.id === id ? { ...c, concentration: !c.concentration } : c
      ),
    }));
  }, []);

  const updateDeathSave = useCallback(
    (id: number, type: keyof DeathSaves, value: number) => {
      setState((prev) => ({
        ...prev,
        combatants: prev.combatants.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              deathSaves: {
                ...c.deathSaves,
                [type]: Math.max(0, Math.min(3, value)),
              },
            };
          }
          return c;
        }),
      }));
    },
    []
  );

  // Turn Management
  const nextTurn = useCallback(() => {
    setState((prev) => {
      if (prev.combatants.length === 0) return prev;
      const next = (prev.currentTurn + 1) % prev.combatants.length;
      return {
        ...prev,
        currentTurn: next,
        round: next === 0 ? prev.round + 1 : prev.round,
      };
    });
  }, []);

  const prevTurn = useCallback(() => {
    setState((prev) => {
      if (prev.combatants.length === 0) return prev;
      const prev_turn =
        prev.currentTurn === 0
          ? prev.combatants.length - 1
          : prev.currentTurn - 1;
      return {
        ...prev,
        currentTurn: prev_turn,
        round:
          prev_turn === prev.combatants.length - 1
            ? Math.max(1, prev.round - 1)
            : prev.round,
      };
    });
  }, []);

  // Utility
  const getUniqueGroups = useCallback(() => {
    const groups = new Map();
    state.combatants.forEach((c) => {
      if (!groups.has(c.name)) {
        groups.set(c.name, {
          name: c.name,
          color: c.color,
          count: 1,
        });
      } else {
        groups.get(c.name).count++;
      }
    });
    return Array.from(groups.values());
  }, [state.combatants]);

  const getTotalCombatantCount = useCallback(() => {
    return state.newCombatant.initiativeGroups.reduce((sum, g) => {
      return sum + (parseInt(g.count) || 0);
    }, 0);
  }, [state.newCombatant.initiativeGroups]);

  
  const resetState = useCallback(() => {
    setState(getInitialState());
  }, []);

  return {
    // State
    state,

    // Sync
    syncApi,

    // Player Management
    addPlayerFromForm,
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
    addParkedGroup,  // wrapper function
    removeParkedGroup: parkedGroupStore.actions.removeParkedGroup,
    includeParkedGroup: parkedGroupStore.actions.includeParkedGroup,

    // New Combatant Form and Initiative Groups
    updateNewCombatant: combatantFormStore.actions.updateNewCombatant,
    addInitiativeGroup: combatantFormStore.actions.addInitiativeGroup,
    removeInitiativeGroup: combatantFormStore.actions.removeInitiativeGroup,
    updateInitiativeGroup: combatantFormStore.actions.updateInitiativeGroup,

    // Monster Library
    monsters,
    loadMonsters,
    createMonster,
    removeMonster,
    updateMonster,
    loadMonsterToForm,
    searchWithLibrary,
    addCombatantToLibrary,

    // Combatants and Turn Management
    addCombatant,
    removeCombatant,
    removeGroup,
    updateHP,
    updateInitiative,
    toggleCondition,
    toggleConcentration,
    updateDeathSave,
    nextTurn,
    prevTurn,

    // Utility
    getUniqueGroups,
    getTotalCombatantCount,
    resetState,

    // Dirty state management
    hasChanges: combatStore.hasChanges,
  };
}
