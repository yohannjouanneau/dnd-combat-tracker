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
 * Optimizes a combatant for storage by removing unchanged template fields for library/parked references.
 *
 * For combatants from libraries or parked groups, fetches the original template and computes a delta,
 * storing only the fields that differ from the template. This preserves user edits while
 * minimizing storage space.
 *
 * For combatants with origin "no_template", returns the full combatant unchanged.
 *
 * The returned reference object has isReference=true and should be restored using
 * restoreCombatant() before accessing template fields.
 *
 * @param combatant - The combatant to optimize
 * @param dataStore - Data store for fetching templates to compute deltas
 * @param parkedGroups - Parked groups for parked_group origin lookups
 * @returns Optimized combatant (may be a reference with only changed fields)
 * @see restoreCombatant
 */
async function optimizeCombatant(
  combatant: Combatant,
  dataStore: DataStore,
  parkedGroups: NewCombatant[] = []
): Promise<Combatant> {
  const origin = combatant.templateOrigin?.origin;

  // Keep full data for no_template
  if (!origin || origin === "no_template") {
    return combatant;
  }

  // For library/parked references, fetch template and compute delta
  if (
    origin === "monster_library" ||
    origin === "player_library" ||
    origin === "parked_group"
  ) {
    // Fetch original template to compare
    let template: SavedPlayer | SavedMonster | NewCombatant | undefined;
    if (origin === "player_library") {
      template = await dataStore.getPlayer(combatant.templateOrigin.id);
    } else if (origin === "monster_library") {
      template = await dataStore.getMonster(combatant.templateOrigin.id);
    } else if (origin === "parked_group") {
      template = parkedGroups.find(
        (pg) => pg.id === combatant.templateOrigin.id
      );
    }

    // Compute changed fields (only if template exists)
    const overrides = template ? getChangedFormFields(combatant, template) : {};

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
      deathSaves: combatant.deathSaves,
      isReference: true,
      ...overrides,
    } as Combatant;
  }

  return combatant;
}

const COMPARABLE_FORM_FIELDS = [
  "name",
  "hp",
  "maxHp",
  "ac",
  "imageUrl",
  "externalResourceUrl",
] as const;

/**
 * Computes the fields that differ between a combatant/parked group and its template.
 *
 * @param entity - The combatant or parked group with potential edits
 * @param template - The original template from the library or parked groups
 * @returns An object containing only the fields that differ
 */
function getChangedFormFields(
  entity: NewCombatant | Combatant,
  template: SavedPlayer | SavedMonster | NewCombatant
): Partial<NewCombatant> {
  const overrides: Partial<NewCombatant> = {};

  for (const field of COMPARABLE_FORM_FIELDS) {
    if (entity[field] !== template[field]) {
      (overrides as Record<string, unknown>)[field] = entity[field];
    }
  }

  return overrides;
}

/**
 * Optimizes a parked group for storage by removing unchanged template fields for library references.
 *
 * For parked groups from libraries, fetches the original template and computes a delta,
 * storing only the fields that differ from the template. This preserves user edits while
 * minimizing storage space.
 *
 * For parked groups with origin "no_template" or "parked_group", returns the full group unchanged.
 *
 * The returned reference object has isReference=true and should be restored using
 * restoreParkedGroup() before accessing template fields.
 *
 * @param group - The parked group to optimize
 * @param dataStore - Data store for fetching templates to compute deltas
 * @returns Optimized parked group (may be a reference with only changed fields)
 * @see restoreParkedGroup
 */
async function optimizeParkedGroup(
  group: NewCombatant,
  dataStore: DataStore
): Promise<NewCombatant> {
  const origin = group.templateOrigin?.origin;

  // Keep full data for no_template and parked_group
  if (!origin || origin === "no_template" || origin === "parked_group") {
    return group;
  }

  // For library references, fetch template and compute delta
  if (origin === "player_library" || origin === "monster_library") {
    // Fetch original template to compare
    const template =
      origin === "player_library"
        ? await dataStore.getPlayer(group.templateOrigin.id)
        : await dataStore.getMonster(group.templateOrigin.id);

    // Compute changed fields (only if template exists)
    const overrides = template ? getChangedFormFields(group, template) : {};

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
      ...overrides,
    } as NewCombatant;
  }

  return group;
}

