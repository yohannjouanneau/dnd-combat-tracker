import type {
  Action,
  ApiMonster,
  APIReference,
  ArmorClass,
  Proficiency,
  Senses,
  SpecialAbility,
  Speed,
} from "./types";

/**
 * Raw monster payload returned by `dnd5eapi.co/api/2024/monsters/:index`
 * (SRD 5.2 / 2024 rules). Only the fields we consume are typed.
 */
export interface Api2024ArmorClass {
  value: number;
  armor: APIReference[];
}

export interface Api2024Monster {
  index: string;
  name: string;
  size?: string;
  type?: string;
  alignment?: string;
  armor_class?: Api2024ArmorClass[];
  hit_points?: number;
  hit_dice?: string;
  hit_points_roll?: string;
  speed?: Speed;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  proficiencies?: Proficiency[];
  damage_vulnerabilities?: string[];
  damage_resistances?: string[];
  damage_immunities?: string[];
  condition_immunities?: APIReference[];
  senses?: Senses;
  languages?: string;
  challenge_rating?: number;
  proficiency_bonus?: number;
  xp?: number;
  special_abilities?: SpecialAbility[];
  actions?: Action[];
  bonus_actions?: Action[];
  legendary_actions?: Action[];
  reactions?: Action[];
  image?: string;
}

/**
 * The API serves a placeholder path (`*-NYI.png`) for monsters without
 * artwork, and that path returns 403. Treat it as "no image".
 */
function normalizeImage(image: string | undefined): string {
  if (!image || image.includes("-NYI.")) return "";
  return image;
}

/**
 * 2024 armor class is `{ value, armor[] }`. The internal shape is the
 * legacy one: a typed entry with a description.
 */
function mapArmorClass(ac: Api2024ArmorClass): ArmorClass {
  if (ac.armor.length === 0) {
    return {
      __typename: "ArmorClassNatural",
      type: "natural",
      value: ac.value,
    };
  }
  return {
    __typename: "ArmorClassArmor",
    type: "armor",
    value: ac.value,
    desc: ac.armor.map((a) => a.name).join(", "),
  };
}

/**
 * Convert a 2024 API monster into the internal `ApiMonster` shape used by the
 * combat form, the library editor and the notes formatter.
 */
export function mapMonster2024(raw: Api2024Monster): ApiMonster {
  return {
    index: raw.index,
    name: raw.name,
    image: normalizeImage(raw.image),
    size: raw.size,
    type: raw.type,
    alignment: raw.alignment,
    armor_class: raw.armor_class?.map(mapArmorClass),
    hit_points: raw.hit_points,
    hit_dice: raw.hit_dice,
    hit_points_roll: raw.hit_points_roll,
    speed: raw.speed,
    strength: raw.strength,
    dexterity: raw.dexterity,
    constitution: raw.constitution,
    intelligence: raw.intelligence,
    wisdom: raw.wisdom,
    charisma: raw.charisma,
    proficiencies: raw.proficiencies,
    damage_vulnerabilities: raw.damage_vulnerabilities,
    damage_resistances: raw.damage_resistances,
    damage_immunities: raw.damage_immunities,
    condition_immunities: raw.condition_immunities,
    senses: raw.senses,
    languages: raw.languages,
    challenge_rating: raw.challenge_rating,
    proficiency_bonus: raw.proficiency_bonus,
    xp: raw.xp,
    special_abilities: raw.special_abilities,
    actions: raw.actions,
    bonus_actions: raw.bonus_actions,
    reactions: raw.reactions,
    legendary_actions: raw.legendary_actions,
  };
}
