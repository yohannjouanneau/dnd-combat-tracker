import type { TimestampedEntity } from "../types";

export type BlockFeatureKey = "characters" | "combat" | "loot" | "countdown";

export interface BlockTypeDef {
  id: string;
  name: string; // i18n key for built-ins, user string for custom
  icon: string;
  features: BlockFeatureKey[];
  isBuiltIn: boolean;
}

/** Unified feature data — replaces the old SpecialFeature discriminated union */
export interface BlockFeatureData {
  linkedNpcIds?: string[]; // "characters" feature
  combatId?: string | null; // "combat" feature
  items?: string[]; // "loot" feature
}

export interface Outcome {
  id: string;
  label: string;
  description: string;
  linkedBlockId?: string;
}

export interface StatCheck {
  id: string;
  label: string;
  skill?: string;
  difficulty: number;
  outcomes: Outcome[];
}

export interface CountdownData {
  max: number; // total steps (0 = disabled)
  current: number; // elapsed steps (0..max)
  descriptions?: string[]; // optional label per step, indexed 0..max-1
}

export interface BuildingBlock extends TimestampedEntity {
  id: string;
  typeId: string; // reference to BlockTypeDef.id
  icon?: string;
  name: string;
  description: string;
  children: string[];
  statChecks: StatCheck[];
  featureData?: BlockFeatureData;
  tags?: string[];
  countdown?: CountdownData;
}

export interface CanvasNode {
  blockId: string;
  x: number;
  y: number;
  collapsed?: boolean;
}

export interface CanvasEdge {
  id: string;
  fromBlockId: string;
  toBlockId: string;
  label?: string;
}

export interface Campaign extends TimestampedEntity {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  rootBlockId?: string;
}

export type BuildingBlockInput = Omit<BuildingBlock, keyof TimestampedEntity>;
export type CampaignInput = Omit<Campaign, keyof TimestampedEntity>;
