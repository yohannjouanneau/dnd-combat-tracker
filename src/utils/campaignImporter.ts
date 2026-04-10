import { load as parseYaml } from "js-yaml";
import { generateId } from "./utils";
import { BUILT_IN_BLOCK_TYPES } from "../constants";
import type { BuildingBlockInput } from "../types/campaign";

const VALID_TYPE_IDS = new Set(BUILT_IN_BLOCK_TYPES.map((t) => t.id));

export interface ImportedBlock {
  block: BuildingBlockInput;
  /** ID of the parent block (pre-generated), used to wire children after creation */
  parentId: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBlock(raw: any, parentId: string | null): ImportedBlock[] {
  if (!raw || typeof raw !== "object") throw new Error("Invalid block entry");

  const name = raw.name;
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new Error('Each block must have a "name" field');
  }

  const typeRaw =
    raw.type && typeof raw.type === "string" ? raw.type.toLowerCase() : "";
  const typeId = VALID_TYPE_IDS.has(typeRaw) ? typeRaw : "scene";

  const statChecks = Array.isArray(raw.checks)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      raw.checks.map((c: any) => {
        if (!c.label || typeof c.label !== "string")
          throw new Error(`Stat check missing "label" in block "${name}"`);
        if (typeof c.dc !== "number")
          throw new Error(
            `Stat check "${c.label}" missing numeric "dc" in block "${name}"`,
          );
        return {
          id: generateId(),
          label: String(c.label),
          skill: c.skill ? String(c.skill) : undefined,
          difficulty: Number(c.dc),
          outcomes: Array.isArray(c.outcomes)
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              c.outcomes.map((o: any) => ({
                id: generateId(),
                label: o.label ? String(o.label) : "",
                description: o.description ? String(o.description) : "",
              }))
            : [],
        };
      })
    : [];

  const items = Array.isArray(raw.items)
    ? raw.items.map(String).filter(Boolean)
    : undefined;

  const countdownRaw = raw.countdown;
  const countdown =
    countdownRaw &&
    typeof countdownRaw === "object" &&
    typeof countdownRaw.steps === "number" &&
    countdownRaw.steps > 0
      ? {
          max: countdownRaw.steps,
          current: 0,
          descriptions: Array.isArray(countdownRaw.labels)
            ? countdownRaw.labels.map(String)
            : undefined,
        }
      : undefined;

  const tags = Array.isArray(raw.tags)
    ? raw.tags.map(String).filter(Boolean)
    : undefined;

  const block: BuildingBlockInput = {
    id: generateId(),
    name: name.trim(),
    typeId,
    icon: raw.icon && typeof raw.icon === "string" ? raw.icon : undefined,
    description:
      raw.description && typeof raw.description === "string"
        ? raw.description
        : "",
    children: [],
    statChecks,
    tags,
    countdown,
    featureData: items ? { items } : undefined,
  };

  const result: ImportedBlock[] = [{ block, parentId }];

  if (Array.isArray(raw.children)) {
    for (const child of raw.children) {
      result.push(...parseBlock(child, block.id));
    }
  }

  return result;
}

/**
 * Parse a YAML string into a flat list of ImportedBlock entries.
 * Handles both single-block shorthand and `blocks:` list format.
 * Children are flattened — use `parentId` to wire them up after creation.
 *
 * @throws Error with a descriptive message on parse or validation failure
 */
export function importBlocksFromYaml(yaml: string): ImportedBlock[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = parseYaml(yaml);
  } catch (e) {
    throw new Error(`YAML parse error: ${e instanceof Error ? e.message : e}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("File must contain a block or a list of blocks");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawBlocks: any[] = Array.isArray(parsed.blocks)
    ? parsed.blocks
    : [parsed];

  if (rawBlocks.length === 0) {
    throw new Error("No blocks found in file");
  }

  const result: ImportedBlock[] = [];
  for (const raw of rawBlocks) {
    result.push(...parseBlock(raw, null));
  }
  return result;
}
