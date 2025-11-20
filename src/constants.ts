import type { NewCombatant } from "./types";

export const DEFAULT_NEW_COMBATANT: NewCombatant = {
  groupName: "",
  initiativeGroups: [{ id: crypto.randomUUID(), initiative: "", count: "1" }],
  hp: "",
  maxHp: "",
  ac: "",
  color: "#3b82f6",
  imageUrl: "",
  initBonus: "",
  externalResourceUrl: ""
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
];

export const HP_BAR_ID_PREFIX = "hpbar-input-";

export const DND_API_HOST = "https://www.dnd5eapi.co";
