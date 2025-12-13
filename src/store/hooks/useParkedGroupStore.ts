import { useCallback } from "react";
import type { CombatState, NewCombatant, Combatant } from "../../types";
import { useToast } from "../../components/common/Toast/useToast";
import { useTranslation } from "react-i18next";

interface ParkedGroupActions {
  addParkedGroup: () => void;
  removeParkedGroup: (name: string) => void;
  includeParkedGroup: (combatant: NewCombatant) => void;
  addParkedGroupFromForm: (params: {
    isFightModeEnabled: boolean;
    prepareCombatantList: (prev: CombatState, nc: NewCombatant) => Combatant[];
    resetForm: () => Partial<CombatState>;
  }) => void;
}

interface ParkedGroupStore {
  actions: ParkedGroupActions;
}

interface Props {
  setState: React.Dispatch<React.SetStateAction<CombatState>>;
}

export function useParkedGroupStore({
  setState,
}: Props): ParkedGroupStore {
  const toastApi = useToast();
  const { t } = useTranslation(["common"]);

  // Add parked group from form (no combat logic)
  const addParkedGroup = useCallback(() => {
    setState((prev) => {
      const nc = prev.newCombatant;

      // Validation - return prev if invalid (no-op)
      if (!nc.name || !nc.hp) return prev;
      if (nc.initiativeGroups.length === 0) return prev;
      if (nc.initiativeGroups.some((g) => !g.initiative || !g.count)) return prev;

      // Create group
      const groupToAdd: NewCombatant = {
        ...nc,
        maxHp: nc.maxHp || nc.hp,
        templateOrigin:
          prev.newCombatant.templateOrigin.origin !== "no_template"
            ? prev.newCombatant.templateOrigin
            : { origin: "parked_group", id: nc.id },
      };

      // Replace existing group with same name
      const filteredGroups = prev.parkedGroups.filter(
        (g) => g.name !== nc.name
      );

      // Return new state
      return {
        ...prev,
        parkedGroups: [...filteredGroups, groupToAdd],
      };
    });

    toastApi.success(t("common:confirmation.addedToParkedGroup.success"));
  }, [setState, toastApi, t]);

  // Orchestration action: add parked group and optionally add to combat
  const addParkedGroupFromForm = useCallback(
    ({ isFightModeEnabled, prepareCombatantList, resetForm }: {
      isFightModeEnabled: boolean;
      prepareCombatantList: (prev: CombatState, nc: NewCombatant) => Combatant[];
      resetForm: () => Partial<CombatState>;
    }) => {
      setState((prev) => {
        const nc = prev.newCombatant;

        // Validation
        if (!nc.name || !nc.hp) return prev;
        if (nc.initiativeGroups.length === 0) return prev;
        if (nc.initiativeGroups.some((g) => !g.initiative || !g.count)) return prev;

        // Create parked group
        const groupToAdd: NewCombatant = {
          ...nc,
          maxHp: nc.maxHp || nc.hp,
          templateOrigin:
            prev.newCombatant.templateOrigin.origin !== "no_template"
              ? prev.newCombatant.templateOrigin
              : { origin: "parked_group", id: nc.id },
        };

        const filteredGroups = prev.parkedGroups.filter((g) => g.name !== nc.name);

        // Compute combatants if fight mode enabled
        const combatants = isFightModeEnabled
          ? prepareCombatantList(prev, {
              ...nc,
              maxHp: nc.maxHp || nc.hp,
              templateOrigin:
                prev.newCombatant.templateOrigin.origin !== "no_template"
                  ? prev.newCombatant.templateOrigin
                  : { origin: "parked_group", id: nc.id },
            })
          : prev.combatants;

        // Get form reset patch
        const formPatch = resetForm();

        // Apply ALL changes atomically
        return {
          ...prev,
          parkedGroups: [...filteredGroups, groupToAdd],
          ...formPatch,
          combatants,
        };
      });

      toastApi.success(t("common:confirmation.addedToParkedGroup.success"));
    },
    [setState, toastApi, t]
  );

  // Remove parked group by name
  const removeParkedGroup = useCallback(
    (name: string) => {
      setState((prev) => ({
        ...prev,
        parkedGroups: prev.parkedGroups.filter((g) => g.name !== name),
      }));
    },
    [setState]
  );

  // Include parked group into form
  const includeParkedGroup = useCallback(
    (combatant: NewCombatant) => {
      setState((prev) => ({
        ...prev,
        newCombatant: combatant,
      }));
    },
    [setState]
  );

  return {
    actions: {
      addParkedGroup,
      removeParkedGroup,
      includeParkedGroup,
      addParkedGroupFromForm,
    },
  };
}
