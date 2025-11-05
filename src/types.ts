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
};

export type InitiativeGroup = {
  id: string;
  initiative: string;
  count: string;
};

export type NewCombatant = {
  groupName: string;
  initiativeGroups: InitiativeGroup[];
  hp: string;
  maxHp: string;
  ac: string;
  color: string;
};

export type GroupSummary = {
  name: string;
  color: string;
  count: number;
};

// Serializable snapshot of the tracker
export type CombatState = {
  combatants: Combatant[];
  currentTurn: number;
  round: number;
  parkedGroups: NewCombatant[];
  newCombatant: NewCombatant;
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
};