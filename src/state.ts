import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  CombatState,
  Combatant,
  NewCombatant,
  DeathSaves,
  GroupSummary,
  InitiativeGroup,
  SavedPlayer,
  SavedCombat,
  SavedCombatInput,
} from "./types";
import { dataStore } from "./persistence/storage";
import { DEFAULT_NEW_COMBATANT, DND_API_HOST } from "./constants";
import type { Monster } from "./api/types";
import { createGraphQLClient } from "./api/DnD5eGraphQLClient";

export type CombatStateManager = {
  // State
  state: CombatState;

  // Saved Combats
  loadCombat: (combatId: string) => Promise<void>;
  saveCombat: (patch: Partial<SavedCombat>) => Promise<void>;
  updateCombat: (name: string, description: string) => void;

  // Saved Players
  savedPlayers: SavedPlayer[];
  loadPlayers: () => Promise<void>;

  // Parked Groups
  addParkedGroup: (isFightModeEnabled: boolean) => void;
  removeParkedGroup: (name: string) => void;
  includeParkedGroup: (combatant: NewCombatant) => void;

  // New Combatant Form
  updateNewCombatant: (patch: Partial<NewCombatant>) => void;

  // Initiative Groups
  addInitiativeGroup: () => void;
  removeInitiativeGroup: (id: string) => void;
  updateInitiativeGroup: (id: string, patch: Partial<InitiativeGroup>) => void;

  // Player Management
  addPlayerFromForm: (isFightModeEnabled: boolean) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  includePlayer: (player: SavedPlayer) => void;

  // Combatants
  addCombatant: (combatant?: NewCombatant) => void;
  removeCombatant: (id: number) => void;
  removeGroup: (groupName: string) => void;
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

  // API
  searchMonsters: (nameQuery: string) => Promise<Monster[]>;
  fillFormWithMonsterData: (monster: Monster) => void;

  // Utility
  getUniqueGroups: () => GroupSummary[];
  getTotalCombatantCount: () => number;
  loadState: (newState: CombatState) => void;
  resetState: () => void;

  // Dirty state managment
  hasChanges: boolean;
};

const getInitialState = (): CombatState => ({
  combatants: [],
  currentTurn: 0,
  round: 1,
  parkedGroups: [],
  newCombatant: DEFAULT_NEW_COMBATANT,
});

