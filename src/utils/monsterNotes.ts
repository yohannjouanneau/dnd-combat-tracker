import type { Action, ApiMonster } from "../api/types";

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

  // Parse range from description (e.g., "reach 5 ft.", "range 30/120 ft.", "range 150 ft.")
  const rangeMatch = action.desc.match(/(?:reach|range)\s+([\d/]+)\s*ft\./i);
  if (rangeMatch) {
    const range = rangeMatch[1];
    tags.push(`{range: ${range} ft.}`);
  }

  return tags;
}

/**
 * Extract custom markdown tags from any text description
 * Shared logic for parsing combat stats from both API and manual SRD text
 * @param text - Text description to parse
 * @returns Array of formatted tag strings
 */
export function generateTagsFromText(text: string): string[] {
  const tags: string[] = [];

  // Attack bonus: {hit: +5}
  const hitMatch = text.match(/([+-]\d+) to hit/);
  if (hitMatch) {
    tags.push(`{hit: ${hitMatch[1]}}`);
  }

  // Damage: {dmg: 2d6+5 slashing}
  const damageMatch = text.match(/Hit:\s*\d+\s*\(([^)]+)\)\s*(\w+)\s+damage/i);
  if (damageMatch) {
    const dice = damageMatch[1].replace(/\s/g, '');
    const type = damageMatch[2].toLowerCase();
    tags.push(`{dmg: ${dice} ${type}}`);
  }

  // DC saves: {save: DC 15 CON}
  const dcMatch = text.match(/DC\s+(\d+)\s+(\w+)\s+saving\s+throw/i);
  if (dcMatch) {
    const dcValue = dcMatch[1];
    const dcType = dcMatch[2].toUpperCase().slice(0, 3);
    tags.push(`{save: DC ${dcValue} ${dcType}}`);
  }

  // Range: {range: 5 ft.}
  const rangeMatch = text.match(/(?:reach|range)\s+([\d/]+)\s*ft\./i);
  if (rangeMatch) {
    tags.push(`{range: ${rangeMatch[1]} ft.}`);
  }

  // Frequency patterns: Recharge X-Y, X/Day, At will
  // Match patterns in parentheses: (Recharge 5-6), (3/Day), (1/Day), (at will)
  const rechargeMatch = text.match(/\((?:Recharge\s+)?(\d+(?:-\d+)?(?:\/Day)?|at will)\)/i);
  if (rechargeMatch) {
    const freq = rechargeMatch[1].toLowerCase();
    tags.push(`{recharge: ${freq}}`);
  }

  return tags;
}

/**
 * Format monster actions as markdown with custom tags
 * Converts API action data into readable markdown with custom tags for attack bonuses,
 * damage, and saving throws. Tags are automatically rendered with icons by MarkdownRenderer.
 *
 * @param monster - Monster data from D&D 5e API
 * @returns Formatted markdown string with sections for special abilities, actions, and conditions
 *
 * @example
 * // Returns:
 * // ## Special Abilities
 * //
 * // **Keen Sight**
 * // The roc has advantage on Wisdom (Perception) checks that rely on sight.
 * //
 * // ## Actions
 * //
 * // **Bite** {hit: +10} {dmg: 2d10+6 piercing}
 * // Melee Weapon Attack: +10 to hit, reach 10 ft., one target...
 */
export function formatActionsAsMarkdown(monster: ApiMonster): string {
  const parts: string[] = [];

  // Add special abilities section FIRST if present
  if (monster.special_abilities && monster.special_abilities.length > 0) {
    parts.push("## Special Abilities", "");

    // Format each special ability
    for (const ability of monster.special_abilities) {
      // Bold ability name
      parts.push(`**${ability.name}**`);

      // Add description on new line
      parts.push(ability.desc);
      parts.push(""); // Empty line between abilities
    }
  }

  // Add actions section if present
  if (monster.actions && monster.actions.length > 0) {
    // Add separator if we already have special abilities
    if (parts.length > 0) {
      parts.push(""); // Extra space before new section
    }

    parts.push("## Actions", "");

    // Format each action
    for (const action of monster.actions) {
      const actionParts: string[] = [];

      // Bold action name
      actionParts.push(`**${action.name}**`);

      // Add custom tags
      const tags = generateActionTags(action);
      if (tags.length > 0) {
        actionParts.push(" " + tags.join(" "));
      }

      // Add description on new line (double newline for proper paragraph break)
      actionParts.push("  \n" + action.desc);

      parts.push(actionParts.join(""));
      parts.push(""); // Empty line between actions
    }
  }

  // Add condition immunities section if present
  if (monster.condition_immunities && monster.condition_immunities.length > 0) {
    // Add separator if we already have content
    if (parts.length > 0) {
      parts.push(""); // Extra space before new section
    }

    parts.push("## Conditions", "");

    // Format each condition separately with its description
    for (const condition of monster.condition_immunities) {
      const conditionParts: string[] = [];

      // Add resist tag
      conditionParts.push(`{resist: ${condition.name}}`);

      // Add description on new line if available
      if (condition.desc && condition.desc.length > 0) {
        conditionParts.push("  \n" + condition.desc.join(" "));
      }

      parts.push(conditionParts.join(""));
      parts.push(""); // Empty line between conditions
    }
  }

  return parts.join("\n");
}

