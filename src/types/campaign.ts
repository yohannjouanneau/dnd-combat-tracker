import type { TimestampedEntity } from "../types";

export type BuildingBlockType = "environment" | "room" | "character" | "combat" | "object" | "scene";

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

export type SpecialFeature =
  | { type: "combat"; combatId: string | null }
  | { type: "character"; linkedNpcIds: string[] }
  | { type: "loot"; items: string[] }
  | { type: "scene"; linkedNpcIds: string[]; combatId: string | null; items: string[] };

export interface BuildingBlock extends TimestampedEntity {
  id: string;
  type: BuildingBlockType;
  icon?: string;
  name: string;
  description: string;
  children: string[];
  statChecks: StatCheck[];
  specialFeature?: SpecialFeature;
  tags?: string[];
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