export function useCombatState(): CombatStateManager {
  const apiClient = useMemo(() => createGraphQLClient(), []);
  const [state, setState] = useState<CombatState>(getInitialState());
  const [savedPlayers, setSavedPlayers] = useState<SavedPlayer[]>([]);

  const loadPlayers = useCallback(async () => {
    const players = await dataStore.listPlayer();
    setSavedPlayers(players);
  }, []);

  // Load players on mount
  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const loadCombat = async (combatId: string) => {
    const savedCombat = await dataStore.getCombat(combatId);

    if (savedCombat?.data) {
      setState({
        ...savedCombat.data,
        combatId: savedCombat.id,
        combatName: savedCombat.name,
        combatDescription: savedCombat.description,
        lastSavedSnapshot: takeSnapshot(savedCombat.data),
      });
    }
  };

  const saveCombat = async (patch: Partial<SavedCombat>) => {
    if (state.combatId) {
      const updatedCombat = await dataStore.updateCombat(state.combatId, patch);
      setState(updatedCombat.data);
      markAsSaved();
    }
  };

  const updateCombat = (name: string, description: string) => {
    setState((prev) => {
      return {
        ...prev,
        combatName: name.length === 0 ? prev.combatName : name,
        combatDescription:
          description.length === 0 ? prev.combatDescription : description,
      };
    });
  };

  // Parked Groups Management
  const addParkedGroup = useCallback((isFightModeEnabled: boolean) => {
    setState((prev) => {
      const nc = prev.newCombatant;
      if (!nc.groupName || !nc.hp) return prev;
      if (nc.initiativeGroups.length === 0) return prev;
      if (nc.initiativeGroups.some((g) => !g.initiative || !g.count))
        return prev;

      // If maxHp is empty, copy hp to maxHp
      const groupToAdd = {
        ...nc,
        maxHp: nc.maxHp || nc.hp,
      };

      // Remove existing group with same name (if any) and add new one
      const filteredGroups = prev.parkedGroups.filter(
        (g) => g.groupName !== nc.groupName
      );

      const combatants = isFightModeEnabled
        ? prepareCombatantList(prev, groupToAdd)
        : [];

      return {
        ...prev,
        parkedGroups: [...filteredGroups, groupToAdd],
        newCombatant: DEFAULT_NEW_COMBATANT,
        combatants,
      };
    });
  }, []);

  const removeParkedGroup = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      parkedGroups: prev.parkedGroups.filter((g) => g.groupName !== name),
    }));
  }, []);

  const includeParkedGroup = useCallback((combatant: NewCombatant) => {
    setState((prev) => ({
      ...prev,
      newCombatant: combatant,
    }));
  }, []);

  // New Combatant Form Management
  const updateNewCombatant = useCallback((patch: Partial<NewCombatant>) => {
    setState((prev) => ({
      ...prev,
      newCombatant: { ...prev.newCombatant, ...patch },
    }));
  }, []);

  // Initiative Groups Management
  const addInitiativeGroup = useCallback(() => {
    setState((prev) => ({
      ...prev,
      newCombatant: {
        ...prev.newCombatant,
        initiativeGroups: [
          ...prev.newCombatant.initiativeGroups,
          { id: crypto.randomUUID(), initiative: "", count: "1" },
        ],
      },
    }));
  }, []);

  const removeInitiativeGroup = useCallback((id: string) => {
    setState((prev) => {
      const filtered = prev.newCombatant.initiativeGroups.filter(
        (g) => g.id !== id
      );
      // Keep at least one group
      if (filtered.length === 0) return prev;

      return {
        ...prev,
        newCombatant: {
          ...prev.newCombatant,
          initiativeGroups: filtered,
        },
      };
    });
  }, []);

  const updateInitiativeGroup = useCallback(
    (id: string, patch: Partial<InitiativeGroup>) => {
      setState((prev) => ({
        ...prev,
        newCombatant: {
          ...prev.newCombatant,
          initiativeGroups: prev.newCombatant.initiativeGroups.map((g) =>
            g.id === id ? { ...g, ...patch } : g
          ),
        },
      }));
    },
    []
  );

  // Player Management
  const addPlayerFromForm = useCallback(
    async (isFightModeEnabled: boolean) => {
      const nc = state.newCombatant;
      if (!nc.groupName || !nc.hp) return;
      if (nc.initiativeGroups.length === 0) return;
      if (nc.initiativeGroups.some((g) => !g.initiative || !g.count)) return;

      // Check if player with same name already exists
      const existingPlayer = savedPlayers.find(
        (p) => p.groupName === nc.groupName
      );

      if (existingPlayer) {
        // Update existing player
        await dataStore.updatePlayer(existingPlayer.id, {
          initiativeGroups: nc.initiativeGroups,
          hp: nc.hp,
          maxHp: nc.maxHp || nc.hp,
          ac: nc.ac,
          color: nc.color,
        });
      } else {
        // Create new player
        await dataStore.createPlayer({
          groupName: nc.groupName,
          initiativeGroups: nc.initiativeGroups,
          hp: nc.hp,
          maxHp: nc.maxHp || nc.hp,
          ac: nc.ac,
          color: nc.color,
          imageUrl: nc.imageUrl,
          initBonus: nc.initBonus,
        });
      }

      await loadPlayers();

      // Clear the form after saving player
      setState((prev) => {
        const combatants = isFightModeEnabled
          ? prepareCombatantList(prev, nc)
          : [];
        return {
          ...prev,
          newCombatant: DEFAULT_NEW_COMBATANT,
          combatants,
        };
      });
    },
    [state.newCombatant, savedPlayers, loadPlayers]
  );

  const removePlayer = useCallback(
    async (id: string) => {
      await dataStore.deletePlayer(id);
      await loadPlayers();
    },
    [loadPlayers]
  );

  const includePlayer = useCallback((player: SavedPlayer) => {
    setState((prev) => ({
      ...prev,
      newCombatant: {
        groupName: player.groupName,
        initiativeGroups: player.initiativeGroups,
        hp: player.hp,
        maxHp: player.maxHp,
        ac: player.ac,
        color: player.color,
        imageUrl: player.imageUrl,
        initBonus: player.initBonus,
      },
    }));
  }, []);

  // Combatant Management
  const prepareCombatantList = useCallback(
    (prev: CombatState, combatant?: NewCombatant) => {
      const nc = combatant ?? prev.newCombatant;
      if (!nc.groupName || !nc.hp) return prev.combatants;
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
        (c) => c.groupName === nc.groupName
      );
      const maxGroupIndex =
        existingGroupMembers.length > 0
          ? Math.max(...existingGroupMembers.map((c) => c.groupIndex))
          : -1;

      const baseId = Date.now();
      let globalLetterIndex = maxGroupIndex + 1;
      const newCombatants: Combatant[] = [];

      // Create combatants for each initiative group
      nc.initiativeGroups.forEach((group) => {
        const count = parseInt(group.count) || 0;
        for (let i = 0; i < count; i++) {
          const letter = String.fromCharCode(65 + globalLetterIndex);
          newCombatants.push({
            id: baseId + globalLetterIndex,
            name: nc.groupName,
            displayName:
              totalCount > 1 ? `${nc.groupName} ${letter}` : nc.groupName,
            initiative: parseFloat(group.initiative),
            hp: parseInt(nc.hp),
            maxHp: parseInt(effectiveMaxHp),
            ac: nc.ac ? parseInt(nc.ac) : 10,
            conditions: [],
            concentration: false,
            deathSaves: { successes: 0, failures: 0 },
            groupName: nc.groupName,
            color: nc.color,
            groupIndex: globalLetterIndex,
            imageUrl: nc.imageUrl,
          });
          globalLetterIndex++;
        }
      });

      // Merge and sort all combatants
      const updated = [...prev.combatants, ...newCombatants].sort((a, b) => {
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        if (a.groupName !== b.groupName) {
          return a.groupName.localeCompare(b.groupName);
        }
        return a.groupIndex - b.groupIndex;
      });

      return updated;
    },
    []
  );

  const addCombatant = useCallback(
    (combatant?: NewCombatant) => {
      setState((prev) => {
        const updated = prepareCombatantList(prev, combatant);
        return {
          ...prev,
          combatants: updated,
          newCombatant: DEFAULT_NEW_COMBATANT,
        };
      });
    },
    [prepareCombatantList]
  );

  const removeCombatant = useCallback((id: number) => {
    setState((prev) => {
      const newCombatants = prev.combatants.filter((c) => c.id !== id);
      let newTurn = prev.currentTurn;
      if (newTurn >= prev.combatants.length - 1) {
        newTurn = Math.max(0, prev.combatants.length - 2);
      }
      return {
        ...prev,
        combatants: newCombatants,
        currentTurn: newTurn,
      };
    });
  }, []);

  const removeGroup = useCallback((groupName: string) => {
    setState((prev) => ({
      ...prev,
      combatants: prev.combatants.filter((c) => c.groupName !== groupName),
      currentTurn: 0,
    }));
  }, []);

  const updateHP = useCallback((id: number, change: number) => {
    setState((prev) => ({
      ...prev,
      combatants: prev.combatants.map((c) => {
        if (c.id === id) {
          const newHp = Math.max(0, Math.min(c.maxHp, c.hp + change));
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
        if (a.groupName !== b.groupName) {
          return a.groupName.localeCompare(b.groupName);
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

  // Combat list
  const listCombat = async () => {
    return dataStore.listCombat();
  };

  const createCombat = async (input: SavedCombatInput) => {
    return dataStore.createCombat(input);
  };

  const deleteCombat = (id: string) => {
    return dataStore.deleteCombat(id);
  };

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

  // Api
  const searchMonsters = async (nameQuery: string) => {
    return apiClient.searchMonsters(nameQuery);
  };

  const fillFormWithMonsterData = (monster: Monster) => {
    setState((prev) => ({
      ...prev,
      newCombatant: {
        ...prev.newCombatant,
        groupName: monster.name,
        hp: monster.hit_points?.toString() ?? "",
        maxHp: monster.hit_points?.toString() ?? "",
        initBonus: monster.dexterity
          ? Math.floor((monster.dexterity - 10) / 2).toString()
          : "",
        ac: monster.armor_class?.at(0)?.value?.toString() ?? "",
        imageUrl: `${DND_API_HOST}${monster.image}`,
      },
    }));
  };

  // Utility
  const getUniqueGroups = useCallback(() => {
    const groups = new Map();
    state.combatants.forEach((c) => {
      if (!groups.has(c.groupName)) {
        groups.set(c.groupName, {
          name: c.groupName,
          color: c.color,
          count: 1,
        });
      } else {
        groups.get(c.groupName).count++;
      }
    });
    return Array.from(groups.values());
  }, [state.combatants]);

  const getTotalCombatantCount = useCallback(() => {
    return state.newCombatant.initiativeGroups.reduce((sum, g) => {
      return sum + (parseInt(g.count) || 0);
    }, 0);
  }, [state.newCombatant.initiativeGroups]);

  const loadState = useCallback((newState: CombatState) => {
    setState(newState);
  }, []);

  const resetState = useCallback(() => {
    setState(getInitialState());
  }, []);

  // Dirty State managment
  function takeSnapshot(state: CombatState) {
    const { lastSavedSnapshot, ...stateToSave } = state;
    return JSON.stringify(stateToSave);
  }

  const hasChanges = useMemo(() => {
    if (!state.lastSavedSnapshot) return true; // Never saved

    const currentSnapshot = takeSnapshot(state);
    return currentSnapshot !== state.lastSavedSnapshot;
  }, [state]);

  const markAsSaved = () => {
    setState((prev) => ({
      ...prev,
      lastSavedSnapshot: takeSnapshot(prev),
    }));
  };

  return {
    // State
    state,

    // Saved combats
    loadCombat,
    saveCombat,
    updateCombat,

    // Saved Players
    savedPlayers,
    loadPlayers,

    // Parked Groups
    addParkedGroup,
    removeParkedGroup,
    includeParkedGroup,

    // New Combatant Form
    updateNewCombatant,

    // Initiative Groups
    addInitiativeGroup,
    removeInitiativeGroup,
    updateInitiativeGroup,

    // Player Management
    addPlayerFromForm,
    removePlayer,
    includePlayer,

    // Combatants
    addCombatant,
    removeCombatant,
    removeGroup,
    updateHP,
    updateInitiative,
    toggleCondition,
    toggleConcentration,
    updateDeathSave,

    //Combat List
    listCombat,
    createCombat,
    deleteCombat,

    // Turn Management
    nextTurn,
    prevTurn,

    // Api
    searchMonsters,
    fillFormWithMonsterData,

    // Utility
    getUniqueGroups,
    getTotalCombatantCount,
    loadState,
    resetState,

    // Dirty state managment
    hasChanges,
  };
}
