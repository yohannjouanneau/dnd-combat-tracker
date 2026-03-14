import { useState, useCallback, useEffect } from "react";
import type { CombatState, SavedPlayer, PlayerCombatant } from "../../types";
import { dataStore } from "../../persistence/storage";
import { generateId } from "../../utils/utils";

interface PlayerActions {
  loadPlayers: () => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  updatePlayerInitiative: (id: string, initiative: number) => Promise<void>;
  createPlayer: (player: PlayerCombatant) => Promise<void>;
  updatePlayer: (id: string, player: SavedPlayer) => Promise<void>;
  isPlayerUsedAsTemplate: (id: string) => Promise<boolean>;
  linkPlayer: (playerId: string) => void;
  unlinkPlayer: (playerId: string) => void;
}

interface PlayerState {
  savedPlayers: SavedPlayer[];
}

interface PlayerStore {
  state: PlayerState;
  actions: PlayerActions;
}

interface Props {
  updateState: (patch: Partial<CombatState> | ((prev: CombatState) => Partial<CombatState>)) => void;
}

export function usePlayerStore({ updateState }: Props): PlayerStore {
  // Local reactive state for saved players
  const [savedPlayers, setSavedPlayers] = useState<SavedPlayer[]>([]);


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

  // Create a new player from the library
  const createPlayer = useCallback(
    async (player: PlayerCombatant) => {
      await dataStore.createPlayer(player);
      await loadPlayers();
    },
    [loadPlayers]
  );

  // Update an existing player from the library
  const updatePlayer = useCallback(
    async (id: string, player: SavedPlayer) => {
      await dataStore.updatePlayer(id, player);
      await loadPlayers();
    },
    [loadPlayers]
  );

  // Link a player to the current combat
  const linkPlayer = useCallback(
    (playerId: string) => {
      updateState((prev) => {
        const current = prev.linkedPlayerIds ?? [];
        if (current.includes(playerId)) return {};
        return { linkedPlayerIds: [...current, playerId] };
      });
    },
    [updateState]
  );

  // Unlink a player from the current combat
  const unlinkPlayer = useCallback(
    (playerId: string) => {
      updateState((prev) => ({
        linkedPlayerIds: (prev.linkedPlayerIds ?? []).filter((id) => id !== playerId),
      }));
    },
    [updateState]
  );

  // Check if a player is used as a template in any saved combat
  const isPlayerUsedAsTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const allCombats = await dataStore.listCombat();
      for (const combat of allCombats) {
        for (const combatant of combat.data.combatants) {
          if (
            combatant.templateOrigin?.origin === "player_library" &&
            combatant.templateOrigin.id === id
          ) {
            return true;
          }
        }
        for (const group of combat.data.parkedGroups) {
          if (
            group.templateOrigin?.origin === "player_library" &&
            group.templateOrigin.id === id
          ) {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking if player is used as template:", error);
      return false;
    }
  }, []);

  return {
    state: {
      savedPlayers,
    },
    actions: {
      loadPlayers,
      removePlayer,
      updatePlayerInitiative,
      createPlayer,
      updatePlayer,
      isPlayerUsedAsTemplate,
      linkPlayer,
      unlinkPlayer,
    },
  };
}
