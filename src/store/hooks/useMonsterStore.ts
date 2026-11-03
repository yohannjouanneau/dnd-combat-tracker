import { useCallback, useState, useEffect, useMemo } from "react";
import type {
  ApiSearchMode,
  ApiVersion,
  CombatState,
  MonsterCombatant,
  SavedMonster,
  SearchResult,
  SearchSource,
} from "../../types";
import type { ApiMonster } from "../../api/types";
import type { CombatantFormStore } from "./useCombatantFormStore";
import { dataStore } from "../../persistence/storage";
import { searchMonsters2024 } from "../../api/dnd5e2024Client";
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
  setApiMode: (mode: ApiSearchMode) => void;
  searchWithLibrary: (
    query: string,
    source?: SearchSource,
  ) => Promise<SearchResult[]>;
  addCombatantToLibrary: () => Promise<void>;
  isUsedAsTemplate: (id: string) => Promise<boolean>;
}

interface MonsterStoreState {
  monsters: SavedMonster[];
  apiMode: ApiSearchMode;
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
  // Choice of the D&D API ruleset(s) used for API searches (persisted locally)
  const [apiMode, setApiModeState] = useState<ApiSearchMode>(
    () => dataStore.getApiSearchMode() ?? "2024",
  );
  const setApiMode = useCallback((mode: ApiSearchMode) => {
    dataStore.setApiSearchMode(mode);
    setApiModeState(mode);
  }, []);

  // Internal dependencies
  const apiClient2014 = useMemo(() => createGraphQLClient(), []);
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
    [setState],
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
    [loadMonsters],
  );

  const removeMonster = useCallback(
    async (id: string) => {
      await dataStore.deleteMonster(id);
      await loadMonsters();
    },
    [loadMonsters],
  );

  const updateMonster = useCallback(
    async (id: string, monster: SavedMonster) => {
      await dataStore.updateMonster(id, monster);
      await loadMonsters();

      // Sync notes to active combatants and parked groups
      syncMonsterNotesToCombat(id, monster.notes || "");
    },
    [loadMonsters, syncMonsterNotesToCombat],
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
    [combatantFormStore, state.newCombatant.notes],
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
    [combatantFormStore],
  );

  const loadMonsterToForm = useCallback(
    (searchResult: SearchResult) => {
      if (searchResult.source === "api") {
        fillFormWithMonsterRemoteData(searchResult.monster as ApiMonster);
      } else {
        fillFormWithMonsterLibraryData(searchResult.monster as SavedMonster);
      }
    },
    [fillFormWithMonsterRemoteData, fillFormWithMonsterLibraryData],
  );

  const searchWithLibrary = useCallback(
    async (query: string, source?: SearchSource) => {
      const results: SearchResult[] = [];

      if (source === "api" || !source) {
        // Search the selected ruleset(s); one failing API must not hide the other
        const versions: ApiVersion[] =
          apiMode === "both" ? ["2024", "2014"] : [apiMode];
        const searches = await Promise.allSettled(
          versions.map((version) =>
            version === "2024"
              ? searchMonsters2024(query)
              : apiClient2014.searchMonsters(query),
          ),
        );
        searches.forEach((outcome, i) => {
          if (outcome.status === "rejected") {
            console.error(
              `API search failed (${versions[i]}):`,
              outcome.reason,
            );
            return;
          }
          results.push(
            ...outcome.value.map((m) => ({
              source: "api" as const,
              monster: m,
              apiVersion: versions[i],
            })),
          );
        });
      }

      if (source === "library" || !source) {
        // Search local library
        try {
          const libraryMonsters = await dataStore.searchMonster(query);
          results.push(
            ...libraryMonsters.map((m) => ({
              source: "library" as const,
              monster: m,
            })),
          );
        } catch (error) {
          console.error("Library search failed:", error);
        }
      }

      return results;
    },
    [apiMode, apiClient2014],
  );

  const addCombatantToLibrary = useCallback(async () => {
    const nc = state.newCombatant;
    const someInitAreIncomplete = nc.initiativeGroups.some(
      (g) => !g.initiative || !g.count,
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

  const isUsedAsTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Fetch all saved combats (optimized data with references)
      const allCombats = await dataStore.listCombat();

      // Check each combat's combatants and parked groups
      for (const combat of allCombats) {
        // Check combatants
        for (const combatant of combat.data.combatants) {
          if (
            combatant.templateOrigin?.origin === "monster_library" &&
            combatant.templateOrigin.id === id
          ) {
            return true; // Early exit on first match
          }
        }

        // Check parked groups
        for (const group of combat.data.parkedGroups) {
          if (
            group.templateOrigin?.origin === "monster_library" &&
            group.templateOrigin.id === id
          ) {
            return true; // Early exit on first match
          }
        }
      }

      return false; // No usage found
    } catch (error) {
      console.error("Error checking if monster is used as template:", error);
      return false; // Safe fallback
    }
  }, []);

  // Load monsters on mount
  useEffect(() => {
    loadMonsters();
  }, [loadMonsters]);

  return {
    state: {
      monsters,
      apiMode,
    },
    actions: {
      loadMonsters,
      createMonster,
      removeMonster,
      updateMonster,
      loadMonsterToForm,
      setApiMode,
      searchWithLibrary,
      addCombatantToLibrary,
      isUsedAsTemplate,
    },
  };
}
