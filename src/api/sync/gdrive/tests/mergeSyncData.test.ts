import { mergeSyncData } from "../mergeSyncData";
import type { SyncData } from "../../types";

// --- helpers ---

type Entity = {
  id: string;
  createdAt: number;
  updatedAt: number;
  [key: string]: unknown;
};

const e = (
  id: string,
  createdAt: number,
  updatedAt: number,
  extra: Record<string, unknown> = {},
): Entity => ({ id, createdAt, updatedAt, ...extra });

const syncWith = (field: keyof SyncData, entities: Entity[]): SyncData => ({
  combats: null,
  players: null,
  monsters: null,
  blocks: null,
  campaigns: null,
  blockTypes: null,
  mapState: null,
  lastSynced: 0,
  [field]: JSON.stringify(entities),
});

const parseCombats = (data: SyncData): Entity[] =>
  data.combats ? JSON.parse(data.combats) : [];

const parseField = (data: SyncData, field: keyof SyncData): Entity[] => {
  const val = data[field];
  return val ? JSON.parse(val as string) : [];
};

// --- mergeEntities (tested via mergeSyncData on the combats field) ---

describe("mergeSyncData — both sides have the entity", () => {
  it("picks remote when remote is newer", () => {
    const local = syncWith("combats", [e("a", 10, 100)]);
    const remote = syncWith("combats", [e("a", 10, 200)]);
    const result = parseCombats(mergeSyncData(local, remote, 50));
    expect(result).toHaveLength(1);
    expect(result[0].updatedAt).toBe(200);
  });

  it("picks local when local is newer", () => {
    const local = syncWith("combats", [e("a", 10, 200)]);
    const remote = syncWith("combats", [e("a", 10, 100)]);
    const result = parseCombats(mergeSyncData(local, remote, 50));
    expect(result).toHaveLength(1);
    expect(result[0].updatedAt).toBe(200);
  });

  it("remote wins on tie", () => {
    const local = syncWith("combats", [e("a", 10, 100, { source: "local" })]);
    const remote = syncWith("combats", [e("a", 10, 100, { source: "remote" })]);
    const result = parseCombats(mergeSyncData(local, remote, 50));
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("remote");
  });
});

