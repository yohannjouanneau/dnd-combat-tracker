import type { ApiMonster } from "./api/types";

// Settings types
export type CombatantIdentifierType = "letters" | "numbers";

// Base types for common metadata
export type TimestampedEntity = {
  createdAt: number;
  updatedAt: number;
};

// Base ability scores (used in multiple places)
export type AbilityScores = {
  str?: number; // Strength
  dex?: number; // Dexterity
  con?: number; // Constitution
  int?: number; // Intelligence
  wis?: number; // Wisdom
  cha?: number; // Charisma
};

// Combat stats used across all types
export type CombatStats = {
  hp?: number;
  maxHp?: number;
  ac?: number;
};

// Visual and reference data
export type Presentation = {
  color: string;
  imageUrl?: string;
  externalResourceUrl?: string;
  notes?: string;
};

export type DeathSaves = {
  successes: number;
  failures: number;
};

export type Combatant = {
  id: number;
  name: string;
  displayName: string;
  initiative: number;
  conditions: string[];
  concentration: boolean;
  deathSaves: DeathSaves;
  groupIndex: number;
  templateOrigin: TemplateOigin;
} & Presentation &
  CombatStats &
  AbilityScores;

export type InitiativeGroup = {
  id: string;
  initiative: string;
  count: string;
};

// Initiative data (shared between CombatantTemplate and SavedPlayer)
export type InitiativeData = {
  initiativeGroups: InitiativeGroup[];
  initBonus?: number;
};

export type CombatantTemplateType = "player" | "monster";

// Base entity for any combatant template (monsters, players, NPCs)
export type CombatantTemplate<T extends CombatantTemplateType> = {
  id: string;
  name: string;
  type: T;
} & CombatStats &
  Presentation &
  Partial<AbilityScores> &
  InitiativeData;

export type SavedCombatantTemplate<T extends CombatantTemplateType> =
  CombatantTemplate<T> & TimestampedEntity;

export type SavedPlayer = SavedCombatantTemplate<"player">;
export type SavedMonster = SavedCombatantTemplate<"monster">;

export type TemplateOigin = {
  orgin: "parked_group" | "monster_library" | "player_library" | "no_template";
  id: string;
};

export type NewCombatant = {
  templateOrigin: TemplateOigin;
} & CombatantTemplate<"player" | "monster">;
export type MonsterCombatant = CombatantTemplate<"monster">;
export type PlayerCombatant = CombatantTemplate<"player">;

export type SearchSource = "api" | "library";
export type SearchResult = {
  source: SearchSource;
  monster: ApiMonster | SavedMonster;
};

export type GroupSummary = {
  name: string;
  color: string;
  count: number;
};

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

export type SavedCombat = TimestampedEntity & {
  id: string;
  name: string;
  description: string;
  data: CombatState;
};

export type SavedCombatInput = Omit<SavedCombat, keyof TimestampedEntity>;

export interface SyncApi {
  isSyncAuthorized: () => boolean;
  authorizeSync: () => Promise<boolean>;
  hasNewRemoteData: () => Promise<boolean>;
  synchronise: () => Promise<boolean>;
  getLastSyncTime: () => number | undefined;
  logout: () => Promise<boolean>;
}
