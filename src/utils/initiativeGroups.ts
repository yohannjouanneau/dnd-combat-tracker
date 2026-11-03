import type { Combatant } from "../types";

export type RerollResult = {
  combatants: Combatant[];
  rerolledGroupCount: number;
};

/**
 * Sorts combatants by initiative (descending), then name, then group index.
 * Same ordering as the one used when adding or editing initiative.
 */
export function sortCombatantsByInitiative(
  combatants: Combatant[],
): Combatant[] {
  return [...combatants].sort((a, b) => {
    if (b.initiative !== a.initiative) {
      return b.initiative - a.initiative;
    }
    if (a.name !== b.name) {
      return a.name.localeCompare(b.name);
    }
    return a.groupIndex - b.groupIndex;
  });
}

const rollD20 = (): number => Math.floor(Math.random() * 20) + 1;

/**
 * Re-rolls the initiative of every initiative group in the fight.
 *
 * A group is a set of combatants sharing the same `initiativeGroupId`, whatever
 * its size. Each group gets a single d20 roll, plus the bonus stored on its
 * members, and that value is applied to all of them.
 *
 * Combatants without an `initiativeGroupId` (players, which keep their own
 * initiative) are left untouched. The returned list is re-sorted by initiative.
 */
export function rerollGroupInitiatives(
  combatants: Combatant[],
  roll: () => number = rollD20,
): RerollResult {
  const membersByGroup = new Map<string, Combatant[]>();
  for (const c of combatants) {
    if (!c.initiativeGroupId) continue;
    const members = membersByGroup.get(c.initiativeGroupId) ?? [];
    members.push(c);
    membersByGroup.set(c.initiativeGroupId, members);
  }

  const newInitiativeByGroup = new Map<string, number>();
  for (const [groupId, members] of membersByGroup) {
    const bonus = members[0].initiativeBonus ?? 0;
    newInitiativeByGroup.set(groupId, roll() + bonus);
  }

  const updated = combatants.map((c) => {
    const groupId = c.initiativeGroupId;
    if (!groupId || !newInitiativeByGroup.has(groupId)) return c;
    return { ...c, initiative: newInitiativeByGroup.get(groupId)! };
  });

  return {
    combatants: sortCombatantsByInitiative(updated),
    rerolledGroupCount: newInitiativeByGroup.size,
  };
}
