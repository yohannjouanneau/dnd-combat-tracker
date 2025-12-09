import type {
  Combatant,
  CombatState,
  NewCombatant,
  SavedPlayer,
  SavedMonster,
} from "../types";
import type { DataStore } from "./storage";

// Optimization functions

/**
 * Optimizes a combatant for storage by removing template fields for library/parked references.
 *
 * For combatants from libraries or parked groups, returns a lightweight reference object
 * containing only runtime state fields (hp, conditions, initiative, etc.) and a
 * templateOrigin pointer. Template fields (name, ac, maxHp, ability scores, presentation)
 * are omitted to save storage space.
 *
 * For combatants with origin "no_template", returns the full combatant unchanged.
 *
 * The returned reference object has isReference=true and should be restored using
 * restoreCombatant() before accessing template fields.
 *
 * @param combatant - The combatant to optimize
 * @returns Optimized combatant (may be a reference)
 * @see restoreCombatant
 */
export function optimizeCombatant(combatant: Combatant): Combatant {
  const origin = combatant.templateOrigin?.origin;

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
    // Type assertion is safe here because we're intentionally creating
    // a partial object with isReference=true as a storage optimization.
    // The object will be restored to full Combatant via restoreCombatant().
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

/**
 * Optimizes a parked group for storage by removing template fields for library references.
 *
 * For parked groups from libraries, returns a lightweight reference object
 * containing only templateOrigin, initiative data, and color.
 *
 * For parked groups with origin "no_template" or "parked_group", returns the full group unchanged.
 *
 * The returned reference object has isReference=true and should be restored using
 * restoreParkedGroup() before accessing template fields.
 *
 * @param group - The parked group to optimize
 * @returns Optimized parked group (may be a reference)
 * @see restoreParkedGroup
 */
export function optimizeParkedGroup(group: NewCombatant): NewCombatant {
  const origin = group.templateOrigin?.origin;

  // Keep full data for no_template and parked_group
  if (!origin || origin === "no_template" || origin === "parked_group") {
    return group;
  }

  // For library references, keep templateOrigin + initiative data + color
  if (origin === "player_library" || origin === "monster_library") {
    // Type assertion is safe here because we're intentionally creating
    // a partial object with isReference=true as a storage optimization.
    // The object will be restored to full NewCombatant via restoreParkedGroup().
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

/**
 * Prepares combat state for storage by optimizing combatants and parked groups.
 *
 * @param state - The combat state to optimize
 * @returns Optimized combat state ready for storage
 * @see optimizeCombatant
 * @see optimizeParkedGroup
 */
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
    if (combatant.templateOrigin?.origin) {
      return combatant;
    }

    // Try to find match in libraries by name
    const playerMatch = players.find((p) => p.name === combatant.name);
    if (playerMatch) {
      return {
        ...combatant,
        templateOrigin: {
          origin: "player_library" as const,
          id: playerMatch.id,
        },
      };
    }

    const monsterMatch = monsters.find((m) => m.name === combatant.name);
    if (monsterMatch) {
      return {
        ...combatant,
        templateOrigin: {
          origin: "monster_library" as const,
          id: monsterMatch.id,
        },
      };
    }

    // No match found, mark as no_template
    return {
      ...combatant,
      templateOrigin: {
        origin: "no_template" as const,
        id: "",
      },
    };
  });

  // Migrate parked groups
  const migratedParkedGroups = state.parkedGroups.map((group) => {
    // If already has templateOrigin, no migration needed
    if (group.templateOrigin?.origin) {
      return group;
    }

    // Try to find match in libraries by name
    const playerMatch = players.find((p) => p.name === group.name);
    if (playerMatch) {
      return {
        ...group,
        templateOrigin: {
          origin: "player_library" as const,
          id: playerMatch.id,
        },
      };
    }

    const monsterMatch = monsters.find((m) => m.name === group.name);
    if (monsterMatch) {
      return {
        ...group,
        templateOrigin: {
          origin: "monster_library" as const,
          id: monsterMatch.id,
        },
      };
    }

    // No match found, mark as no_template
    return {
      ...group,
      templateOrigin: {
        origin: "no_template" as const,
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

/**
 * Migrates template origin field from legacy 'orgin' to 'origin'.
 *
 * @param obj - Object with templateOrigin field to migrate
 */
export function migrateTemplateOriginField(
  obj: { templateOrigin?: Record<string, unknown> }
): void {
  if (obj.templateOrigin && "orgin" in obj.templateOrigin) {
    obj.templateOrigin.origin = obj.templateOrigin.orgin;
    delete obj.templateOrigin.orgin;
  }
}

/**
 * Migrates all template origin fields in a combat state.
 *
 * @param state - The combat state to migrate
 * @returns Migrated combat state
 */
export function migrateCombatStateFieldNames(state: CombatState): CombatState {
  state.combatants.forEach(migrateTemplateOriginField);
  state.parkedGroups.forEach(migrateTemplateOriginField);
  migrateTemplateOriginField(state.newCombatant);
  return state;
}

// Restoration functions

/**
 * Restores a combatant reference to a full combatant by fetching template data.
 *
 * If the combatant is a reference (isReference=true), fetches the template from
 * the appropriate library and merges it with runtime state.
 *
 * If not a reference, returns the combatant unchanged.
 *
 * @param combatant - The combatant to restore
 * @param dataStore - Data store for fetching templates
 * @param parkedGroups - Restored parked groups for parked_group origin lookups
 * @returns Fully restored combatant
 * @throws Error if template is not found
 */
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
  if (origin.origin === "player_library") {
    template = await dataStore.getPlayer(origin.id);
  } else if (origin.origin === "monster_library") {
    template = await dataStore.getMonster(origin.id);
  } else if (origin.origin === "parked_group") {
    // Template is in the parked groups (combatant was added from a parked group)
    template = parkedGroups.find((pg) => pg.id === origin.id);
  }

  if (!template) {
    // Template not found - throw error
    throw new Error(
      `Template not found for combatant ${combatant.id}, origin: ${origin.origin}, id: ${origin.id}`
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

/**
 * Restores a parked group reference to a full template by fetching from libraries.
 *
 * If the parked group is a reference (isReference=true), fetches the template from
 * the appropriate library and merges it with saved initiative data and color.
 *
 * If not a reference, returns the parked group unchanged.
 *
 * @param group - The parked group to restore
 * @param dataStore - Data store for fetching templates
 * @returns Fully restored parked group
 * @throws Error if template is not found
 */
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
  if (origin.origin === "player_library") {
    template = await dataStore.getPlayer(origin.id);
  } else if (origin.origin === "monster_library") {
    template = await dataStore.getMonster(origin.id);
  }

  if (!template) {
    // Template not found - throw error
    throw new Error(
      `Template not found for parked group, origin: ${origin.origin}, id: ${origin.id}`
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

/**
 * Restores a complete combat state by restoring all combatant and parked group references.
 *
 * Parked groups are restored first, then combatants (which may reference parked groups).
 *
 * @param state - The combat state to restore
 * @param dataStore - Data store for fetching templates
 * @returns Fully restored combat state
 * @see restoreCombatant
 * @see restoreParkedGroup
 */
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
