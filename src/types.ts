import type { Monster } from "./api/types";

export type DeathSaves = {
  successes: number;
  failures: number;
};

export type Combatant = {
  id: number;
  name: string;
  displayName: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  conditions: string[];
  concentration: boolean;
  deathSaves: DeathSaves;
  groupName: string;
  color: string;
  groupIndex: number;
  imageUrl: string;
  externalResourceUrl: string;
};

export type InitiativeGroup = {
  id: string;
  initiative: string;
  count: string;
};

export type MonsterData = {
  id: string;
  name: string;
  hp: string;
  ac: string;
  imageUrl: string;
  str: string; // Strength
  dex: string; // Dexterity
  con: string; // Constitution
  int: string; // Intelligence
  wis: string; // Wisdom
  cha: string; // Charisma
  createdAt: number;
  updatedAt: number;
};

export type MonsterDataInput = Omit<
  MonsterData,
  "id" | "createdAt" | "updatedAt"
>;

// Add this to your existing search result types
export type SearchResult = {
  source: "api" | "library";
  monster: Monster | MonsterData;
};

export type NewCombatant = {
  groupName: string;
  initiativeGroups: InitiativeGroup[];
  hp: string;
  maxHp: string;
  ac: string;
  color: string;
  imageUrl: string;
  initBonus: string;
  externalResourceUrl: string;
  str?: string;
  dex?: string;
  con?: string;
  int?: string;
  wis?: string;
  cha?: string;
};

export type GroupSummary = {
  name: string;
  color: string;
  count: number;
};

// Serializable snapshot of the tracker
export type CombatState = {
  combatId?: string;
  combatName?: string;
  combatDescription?: string;
  combatants: Combatant[];
  currentTurn: number;
  round: number;
  parkedGroups: NewCombatant[];
  newCombatant: NewCombatant;
  lastSavedSnapshot?: string;
};

export type SavedCombat = {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  data: CombatState;
};

export type SavedPlayer = {
  id: string;
  groupName: string;
  initiativeGroups: InitiativeGroup[];
  hp: string;
  maxHp: string;
  ac: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  imageUrl: string;
  initBonus: string;
  externalResourceUrl: string;
};

export type SavedCombatInput = Omit<
  SavedCombat,
  "id" | "createdAt" | "updatedAt"
>;
export type SavedPlayerInput = Omit<
  SavedPlayer,
  "id" | "createdAt" | "updatedAt"
>;
