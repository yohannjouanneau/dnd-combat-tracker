export interface APIReference {
  index: string;
  name: string;
  desc: string[];
  url: string;
}

export interface ArmorClass {
  __typename: string;
  type: string;
  value: number;
  desc?: string;
}

export interface Speed {
  walk?: string;
  swim?: string;
  fly?: string;
  burrow?: string;
  climb?: string;
}

export interface DamageType {
  damage_type: APIReference;
  damage_dice: string;
}

export interface DC {
  dc_type: APIReference;
  dc_value: number;
  success_type: string;
}

export interface Action {
  name: string;
  desc: string;
  attack_bonus?: number;
  damage?: DamageType[];
  dc?: DC;
}

export interface SpecialAbility {
  name: string;
  desc: string;
  usage?: {
    type: string;
    times?: number;
    rest_types?: string[];
  };
}

export interface Proficiency {
  value: number;
  proficiency: APIReference;
}

export interface Senses {
  passive_perception: number;
  blindsight?: string;
  darkvision?: string;
  tremorsense?: string;
  truesight?: string;
}

export interface ApiMonster {
  index: string;
  name: string;
  image: string;
  size?: string;
  type?: string;
  subtype?: string;
  alignment?: string;
  armor_class?: ArmorClass[];
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
  legendary_actions?: Action[];
  reactions?: Action[];
}

export interface MonsterListItem {
  index: string;
  name: string;
  url?: string;
}
