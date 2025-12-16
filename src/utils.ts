import type { Action, ApiMonster } from "./api/types";
import { DEFAULT_NEW_COMBATANT, DND_API_HOST } from "./constants";
import type { NewCombatant } from "./types";

export function generateId(): string {
  // Generate a random id: 16 characters, URL-safe
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    .map(() => Math.random().toString(36).slice(2))
    .join("")
    .slice(0, 16);
}

export function safeParse<T>(raw: string | null): T[] {
  if (!raw) return [] as T[];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [] as T[];
  }
}

export function safeStringify<T>(data: T[]): string {
  try {
    return JSON.stringify(data);
  } catch {
    return "[]";
  }
}

export function getStatModifier(stat?: number) {
  if (!stat) return undefined;
  return Math.floor((stat - 10) / 2);
}

export function getAbilityModifier(score: number) {
  const num = score || 10;
  const mod = getStatModifier(num);
  return mod && mod >= 0 ? `+${mod}` : `${mod}`;
};

export function getApiImageUrl(monster: ApiMonster) {
  return `${DND_API_HOST}${monster.image}`;
}

export function safeParseInt(strNumber: string, allowNegative: boolean = false) {
  const result = parseInt(strNumber);
  if (isNaN(result)) return undefined;
  if (!allowNegative && result < 0) return undefined;
  return result;
}

/**
 * Converts an index to a letter identifier (A, B, C, ..., Z, AA, AB, ...)
 * Index 0 = A, Index 25 = Z, Index 26 = AA, etc.
 */
export function indexToLetter(index: number): string {
  let result = "";
  let num = index;

  do {
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
  } while (num >= 0);

  return result;
}

/**
 * Converts a timestamp to a human-readable relative time or absolute date
 * - "just now" for < 1 minute
 * - "X minutes ago" for < 1 hour
 * - "X hours ago" for < 24 hours
 * - "at 5:15 PM on 03/11" for older dates
 */
export function getReadableTimestamp(timestamp: number | Date): string {
  const now = new Date();
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  // Less than 1 minute
  if (diffMinutes < 1) {
    return "just now";
  }

  // Less than 1 hour
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }

  // Format time (e.g., "5:15 PM")
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  const timeString = `${displayHours}:${displayMinutes} ${ampm}`;

  // Format date (e.g., "03/11")
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  // If it's within the current year, omit the year
  if (date.getFullYear() === now.getFullYear()) {
    return `at ${timeString} on ${month}/${day}`;
  }

  // If it's from a previous year, include the year
  const year = date.getFullYear();
  return `at ${timeString} on ${month}/${day}/${year}`;
}

export function isNewCombatantInvalid(newCombatant: NewCombatant): boolean {
  return (
    newCombatant.name === "" ||
    !newCombatant.ac || newCombatant.ac <= 0 ||
    !newCombatant.hp || newCombatant.hp <= 0 ||
    newCombatant.initiativeGroups.length === 0 ||
    newCombatant.initiativeGroups.some((g) => g.initiative === "" || g.count === "")
  );
}

export function generateDefaultNewCombatant() {
  return {
    ...DEFAULT_NEW_COMBATANT,
    id: generateId()
  }
}

/**
 * Generate custom markdown tags for a monster action
 * Parses action data and description to extract combat information
 * @param action - Monster action from D&D 5e API
 * @returns Array of formatted tag strings (e.g., ["{hit: +5}", "{dmg: 2d6 slashing}"])
 */
function generateActionTags(action: Action): string[] {
  const tags: string[] = [];

  // Attack bonus: {hit: +5}
  if (action.attack_bonus !== undefined && action.attack_bonus !== null) {
    const sign = action.attack_bonus >= 0 ? "+" : "";
    tags.push(`{hit: ${sign}${action.attack_bonus}}`);
  }

  // Parse damage from description (e.g., "Hit: 17 (2d10 + 6) piercing damage")
  const damageMatch = action.desc.match(/Hit:\s*\d+\s*\(([^)]+)\)\s*(\w+)\s+damage/i);
  if (damageMatch) {
    const dice = damageMatch[1].trim();
    const type = damageMatch[2].toLowerCase();
    tags.push(`{dmg: ${dice} ${type}}`);
  }

  // Parse DC from description (e.g., "DC 17 Dexterity saving throw")
  const dcMatch = action.desc.match(/DC\s+(\d+)\s+(\w+)\s+saving\s+throw/i);
  if (dcMatch) {
    const dcValue = dcMatch[1];
    const dcType = dcMatch[2].toUpperCase().slice(0, 3); // DEX, STR, CON, etc.
    tags.push(`{save: DC ${dcValue} ${dcType}}`);
  }

  return tags;
}

/**
 * Format monster actions as markdown with custom tags
 * Converts API action data into readable markdown with custom tags for attack bonuses,
 * damage, and saving throws. Tags are automatically rendered with icons by MarkdownRenderer.
 *
 * @param actions - Array of monster actions from D&D 5e API
 * @returns Formatted markdown string with "## Actions" heading and tagged action descriptions
 *
 * @example
 * // Returns:
 * // ## Actions
 * //
 * // **Bite** {hit: +10} {dmg: 2d10+6 piercing}
 * // Melee Weapon Attack: +10 to hit, reach 10 ft., one target...
 */
export function formatActionsAsMarkdown(actions?: Action[]): string {
  // Return empty string if no actions
  if (!actions || actions.length === 0) return "";

  // Build markdown with heading
  const parts: string[] = ["## Actions", ""];

  // Format each action
  for (const action of actions) {
    const actionParts: string[] = [];

    // Bold action name
    actionParts.push(`**${action.name}**`);

    // Add custom tags
    const tags = generateActionTags(action);
    if (tags.length > 0) {
      actionParts.push(" " + tags.join(" "));
    }

    // Add description on new line
    actionParts.push("\n" + action.desc);

    parts.push(actionParts.join(""));
    parts.push(""); // Empty line between actions
  }

  return parts.join("\n");
}

/**
 * Append formatted actions to existing notes
 * If notes already exist, adds formatted actions after existing content with separator
 * @param existingNotes - Current notes content (may be empty)
 * @param actions - Monster actions from D&D 5e API
 * @returns Combined notes with formatted actions appended
 */
export function appendFormattedActions(existingNotes: string | undefined, actions?: Action[]): string {
  const formattedActions = formatActionsAsMarkdown(actions);

  // If no actions to add, return existing notes
  if (!formattedActions) {
    return existingNotes || "";
  }

  // If no existing notes, just return formatted actions
  if (!existingNotes || existingNotes.trim() === "") {
    return formattedActions;
  }

  // Append with separator
  return `${existingNotes}\n\n${formattedActions}`;
}
