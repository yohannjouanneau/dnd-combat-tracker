import { readFileSync } from "fs";
import { join } from "path";
import {
  clearMonster2024Cache,
  MONSTER_SEARCH_LIMIT,
  searchMonsters2024,
} from "../dnd5e2024Client";

const fixture = (name: string) =>
  JSON.parse(readFileSync(join(__dirname, "fixtures", name), "utf-8"));

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
  }) as Response;

describe("searchMonsters2024", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    clearMonster2024Cache();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns an empty list without calling the API for a blank query", async () => {
    await expect(searchMonsters2024("   ")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("searches the 2024 list endpoint and maps the full statblocks", async () => {
    const goblin = fixture("goblin-warrior-2024.json");
    const dragon = fixture("adult-red-dragon-2024.json");
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/monsters?name=")) {
        return jsonResponse({
          count: 2,
          results: [
            { index: "goblin-warrior", name: "Goblin Warrior", url: "" },
            { index: "adult-red-dragon", name: "Adult Red Dragon", url: "" },
          ],
        });
      }
      if (url.endsWith("/monsters/goblin-warrior")) return jsonResponse(goblin);
      if (url.endsWith("/monsters/adult-red-dragon"))
        return jsonResponse(dragon);
      return jsonResponse({}, 404);
    });

    const results = await searchMonsters2024("goblin");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://www.dnd5eapi.co/api/2024/monsters?name=goblin",
    );
    expect(results.map((m) => m.name)).toEqual([
      "Goblin Warrior",
      "Adult Red Dragon",
    ]);
    expect(results[0].hit_points).toBe(10);
  });

  it("skips statblocks that fail to load instead of failing the search", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/monsters?name=")) {
        return jsonResponse({
          count: 2,
          results: [
            { index: "goblin-warrior", name: "Goblin Warrior", url: "" },
            { index: "broken", name: "Broken", url: "" },
          ],
        });
      }
      if (url.endsWith("/monsters/goblin-warrior")) {
        return jsonResponse(fixture("goblin-warrior-2024.json"));
      }
      return jsonResponse({}, 500);
    });

    const results = await searchMonsters2024("gob");
    expect(results.map((m) => m.index)).toEqual(["goblin-warrior"]);
  });

  it("limits the number of statblock requests", async () => {
    const hits = Array.from({ length: MONSTER_SEARCH_LIMIT + 5 }, (_, i) => ({
      index: `m-${i}`,
      name: `M ${i}`,
      url: "",
    }));
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/monsters?name=")) {
        return jsonResponse({ count: hits.length, results: hits });
      }
      return jsonResponse({ ...fixture("goblin-warrior-2024.json") });
    });

    await searchMonsters2024("m");
    const detailCalls = fetchMock.mock.calls.filter(
      ([url]) => !String(url).includes("?name="),
    );
    expect(detailCalls).toHaveLength(MONSTER_SEARCH_LIMIT);
  });

  it("caches statblocks across searches", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/monsters?name=")) {
        return jsonResponse({
          count: 1,
          results: [
            { index: "goblin-warrior", name: "Goblin Warrior", url: "" },
          ],
        });
      }
      return jsonResponse(fixture("goblin-warrior-2024.json"));
    });

    await searchMonsters2024("goblin");
    await searchMonsters2024("goblin");
    // one list call per search, one detail call total
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws when the search endpoint fails", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 503));
    await expect(searchMonsters2024("goblin")).rejects.toThrow(
      "HTTP error: 503",
    );
  });
});
