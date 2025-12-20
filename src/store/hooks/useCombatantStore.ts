import { useCallback } from "react";
import type {
  CombatState,
  Combatant,
  NewCombatant,
  DeathSaves,
  GroupSummary,
  TemplateOrigin,
} from "../../types";
import { indexToLetter } from "../../utils/utils";
import { getSettings } from "../../hooks/useSettings";
import { useToast } from "../../components/common/Toast/useToast";
import { useTranslation } from "react-i18next";
import type { CombatantFormStore } from "./useCombatantFormStore";

interface CombatantActions {
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
  prepareCombatantList: (
    prev: CombatState,
    combatant: NewCombatant
  ) => Combatant[];
  getUniqueGroups: () => GroupSummary[];
}

interface CombatantStore {
  actions: CombatantActions;
}

interface Props {
  state: CombatState;
  setState: React.Dispatch<React.SetStateAction<CombatState>>;
  combatantFormStore: CombatantFormStore;
}

export function useCombatantStore({
  state,
  setState,
  combatantFormStore,
}: Props): CombatantStore {
  // Internal dependencies
  const toastApi = useToast();
  const { t } = useTranslation(["common"]);

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

  // Helper function to prepare combatant list from form
  const prepareCombatantList = useCallback(
    (prev: CombatState, combatant: NewCombatant, templateOrigin?: TemplateOrigin) => {
      const nc = combatant;
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
            templateOrigin: templateOrigin ?? nc.templateOrigin,
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
    []
  );

  const addCombatant = useCallback(
    (combatant?: NewCombatant, templateOrigin?: TemplateOrigin) => {
      setState((prev) => {
        const updated = prepareCombatantList(
          prev,
          combatant ?? state.newCombatant,
          templateOrigin
        );
        return {
          ...prev,
          combatants: updated,
        };
      });
      combatantFormStore.actions.resetForm();
      toastApi.success(t("common:confirmation.addedToCombat.success"));
    },
    [
      setState,
      prepareCombatantList,
      state.newCombatant,
      combatantFormStore,
      toastApi,
      t,
    ]
  );

  const removeCombatant = useCallback(
    (id: number) => {
      setState((prev) => {
        const newCombatants = prev.combatants.filter((c) => c.id !== id);
        let newTurn = prev.currentTurn;
        if (newTurn >= prev.combatants.length - 1) {
          newTurn = Math.max(0, prev.combatants.length - 2);
        }
        return createCombatantsUpdate(prev, newCombatants, newTurn);
      });
    },
    [setState]
  );

  const removeGroup = useCallback(
    (name: string) => {
      setState((prev) => {
        const newCombatants = prev.combatants.filter((c) => c.name !== name);
        return createCombatantsUpdate(prev, newCombatants, 0);
      });
    },
    [setState]
  );

  const updateHP = useCallback(
    (id: number, change: number) => {
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
    },
    [setState]
  );

  const updateInitiative = useCallback(
    (id: number, newInitiative: number) => {
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
    },
    [setState]
  );

  const toggleCondition = useCallback(
    (id: number, condition: string) => {
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
    },
    [setState]
  );

  const toggleConcentration = useCallback(
    (id: number) => {
      setState((prev) => ({
        ...prev,
        combatants: prev.combatants.map((c) =>
          c.id === id ? { ...c, concentration: !c.concentration } : c
        ),
      }));
    },
    [setState]
  );

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
    [setState]
  );

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
  }, [setState]);

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
  }, [setState]);

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

  return {
    actions: {
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
      prepareCombatantList,
      getUniqueGroups
    },
  };
}
