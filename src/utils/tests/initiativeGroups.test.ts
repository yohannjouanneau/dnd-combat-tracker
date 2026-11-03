import { rerollGroupInitiatives } from "../initiativeGroups";
import type { Combatant } from "../../types";

const make = (id: number, overrides: Partial<Combatant> = {}): Combatant =>
  ({
    id,
    name: "Goblin",
    displayName: `Goblin ${id}`,
    initiative: 0,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    groupIndex: id,
    templateOrigin: { origin: "no_template" },
    ...overrides,
  }) as Combatant;

// Roll sequence: each call returns the next value
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++];
};

describe("rerollGroupInitiatives", () => {
  it("rolls once per group and applies the result to every member", () => {
    const combatants = [
      make(1, { initiativeGroupId: "g1", initiative: 3, initiativeBonus: 2 }),
      make(2, { initiativeGroupId: "g1", initiative: 3, initiativeBonus: 2 }),
      make(3, { initiativeGroupId: "g1", initiative: 3, initiativeBonus: 2 }),
    ];
    const roll = jest.fn(sequence(15));

    const result = rerollGroupInitiatives(combatants, roll);

    expect(roll).toHaveBeenCalledTimes(1);
    expect(result.rerolledGroupCount).toBe(1);
    expect(result.combatants.map((c) => c.initiative)).toEqual([17, 17, 17]);
  });

  it("gives independent rolls to different groups", () => {
    const combatants = [
      make(1, { name: "Goblin", initiativeGroupId: "g1", initiative: 0 }),
      make(2, { name: "Goblin", initiativeGroupId: "g1", initiative: 0 }),
      make(3, { name: "Goblin", initiativeGroupId: "g2", initiative: 0 }),
      make(4, { name: "Goblin", initiativeGroupId: "g2", initiative: 0 }),
    ];

    const result = rerollGroupInitiatives(combatants, sequence(4, 19));

    expect(result.rerolledGroupCount).toBe(2);
    const byId = Object.fromEntries(result.combatants.map((c) => [c.id, c]));
    expect(byId[1].initiative).toBe(4);
    expect(byId[2].initiative).toBe(4);
    expect(byId[3].initiative).toBe(19);
    expect(byId[4].initiative).toBe(19);
  });

  it("leaves combatants without a group id (players) untouched", () => {
    const player = make(1, {
      name: "Aragorn",
      initiative: 12,
      initiativeBonus: 3,
    });
    const legacy = make(2, { name: "Old", initiative: 7 });
    const roll = jest.fn(sequence(10));

    const result = rerollGroupInitiatives([player, legacy], roll);

    expect(roll).not.toHaveBeenCalled();
    expect(result.rerolledGroupCount).toBe(0);
    const byId = Object.fromEntries(result.combatants.map((c) => [c.id, c]));
    expect(byId[1].initiative).toBe(12);
    expect(byId[2].initiative).toBe(7);
  });

  it("re-rolls a monster group of one", () => {
    const monster = make(1, {
      name: "Dragon",
      initiative: 18,
      initiativeGroupId: "solo",
      initiativeBonus: 3,
    });

    const result = rerollGroupInitiatives([monster], sequence(10));

    expect(result.rerolledGroupCount).toBe(1);
    expect(result.combatants[0].initiative).toBe(13);
  });

  it("only re-rolls groups and keeps individuals when mixed", () => {
    const combatants = [
      make(1, { name: "Goblin", initiativeGroupId: "g1", initiative: 1 }),
      make(2, { name: "Goblin", initiativeGroupId: "g1", initiative: 1 }),
      make(3, { name: "Ogre", initiative: 9 }),
    ];

    const result = rerollGroupInitiatives(combatants, sequence(20));

    const byId = Object.fromEntries(result.combatants.map((c) => [c.id, c]));
    expect(byId[1].initiative).toBe(20);
    expect(byId[2].initiative).toBe(20);
    expect(byId[3].initiative).toBe(9);
  });

  it("re-sorts combatants by initiative after the reroll", () => {
    const combatants = [
      make(1, { name: "A", initiativeGroupId: "g1", initiative: 15 }),
      make(2, { name: "A", initiativeGroupId: "g1", initiative: 15 }),
      make(3, { name: "B", initiative: 10 }),
    ];

    const result = rerollGroupInitiatives(combatants, sequence(2));

    expect(result.combatants.map((c) => c.id)).toEqual([3, 1, 2]);
  });

  it("does not mutate the input combatants", () => {
    const combatants = [
      make(1, { initiativeGroupId: "g1", initiative: 1 }),
      make(2, { initiativeGroupId: "g1", initiative: 1 }),
    ];
    const snapshot = JSON.stringify(combatants);

    rerollGroupInitiatives(combatants, sequence(14));

    expect(JSON.stringify(combatants)).toBe(snapshot);
  });

  it("uses a missing bonus as 0", () => {
    const combatants = [
      make(1, { initiativeGroupId: "g1" }),
      make(2, { initiativeGroupId: "g1" }),
    ];

    const result = rerollGroupInitiatives(combatants, sequence(6));

    expect(result.combatants.map((c) => c.initiative)).toEqual([6, 6]);
  });
});
