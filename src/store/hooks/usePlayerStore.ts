import { useState, useCallback, useEffect } from "react";
import type { CombatState, SavedPlayer, NewCombatant, Combatant } from "../../types";
import { dataStore } from "../../persistence/storage";
import { generateId } from "../../utils/utils";
import { useToast } from "../../components/common/Toast/useToast";
import { useTranslation } from "react-i18next";

interface PlayerActions {
  loadPlayers: () => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  includePlayer: (player: SavedPlayer) => Promise<void>;
  addPlayerFromForm: () => Promise<void>;
  savePlayerFromForm: (params: {
    isFightModeEnabled: boolean;
    prepareCombatantList: (prev: CombatState, nc: NewCombatant) => Combatant[];
    resetForm: () => Partial<CombatState>;
  }) => Promise<void>;
  updatePlayerInitiative: (id: string, initiative: number) => Promise<void>;
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
  updateState: (patch: Partial<CombatState>) => void;
}

export function usePlayerStore({
  combatState,
  updateState,
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
    async (player: SavedPlayer) => {
      // Read fresh player data directly from dataStore to avoid stale React state
      const freshPlayer = await dataStore.getPlayer(player.id) ?? player;
      updateState({
        newCombatant: {
          id: generateId(),
          type: "player",
          name: freshPlayer.name,
          initiativeGroups: freshPlayer.initiativeGroups,
          hp: freshPlayer.hp,
          maxHp: freshPlayer.maxHp,
          ac: freshPlayer.ac,
          color: freshPlayer.color,
          imageUrl: freshPlayer.imageUrl,
          initBonus: freshPlayer.initBonus,
          externalResourceUrl: freshPlayer.externalResourceUrl,
          templateOrigin: {
            origin: "player_library",
            id: freshPlayer.id,
          },
        },
      });
    },
    [updateState]
  );

  // Add player from form to dataStore
  const addPlayerFromForm = useCallback(
    async () => {
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

      toastApi.success(t("common:confirmation.addedPlayer.success"));
    },
    [combatState, savedPlayers, loadPlayers, toastApi, t]
  );

  // Orchestration action: save player and optionally add to combat
  const savePlayerFromForm = useCallback(
    async ({ isFightModeEnabled, prepareCombatantList, resetForm }: {
      isFightModeEnabled: boolean;
      prepareCombatantList: (prev: CombatState, nc: NewCombatant) => Combatant[];
      resetForm: () => Partial<CombatState>;
    }) => {
      // Capture current newCombatant value
      const nc = combatState.newCombatant;

      // Validation
      if (!nc.name || !nc.hp) return;
      if (nc.initiativeGroups.length === 0) return;
      if (nc.initiativeGroups.some((g) => !g.initiative || !g.count)) return;

      // Pre-compute new combatants BEFORE async operations
      const newCombatants = isFightModeEnabled
        ? prepareCombatantList(combatState, nc)
        : combatState.combatants;

      // Get form patch BEFORE async operations
      const formPatch = resetForm();

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

      // Reload players
      await loadPlayers();

      // Show toast
      toastApi.success(t("common:confirmation.addedPlayer.success"));

      // Update state with pre-computed values (not reading from combatState)
      updateState({
        ...formPatch,
        combatants: newCombatants,
      });
    },
    [combatState, savedPlayers, loadPlayers, toastApi, t, updateState]
  );

  // Update player initiative
  const updatePlayerInitiative = useCallback(
    async (id: string, initiative: number) => {
      // Find existing player to preserve initiative group ID
      const player = savedPlayers.find((p) => p.id === id);
      const existingGroup = player?.initiativeGroups[0];

      await dataStore.updatePlayer(id, {
        initiativeGroups: [
          {
            id: existingGroup?.id ?? generateId(),
            initiative: String(initiative),
            count: existingGroup?.count ?? "1",
          },
        ],
      });
      await loadPlayers();
    },
    [loadPlayers, savedPlayers]
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
      savePlayerFromForm,
      updatePlayerInitiative,
    },
  };
}
