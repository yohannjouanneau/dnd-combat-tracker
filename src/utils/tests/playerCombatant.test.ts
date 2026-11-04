import type { SavedPlayer } from "../../types";
import { toPlayerCombatant } from "../utils";

describe("toPlayerCombatant", () => {
  const player = {
    id: "p1",
    name: "Aria",
    type: "player",
    hp: 30,
    maxHp: 32,
    ac: 15,
    color: "#000000",
    initiativeGroups: [{ id: "g1", initiative: "12", count: "1" }],
    initBonus: 2,
    str: 10,
    dex: 14,
    con: 12,
    int: 9,
    wis: 16,
    cha: 13,
    level: 5,
    proficiencyBonus: 3,
    spellcastingAbility: "wis",
    perceptionProficiency: { proficient: true },
  } as unknown as SavedPlayer;

  it("keeps the ability scores and proficiency data for focus mode", () => {
    const combatant = toPlayerCombatant(player);

    expect(combatant).toMatchObject({
      str: 10,
      dex: 14,
      con: 12,
      int: 9,
      wis: 16,
      cha: 13,
      level: 5,
      proficiencyBonus: 3,
      spellcastingAbility: "wis",
      perceptionProficiency: { proficient: true },
    });
  });

  it("links the player to its library entry and generates a fresh id", () => {
    const combatant = toPlayerCombatant(player);

    expect(combatant.templateOrigin).toEqual({
      origin: "player_library",
      id: "p1",
    });
    expect(combatant.id).toEqual(expect.any(String));
    expect(combatant.id).not.toBe(toPlayerCombatant(player).id);
  });
});
