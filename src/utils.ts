import type { ApiMonster } from "./api/types";
import { DND_API_HOST } from "./constants";
import type { NewCombatant, SavedMonster } from "./types";

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

/**
 * Enriches combatants and parked groups with notes from the monster library
 * by matching names (case-insensitive contains)
 */
export function enrichWithMonsterNotes<T extends { name: string; notes?: string }>(
  entities: T[],
  monsters: SavedMonster[]
): T[] {
  return entities.map((entity) => {
    // Skip if already has notes
    if (entity.notes) {
      return entity;
    }

    // Find matching monster by name (case-insensitive contains)
    const matchingMonster = monsters.find((monster) =>
      monster.name.toLowerCase().includes(entity.name.toLowerCase()) ||
      entity.name.toLowerCase().includes(monster.name.toLowerCase())
    );

    // If found, add notes
    if (matchingMonster?.notes) {
      return {
        ...entity,
        notes: matchingMonster.notes,
      };
    }

    return entity;
  });
}
