import { DND_API_HOST } from "../constants";
import { mapMonster2024, type Api2024Monster } from "./mapMonster2024";
import type { ApiMonster } from "./types";

/** Base path of the SRD 5.2 / 2024 rules endpoints. */
export const DND_API_2024_BASE = `${DND_API_HOST}/api/2024`;

/** Maximum number of search hits whose full statblock is fetched. */
export const MONSTER_SEARCH_LIMIT = 10;

interface MonsterListResponse {
  count: number;
  results: Array<{ index: string; name: string; url: string }>;
}

const monsterCache = new Map<string, Promise<ApiMonster>>();

/**
 * Fetch and map a single 2024 monster by index. Results (and in-flight
 * requests) are cached for the session. Failed requests are evicted so they
 * can be retried.
 */
export function fetchMonster2024(index: string): Promise<ApiMonster> {
  const cached = monsterCache.get(index);
  if (cached) return cached;

  const request = fetch(
    `${DND_API_2024_BASE}/monsters/${encodeURIComponent(index)}`,
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `HTTP error: ${response.status} ${response.statusText}`,
        );
      }
      const raw = (await response.json()) as Api2024Monster;
      return mapMonster2024(raw);
    })
    .catch((error: unknown) => {
      monsterCache.delete(index);
      throw error;
    });

  monsterCache.set(index, request);
  return request;
}

/**
 * Search the 2024 bestiary by name (partial match, as served by the API) and
 * return full statblocks for the first `MONSTER_SEARCH_LIMIT` hits.
 * Individual statblock failures are skipped rather than failing the search.
 */
export async function searchMonsters2024(name: string): Promise<ApiMonster[]> {
  const query = name.trim();
  if (!query) return [];

  const response = await fetch(
    `${DND_API_2024_BASE}/monsters?name=${encodeURIComponent(query)}`,
  );
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }
  const list = (await response.json()) as MonsterListResponse;

  const hits = list.results.slice(0, MONSTER_SEARCH_LIMIT);
  const settled = await Promise.allSettled(
    hits.map((hit) => fetchMonster2024(hit.index)),
  );

  return settled.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
}

/** Clears the in-memory statblock cache (used by tests). */
export function clearMonster2024Cache(): void {
  monsterCache.clear();
}
