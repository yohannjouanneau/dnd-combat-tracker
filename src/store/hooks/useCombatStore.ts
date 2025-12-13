import { useCallback, useMemo } from "react";
import type { CombatState, SavedCombat, SavedCombatInput } from "../../types";
import { dataStore } from "../../persistence/storage";
import { useToast } from "../../components/common/Toast/useToast";
import { useTranslation } from "react-i18next";

interface CombatActions {
  loadCombat: (combatId: string) => Promise<void>;
  saveCombat: (patch: Partial<SavedCombat>) => Promise<void>;
  updateCombat: (name: string, description: string) => void;
  listCombat: () => Promise<SavedCombat[]>;
  createCombat: (input: SavedCombatInput) => Promise<SavedCombat>;
  deleteCombat: (id: string) => Promise<void>;
}

interface CombatStore {
  actions: CombatActions;
  hasChanges: boolean;
}

interface Props {
  state: CombatState;
  setState: React.Dispatch<React.SetStateAction<CombatState>>;
}

export function useCombatStore({ state, setState }: Props): CombatStore {
  const toastApi = useToast();
  const { t } = useTranslation(["common"]);

  // Helper: Serialize state to JSON for dirty tracking
  const takeSnapshot = useCallback((combatState: CombatState): string => {
    return JSON.stringify({
      combatants: combatState.combatants,
      parkedGroups: combatState.parkedGroups,
      currentTurn: combatState.currentTurn,
      round: combatState.round,
    });
  }, []);

  // Helper: Mark current state as saved
  const markAsSaved = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastSavedSnapshot: takeSnapshot(prev),
    }));
  }, [setState, takeSnapshot]);

  // Load combat from storage
  const loadCombat = useCallback(
    async (combatId: string) => {
      const savedCombat = await dataStore.getCombat(combatId);

      if (savedCombat?.data) {
        setState({
          ...savedCombat.data,
          combatants: savedCombat.data.combatants,
          parkedGroups: savedCombat.data.parkedGroups,
          combatId: savedCombat.id,
          combatName: savedCombat.name,
          combatDescription: savedCombat.description,
          lastSavedSnapshot: takeSnapshot(savedCombat.data),
        });
      }
    },
    [setState, takeSnapshot]
  );

  // Save current combat to storage
  const saveCombat = useCallback(
    async (patch: Partial<SavedCombat>) => {
      if (state.combatId) {
        const updatedCombat = await dataStore.updateCombat(
          state.combatId,
          patch
        );
        setState((prev) => ({
          ...updatedCombat.data,
          combatId: prev.combatId,
          combatName: prev.combatName,
          combatDescription: prev.combatDescription,
        }));
        markAsSaved();
        toastApi.success(t("common:confirmation.saveCombat.success"));
      }
    },
    [state.combatId, setState, markAsSaved, toastApi, t]
  );

  // Update combat metadata (client-side only, no persistence)
  const updateCombat = useCallback(
    (name: string, description: string) => {
      setState((prev) => ({
        ...prev,
        combatName: name.length === 0 ? prev.combatName : name,
        combatDescription:
          description.length === 0 ? prev.combatDescription : description,
      }));
    },
    [setState]
  );

  // List all saved combats
  const listCombat = useCallback(async () => {
    return dataStore.listCombat();
  }, []);

  // Create new combat
  const createCombat = useCallback(async (input: SavedCombatInput) => {
    return dataStore.createCombat(input);
  }, []);

  // Delete combat by ID
  const deleteCombat = useCallback(async (id: string) => {
    return dataStore.deleteCombat(id);
  }, []);

  // Compute whether state has changes since last save
  const hasChanges = useMemo(() => {
    if (!state.lastSavedSnapshot) return true; // never saved
    return state.lastSavedSnapshot !== takeSnapshot(state);
  }, [state, takeSnapshot]);

  return {
    actions: {
      loadCombat,
      saveCombat,
      updateCombat,
      listCombat,
      createCombat,
      deleteCombat,
    },
    hasChanges,
  };
}
