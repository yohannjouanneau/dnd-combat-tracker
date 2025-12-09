import {
  Sword,
  Flame,
  Heart,
  Skull,
  Target,
  Wind,
  Shield,
  ShieldCheck,
  ShieldPlus,
  ShieldX,
  Sparkles,
  RotateCw,
  Star,
} from "lucide-react";
import type { EditorTag, EditorTagMenuItem } from "./components/common/mardown/types";
import type { NewCombatant } from "./types";

export const DEFAULT_NEW_COMBATANT: Omit<NewCombatant, 'id'> = {
  type: "monster",
  name: "",
  initiativeGroups: [{ id: crypto.randomUUID(), initiative: "", count: "1" }],
  color: "#3b82f6",
  imageUrl: "",
  externalResourceUrl: "",
  notes: "",
  templateOrigin: {
    orgin: 'no_template',
    id: ''
  }
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
export const MARKDOWN_EDITOR_TAG_MENU_ITEMS: EditorTagMenuItem[] = [
  // Combat
  {
    key: "hit",
    icon: Sword,
    color: "text-red-400",
    labelKey: "hit",
    placeholder: "+0",
  },
  {
    key: "dmg",
    icon: Flame,
    color: "text-orange-400",
    labelKey: "dmg",
    placeholder: "1d6",
  },
  {
    key: "heal",
    icon: Heart,
    color: "text-green-400",
    labelKey: "heal",
    placeholder: "1d8",
  },
  // Status & Utility
  {
    key: "cond",
    icon: Skull,
    color: "text-yellow-400",
    labelKey: "cond",
    placeholder: "poisoned",
  },
  {
    key: "range",
    icon: Target,
    color: "text-purple-400",
    labelKey: "range",
    placeholder: "30 ft.",
  },
  {
    key: "speed",
    icon: Wind,
    color: "text-sky-400",
    labelKey: "speed",
    placeholder: "30 ft.",
  },
  // Defense
  {
    key: "save",
    icon: Shield,
    color: "text-blue-400",
    labelKey: "save",
    placeholder: "DC 10",
  },
  {
    key: "ac",
    icon: ShieldCheck,
    color: "text-cyan-400",
    labelKey: "ac",
    placeholder: "15",
  },
  {
    key: "resist",
    icon: ShieldPlus,
    color: "text-indigo-400",
    labelKey: "resist",
    placeholder: "fire",
  },
  {
    key: "vuln",
    icon: ShieldX,
    color: "text-red-500",
    labelKey: "vuln",
    placeholder: "cold",
  },
  // Special
  {
    key: "spell",
    icon: Sparkles,
    color: "text-pink-400",
    labelKey: "spell",
    placeholder: "Fireball",
  },
  {
    key: "recharge",
    icon: RotateCw,
    color: "text-amber-400",
    labelKey: "recharge",
    placeholder: "5-6",
  },
  {
    key: "legendary",
    icon: Star,
    color: "text-yellow-300",
    labelKey: "legendary",
    placeholder: "3",
  },
];

export const EDITOR_TAGS: EditorTag[] = [
  {
    pattern: /\{hit:\s*([^}]+)\}/gi,
    icon: Sword,
    className: "text-red-400 font-semibold",
  },
  {
    pattern: /\{dmg:\s*([^}]+)\}/gi,
    icon: Flame,
    className: "text-orange-400 font-semibold",
  },
  {
    pattern: /\{save:\s*([^}]+)\}/gi,
    icon: Shield,
    className: "text-blue-400 font-semibold",
  },
  {
    pattern: /\{heal:\s*([^}]+)\}/gi,
    icon: Heart,
    className: "text-green-400 font-semibold",
  },
  {
    pattern: /\{ac:\s*([^}]+)\}/gi,
    icon: ShieldCheck,
    className: "text-cyan-400 font-semibold",
  },
  {
    pattern: /\{cond:\s*([^}]+)\}/gi,
    icon: Skull,
    className: "text-yellow-400 font-semibold",
  },
  {
    pattern: /\{range:\s*([^}]+)\}/gi,
    icon: Target,
    className: "text-purple-400 font-semibold",
  },
  {
    pattern: /\{speed:\s*([^}]+)\}/gi,
    icon: Wind,
    className: "text-sky-400 font-semibold",
  },
  {
    pattern: /\{resist:\s*([^}]+)\}/gi,
    icon: ShieldPlus,
    className: "text-indigo-400 font-semibold",
  },
  {
    pattern: /\{spell:\s*([^}]+)\}/gi,
    icon: Sparkles,
    className: "text-pink-400 font-semibold",
  },
  {
    pattern: /\{recharge:\s*([^}]+)\}/gi,
    icon: RotateCw,
    className: "text-amber-400 font-semibold",
  },
  {
    pattern: /\{legendary:\s*([^}]+)\}/gi,
    icon: Star,
    className: "text-yellow-300 font-semibold",
  },
  {
    pattern: /\{vuln:\s*([^}]+)\}/gi,
    icon: ShieldX,
    className: "text-red-500 font-semibold",
  },
];

// Regex pattern for dice notation (e.g., 2d12+4, 2d12 + 4, 1d6, 3d8-2, 3d8 - 2)
export const DICE_NOTATION_REGEX = /(\d+d\d+(?:\s*[+-]\s*\d+)?)/i;
export const DICE_NOTATION_TEST_REGEX = /^\d+d\d+(?:\s*[+-]\s*\d+)?$/i;

