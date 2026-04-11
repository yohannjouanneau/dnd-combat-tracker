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

/**
 * Raw YAML shapes — all field types are `unknown` since the source is untyped
 * user input. Runtime checks in parseBlock handle the actual validation.
 */
interface RawOutcome {
  label?: unknown;
  description?: unknown;
}

interface RawStatCheck {
  label?: unknown;
  dc?: unknown;
  skill?: unknown;
  outcomes?: unknown;
}

interface RawCountdown {
  steps?: unknown;
  labels?: unknown;
}

interface RawBlock {
  name?: unknown;
  type?: unknown;
  icon?: unknown;
  description?: unknown;
  checks?: unknown;
  items?: unknown;
  countdown?: unknown;
  tags?: unknown;
  children?: unknown;
}

function parseBlock(raw: unknown, parentId: string | null): ImportedBlock[] {
  if (!raw || typeof raw !== "object") throw new Error("Invalid block entry");
  const r = raw as RawBlock;

  const name = r.name;
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new Error('Each block must have a "name" field');
  }

  const typeRaw =
    r.type && typeof r.type === "string" ? r.type.toLowerCase() : "";
  const typeId = VALID_TYPE_IDS.has(typeRaw) ? typeRaw : "scene";

  const statChecks = Array.isArray(r.checks)
    ? r.checks.map((c: unknown) => {
        if (!c || typeof c !== "object")
          throw new Error(`Invalid stat check entry in block "${name}"`);
        const check = c as RawStatCheck;
        if (!check.label || typeof check.label !== "string")
          throw new Error(`Stat check missing "label" in block "${name}"`);
        if (typeof check.dc !== "number")
          throw new Error(
            `Stat check "${check.label}" missing numeric "dc" in block "${name}"`,
          );
        return {
          id: generateId(),
          label: String(check.label),
          skill: check.skill ? String(check.skill) : undefined,
          difficulty: Number(check.dc),
          outcomes: Array.isArray(check.outcomes)
            ? check.outcomes.map((o: unknown) => {
                const outcome =
                  o && typeof o === "object" ? (o as RawOutcome) : {};
                return {
                  id: generateId(),
                  label: outcome.label ? String(outcome.label) : "",
                  description: outcome.description
                    ? String(outcome.description)
                    : "",
                };
              })
            : [],
        };
      })
    : [];

  const items = Array.isArray(r.items)
    ? r.items.map((item: unknown) => String(item)).filter(Boolean)
    : undefined;

  const countdown = (() => {
    const cd = r.countdown;
    if (!cd || typeof cd !== "object") return undefined;
    const { steps, labels } = cd as RawCountdown;
    if (typeof steps !== "number" || steps <= 0) return undefined;
    return {
      max: steps,
      current: 0,
      descriptions: Array.isArray(labels)
        ? labels.map((l: unknown) => String(l))
        : undefined,
    };
  })();

  const tags = Array.isArray(r.tags)
    ? r.tags.map((t: unknown) => String(t)).filter(Boolean)
    : undefined;

  const block: BuildingBlockInput = {
    id: generateId(),
    name: name.trim(),
    typeId,
    icon: r.icon && typeof r.icon === "string" ? r.icon : undefined,
    description:
      r.description && typeof r.description === "string" ? r.description : "",
    children: [],
    statChecks,
    tags,
    countdown,
    featureData: items ? { items } : undefined,
  };

  const result: ImportedBlock[] = [{ block, parentId }];

  if (Array.isArray(r.children)) {
    for (const child of r.children) {
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
  let parsed: unknown;
  try {
    parsed = parseYaml(yaml);
  } catch (e) {
    throw new Error(`YAML parse error: ${e instanceof Error ? e.message : e}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("File must contain a block or a list of blocks");
  }

  const root = parsed as Record<string, unknown>;
  const rawBlocks: unknown[] = Array.isArray(root.blocks)
    ? root.blocks
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
