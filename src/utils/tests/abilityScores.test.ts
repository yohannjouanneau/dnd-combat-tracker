import type { ApiMonster } from "../../api/types";
import type { SavedPlayer } from "../../types";
import { buildPlayerCombatantsForFight, getApiAbilityScores } from "../utils";

describe("getApiAbilityScores", () => {
  it("maps dnd5eapi long ability names to short keys", () => {
    const monster = {
      index: "goblin",
      name: "Goblin",
      image: "/img/goblin.png",
      strength: 8,
      dexterity: 14,
      constitution: 10,
      intelligence: 10,
      wisdom: 8,
      charisma: 8,
    } as ApiMonster;

    expect(getApiAbilityScores(monster)).toEqual({
      str: 8,
      dex: 14,
      con: 10,
      int: 10,
      wis: 8,
      cha: 8,
    });
  });

  it("leaves missing ability scores undefined instead of zero", () => {
    const monster = { index: "x", name: "X", image: "" } as ApiMonster;

    const scores = getApiAbilityScores(monster);

    expect(scores.str).toBeUndefined();
    expect(scores.cha).toBeUndefined();
  });
});

describe("buildPlayerCombatantsForFight", () => {
  it("carries the player's ability scores onto the combatant", () => {
    const player = {
      id: "p1",
      name: "Aria",
      type: "player",
      hp: 30,
      maxHp: 30,
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
    } as unknown as SavedPlayer;

    const [combatant] = buildPlayerCombatantsForFight([player]);

    expect(combatant).toMatchObject({
      str: 10,
      dex: 14,
      con: 12,
      int: 9,
      wis: 16,
      cha: 13,
    });
  });
});
