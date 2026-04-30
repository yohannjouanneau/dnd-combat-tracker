import type { BlockTypeDef } from "../../../types/campaign";
import { safeParse, safeStringify } from "../../../utils/utils";
import type { SyncData } from "../types";

type Timestamped = { id: string; createdAt: number; updatedAt: number };

/**
 * 3-way merge for a list of timestamped entities.
 *
 * Rules (using `localLastSynced` as the baseline snapshot):
 * - Both sides have the entity → keep the one with the higher `updatedAt`
 *   (remote wins on tie, since remote is the last-uploaded canonical state).
 * - Only in remote, `createdAt > localLastSynced` → created on remote after
 *   last sync → add locally.
 * - Only in remote, `createdAt <= localLastSynced` (or unknown/0) → existed
 *   at last sync, must have been deleted locally → skip (respect deletion).
 *   Exception: if `createdAt` is falsy (legacy data without timestamps) → keep
 *   (safe default: never silently delete legacy data).
 * - Only locally, `createdAt > localLastSynced` → created locally after last
 *   sync → keep.
 * - Only locally, `createdAt <= localLastSynced` (or unknown/0) → existed at
 *   last sync, must have been deleted remotely → remove.
 *   Exception: if `createdAt` is falsy (legacy data) → keep.
 */
function mergeEntities<T extends Timestamped>(
  local: T[],
  remote: T[],
  localLastSynced: number,
): T[] {
  const localMap = new Map(local.map((e) => [e.id, e]));
  const remoteMap = new Map(remote.map((e) => [e.id, e]));
  const result: T[] = [];

  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

  for (const id of allIds) {
    const loc = localMap.get(id);
    const rem = remoteMap.get(id);

    if (loc && rem) {
      // Both sides: pick newest; remote wins on tie
      result.push(rem.updatedAt >= loc.updatedAt ? rem : loc);
    } else if (rem && !loc) {
      // Remote only
      const isLegacy = !rem.createdAt;
      const createdAfterSync = rem.createdAt > localLastSynced;
      if (isLegacy || createdAfterSync) {
        result.push(rem);
      }
      // else: existed at last sync → deleted locally → skip
    } else if (loc && !rem) {
      // Local only
      const isLegacy = !loc.createdAt;
      const createdAfterSync = loc.createdAt > localLastSynced;
      if (isLegacy || createdAfterSync) {
        result.push(loc);
      }
      // else: existed at last sync → deleted remotely → remove
    }
  }

  return result;
}

/**
 * Merge two mapState JSON strings by picking the one with the higher updatedAt.
 * Local wins on tie or when timestamps are absent (safe default: preserve local edits).
 */
function mergeMapState(
  localStr: string | null,
  remoteStr: string | null,
): string | null {
  if (!localStr && !remoteStr) return null;
  if (!localStr) return remoteStr;
  if (!remoteStr) return localStr;
  const local = JSON.parse(localStr) as { updatedAt?: number };
  const remote = JSON.parse(remoteStr) as { updatedAt?: number };
  return (remote.updatedAt ?? 0) > (local.updatedAt ?? 0)
    ? remoteStr
    : localStr;
}

/**
 * Merge two full SyncData snapshots using a 3-way merge strategy.
 * Built-in block types (isBuiltIn: true) are never stored and are excluded.
 */
export function mergeSyncData(
  localRaw: SyncData,
  remoteRaw: SyncData,
  localLastSynced: number,
): SyncData {
  type AnyEntity = Timestamped & Record<string, unknown>;

  const mergeField = (localStr: string | null, remoteStr: string | null) => {
    const localArr = safeParse<AnyEntity>(localStr);
    const remoteArr = safeParse<AnyEntity>(remoteStr);
    return safeStringify(mergeEntities(localArr, remoteArr, localLastSynced));
  };

  const localBlockTypes = safeParse<BlockTypeDef>(
    localRaw.blockTypes ?? null,
  ).filter((t) => !t.isBuiltIn);
  const remoteBlockTypes = safeParse<BlockTypeDef>(
    remoteRaw.blockTypes ?? null,
  ).filter((t) => !t.isBuiltIn);
  const mergedBlockTypes = mergeEntities(
    localBlockTypes as unknown as AnyEntity[],
    remoteBlockTypes as unknown as AnyEntity[],
    localLastSynced,
  );

  return {
    combats: mergeField(localRaw.combats, remoteRaw.combats),
    players: mergeField(localRaw.players, remoteRaw.players),
    monsters: mergeField(localRaw.monsters, remoteRaw.monsters),
    blocks: mergeField(localRaw.blocks, remoteRaw.blocks),
    campaigns: mergeField(localRaw.campaigns, remoteRaw.campaigns),
    blockTypes: safeStringify(mergedBlockTypes),
    mapState: mergeMapState(
      localRaw.mapState ?? null,
      remoteRaw.mapState ?? null,
    ),
    lastSynced: Date.now(),
  };
}
