import type {
  Combatant,
  CombatantReference,
  CombatState,
  NewCombatant,
  OptimizedCombatState,
  ParkedGroupReference,
  SavedPlayer,
  SavedMonster,
} from "../types";
import type { DataStore } from "./storage";

// Type guards to check if data is optimized
export function isCombatantReference(
  combatant: Combatant | CombatantReference
): combatant is CombatantReference {
  // CombatantReference only has specific fields, missing fields like 'name', 'maxHp', 'ac', etc.
  return !("name" in combatant && "maxHp" in combatant && "ac" in combatant);
}

export function isParkedGroupReference(
  group: NewCombatant | ParkedGroupReference
): group is ParkedGroupReference {
  // ParkedGroupReference has templateOrigin + initiativeGroups, but missing other fields like name, hp, etc.
  return !("name" in group && "hp" in group && "type" in group);
}

// Optimization functions
export function optimizeCombatant(
  combatant: Combatant
): Combatant | CombatantReference {
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
    };
  }

  return combatant;
}

export function optimizeParkedGroup(
  group: NewCombatant
): NewCombatant | ParkedGroupReference {
  const origin = group.templateOrigin?.orgin;

  // Keep full data for no_template and parked_group
  if (!origin || origin === "no_template" || origin === "parked_group") {
    return group;
  }

  // For library references, keep templateOrigin + initiative data + color
  if (origin === "player_library" || origin === "monster_library") {
    return {
      templateOrigin: group.templateOrigin,
      initiativeGroups: group.initiativeGroups,
      initBonus: group.initBonus,
      color: group.color,
    };
  }

  return group;
}

export function cleanCombatStateForStorage(
  state: CombatState
): OptimizedCombatState {
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
  combatant: Combatant | CombatantReference,
  dataStore: DataStore,
  parkedGroups: NewCombatant[] = []
): Promise<Combatant> {
  // If already full combatant, return as-is
  if (!isCombatantReference(combatant)) {
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

    if (!template) {
      console.warn(
        `Parked group template not found for combatant ${combatant.id}, origin id: ${origin.id}`
      );
      // Create a minimal combatant with available data
      return {
        ...combatant,
        name: combatant.displayName,
        maxHp: combatant.hp || 0,
        ac: 10,
        color: "#3b82f6",
        imageUrl: "",
        externalResourceUrl: "",
        notes: "",
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      } as Combatant;
    }
  }

  if (!template) {
    // Template not found - create fallback combatant
    console.warn(
      `Template not found for combatant ${combatant.id}, origin: ${origin.orgin}, id: ${origin.id}`
    );
    return {
      ...combatant,
      name: combatant.displayName,
      maxHp: combatant.hp || 0,
      ac: 10,
      color: "#3b82f6",
      imageUrl: "",
      externalResourceUrl: "",
      notes: "",
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    } as Combatant;
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
  group: NewCombatant | ParkedGroupReference,
  dataStore: DataStore
): Promise<NewCombatant> {
  // If already full parked group, return as-is
  if (!isParkedGroupReference(group)) {
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
    console.warn(
      `Template not found for parked group, origin: ${origin.orgin}, id: ${origin.id}`
    );
    return {
      id: origin.id,
      name: "Unknown",
      type: "monster",
      hp: 0,
      maxHp: 0,
      ac: 10,
      color: "#3b82f6",
      imageUrl: "",
      externalResourceUrl: "",
      notes: "",
      initiativeGroups: [{ id: crypto.randomUUID(), initiative: "", count: "1" }],
      initBonus: 0,
      templateOrigin: origin,
    } as NewCombatant;
  }

  // Return template with templateOrigin and initiative data + color from the reference
  return {
    ...template,
    templateOrigin: origin,
    initiativeGroups: group.initiativeGroups,
    initBonus: group.initBonus ?? template.initBonus ?? 0,
    color: group.color,
  };
}

export async function restoreCombatState(
  optimized: OptimizedCombatState | CombatState,
  dataStore: DataStore
): Promise<CombatState> {
  // Restore parked groups first (combatants may reference them)
  const parkedGroups = await Promise.all(
    optimized.parkedGroups.map((g) => restoreParkedGroup(g, dataStore))
  );

  // Then restore combatants (passing restored parked groups for parked_group origin lookups)
  const combatants = await Promise.all(
    optimized.combatants.map((c) => restoreCombatant(c, dataStore, parkedGroups))
  );

  return {
    ...optimized,
    combatants,
    parkedGroups,
  };
}
