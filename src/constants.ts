import { Sword, Flame, Heart, Skull, Target, Wind, Shield, ShieldCheck, ShieldPlus, ShieldX, Sparkles, RotateCw, Star } from "lucide-react";
import type { TagMenuItem } from "./components/common/mardown/types";
import type { NewCombatant } from "./types";

export const DEFAULT_NEW_COMBATANT: NewCombatant = {
  type: 'monster',
  name: "",
  initiativeGroups: [{ id: crypto.randomUUID(), initiative: "", count: "1" }],
  color: "#3b82f6",
  imageUrl: "",
  externalResourceUrl: "",
  notes: ""
};

// Condition keys for translation - use these with t('conditions:key')
export const DEFAULT_CONDITIONS_KEYS = [
  "blinded",
  "charmed",
  "deafened",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
];

// Legacy export for backward compatibility
// Use getTranslatedConditions() instead for translated labels
export const DEFAULT_CONDITIONS = DEFAULT_CONDITIONS_KEYS;

// Helper function to get translated conditions
// Usage: const conditions = getTranslatedConditions(t);
export const getTranslatedConditions = (t: (key: string) => string) => {
  return DEFAULT_CONDITIONS_KEYS.map((key) => ({
    key,
    label: t(`conditions:${key}`),
  }));
};

export const DEFAULT_COLOR_PRESET = [
  { key: "blue", value: "#3b82f6" },
  { key: "red", value: "#ef4444" },
  { key: "green", value: "#10b981" },
  { key: "purple", value: "#a855f7" },
  { key: "orange", value: "#f97316" },
  { key: "pink", value: "#ec4899" },
  { key: "yellow", value: "#eab308" },
  { key: "cyan", value: "#06b6d4" },
] as const;

export const HP_BAR_ID_PREFIX = "hpbar-input-";

export const DND_API_HOST = "https://www.dnd5eapi.co";

export const COMBAT_STORAGE_KEY = "dnd-ct:combats:v1";
export const PLAYER_STORAGE_KEY = "dnd-ct:players:v1";
export const MONSTER_STORAGE_KEY = "dnd-ct:monsters:v1";
export const LAST_SYNC_STORAGE_KEY = "dnd-ct:lastSynced";
export const SETTINGS_STORAGE_KEY = "dnd-ct:settings:v1";

// Tag menu items configuration
export const MARKDOWN_EDITOR_TAG_MENU_ITEMS : TagMenuItem[] = [
  // Combat
  { key: 'hit', icon: Sword, color: 'text-red-400', labelKey: 'hit', placeholder: '+0' },
  { key: 'dmg', icon: Flame, color: 'text-orange-400', labelKey: 'dmg', placeholder: '1d6' },
  { key: 'heal', icon: Heart, color: 'text-green-400', labelKey: 'heal', placeholder: '1d8' },
  // Status & Utility
  { key: 'cond', icon: Skull, color: 'text-yellow-400', labelKey: 'cond', placeholder: 'poisoned' },
  { key: 'range', icon: Target, color: 'text-purple-400', labelKey: 'range', placeholder: '30 ft.' },
  { key: 'speed', icon: Wind, color: 'text-sky-400', labelKey: 'speed', placeholder: '30 ft.' },
  // Defense
  { key: 'save', icon: Shield, color: 'text-blue-400', labelKey: 'save', placeholder: 'DC 10' },
  { key: 'ac', icon: ShieldCheck, color: 'text-cyan-400', labelKey: 'ac', placeholder: '15' },
  { key: 'resist', icon: ShieldPlus, color: 'text-indigo-400', labelKey: 'resist', placeholder: 'fire' },
  { key: 'vuln', icon: ShieldX, color: 'text-red-500', labelKey: 'vuln', placeholder: 'cold' },
  // Special
  { key: 'spell', icon: Sparkles, color: 'text-pink-400', labelKey: 'spell', placeholder: 'Fireball' },
  { key: 'recharge', icon: RotateCw, color: 'text-amber-400', labelKey: 'recharge', placeholder: '5-6' },
  { key: 'legendary', icon: Star, color: 'text-yellow-300', labelKey: 'legendary', placeholder: '3' },
];
