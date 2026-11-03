import { readFileSync } from "fs";
import { join } from "path";
import { mapMonster2024, type Api2024Monster } from "../mapMonster2024";

const loadFixture = (name: string): Api2024Monster =>
  JSON.parse(
    readFileSync(join(__dirname, "fixtures", name), "utf-8"),
  ) as Api2024Monster;

describe("mapMonster2024", () => {
  describe("simple monster (Goblin Warrior)", () => {
    const monster = mapMonster2024(loadFixture("goblin-warrior-2024.json"));

    it("maps core identity and abilities", () => {
      expect(monster.index).toBe("goblin-warrior");
      expect(monster.name).toBe("Goblin Warrior");
      expect(monster.hit_points).toBe(10);
      expect(monster.dexterity).toBe(15);
      expect(monster.challenge_rating).toBe(0.25);
    });

    it("flattens armor class to the internal shape with armor names", () => {
      expect(monster.armor_class).toEqual([
        {
          __typename: "ArmorClassArmor",
          type: "armor",
          value: 15,
          desc: "Leather Armor, Shield",
        },
      ]);
    });

    it("treats the NYI placeholder image as no image", () => {
      expect(monster.image).toBe("");
    });

    it("keeps actions and bonus actions", () => {
      expect(monster.actions?.map((a) => a.name)).toEqual([
        "Scimitar",
        "Shortbow",
      ]);
      expect(monster.actions?.[0].attack_bonus).toBe(4);
      expect(monster.bonus_actions?.map((a) => a.name)).toEqual([
        "Nimble Escape",
      ]);
    });
  });

  describe("complex monster (Adult Red Dragon)", () => {
    const monster = mapMonster2024(loadFixture("adult-red-dragon-2024.json"));

    it("maps a natural armor class with no armor description", () => {
      expect(monster.armor_class).toEqual([
        { __typename: "ArmorClassNatural", type: "natural", value: 19 },
      ]);
    });

    it("keeps the real image path", () => {
      expect(monster.image).toBe("/api/images/monsters/adult-red-dragon.png");
    });

    it("maps legendary actions, special abilities and multi-speed", () => {
      expect(monster.legendary_actions?.length).toBe(3);
      expect(monster.special_abilities?.map((s) => s.name)).toEqual([
        "Legendary Resistance",
      ]);
      expect(monster.speed).toEqual({
        walk: "40 ft.",
        climb: "40 ft.",
        fly: "80 ft.",
      });
      expect(monster.senses?.blindsight).toBe("60 ft.");
    });
  });
});
