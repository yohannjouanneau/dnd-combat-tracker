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
function optimizeCombatant(combatant: Combatant): Combatant {
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
function optimizeParkedGroup(group: NewCombatant): NewCombatant {
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

  // Merge template data with runtime state
  return {
    ...template,
    id: combatant.id,
    displayName: combatant.displayName,
    initiative: combatant.initiative,
    groupIndex: combatant.groupIndex,
    hp: combatant.hp ?? template.hp,
    conditions: combatant.conditions,
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
    return undefined
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
