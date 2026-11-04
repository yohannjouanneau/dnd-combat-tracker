import type { ApiMonster } from "../../api/types";
import { getApiSavingThrows } from "../utils";

describe("getApiSavingThrows", () => {
  it("maps 'Saving Throw: XXX' proficiencies to ability keys with the API value", () => {
    const monster = {
      index: "x",
      name: "X",
      image: "",
      proficiencies: [
        { value: 6, proficiency: { name: "Saving Throw: DEX" } },
        { value: 13, proficiency: { name: "Saving Throw: CON" } },
        { value: 13, proficiency: { name: "Skill: Perception" } },
      ],
    } as unknown as ApiMonster;

    expect(getApiSavingThrows(monster)).toEqual({ dex: 6, con: 13 });
  });

  it("returns undefined when the monster has no saving throw proficiency", () => {
    const monster = {
      index: "goblin",
      name: "Goblin",
      image: "",
      proficiencies: [{ value: 6, proficiency: { name: "Skill: Stealth" } }],
    } as unknown as ApiMonster;

    expect(getApiSavingThrows(monster)).toBeUndefined();
  });

  it("returns undefined when proficiencies are missing", () => {
    const monster = { index: "x", name: "X", image: "" } as ApiMonster;

    expect(getApiSavingThrows(monster)).toBeUndefined();
  });
});
