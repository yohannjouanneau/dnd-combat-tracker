import type {
  Combatant,
  CombatState,
  NewCombatant,
  SavedPlayer,
  SavedMonster,
} from "../types";
import type { DataStore } from "./storage";

// Optimization functions
export function optimizeCombatant(combatant: Combatant): Combatant {
  const origin = combatant.templateOrigin?.orgin;

  // Keep full data for no_template
  if (!origin || origin === "no_template") {
    return combatant;
  }

  // For library/parked references, keep only templateOrigin + runtime state
  if (
    origin === "monster_library" ||
    origin === "player_library" ||
    origin === "parked_group"
  ) {
    return {
      id: combatant.id,
      templateOrigin: combatant.templateOrigin,
      initiative: combatant.initiative,
      displayName: combatant.displayName,
      groupIndex: combatant.groupIndex,
      hp: combatant.hp,
      conditions: combatant.conditions,
      concentration: combatant.concentration,
      deathSaves: combatant.deathSaves,
      isReference: true,
    } as Combatant;
  }

  return combatant;
}

export function optimizeParkedGroup(group: NewCombatant): NewCombatant {
  const origin = group.templateOrigin?.orgin;

  // Keep full data for no_template and parked_group
  if (!origin || origin === "no_template" || origin === "parked_group") {
    return group;
  }

  // For library references, keep templateOrigin + initiative data + color
  if (origin === "player_library" || origin === "monster_library") {
    return {
      id: group.id,
      templateOrigin: group.templateOrigin,
      initiativeGroups: group.initiativeGroups,
      initBonus: group.initBonus,
      color: group.color,
      isReference: true,
    } as NewCombatant;
  }

  return group;
}

export function cleanCombatStateForStorage(state: CombatState): CombatState {
  return {
    ...state,
    combatants: state.combatants.map(optimizeCombatant),
    parkedGroups: state.parkedGroups.map(optimizeParkedGroup),
  };
}

// Migration function for legacy data
export async function migrateLegacyData(
  state: CombatState,
  dataStore: DataStore
): Promise<CombatState> {
  // Get libraries for matching
  const [players, monsters] = await Promise.all([
    dataStore.listPlayer(),
    dataStore.listMonster(),
  ]);

  // Migrate combatants
  const migratedCombatants = state.combatants.map((combatant) => {
    // If already has templateOrigin, no migration needed
    if (combatant.templateOrigin?.orgin) {
      return combatant;
    }

    // Try to find match in libraries by name
    const playerMatch = players.find((p) => p.name === combatant.name);
    if (playerMatch) {
      return {
        ...combatant,
        templateOrigin: {
          orgin: "player_library" as const,
          id: playerMatch.id,
        },
      };
    }

    const monsterMatch = monsters.find((m) => m.name === combatant.name);
    if (monsterMatch) {
      return {
        ...combatant,
        templateOrigin: {
          orgin: "monster_library" as const,
          id: monsterMatch.id,
        },
      };
    }

    // No match found, mark as no_template
    return {
      ...combatant,
      templateOrigin: {
        orgin: "no_template" as const,
        id: "",
      },
    };
  });

  // Migrate parked groups
  const migratedParkedGroups = state.parkedGroups.map((group) => {
    // If already has templateOrigin, no migration needed
    if (group.templateOrigin?.orgin) {
      return group;
    }

    // Try to find match in libraries by name
    const playerMatch = players.find((p) => p.name === group.name);
    if (playerMatch) {
      return {
        ...group,
        templateOrigin: {
          orgin: "player_library" as const,
          id: playerMatch.id,
        },
      };
    }

    const monsterMatch = monsters.find((m) => m.name === group.name);
    if (monsterMatch) {
      return {
        ...group,
        templateOrigin: {
          orgin: "monster_library" as const,
          id: monsterMatch.id,
        },
      };
    }

    // No match found, mark as no_template
    return {
      ...group,
      templateOrigin: {
        orgin: "no_template" as const,
        id: "",
      },
    };
  });

  return {
    ...state,
    combatants: migratedCombatants,
    parkedGroups: migratedParkedGroups,
  };
}

// Restoration functions
export async function restoreCombatant(
  combatant: Combatant,
  dataStore: DataStore,
  parkedGroups: NewCombatant[] = []
): Promise<Combatant> {
  // If not a reference, return as-is
  if (!combatant.isReference) {
    return combatant;
  }

  const origin = combatant.templateOrigin;
  let template: SavedPlayer | SavedMonster | NewCombatant | undefined = undefined;

  // Fetch template from appropriate source
  if (origin.orgin === "player_library") {
    template = await dataStore.getPlayer(origin.id);
  } else if (origin.orgin === "monster_library") {
    template = await dataStore.getMonster(origin.id);
  } else if (origin.orgin === "parked_group") {
    // Template is in the parked groups (combatant was added from a parked group)
    template = parkedGroups.find((pg) => pg.id === origin.id);
  }

  if (!template) {
    // Template not found - create fallback combatant
    throw(
      `Template not found for combatant ${combatant.id}, origin: ${origin.orgin}, id: ${origin.id}`
    );
  }

  // Merge template data with runtime state
  return {
    ...template,
    id: combatant.id,
    displayName: combatant.displayName,
    initiative: combatant.initiative,
    groupIndex: combatant.groupIndex,
    hp: combatant.hp ?? template.hp,
    conditions: combatant.conditions,
    concentration: combatant.concentration,
    deathSaves: combatant.deathSaves,
    templateOrigin: combatant.templateOrigin,
  };
}

export async function restoreParkedGroup(
  group: NewCombatant,
  dataStore: DataStore
): Promise<NewCombatant> {
  // If not a reference, return as-is
  if (!group.isReference) {
    return group;
  }

  const origin = group.templateOrigin;
  let template: SavedPlayer | SavedMonster | undefined = undefined;

  // Fetch template from appropriate library
  if (origin.orgin === "player_library") {
    template = await dataStore.getPlayer(origin.id);
  } else if (origin.orgin === "monster_library") {
    template = await dataStore.getMonster(origin.id);
  }

  if (!template) {
    // Template not found - create fallback with minimal data
    throw(
      `Template not found for parked group, origin: ${origin.orgin}, id: ${origin.id}`
    );
  }

  // Return template with templateOrigin and initiative data + color from the reference
  return {
    ...template,
    id: group.id,
    templateOrigin: origin,
    initiativeGroups: group.initiativeGroups,
    initBonus: group.initBonus ?? template.initBonus ?? 0,
    color: group.color,
  };
}

export async function restoreCombatState(
  state: CombatState,
  dataStore: DataStore
): Promise<CombatState> {
  // Restore parked groups first (combatants may reference them)
  const parkedGroups = await Promise.all(
    state.parkedGroups.map((g) => restoreParkedGroup(g, dataStore))
  );

  // Then restore combatants (passing restored parked groups for parked_group origin lookups)
  const combatants = await Promise.all(
    state.combatants.map((c) => restoreCombatant(c, dataStore, parkedGroups))
  );

  return {
    ...state,
    combatants,
    parkedGroups,
  };
}
