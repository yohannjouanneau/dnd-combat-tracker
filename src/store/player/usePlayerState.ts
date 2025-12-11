import { useState, useCallback, useEffect } from "react";
import type { CombatState, SavedPlayer, NewCombatant, Combatant } from "../../types";
import { dataStore } from "../../persistence/storage";
import { generateId, generateDefaultNewCombatant } from "../../utils";
import { useToast } from "../../components/common/Toast/useToast";
import { useTranslation } from "react-i18next";

interface PlayerActions {
  loadPlayers: () => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  includePlayer: (player: SavedPlayer) => void;
  addPlayerFromForm: (isFightModeEnabled: boolean) => Promise<void>;
}

interface PlayerState {
  savedPlayers: SavedPlayer[];
}

interface PlayerStore {
  state: PlayerState;
  actions: PlayerActions;
}

interface Props {
  combatState: CombatState;
  updateState: (patch: Partial<CombatState>) => CombatState;
  prepareCombatantList: (prev: CombatState, combatant?: NewCombatant) => Combatant[];
}

export function usePlayerState({
  combatState,
  updateState,
  prepareCombatantList,
}: Props): PlayerStore {
  // Local reactive state for saved players
  const [savedPlayers, setSavedPlayers] = useState<SavedPlayer[]>([]);

  // Hooks for toast and translation
  const toastApi = useToast();
  const { t } = useTranslation(["common"]);

  // Load players from dataStore
  const loadPlayers = useCallback(async () => {
    const players = await dataStore.listPlayer();
    setSavedPlayers(players);
  }, []);

  // Load on mount
  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // Remove player from dataStore and reload
  const removePlayer = useCallback(
    async (id: string) => {
      await dataStore.deletePlayer(id);
      await loadPlayers();
    },
    [loadPlayers]
  );

  // Include player into form by updating parent's combatState
  const includePlayer = useCallback(
    (player: SavedPlayer) => {
      updateState({
        newCombatant: {
          id: generateId(),
          type: "player",
          name: player.name,
          initiativeGroups: player.initiativeGroups,
          hp: player.hp,
          maxHp: player.maxHp,
          ac: player.ac,
          color: player.color,
          imageUrl: player.imageUrl,
          initBonus: player.initBonus,
          externalResourceUrl: player.externalResourceUrl,
          templateOrigin: {
            origin: "player_library",
            id: player.id,
          },
        },
      });
    },
    [updateState]
  );

  // Add player from form to dataStore and optionally to combat
  const addPlayerFromForm = useCallback(
    async (isFightModeEnabled: boolean) => {
      const nc = combatState.newCombatant;

      // Validation
      if (!nc.name || !nc.hp) return;
      if (nc.initiativeGroups.length === 0) return;
      if (nc.initiativeGroups.some((g) => !g.initiative || !g.count)) return;

      // Check if player with same name already exists
      const existingPlayer = savedPlayers.find((p) => p.name === nc.name);

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
          id: generateId(),
          type: "player",
          name: nc.name,
          initiativeGroups: nc.initiativeGroups,
          hp: nc.hp,
          maxHp: nc.maxHp || nc.hp,
          ac: nc.ac,
          color: nc.color,
          imageUrl: nc.imageUrl,
          initBonus: nc.initBonus,
          externalResourceUrl: nc.externalResourceUrl,
        });
      }

      await loadPlayers();

      // Clear the form and optionally add to combat
      const combatants = isFightModeEnabled
        ? prepareCombatantList(combatState, nc)
        : combatState.combatants;

      updateState({
        newCombatant: generateDefaultNewCombatant(),
        combatants,
      });

      toastApi.success(t("common:confirmation.addedPlayer.success"));
    },
    [combatState, savedPlayers, loadPlayers, prepareCombatantList, updateState, toastApi, t]
  );

  return {
    state: {
      savedPlayers,
    },
    actions: {
      loadPlayers,
      removePlayer,
      includePlayer,
      addPlayerFromForm,
    },
  };
}