/**
 * Prepares combat state for storage by optimizing combatants and parked groups.
 *
 * @param state - The combat state to optimize
 * @param dataStore - Data store for fetching templates to compute deltas
 * @returns Optimized combat state ready for storage
 * @see optimizeCombatant
 * @see optimizeParkedGroup
 */
export async function cleanCombatStateForStorage(
  state: CombatState,
  dataStore: DataStore
): Promise<CombatState> {
  return {
    ...state,
    combatants: await Promise.all(
      state.combatants.map((c) =>
        optimizeCombatant(c, dataStore, state.parkedGroups)
      )
    ),
    parkedGroups: await Promise.all(
      state.parkedGroups.map((g) => optimizeParkedGroup(g, dataStore))
    ),
  };
}

// Restoration functions

/**
 * Restores a combatant reference to a full combatant by fetching template data.
 *
 * If the combatant is a reference (isReference=true), fetches the template from
 * the appropriate library and merges it with runtime state. Combatant overrides (user edits)
 * take precedence over template values.
 *
 * If not a reference, returns the combatant unchanged.
 *
 * @param combatant - The combatant to restore
 * @param dataStore - Data store for fetching templates
 * @param parkedGroups - Restored parked groups for parked_group origin lookups
 * @returns Fully restored combatant or undefined if no template is found
 */
async function restoreCombatant(
  combatant: Combatant,
  dataStore: DataStore,
  parkedGroups: NewCombatant[] = []
): Promise<Combatant | undefined> {
  // If not a reference, return as-is
  if (!combatant.isReference) {
    return combatant;
  }

  const origin = combatant.templateOrigin;
  let template: SavedPlayer | SavedMonster | NewCombatant | undefined =
    undefined;

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
    console.error(
      `Template not found for combatant ${combatant.id}, origin: ${origin.origin}, id: ${origin.id}`
    );
    return undefined;
  }

  // Extract combatant data without isReference (we don't want to persist it in the restored object)
  // combatantData contains user overrides that take precedence over template values
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isReference: _isRef, ...combatantData } = combatant;

  // Return template merged with combatant overrides (user edits take precedence)
  return {
    ...template, // Template provides base values
    ...combatantData, // Combatant overrides (only changed fields stored) take precedence
    hp: combatant.hp ?? template.hp,
    conditions: combatant.conditions,
    deathSaves: combatant.deathSaves,
  };
}

/**
 * Restores a parked group reference to a full template by fetching from libraries.
 *
 * If the parked group is a reference (isReference=true), fetches the template from
 * the appropriate library and merges it with saved data. Group overrides (user edits)
 * take precedence over template values.
 *
 * If not a reference, returns the parked group unchanged.
 *
 * @param group - The parked group to restore
 * @param dataStore - Data store for fetching templates
 * @returns Fully restored parked group or undefined if no template is found
 */
async function restoreParkedGroup(
  group: NewCombatant,
  dataStore: DataStore
): Promise<NewCombatant | undefined> {
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
    console.error(
      `Template not found for parked group, origin: ${origin.origin}, id: ${origin.id}`
    );
    return undefined;
  }

  // Extract groupData without isReference (we don't want to persist it in the restored object)
  // groupData contains user overrides that take precedence over template values
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isReference: _isRef, ...groupData } = group;

  // Return template merged with group overrides (user edits take precedence)
  return {
    ...template, // Template provides base values
    ...groupData, // Group overrides (only changed fields stored) take precedence
    initBonus: group.initBonus ?? template.initBonus ?? 0,
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
): Promise<CombatState | undefined> {
  try {
    // Restore parked groups first (combatants may reference them)
    const restoredGroups = await Promise.all(
      state.parkedGroups.map((g) => restoreParkedGroup(g, dataStore))
    );

    const parkedGroups = restoredGroups.filter((c) => c !== undefined);

    // Then restore combatants (passing restored parked groups for parked_group origin lookups)
    const restoredCombatants = await Promise.all(
      state.combatants.map((c) => restoreCombatant(c, dataStore, parkedGroups))
    );
    const combatants = restoredCombatants.filter((c) => c !== undefined);

    return {
      ...state,
      combatants,
      parkedGroups,
    };
  } catch (error) {
    console.log("Unable to restore combat state", error);
  }
}