describe("mergeSyncData — entity only in remote", () => {
  it("includes entity created after last sync (new on remote)", () => {
    const local = syncWith("combats", []);
    const remote = syncWith("combats", [e("a", 200, 200)]);
    const result = parseCombats(mergeSyncData(local, remote, 100));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("excludes entity that existed at last sync (deleted locally)", () => {
    const local = syncWith("combats", []);
    const remote = syncWith("combats", [e("a", 50, 60)]);
    const result = parseCombats(mergeSyncData(local, remote, 100));
    expect(result).toHaveLength(0);
  });

  it("keeps legacy entity with createdAt=0 (never deletes legacy data)", () => {
    const local = syncWith("combats", []);
    const remote = syncWith("combats", [e("a", 0, 0)]);
    const result = parseCombats(mergeSyncData(local, remote, 100));
    expect(result).toHaveLength(1);
  });
});

describe("mergeSyncData — entity only in local", () => {
  it("includes entity created after last sync (new locally)", () => {
    const local = syncWith("combats", [e("a", 200, 200)]);
    const remote = syncWith("combats", []);
    const result = parseCombats(mergeSyncData(local, remote, 100));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("excludes entity that existed at last sync (deleted remotely)", () => {
    const local = syncWith("combats", [e("a", 50, 60)]);
    const remote = syncWith("combats", []);
    const result = parseCombats(mergeSyncData(local, remote, 100));
    expect(result).toHaveLength(0);
  });

  it("keeps legacy entity with createdAt=0 (never deletes legacy data)", () => {
    const local = syncWith("combats", [e("a", 0, 0)]);
    const remote = syncWith("combats", []);
    const result = parseCombats(mergeSyncData(local, remote, 100));
    expect(result).toHaveLength(1);
  });
});

describe("mergeSyncData — null / empty inputs", () => {
  it("handles null local field without crashing", () => {
    const local: SyncData = {
      combats: null,
      players: null,
      monsters: null,
      blocks: null,
      campaigns: null,
      lastSynced: 0,
    };
    const remote = syncWith("combats", [e("a", 200, 200)]);
    const result = parseCombats(mergeSyncData(local, remote, 100));
    expect(result).toHaveLength(1);
  });

  it("handles null remote field without crashing", () => {
    const local = syncWith("combats", [e("a", 200, 200)]);
    const remote: SyncData = {
      combats: null,
      players: null,
      monsters: null,
      blocks: null,
      campaigns: null,
      lastSynced: 0,
    };
    const result = parseCombats(mergeSyncData(local, remote, 100));
    expect(result).toHaveLength(1);
  });

  it("keeps all legacy entities when remote is empty and localLastSynced is 0", () => {
    const local = syncWith("combats", [
      e("a", 0, 0),
      e("b", 0, 0),
      e("c", 0, 0),
    ]);
    const remote = syncWith("combats", []);
    const result = parseCombats(mergeSyncData(local, remote, 0));
    expect(result).toHaveLength(3);
  });
});

describe("mergeSyncData — blockTypes handling", () => {
  it("excludes built-in block types from merge result", () => {
    const builtIn = { id: "room", createdAt: 0, updatedAt: 0, isBuiltIn: true };
    const custom = e("custom-1", 200, 200);
    const local: SyncData = {
      combats: null,
      players: null,
      monsters: null,
      blocks: null,
      campaigns: null,
      blockTypes: JSON.stringify([builtIn, custom]),
      lastSynced: 0,
    };
    const remote: SyncData = {
      combats: null,
      players: null,
      monsters: null,
      blocks: null,
      campaigns: null,
      blockTypes: JSON.stringify([builtIn]),
      lastSynced: 0,
    };
    const result = parseField(mergeSyncData(local, remote, 100), "blockTypes");
    expect(result.every((t: Entity) => !t.isBuiltIn)).toBe(true);
  });

  it("merges custom block types like other entities", () => {
    const custom = e("custom-1", 200, 200);
    const local: SyncData = {
      combats: null,
      players: null,
      monsters: null,
      blocks: null,
      campaigns: null,
      blockTypes: JSON.stringify([custom]),
      lastSynced: 0,
    };
    const remote: SyncData = {
      combats: null,
      players: null,
      monsters: null,
      blocks: null,
      campaigns: null,
      blockTypes: null,
      lastSynced: 0,
    };
    const result = parseField(mergeSyncData(local, remote, 100), "blockTypes");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("custom-1");
  });
});

describe("mergeSyncData — all fields merged independently", () => {
  it("merges players and campaigns alongside combats", () => {
    const local: SyncData = {
      combats: JSON.stringify([e("c1", 200, 200)]),
      players: JSON.stringify([e("p1", 50, 60)]),
      monsters: null,
      blocks: null,
      campaigns: JSON.stringify([e("camp1", 200, 200)]),
      lastSynced: 0,
    };
    const remote: SyncData = {
      combats: JSON.stringify([e("c2", 200, 200)]),
      players: JSON.stringify([]),
      monsters: null,
      blocks: null,
      campaigns: JSON.stringify([]),
      lastSynced: 0,
    };
    const result = mergeSyncData(local, remote, 100);
    // c1: local-only, createdAt=200>100 → kept; c2: remote-only, createdAt=200>100 → kept
    expect(parseCombats(result)).toHaveLength(2);
    // p1: local-only, createdAt=50<=100 → deleted remotely → removed
    expect(parseField(result, "players")).toHaveLength(0);
    // camp1: local-only, createdAt=200>100 → kept
    expect(parseField(result, "campaigns")).toHaveLength(1);
  });
});

describe("mergeSyncData — lastSynced", () => {
  it("sets lastSynced to a recent timestamp", () => {
    const before = Date.now();
    const local: SyncData = {
      combats: null,
      players: null,
      monsters: null,
      blocks: null,
      campaigns: null,
      lastSynced: 0,
    };
    const remote: SyncData = {
      combats: null,
      players: null,
      monsters: null,
      blocks: null,
      campaigns: null,
      lastSynced: 0,
    };
    const result = mergeSyncData(local, remote, 0);
    expect(result.lastSynced).toBeGreaterThanOrEqual(before);
  });
});

// --- mergeMapState ---

const baseSync = (): SyncData => ({
  combats: null,
  players: null,
  monsters: null,
  blocks: null,
  campaigns: null,
  blockTypes: null,
  mapState: null,
  lastSynced: 0,
});

const mapStateStr = (updatedAt?: number) =>
  JSON.stringify({
    tokens: [
      {
        id: "t1",
        x: 0,
        y: 0,
        radius: 20,
        color: "#ff0000",
        hidden: false,
        revealsFog: false,
      },
    ],
    revealedZones: [],
    camera: { x: 0, y: 0, scale: 1 },
    ...(updatedAt !== undefined ? { updatedAt } : {}),
  });

describe("mergeSyncData — mapState", () => {
  it("returns null when both sides are null", () => {
    const result = mergeSyncData(baseSync(), baseSync(), 0);
    expect(result.mapState).toBeNull();
  });

  it("returns local when only local has mapState", () => {
    const local = { ...baseSync(), mapState: mapStateStr(100) };
    const result = mergeSyncData(local, baseSync(), 0);
    expect(result.mapState).toBe(local.mapState);
  });

  it("returns remote when only remote has mapState", () => {
    const remote = { ...baseSync(), mapState: mapStateStr(100) };
    const result = mergeSyncData(baseSync(), remote, 0);
    expect(result.mapState).toBe(remote.mapState);
  });

  it("picks remote when remote is strictly newer", () => {
    const local = { ...baseSync(), mapState: mapStateStr(100) };
    const remote = { ...baseSync(), mapState: mapStateStr(200) };
    const result = mergeSyncData(local, remote, 0);
    expect(result.mapState).toBe(remote.mapState);
  });

  it("picks local when local is strictly newer (the bug fix)", () => {
    const local = { ...baseSync(), mapState: mapStateStr(200) };
    const remote = { ...baseSync(), mapState: mapStateStr(100) };
    const result = mergeSyncData(local, remote, 0);
    expect(result.mapState).toBe(local.mapState);
  });

  it("picks local on tie", () => {
    const local = { ...baseSync(), mapState: mapStateStr(100) };
    const remote = { ...baseSync(), mapState: mapStateStr(100) };
    const result = mergeSyncData(local, remote, 0);
    expect(result.mapState).toBe(local.mapState);
  });

  it("picks local when neither side has a timestamp", () => {
    const local = { ...baseSync(), mapState: mapStateStr() };
    const remote = { ...baseSync(), mapState: mapStateStr() };
    const result = mergeSyncData(local, remote, 0);
    expect(result.mapState).toBe(local.mapState);
  });
});
