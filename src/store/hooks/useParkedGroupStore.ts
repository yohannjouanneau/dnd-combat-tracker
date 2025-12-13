import { useCallback } from "react";
import type { CombatState, NewCombatant } from "../../types";
import { useToast } from "../../components/common/Toast/useToast";
import { useTranslation } from "react-i18next";

interface ParkedGroupActions {
  addParkedGroup: () => void;
  removeParkedGroup: (name: string) => void;
  includeParkedGroup: (combatant: NewCombatant) => void;
}

interface ParkedGroupStore {
  actions: ParkedGroupActions;
}

interface Props {
  combatState: CombatState;
  updateState: (patch: Partial<CombatState>) => void;
}

export function useParkedGroupStore({
  combatState,
  updateState,
}: Props): ParkedGroupStore {
  const toastApi = useToast();
  const { t } = useTranslation(["common"]);

  // Add parked group from form (no combat logic)
  const addParkedGroup = useCallback(() => {
    const nc = combatState.newCombatant;

    // Validation
    if (!nc.name || !nc.hp) return;
    if (nc.initiativeGroups.length === 0) return;
    if (nc.initiativeGroups.some((g) => !g.initiative || !g.count)) return;

    // Create group with maxHp and templateOrigin
    const groupToAdd: NewCombatant = {
      ...nc,
      maxHp: nc.maxHp || nc.hp,
      templateOrigin:
        combatState.newCombatant.templateOrigin.origin !== "no_template"
          ? combatState.newCombatant.templateOrigin
          : {
              origin: "parked_group",
              id: nc.id,
            },
    };

    // Replace existing group with same name
    const filteredGroups = combatState.parkedGroups.filter(
      (g) => g.name !== nc.name
    );

    // Update state
    updateState({
      parkedGroups: [...filteredGroups, groupToAdd],
    });

    toastApi.success(t("common:confirmation.addedToParkedGroup.success"));
  }, [combatState, updateState, toastApi, t]);

  // Remove parked group by name
  const removeParkedGroup = useCallback(
    (name: string) => {
      updateState({
        parkedGroups: combatState.parkedGroups.filter((g) => g.name !== name),
      });
    },
    [combatState.parkedGroups, updateState]
  );

  // Include parked group into form
  const includeParkedGroup = useCallback(
    (combatant: NewCombatant) => {
      updateState({
        newCombatant: combatant,
      });
    },
    [updateState]
  );

  return {
    actions: {
      addParkedGroup,
      removeParkedGroup,
      includeParkedGroup,
    },
  };
}
