import { useCallback } from "react";
import type { CombatState, NewCombatant, InitiativeGroup } from "../../types";
import { generateDefaultNewCombatant } from "../../utils";

interface CombatantFormActions {
  updateNewCombatant: (patch: Partial<NewCombatant>) => void;
  addInitiativeGroup: () => void;
  removeInitiativeGroup: (id: string) => void;
  updateInitiativeGroup: (id: string, patch: Partial<InitiativeGroup>) => void;
  resetForm: () => void;
}

export interface CombatantFormStore {
  actions: CombatantFormActions;
}

interface Props {
  combatState: CombatState;
  setState: React.Dispatch<React.SetStateAction<CombatState>>;
}

export function useCombatantFormStore({ setState }: Props): CombatantFormStore {
  
  const setNewCombatant = useCallback(
    (onUpdate: (prev: NewCombatant) => NewCombatant) => {
      setState((prev) => {
        const updated = onUpdate(prev.newCombatant)
        
        return {
          ...prev,
          newCombatant: updated,
        };
      });
    },
    [setState]
  );

  // Update form with partial data
  const updateNewCombatant = useCallback(
    (patch: Partial<NewCombatant>) => {
      setNewCombatant((prev) => ({ ...prev, ...patch }));
    },
    [setNewCombatant]
  );

  // Add new initiative group
  const addInitiativeGroup = useCallback(() => {
    setNewCombatant((prev) => ({
      ...prev,
      initiativeGroups: [
        ...prev.initiativeGroups,
        { id: crypto.randomUUID(), initiative: "", count: "1" },
      ],
    }));
  }, [setNewCombatant]);

  // Remove initiative group by ID
  const removeInitiativeGroup = useCallback(
    (id: string) => {
      setNewCombatant((prev) => {
        const filtered = prev.initiativeGroups.filter((g) => g.id !== id);

        // Keep at least one group
        if (filtered.length === 0) return prev;

        return {
          ...prev,
          initiativeGroups: filtered,
        };
      });
    },
    [setNewCombatant]
  );

  // Update specific initiative group
  const updateInitiativeGroup = useCallback(
    (id: string, patch: Partial<InitiativeGroup>) => {
      setNewCombatant((prev) => ({
        ...prev,
        initiativeGroups: prev.initiativeGroups.map((g) =>
          g.id === id ? { ...g, ...patch } : g
        ),
      }));
    },
    [setNewCombatant]
  );

  // Reset form to default state
  const resetForm = useCallback(() => {
    setNewCombatant(() => generateDefaultNewCombatant());
  }, [setNewCombatant]);

  return {
    actions: {
      updateNewCombatant,
      addInitiativeGroup,
      removeInitiativeGroup,
      updateInitiativeGroup,
      resetForm,
    },
  };
}
