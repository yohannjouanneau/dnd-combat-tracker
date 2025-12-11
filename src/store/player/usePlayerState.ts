import type { CombatState, SavedPlayer } from "../../types";

interface PlayerActions {
  loadPlayers: () => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  includePlayer: (player: SavedPlayer) => void;
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
}

export function usePlayerState({
  combatState,
  updateState,
}: Props): PlayerStore {
  return {
    state: {
      savedPlayers: [],
    },
    actions: {
      loadPlayers: async () => {},
      removePlayer: async (id: string) => {},
      includePlayer: async (player: SavedPlayer) => {},
    },
  };
}
