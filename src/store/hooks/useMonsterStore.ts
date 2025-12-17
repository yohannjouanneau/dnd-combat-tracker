import { useCallback, useState, useEffect, useMemo } from "react";
import type {
  CombatState,
  MonsterCombatant,
  SavedMonster,
  SearchResult,
  SearchSource,
} from "../../types";
import type { ApiMonster } from "../../api/types";
import type { CombatantFormStore } from "./useCombatantFormStore";
import { dataStore } from "../../persistence/storage";
import { createGraphQLClient } from "../../api/DnD5eGraphQLClient";
import { getStatModifier, getApiImageUrl } from "../../utils/utils";
import { appendFormattedActions } from "../../utils/monsterNotes";
import { useToast } from "../../components/common/Toast/useToast";
import { useTranslation } from "react-i18next";

interface MonsterStoreActions {
  loadMonsters: () => Promise<void>;
  createMonster: (monster: MonsterCombatant) => Promise<void>;
  removeMonster: (id: string) => Promise<void>;
  updateMonster: (id: string, monster: SavedMonster) => Promise<void>;
  loadMonsterToForm: (searchTerm: SearchResult) => void;
  searchWithLibrary: (
    query: string,
    source?: SearchSource
  ) => Promise<SearchResult[]>;
  addCombatantToLibrary: () => Promise<void>;
}

interface MonsterStoreState {
  monsters: SavedMonster[];
}

interface MonsterStore {
  actions: MonsterStoreActions;
  state: MonsterStoreState;
}

interface Props {
  state: CombatState;
  setState: React.Dispatch<React.SetStateAction<CombatState>>;
  combatantFormStore: CombatantFormStore;
}

export function useMonsterStore({
  state,
  setState,
  combatantFormStore,
}: Props): MonsterStore {
  // Internal state for monsters
  const [monsters, setMonsters] = useState<SavedMonster[]>([]);

  // Internal dependencies
  const apiClient = useMemo(() => createGraphQLClient(), []);
  const toastApi = useToast();
  const { t } = useTranslation(["common"]);

  const syncMonsterNotesToCombat = useCallback(
    (monsterId: string, notes: string) => {
      setState((prev) => ({
        ...prev,
        // Update active combatants
        combatants: prev.combatants.map((combatant) => {
          // Check if combatant references this monster
          if (
            combatant.templateOrigin?.origin === "monster_library" &&
            combatant.templateOrigin.id === monsterId
          ) {
            return { ...combatant, notes };
          }
          return combatant;
        }),
        // Update parked groups
        parkedGroups: prev.parkedGroups.map((group) => {
          // Check if parked group references this monster
          if (
            group.templateOrigin?.origin === "monster_library" &&
            group.templateOrigin.id === monsterId
          ) {
            return { ...group, notes };
          }
          return group;
        }),
      }));
    },
    [setState]
  );

  const loadMonsters = useCallback(async () => {
    const monsterList = await dataStore.listMonster();
    setMonsters(monsterList);
  }, []);

  const createMonster = useCallback(
    async (monster: MonsterCombatant) => {
      await dataStore.createMonster(monster);
      await loadMonsters();
    },
    [loadMonsters]
  );

  const removeMonster = useCallback(
    async (id: string) => {
      await dataStore.deleteMonster(id);
      await loadMonsters();
    },
    [loadMonsters]
  );

  const updateMonster = useCallback(
    async (id: string, monster: SavedMonster) => {
      await dataStore.updateMonster(id, monster);
      await loadMonsters();

      // Sync notes to active combatants and parked groups
      syncMonsterNotesToCombat(id, monster.notes || "");
    },
    [loadMonsters, syncMonsterNotesToCombat]
  );

  const fillFormWithMonsterRemoteData = useCallback(
    (monster: ApiMonster) => {
      combatantFormStore.actions.updateNewCombatant({
        name: monster.name,
        hp: monster.hit_points ?? 0,
        maxHp: monster.hit_points ?? 0,
        initBonus: monster.dexterity
          ? getStatModifier(monster.dexterity)
          : undefined,
        ac: monster.armor_class?.at(0)?.value ?? 0,
        imageUrl: getApiImageUrl(monster),
        notes: appendFormattedActions(state.newCombatant.notes, monster),
      });
    },
    [combatantFormStore, state.newCombatant.notes]
  );

  const fillFormWithMonsterLibraryData = useCallback(
    (monster: SavedMonster) => {
      const dexMod = getStatModifier(monster.dex);
      combatantFormStore.actions.updateNewCombatant({
        name: monster.name,
        hp: monster.hp,
        maxHp: monster.hp,
        ac: monster.ac,
        imageUrl: monster.imageUrl,
        externalResourceUrl: monster.externalResourceUrl,
        initBonus: dexMod,
        str: monster.str,
        dex: monster.dex,
        con: monster.con,
        int: monster.int,
        wis: monster.wis,
        cha: monster.cha,
        notes: monster.notes,
        templateOrigin: {
          origin: "monster_library",
          id: monster.id,
        },
      });
    },
    [combatantFormStore]
  );

  const loadMonsterToForm = useCallback(
    (searchResult: SearchResult) => {
      if (searchResult.source === "api") {
        fillFormWithMonsterRemoteData(searchResult.monster as ApiMonster);
      } else {
        fillFormWithMonsterLibraryData(searchResult.monster as SavedMonster);
      }
    },
    [fillFormWithMonsterRemoteData, fillFormWithMonsterLibraryData]
  );

  const searchWithLibrary = useCallback(
    async (query: string, source?: SearchSource) => {
      const results: SearchResult[] = [];

      if (source === "api" || !source) {
        // Search API
        try {
          const apiMonsters = await apiClient.searchMonsters(query);
          results.push(
            ...apiMonsters.map((m) => ({
              source: "api" as const,
              monster: m,
            }))
          );
        } catch (error) {
          console.error("API search failed:", error);
        }
      }

      if (source === "library" || !source) {
        // Search local library
        try {
          const libraryMonsters = await dataStore.searchMonster(query);
          results.push(
            ...libraryMonsters.map((m) => ({
              source: "library" as const,
              monster: m,
            }))
          );
        } catch (error) {
          console.error("Library search failed:", error);
        }
      }

      return results;
    },
    [apiClient]
  );

  const addCombatantToLibrary = useCallback(async () => {
    const nc = state.newCombatant;
    const someInitAreIncomplete = nc.initiativeGroups.some(
      (g) => !g.initiative || !g.count
    );
    if (
      !nc.name ||
      !nc.hp ||
      nc.initiativeGroups.length === 0 ||
      someInitAreIncomplete
    ) {
      return;
    }

    await createMonster({
      ...nc,
      maxHp: nc.maxHp || nc.hp,
      type: "monster",
    });
    toastApi.success(t("common:confirmation.addToLibrary.success"));
  }, [state.newCombatant, createMonster, toastApi, t]);

  // Load monsters on mount
  useEffect(() => {
    loadMonsters();
  }, [loadMonsters]);

  return {
    state: {
      monsters,
    },
    actions: {
      loadMonsters,
      createMonster,
      removeMonster,
      updateMonster,
      loadMonsterToForm,
      searchWithLibrary,
      addCombatantToLibrary,
    },
  };
}