/**
 * Append formatted actions to existing notes
 * If notes already exist, adds formatted actions after existing content with separator
 * @param existingNotes - Current notes content (may be empty)
 * @param monster - Monster data from D&D 5e API
 * @returns Combined notes with formatted actions appended
 */
export function appendFormattedActions(existingNotes: string | undefined, monster: ApiMonster): string {
  const formattedActions = formatActionsAsMarkdown(monster);

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

/**
 * Format SRD-style monster stat block text into markdown with custom tags
 * Converts raw text from D&D 5e SRD into our custom markdown format
 *
 * @param text - Raw SRD text with Traits/Actions sections
 * @returns Formatted markdown with headings and custom tags
 *
 * @example
 * Input:
 * ```
 * Traits
 * Keen Sight. The roc has advantage on Wisdom (Perception) checks that rely on sight.
 *
 * Actions
 * Bite. Melee Weapon Attack: +13 to hit, reach 10 ft., one target. Hit: 27 (4d8 + 9) piercing damage.
 * ```
 *
 * Output:
 * ```markdown
 * ## Traits
 * **Keen Sight.** The roc has advantage on Wisdom (Perception) checks that rely on sight.
 *
 * ## Actions
 * **Bite.** {hit: +13} {dmg: 4d8+9 piercing} {range: 10 ft.}
 * Melee Weapon Attack: +13 to hit, reach 10 ft., one target. Hit: 27 (4d8 + 9) piercing damage.
 * ```
 */
export function formatSRDText(text: string): string {
  if (!text || text.trim() === "") {
    return text;
  }

  let result = text;

  // Step 1: Convert section headers (Traits, Actions, Reactions, etc.)
  result = result.replace(/^(Traits|Actions|Reactions|Legendary Actions)\s*$/gm, '## $1');

  // Step 2: Parse and format abilities/traits
  // Match ability name followed by its description
  // Pattern: "Name. Description" where Name starts with capital letter
  const abilityPattern = /^([A-Z][^.\n]+)\.\s+(.+?)(?=\n\n|$)/gms;

  result = result.replace(abilityPattern, (_match, name, description) => {
    // Generate tags from the description
    const tags = generateTagsFromText(description);

    // Format: **Name.** {tags}
    // Description
    const formattedName = `**${name.trim()}.**`;
    const tagsString = tags.length > 0 ? ` ${tags.join(" ")}` : "";

    return `${formattedName}${tagsString}\n${description}`;
  });

  // Step 3: Process spell lists
  // Pattern: "1/day each: spell1, spell2" or "At will: spell1, spell2"
  // Match frequency + colon + spell list
  const spellListPattern = /^(\d+\/day each|at will):\s*(.+)$/gmi;

  result = result.replace(spellListPattern, (_match, frequency, spellList) => {
    // Add recharge tag for the frequency
    const freqTag = `{recharge: ${frequency.toLowerCase()}}`;

    // Split spells by comma and wrap each in {spell:} tag
    const spells = spellList.split(',').map((spell: string) => {
      // Remove parenthetical notes like "(self only)" for the tag
      const spellName = spell.trim().replace(/\s*\([^)]+\)/, '').trim();
      // But keep the full text with notes
      return spell.trim().replace(spellName, `{spell: ${spellName}}`);
    }).join(', ');

    return `${freqTag} ${spells}`;
  });

  return result;
}
