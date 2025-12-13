import { useCallback } from "react";
import type { CombatState, NewCombatant, InitiativeGroup } from "../../types";
import { generateDefaultNewCombatant } from "../../utils";

interface CombatantFormActions {
  updateNewCombatant: (patch: Partial<NewCombatant>) => void;
  addInitiativeGroup: () => void;
  removeInitiativeGroup: (id: string) => void;
  updateInitiativeGroup: (id: string, patch: Partial<InitiativeGroup>) => void;
  resetForm: () => Partial<CombatState>;
  getTotalCombatantCount: (state: CombatState) => number;
}

export interface CombatantFormStore {
  actions: CombatantFormActions;
}

interface Props {
  setState: React.Dispatch<React.SetStateAction<CombatState>>;
}

export function useCombatantFormStore({ setState }: Props): CombatantFormStore {

  // Update form with partial data
  const updateNewCombatant = useCallback(
    (patch: Partial<NewCombatant>) => {
      setState((prev) => ({
        ...prev,
        newCombatant: { ...prev.newCombatant, ...patch },
      }));
    },
    [setState]
  );

  // Add new initiative group
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
  }, [setState]);

  // Remove initiative group by ID
  const removeInitiativeGroup = useCallback(
    (id: string) => {
      setState((prev) => {
        const filtered = prev.newCombatant.initiativeGroups.filter((g) => g.id !== id);

        // Keep at least one group - no-op if trying to remove last
        if (filtered.length === 0) return prev;

        return {
          ...prev,
          newCombatant: {
            ...prev.newCombatant,
            initiativeGroups: filtered,
          },
        };
      });
    },
    [setState]
  );

  // Update specific initiative group
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
    [setState]
  );

  // Reset form to default state - returns patch for composition
  const resetForm = useCallback((): Partial<CombatState> => {
    return {
      newCombatant: generateDefaultNewCombatant(),
    };
  }, []);

  // Pure function to get total combatant count
  const getTotalCombatantCount = useCallback((state: CombatState): number => {
    return state.newCombatant.initiativeGroups.reduce((sum, g) => {
      return sum + (parseInt(g.count) || 0);
    }, 0);
  }, []);

  return {
    actions: {
      updateNewCombatant,
      addInitiativeGroup,
      removeInitiativeGroup,
      updateInitiativeGroup,
      resetForm,
      getTotalCombatantCount,
    },
  };
}
